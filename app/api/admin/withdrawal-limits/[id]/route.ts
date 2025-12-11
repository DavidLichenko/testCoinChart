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

    const limit = await prisma.withdrawalLimit.update({
      where: { id: params.id },
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
    console.error("Error updating withdrawal limit:", error)
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

    await prisma.withdrawalLimit.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting withdrawal limit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}




