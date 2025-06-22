import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    })

    if (!adminUser || (adminUser.role !== 'OWNER' && adminUser.role !== 'CR_MANAGMENT' && adminUser.role !== 'TEAMLEAD')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { tradeId } = params
    const updates = await request.json()

    // Validate updates - only allow specific fields for admin editing
    const allowedFields = ['profit', 'openIn', 'openInA', 'closeIn', 'status']
    const filteredUpdates: any = {}
    
    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field]
      }
    }

    const updatedTrade = await prisma.trade_Transaction.update({
      where: { id: tradeId },
      data: filteredUpdates,
      include: {
        User: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedTrade)

  } catch (error) {
    console.error("Error updating trade:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 