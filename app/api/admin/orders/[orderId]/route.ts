// app/api/admin/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { pusherServer } from "@/lib/pusher-server"
import { getUserBalanceData } from "@/lib/user-balance"

export async function PATCH(
    request: NextRequest,
    { params }: { params: { orderId: string } },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = params
    const { status } = await request.json()

    if (!["PENDING", "SUCCESSFUL", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { User: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status === "SUCCESSFUL" || order.status === "CANCELLED") {
      return NextResponse.json(
          { error: "Order already processed" },
          { status: 400 },
      )
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.orders.update({
        where: { id: orderId },
        data: { status },
        include: { User: true },
      })

      if (status === "SUCCESSFUL") {
        const baseCurrency =
            (updated.User.baseCurrency || "EUR") as "EUR" | "USD" | string
        const userId = updated.userId
        const amount = updated.amount

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
            updated.type === "WITHDRAW" ? -Math.abs(amount) : Math.abs(amount)
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
            creditBalance: 0,
            locked: 0,
          },
        })
      }

      return updated
    })

    if (status === "SUCCESSFUL") {
      const data = await getUserBalanceData(updatedOrder.userId)
      await pusherServer.trigger(
          `user-${updatedOrder.userId}`,
          "balance-update",
          {
            userId: updatedOrder.userId,
            balance: data.balance,
            liveProfit: data.liveProfit,
            details: data.details,
          },
      )
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
    )
  }
}
