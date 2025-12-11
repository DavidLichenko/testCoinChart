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

    const rewards = await prisma.referralReward.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(rewards)
  } catch (error) {
    console.error("Error fetching referral rewards:", error)
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
      action,
      actionLabel,
      rewardAmount,
      rewardCurrency,
      threshold,
      isActive,
      description,
    } = await request.json()

    const reward = await prisma.referralReward.create({
      data: {
        action,
        actionLabel,
        rewardAmount: Number(rewardAmount),
        rewardCurrency,
        threshold: threshold ? Number(threshold) : null,
        isActive: Boolean(isActive),
        description: description || null,
      },
    })

    return NextResponse.json(reward)
  } catch (error) {
    console.error("Error creating referral reward:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



