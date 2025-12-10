// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess, hasOwnerOrCRManagementAccess } from "@/lib/admin-access"
import { getUserBalanceData } from "@/lib/user-balance"
import { pusherServer } from "@/lib/pusher-server"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const whereClause: any = {}
    if (userId) {
      whereClause.userId = userId
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        User: true,
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getCurrentUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminDetails = await prisma.user.findUnique({
      where: { id: adminUser.id },
    })
    if (!adminDetails || !hasOwnerOrCRManagementAccess(adminDetails)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, type, amount, status } = await req.json()

    if (!userId || !type || !amount || !status) {
      return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 },
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        baseCurrency: true,
      },
    })
    if (!targetUser) {
      return NextResponse.json(
          { error: "Target user not found" },
          { status: 404 },
      )
    }

    const numericAmount = parseFloat(amount)

    const newOrder = await prisma.$transaction(async (tx) => {
      const created = await tx.orders.create({
        data: {
          userId,
          type,
          amount: numericAmount,
          status,
        },
      })

      if (status === "SUCCESSFUL") {
        const baseCurrency =
            (targetUser.baseCurrency || "EUR") as "EUR" | "USD" | string

        const wallet = await tx.walletBalance.findUnique({
          where: {
            userId_assetSymbol: {
              userId,
              assetSymbol: baseCurrency,
            },
          },
        })

        const currentOwn = wallet?.ownBalance ?? 0
        const delta =
            type === "DEPOSIT" ? numericAmount : -Math.abs(numericAmount)
        const newOwn = currentOwn + delta

        await tx.walletBalance.upsert({
          where: {
            userId_assetSymbol: {
              userId,
              assetSymbol: baseCurrency,
            },
          },
          update: {
            ownBalance: newOwn,
          },
          create: {
            userId,
            assetSymbol: baseCurrency,
            ownBalance: Math.max(0, newOwn),
            creditLimit: 0,
            creditUsed: 0,
            locked: 0,
          },
        })
      }

      return created
    })

    // После успешного изменения кошелька (если было) — пушим баланс
    if (status === "SUCCESSFUL") {
      const data = await getUserBalanceData(userId)
      await pusherServer.trigger(`user-${userId}`, "balance-update", {
        userId,
        balance: data.balance,
        liveProfit: data.liveProfit,
        details: data.details,
      })
    }

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
    )
  }
}
