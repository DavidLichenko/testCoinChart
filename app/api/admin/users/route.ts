// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true },
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        can_withdraw: true,
        isVerif: true,
        blocked: true,
        createdAt: true,
        updatedAt: true,
        baseCurrency: true,
        walletBalances: {
          select: {
            assetSymbol: true,
            ownBalance: true,
          }
        }
      },
    })
    
    // Calculate balance from walletBalances for each user
    const usersWithBalance = users.map(user => {
      const baseCurrency = user.baseCurrency || "USD"
      const wallet = user.walletBalances.find(w => w.assetSymbol === baseCurrency)
      return {
        ...user,
        totalBalance: wallet?.ownBalance || 0
      }
    })

    return NextResponse.json(usersWithBalance)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
    )
  }
}
