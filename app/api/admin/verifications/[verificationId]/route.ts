import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { verificationId: string } }
) {
  try {
    const basicUser = await getCurrentUser()
    if (!basicUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the full user from DB to get the role
    const fullUser = await prisma.user.findUnique({
      where: { id: basicUser.id },
      select: { role: true }
    });

    if (!fullUser || !hasAdminAccess(fullUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { verificationId } = params
    const body = await request.json()
    const { status } = body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Use a transaction to ensure data consistency
    const transactionResult = await prisma.$transaction(async (tx) => {
      const updatedVerification = await tx.verification.update({
        where: { id: verificationId },
        data: { status },
      })

      // If approving verification, update user's isVerif status
      if (status === 'APPROVED') {
        await tx.user.update({
          where: { id: updatedVerification.userId },
          data: { isVerif: true },
        })
      }

      return updatedVerification
    })

    return NextResponse.json(transactionResult)
  } catch (error) {
    console.error("Error updating verification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}