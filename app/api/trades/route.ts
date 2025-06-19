import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { type, ticker, volume, leverage, margin, openIn, takeProfit, stopLoss, assetType } = body

    // Validate required fields
    if (!type || !ticker || !volume || !leverage || !margin || !openIn || !assetType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user has sufficient balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || (user.TotalBalance || 0) < margin) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    const trade = await prisma.trade_Transaction.create({
      data: {
        userId,
        type,
        ticker,
        volume: Number.parseFloat(volume),
        leverage: Number.parseInt(leverage),
        margin: Number.parseFloat(margin),
        openIn: Number.parseFloat(openIn),
        openInA: Number.parseFloat(openIn), // Current price at open
        takeProfit: takeProfit ? Number.parseFloat(takeProfit) : null,
        stopLoss: stopLoss ? Number.parseFloat(stopLoss) : null,
        assetType,
        profit: 0, // Initial profit is 0
        status: "OPEN",
      },
    })

    // Deduct margin from user balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        TotalBalance: {
          decrement: Number.parseFloat(margin),
        },
      },
    })

    return NextResponse.json(trade)
  } catch (error) {
    console.error("Error creating trade:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
