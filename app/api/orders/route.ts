import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    const orders = await prisma.orders.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { type, amount, depositFrom, bankName, cardNumber, cryptoAddress, cryptoNetwork, withdrawMethod } = body

    // Validate required fields
    if (!type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const order = await prisma.orders.create({
      data: {
        userId,
        type,
        amount: Number.parseFloat(amount),
        status: "PENDING",
        depositFrom,
        bankName,
        cardNumber,
        cryptoAddress,
        cryptoNetwork,
        withdrawMethod,
      },
    })
    //
    // // If it's a deposit, automatically approve and add to balance (in real app, this would be manual)
    // if (type === "DEPOSIT") {
    //   await prisma.orders.update({
    //     where: { id: order.id },
    //     data: {
    //       status: "PENDING",
    //       amount: Number.parseFloat(amount),
    //     },
    //   })
    //
    //   await prisma.user.update({
    //     where: { id: userId },
    //     data: {
    //       TotalBalance: {
    //         increment: Number.parseFloat(amount),
    //       },
    //     },
    //   })
    // }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
