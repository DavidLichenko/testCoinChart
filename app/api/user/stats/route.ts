import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        balance: true,
        trade_transaction: {
          where: {
            status: "CLOSE",
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const activeTrades = await prisma.trade_Transaction.count({
      where: {
        userId,
        status: "OPEN",
      },
    })

    const closedTrades = user.trade_transaction
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0)
    const winningTrades = closedTrades.filter((trade) => (trade.profit || 0) > 0).length
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0

    return NextResponse.json({
      totalBalance: user.TotalBalance || 0,
      totalPnL,
      totalPnLPercent: user.TotalBalance ? (totalPnL / user.TotalBalance) * 100 : 0,
      activeTradesCount: activeTrades,
      winRate,
      isVerified: user.isVerif,
      canWithdraw: user.can_withdraw,
      memberSince: user.createdAt,
      status: user.status,
      blocked: user.blocked,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
