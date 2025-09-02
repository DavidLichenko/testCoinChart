import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {updateBalance} from "@/app/actions/updateBalance";

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();

    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const id = parts[3];

    const body = await request.json();
    const { closePrice } = body;

    const trade = await prisma.trade_Transaction.findUnique({
      where: { id },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const profit =
        trade.type === "BUY"
            ? (closePrice - trade.openIn) * trade.volume * trade.leverage
            : (trade.openIn - closePrice) * trade.volume * trade.leverage;

    const updatedTrade = await prisma.trade_Transaction.update({
      where: { id },
      data: {
        status: "CLOSE",
        closeIn: closePrice,
        profit,
        endAt: new Date(),
      },
    });

    // Get current user balance
    const currentUser = await prisma.user.findUnique({
      where: { id: trade.userId },
      select: { TotalBalance: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate new balance with protection against negative values
    const currentBalance = currentUser.TotalBalance || 0;
    const balanceChange = trade.margin + profit;
    const newBalance = Math.max(0, currentBalance + balanceChange); // Never go below 0

    console.log("Trade closing details:", {
      margin: trade.margin,
      profit: profit,
      currentBalance: currentBalance,
      balanceChange: balanceChange,
      newBalance: newBalance
    });

    // Update user balance with protection
    await prisma.user.update({
      where: { id: trade.userId },
      data: {
        TotalBalance: newBalance,
      },
    });

    // Send updated balance via Pusher
    await updateBalance(trade.userId, newBalance);

    return NextResponse.json({
      ...updatedTrade,
      newBalance: newBalance,
      balanceChange: balanceChange
    });
  } catch (error) {
    console.error("Error closing trade:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
