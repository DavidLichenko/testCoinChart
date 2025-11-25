import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { updateBalance } from "@/app/actions/updateBalance";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const authUser = await getCurrentUser();

    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const id = parts[3];

    const body = await request.json();
    const { closePrice } = body;

    // Validate close price
    const parsedClosePrice = Number.parseFloat(closePrice);
    if (isNaN(parsedClosePrice) || parsedClosePrice <= 0) {
      return NextResponse.json({ error: "Invalid close price" }, { status: 400 });
    }

    // Find the trade and update in a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const trade = await tx.trade_Transaction.findUnique({
        where: { id },
      });

      if (!trade) {
        throw new Error("Trade not found");
      }

      // Verify trade belongs to user OR user is admin
      let isAdmin = false;
      if (authUser) {
        const fullUser = await tx.user.findUnique({
          where: { id: authUser.id },
          select: { role: true }
        });
        isAdmin = !!fullUser && ['OWNER', 'CR_MANAGMENT', 'TEAMLEAD'].includes(fullUser.role || '');
      }
      
      if (trade.userId !== userId && !isAdmin) {
        throw new Error("Unauthorized");
      }

      // Additional Binance/MT5-style validations
      // Validate that trade is open
      if (trade.status !== "OPEN") {
        throw new Error("Trade is not open");
      }

      // Calculate profit with proper precision handling
      const priceDifference = trade.type === "BUY" 
        ? parsedClosePrice - trade.openIn 
        : trade.openIn - parsedClosePrice;
      
      // Calculate profit with proper decimal precision
      const rawProfit = priceDifference * trade.volume * trade.leverage;
      const profit = Math.round(rawProfit * 100) / 100; // Round to 2 decimal places

      // Validate profit calculation
      if (isNaN(profit)) {
        throw new Error("Error calculating profit");
      }

      // Update trade status
      const updatedTrade = await tx.trade_Transaction.update({
        where: { id },
        data: {
          status: "CLOSE",
          closeIn: parsedClosePrice,
          profit,
          endAt: new Date(),
        },
      });

      // Get current user balance
      const tradeUser = await tx.user.findUnique({
        where: { id: trade.userId },
        select: { TotalBalance: true },
      });

      if (!tradeUser) {
        throw new Error("User not found");
      }

      // Calculate new balance: return margin + profit
      const currentBalance = tradeUser.TotalBalance || 0;
      const balanceChange = trade.margin + profit;
      const newBalance = Math.max(0, currentBalance + balanceChange); // Never go below 0

      // Update user balance
      await tx.user.update({
        where: { id: trade.userId },
        data: {
          TotalBalance: newBalance,
        },
      });

      return {
        trade: updatedTrade,
        newBalance: newBalance,
        balanceChange: balanceChange
      };
    }, {
      timeout: 10000 // 10 second timeout
    });

    // Send updated balance via Pusher (outside of transaction to prevent timeouts)
    try {
      await updateBalance(result.trade.userId, result.newBalance);
    } catch (pusherError) {
      console.error("Failed to send balance update via Pusher:", pusherError);
      // Don't fail the entire operation if Pusher fails
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error closing trade:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}