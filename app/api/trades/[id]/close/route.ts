import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireAuth()
    const { id } = params
    const body = await request.json()
    const { closePrice } = body

    const trade = await prisma.trade_Transaction.findUnique({
      where: { id },
    })

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    if (trade.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Calculate profit
    const profit =
      trade.type === "BUY"
        ? (closePrice - trade.openIn) * trade.volume * trade.leverage
        : (trade.openIn - closePrice) * trade.volume * trade.leverage

    const updatedTrade = await prisma.trade_Transaction.update({
      where: { id },
      data: {
        status: "CLOSE",
        closeIn: closePrice,
        profit,
        endAt: new Date(),
      },
    })

    // Update user balance (return margin + profit)
    await prisma.user.update({
      where: { id: trade.userId },
      data: {
        TotalBalance: {
          increment: trade.margin + profit,
        },
      },
    })

    return NextResponse.json(updatedTrade)
  } catch (error) {
    console.error("Error closing trade:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
