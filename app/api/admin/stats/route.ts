import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function GET(request: NextRequest) {
  try {
    const basicUser = await getCurrentUser()
    if (!basicUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: basicUser.id },
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ----- only regular users (ROLE = USER) -----

    // Count of users
    const totalUsers = await prisma.user.count({
      where: { role: "USER" },
    })

    // Total balance only for USERs - calculate from walletBalances
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        baseCurrency: true,
        walletBalances: {
          select: {
            assetSymbol: true,
            ownBalance: true,
          }
        }
      }
    })
    
    // Calculate total balance from walletBalances
    let totalBalance = 0
    for (const user of users) {
      const baseCurrency = user.baseCurrency || "USD"
      const wallet = user.walletBalances.find(w => w.assetSymbol === baseCurrency)
      if (wallet) {
        totalBalance += wallet.ownBalance
      }
    }

    // Total trades only for USERs
    const totalTrades = await prisma.trade_Transaction.count({
      where: {
        User: { role: "USER" },
      },
    })

    // Count of orders (deposits/withdrawals) only for USERs
    const totalOrders = await prisma.orders.count({
      where: {
        User: { role: "USER" },
      },
    })

    // Open trades only for USERs
    const activeTrades = await prisma.trade_Transaction.count({
      where: {
        status: "OPEN",
        User: { role: "USER" },
      },
    })

    // Pending verifications only for USERs
    const pendingVerifications = await prisma.verification.count({
      where: {
        status: "PENDING",
        // verification has a relation called `user`, not `User`
        user: { role: "USER" },
      },
    })

    // Recent users (only USERs)
    const recentUsers = await prisma.user.findMany({
      where: { role: "USER" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isVerif: true,
      },
    })

    // Recent trades (only USERs) + user name/email
    const recentTrades = await prisma.trade_Transaction.findMany({
      where: {
        User: { role: "USER" },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      totalUsers,
      totalBalance,
      totalTrades,
      totalOrders,
      activeTrades,
      pendingVerifications,
      recentUsers,
      recentTrades,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
    )
  }
}