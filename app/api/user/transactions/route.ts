import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET() {
  try {
    const userId = await requireAuth();

    // Fetch wallet transactions
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: { userId },
      include: {
        asset: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Fetch closed trades
    const closedTrades = await prisma.trade_Transaction.findMany({
      where: {
        userId,
        status: "CLOSE",
      },
      orderBy: { endAt: "desc" },
      take: 100,
    });

    // Fetch referral transactions
    const referralRewards = await prisma.referral.findMany({
      where: {
        referrerId: userId,
        status: "REWARDED",
      },
      include: {
        referredUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Combine and format all transactions
    const formattedTransactions = [
      // Format wallet transactions
      ...walletTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        currency: tx.assetSymbol,
        date: tx.createdAt.toISOString(),
        description: getDescriptionForWalletTransaction(tx.type),
        reference: tx.txHash || undefined,
      })),

      // Format closed trades
      ...closedTrades.map(trade => ({
        id: trade.id,
        type: "TRADE",
        status: "SUCCESSFUL",
        amount: Math.abs(trade.profit || 0),
        currency: "USD", // Assuming all trades are in USD
        date: trade.endAt?.toISOString() || trade.createdAt.toISOString(),
        description: `${trade.type} ${trade.ticker} (${trade.volume} lots)`,
        reference: undefined,
      })),

      // Format referral rewards
      ...referralRewards.map(referral => ({
        id: referral.id,
        type: "REFERRAL",
        status: "SUCCESSFUL",
        amount: referral.rewardAmount,
        currency: referral.rewardCurrency,
        date: referral.updatedAt.toISOString(),
        description: `Referral reward from ${referral.referredUser?.name || referral.referredUser?.email || 'a friend'}`,
        reference: undefined,
      })),
    ];

    // Sort all transactions by date (newest first)
    formattedTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getDescriptionForWalletTransaction(type: string): string {
  switch (type) {
    case "DEPOSIT":
      return "Deposit";
    case "WITHDRAW":
      return "Withdrawal";
    case "INTERNAL_TRANSFER":
      return "Internal transfer";
    case "EXCHANGE":
      return "Asset exchange";
    case "STAKE_LOCK":
      return "Staking deposit";
    case "STAKE_UNLOCK":
      return "Staking withdrawal";
    case "STAKE_REWARD":
      return "Staking reward";
    default:
      return "Transaction";
  }
}