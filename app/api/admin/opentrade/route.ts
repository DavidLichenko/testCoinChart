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

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ⚠️ если ты уже ушёл от TotalBalance — тут потом тоже перепишем под walletBalance
    if ((user.TotalBalance || 0) < margin) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    const trade = await prisma.trade_Transaction.create({
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
        aiEnabled: Boolean(aiEnabled),  // 👈 вот тут
      },
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        TotalBalance: {
          decrement: Number(margin),
        },
      },
    })

    return NextResponse.json(trade)
  } catch (error) {
    console.error("Admin error creating trade:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
