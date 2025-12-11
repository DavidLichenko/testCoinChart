import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasOwnerAccess } from "@/lib/admin-access"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true },
    })

    if (!user || !hasOwnerAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const limits = await prisma.withdrawalLimit.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(limits)
  } catch (error) {
    console.error("Error fetching withdrawal limits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true },
    })

    if (!user || !hasOwnerAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const {
      method,
      minAmount,
      maxAmount,
      dailyLimit,
      monthlyLimit,
      fee,
      feePercent,
      processingTime,
      isActive,
    } = await request.json()

    const limit = await prisma.withdrawalLimit.create({
      data: {
        method,
        minAmount: Number(minAmount),
        maxAmount: maxAmount ? Number(maxAmount) : null,
        dailyLimit: dailyLimit ? Number(dailyLimit) : null,
        monthlyLimit: monthlyLimit ? Number(monthlyLimit) : null,
        fee: Number(fee),
        feePercent: feePercent ? Number(feePercent) : null,
        processingTime: processingTime || null,
        isActive: Boolean(isActive),
      },
    })

    return NextResponse.json(limit)
  } catch (error) {
    console.error("Error creating withdrawal limit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


