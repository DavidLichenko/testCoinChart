import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    const { userId } = params
    const updates = await request.json()

    // Validate updates
    const allowedFields = ['name', 'role', 'TotalBalance', 'can_withdraw', 'isVerif', 'blocked', 'status']
    const filteredUpdates: any = {}
    
    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field]
      }
    }

    // Handle balance updates with transaction
    if ('TotalBalance' in updates) {
      await prisma.$transaction(async (tx) => {
        // Update user's TotalBalance
        await tx.user.update({
          where: { id: userId },
          data: { TotalBalance: updates.TotalBalance }
        })

        // Update or create Balances record
        await tx.balances.upsert({
          where: { userId },
          update: { usd: updates.TotalBalance },
          create: { userId, usd: updates.TotalBalance }
        })
      })

      // Trigger real-time update
      await pusherServer.trigger(`user-${userId}`, 'balance-update', {
        totalBalance: updates.TotalBalance,
      })
    } else {
      // Regular user update without balance
      await prisma.user.update({
        where: { id: userId },
        data: filteredUpdates
      })
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        TotalBalance: true,
        can_withdraw: true,
        isVerif: true,
        blocked: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 