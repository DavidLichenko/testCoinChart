import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"
import { hasAdminAccess } from "@/lib/admin-access"

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin using standardized function
    const adminUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    })

    if (!adminUser || !hasAdminAccess(adminUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { updates } = await request.json()

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid updates format" }, { status: 400 })
    }

    const results = []

    for (const update of updates) {
      const { userId, newBalance } = update

      if (!userId || typeof newBalance !== 'number') {
        results.push({ userId, success: false, error: "Invalid data" })
        continue
      }

      try {
        await prisma.$transaction(async (tx) => {
          // Update user's TotalBalance
          await tx.user.update({
            where: { id: userId },
            data: { TotalBalance: newBalance },
          })

          // Update balances record
          await tx.balances.upsert({
            where: { userId },
            update: { usd: newBalance },
            create: { userId, usd: newBalance },
          })

          // Notify via Pusher
          await pusherServer.trigger(`balance-update-${userId}`, "balance-update", {
            balance: newBalance,
          })
        })

        results.push({ userId, success: true })
      } catch (error) {
        console.error(`Error updating balance for user ${userId}:`, error)
        results.push({ userId, success: false, error: "Failed to update balance" })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in bulk balance update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}