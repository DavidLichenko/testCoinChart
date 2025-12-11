import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasOwnerAccess } from "@/lib/admin-access"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const reward = await prisma.referralReward.update({
      where: { id: params.id },
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
    console.error("Error updating referral reward:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.referralReward.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting referral reward:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



