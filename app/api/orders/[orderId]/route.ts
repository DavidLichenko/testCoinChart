import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/prisma/prisma-client"

export async function PUT(
    req: Request,
    { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params
    const body = await req.json()
    const { type, amount, status, depositFrom, withdrawTo } = body

    const existingOrder = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { User: { include: { balance: true } } }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updatedOrder = await prisma.$transaction(async (prisma) => {
      const order = await prisma.orders.update({
        where: { id: orderId },
        data: {
          type,
          amount,
          status,
          depositFrom: type === 'DEPOSIT' ? depositFrom : null,
          withdrawTo: type === 'WITHDRAW' ? withdrawTo : null,
        },
      })

      if (status !== existingOrder.status) {
        const balanceChange = type === 'DEPOSIT' ? amount : -amount

        if (status === 'SUCCESSFUL' && existingOrder.status !== 'SUCCESSFUL') {
          await prisma.balances.upsert({
            where: { userId: existingOrder.userId },
            update: { usd: { increment: balanceChange } },
            create: { userId: existingOrder.userId, usd: balanceChange },
          })
        } else if (status !== 'SUCCESSFUL' && existingOrder.status === 'SUCCESSFUL') {
          await prisma.balances.update({
            where: { userId: existingOrder.userId },
            data: { usd: { decrement: balanceChange } },
          })
        }
      }

      return order
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

