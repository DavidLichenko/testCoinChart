import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    // Optimize: fetch only needed fields and use parallel queries
    const [user, activeTradesCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          baseCurrency: true,
          isVerif: true,
          can_withdraw: true,
          createdAt: true,
          status: true,
          blocked: true,
          walletBalances: {
            select: {
              assetSymbol: true,
              ownBalance: true,
            }
          },
          _count: {
            select: {
              trade_transaction: {
                where: {
                  status: "CLOSE",
                },
              },
            },
          },
        },
      }),
      prisma.trade_Transaction.count({
        where: {
          userId,
          status: "OPEN",
        },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get balance from walletBalances
    const baseCurrency = user.baseCurrency || "USD"
    const wallet = user.walletBalances.find(w => w.assetSymbol === baseCurrency)
    const totalBalance = wallet?.ownBalance || 0

    // Fetch closed trades with only profit field for PnL calculation
    const closedTrades = await prisma.trade_Transaction.findMany({
      where: {
        userId,
        status: "CLOSE",
      },
      select: {
        profit: true,
      },
    })

    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0)
    const winningTrades = closedTrades.filter((trade) => (trade.profit || 0) > 0).length
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0

    return NextResponse.json({
      totalBalance,
      totalPnL,
      totalPnLPercent: totalBalance > 0 ? (totalPnL / totalBalance) * 100 : 0,
      activeTradesCount,
      winRate,
      isVerified: user.isVerif,
      canWithdraw: user.can_withdraw,
      memberSince: user.createdAt,
      status: user.status,
      blocked: user.blocked,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
