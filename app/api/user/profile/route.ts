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
        verification: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      canWithdraw: user.can_withdraw,
      isVerified: user.isVerif,
      totalBalance: user.TotalBalance || 0,
      usdBalance: user.balance?.usd || 0,
      blocked: user.blocked,
      status: user.status,
      createdAt: user.createdAt,
      verification: user.verification[0] || null,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { name, email, image } = body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        image,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user profile:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
