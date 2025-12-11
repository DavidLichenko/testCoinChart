import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET() {
  try {
    const userId = await requireAuth();

    // Fetch user to get baseCurrency
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    });

    const baseCurrency = user?.baseCurrency || "USD";

    // Get EUR/USD rate for conversion if needed
    let eurUsdRate = 1;
    if (baseCurrency === "EUR") {
      try {
        const eurUsdtRes = await fetch(
          "https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT",
          { cache: "no-store" }
        );
        if (eurUsdtRes.ok) {
          const eurUsdtData = await eurUsdtRes.json();
          eurUsdRate = parseFloat(eurUsdtData.price) || 1;
        }
      } catch (error) {
        console.warn("Failed to fetch EUR/USDT rate:", error);
      }
    }

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
      ...walletTransactions.map(tx => {
        // Convert amount to baseCurrency if needed
        let convertedAmount = tx.amount;
        if (tx.assetSymbol !== baseCurrency) {
          // If transaction is in different currency, convert it
          if (tx.assetSymbol === "USD" && baseCurrency === "EUR") {
            convertedAmount = tx.amount / eurUsdRate;
          } else if (tx.assetSymbol === "EUR" && baseCurrency === "USD") {
            convertedAmount = tx.amount * eurUsdRate;
          }
        }
        return {
          id: tx.id,
          type: tx.type,
          status: tx.status,
          amount: convertedAmount,
          currency: baseCurrency,
          date: tx.createdAt.toISOString(),
          description: getDescriptionForWalletTransaction(tx.type),
          reference: tx.txHash || undefined,
        };
      }),

      // Format closed trades - convert profit to baseCurrency
      ...closedTrades.map(trade => {
        let convertedProfit = Math.abs(trade.profit || 0);
        // Trades are stored in USD, convert to baseCurrency if needed
        if (baseCurrency === "EUR" && eurUsdRate) {
          convertedProfit = convertedProfit / eurUsdRate;
        }
        return {
          id: trade.id,
          type: "TRADE",
          status: "SUCCESSFUL",
          amount: convertedProfit,
          currency: baseCurrency,
          date: trade.endAt?.toISOString() || trade.createdAt.toISOString(),
          description: `${trade.type} ${trade.ticker} (${trade.volume} lots)`,
          reference: undefined,
          aiEnabled: trade.aiEnabled || false,
        };
      }),

      // Format referral rewards - convert to baseCurrency
      ...referralRewards.map(referral => {
        let convertedAmount = referral.rewardAmount;
        if (referral.rewardCurrency !== baseCurrency) {
          if (referral.rewardCurrency === "USD" && baseCurrency === "EUR") {
            convertedAmount = referral.rewardAmount / eurUsdRate;
          } else if (referral.rewardCurrency === "EUR" && baseCurrency === "USD") {
            convertedAmount = referral.rewardAmount * eurUsdRate;
          }
        }
        return {
          id: referral.id,
          type: "REFERRAL",
          status: "SUCCESSFUL",
          amount: convertedAmount,
          currency: baseCurrency,
          date: referral.updatedAt.toISOString(),
          description: `Referral reward from ${referral.referredUser?.name || referral.referredUser?.email || 'a friend'}`,
          reference: undefined,
        };
      }),
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