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
      include: { 
        User: { 
          select: { 
            id: true, 
            email: true, 
            name: true,
            baseCurrency: true
          } 
        } 
      }
    })

    // If profit was updated - adjust user wallet balance
    if ('profit' in filteredUpdates) {
      const profitDiff = filteredUpdates.profit - (existingTrade.profit || 0)
      const baseCurrency = updatedTrade.User.baseCurrency || "USD"
      
      // Update wallet balance instead of TotalBalance
      await prisma.walletBalance.update({
        where: {
          userId_assetSymbol: {
            userId: updatedTrade.User.id,
            assetSymbol: baseCurrency
          }
        },
        data: {
          ownBalance: { increment: profitDiff }
        }
      })
    }

    return NextResponse.json(updatedTrade)
  } catch (error) {
    console.error("Error updating trade:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}