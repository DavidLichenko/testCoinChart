import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        balance: true,
      },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      totalBalance: user.TotalBalance || 0,
      usdBalance: user.balance?.usd || 0,
      canWithdraw: user.can_withdraw,
      isVerified: user.isVerif,
    })
  } catch (error) {
    console.error("Error fetching user balance:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
