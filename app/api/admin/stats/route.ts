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

    // Run all queries in parallel for maximum speed
    const [
      totalUsers,
      totalBalance,
      totalTrades,
      totalOrders,
      activeTrades,
      pendingVerifications,
      recentUsers,
      recentTrades,
    ] = await Promise.all([
      // Count of users
      prisma.user.count({
        where: { role: "USER" },
      }),

      // Total balance - use aggregate for better performance
      (async () => {
        const result = await prisma.walletBalance.aggregate({
          where: {
            user: { role: "USER" },
            OR: [
              { assetSymbol: "USD" },
              { assetSymbol: "EUR" }
            ]
          },
          _sum: {
            ownBalance: true,
          },
        })
        return result._sum?.ownBalance || 0
      })(),

      // Total trades only for USERs
      prisma.trade_Transaction.count({
        where: {
          User: { role: "USER" },
        },
      }),

      // Count of orders (deposits/withdrawals) only for USERs
      prisma.orders.count({
        where: {
          User: { role: "USER" },
        },
      }),

      // Open trades only for USERs
      prisma.trade_Transaction.count({
        where: {
          status: "OPEN",
          User: { role: "USER" },
        },
      }),

      // Pending verifications only for USERs
      prisma.verification.count({
        where: {
          status: "PENDING",
          user: { role: "USER" },
        },
      }),

      // Recent users (only USERs)
      prisma.user.findMany({
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
      }),

      // Recent trades (only USERs) + user name/email
      prisma.trade_Transaction.findMany({
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
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalBalance,
      totalTrades,
      totalOrders,
      activeTrades,
      pendingVerifications,
      recentUsers,
      recentTrades,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10',
      },
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
    )
  }
}