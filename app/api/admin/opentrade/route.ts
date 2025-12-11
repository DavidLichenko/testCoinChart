// app/api/admin/trades/route.ts (или твой opentrade файл)
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      type,
      ticker,
      volume,
      leverage,
      margin,
      openIn,
      takeProfit,
      stopLoss,
      assetType,
      aiEnabled,        // 👈 добавили
    } = body

    if (
        !userId ||
        !type ||
        !ticker ||
        !volume ||
        !leverage ||
        !margin ||
        !openIn ||
        !assetType
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { baseCurrency: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const baseCurrency = user.baseCurrency || "USD"

    // Используем walletBalances вместо TotalBalance
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.walletBalance.findUnique({
        where: {
          userId_assetSymbol: { userId, assetSymbol: baseCurrency },
        },
      })

      const available = (wallet?.ownBalance || 0) + (wallet?.creditBalance || 0)

      if (available < margin) {
        throw new Error("Insufficient balance")
      }

      // Lock margin
      await tx.walletBalance.update({
        where: {
          userId_assetSymbol: { userId, assetSymbol: baseCurrency },
        },
        data: {
          ownBalance: { decrement: margin },
          locked: { increment: margin },
        },
      })

      const trade = await tx.trade_Transaction.create({
        data: {
          userId,
          type,
          ticker,
          volume: Number(volume),
          leverage: Number(leverage),
          margin: Number(margin),
          openIn: Number(openIn),
          openInA: Number(openIn),
          takeProfit: takeProfit ? Number(takeProfit) : null,
          stopLoss: stopLoss ? Number(stopLoss) : null,
          assetType,
          profit: 0,
          status: "OPEN",
          aiEnabled: Boolean(aiEnabled),
        },
      })

      return { trade }
    })

    return NextResponse.json(result.trade)
  } catch (error) {
    console.error("Admin error creating trade:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
