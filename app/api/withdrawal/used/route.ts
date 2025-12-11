import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET() {
  try {
    const userId = await requireAuth()

    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get withdrawals for today
    const todayWithdrawals = await prisma.walletTransaction.findMany({
      where: {
        userId,
        type: "WITHDRAW",
        status: "COMPLETED",
        createdAt: {
          gte: startOfDay,
        },
      },
      select: {
        amount: true,
      },
    })

    // Get withdrawals for this month
    const monthWithdrawals = await prisma.walletTransaction.findMany({
      where: {
        userId,
        type: "WITHDRAW",
        status: "COMPLETED",
        createdAt: {
          gte: startOfMonth,
        },
      },
      select: {
        amount: true,
      },
    })

    const today = todayWithdrawals.reduce((sum, t) => sum + t.amount, 0)
    const month = monthWithdrawals.reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({ today, month })
  } catch (error) {
    console.error("Error fetching used withdrawal amounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


