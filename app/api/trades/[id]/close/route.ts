import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const userId = await requireAuth();

    // Extract trade ID from URL pathname, e.g. /api/trades/[id]/close
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    // parts = ["", "api", "trades", "[id]", "close"]
    // id is at parts[3]
    const id = parts[3];

    // Parse JSON body
    const body = await request.json();
    const { closePrice } = body;

    // Find trade record
    const trade = await prisma.trade_Transaction.findUnique({
      where: { id },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Check user owns the trade
    if (trade.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate profit based on trade type
    const profit =
        trade.type === "BUY"
            ? (closePrice - trade.openIn) * trade.volume * trade.leverage
            : (trade.openIn - closePrice) * trade.volume * trade.leverage;

    // Update trade status to CLOSE with profit info
    const updatedTrade = await prisma.trade_Transaction.update({
      where: { id },
      data: {
        status: "CLOSE",
        closeIn: closePrice,
        profit,
        endAt: new Date(),
      },
    });

    // Update user's TotalBalance (add margin + profit)
    await prisma.user.update({
      where: { id: trade.userId },
      data: {
        TotalBalance: {
          increment: trade.margin + profit,
        },
      },
    });

    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error("Error closing trade:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
