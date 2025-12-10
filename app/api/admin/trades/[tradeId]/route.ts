// app/api/admin/trades/[tradeId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"
import { getUserBalanceData } from "@/lib/user-balance"
import { pusherServer } from "@/lib/pusher-server"

export async function PATCH(
    request: NextRequest,
    { params }: { params: { tradeId: string } },
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true },
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { tradeId } = params
    const updates = await request.json()

    const allowedFields = ["profit", "openIn", "openInA", "closeIn", "status"]
    const filteredUpdates: any = {}

    for (const field of allowedFields) {
      if (field in updates) filteredUpdates[field] = updates[field]
    }

    const existingTrade = await prisma.trade_Transaction.findUnique({
      where: { id: tradeId },
      include: { User: { select: { id: true } } },
    })

    if (!existingTrade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    const updatedTrade = await prisma.trade_Transaction.update({
      where: { id: tradeId },
      data: filteredUpdates,
      include: {
        User: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    // После изменения сделки — пересчитываем баланс и пушим (liveProfit и т.д.)
    const userId = updatedTrade.User.id
    const data = await getUserBalanceData(userId)
    await pusherServer.trigger(`user-${userId}`, "balance-update", {
      userId,
      balance: data.balance,
      liveProfit: data.liveProfit,
      details: data.details,
    })

    return NextResponse.json(updatedTrade)
  } catch (error) {
    console.error("Error updating trade:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
    )
  }
}
