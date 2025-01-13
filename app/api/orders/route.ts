import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/prisma/prisma-client"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      email,
      type,
      amount,
      status,
      depositFrom,
      withdrawMethod,
      bankName,
      cryptoAddress,
      cryptoNetwork,
      cardNumber
    } = body

    const user = await prisma.user.findUnique({
      where: { email },
      include: { balance: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const order = await prisma.$transaction(async (prisma) => {
      const newOrder = await prisma.orders.create({
        data: {
          userId: user.id,
          type,
          amount,
          status,
          depositFrom: type === 'DEPOSIT' ? depositFrom : null,
          withdrawMethod: type === 'WITHDRAW' ? withdrawMethod : null,
          bankName: type === 'WITHDRAW' && withdrawMethod === 'Bank' ? bankName : null,
          cryptoAddress: type === 'WITHDRAW' && withdrawMethod === 'Crypto' ? cryptoAddress : null,
          cryptoNetwork: type === 'WITHDRAW' && withdrawMethod === 'Crypto' ? cryptoNetwork : null,
          cardNumber: type === 'WITHDRAW' && withdrawMethod === 'Card' ? cardNumber : null,
        },
        include: {
          User: true
        }
      })

      if (status === 'SUCCESSFUL') {
        const balanceChange = type === 'DEPOSIT' ? amount : -amount
        await prisma.balances.upsert({
          where: { userId: user.id },
          update: { usd: { increment: balanceChange } },
          create: { userId: user.id, usd: balanceChange },
        })
      }

      return newOrder
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

