import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin using standardized function
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { tradeId } = params
    const updates = await request.json()

    const allowedFields = ['profit', 'openIn', 'openInA', 'closeIn', 'status']
    const filteredUpdates: any = {}
    
    for (const field of allowedFields) {
      if (field in updates) filteredUpdates[field] = updates[field]
    }

    // Get the existing trade
    const existingTrade = await prisma.trade_Transaction.findUnique({
      where: { id: tradeId }
    })

    if (!existingTrade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    // Update the trade
    const updatedTrade = await prisma.trade_Transaction.update({
      where: { id: tradeId },
      data: filteredUpdates,
      include: { User: { select: { id: true, TotalBalance: true, email: true, name: true } } }
    })

    // If profit was updated - adjust user balance
    if ('profit' in filteredUpdates) {
      const profitDiff = filteredUpdates.profit - (existingTrade.profit || 0)
      await prisma.user.update({
        where: { id: updatedTrade.User.id },
        data: { TotalBalance: { increment: profitDiff } }
      })
    }

    return NextResponse.json(updatedTrade)
  } catch (error) {
    console.error("Error updating trade:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}