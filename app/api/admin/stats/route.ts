import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const basicUser = await getCurrentUser();
    if (!basicUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: basicUser.id },
    });

    if (!user || (user.role !== UserRole.OWNER && user.role !== UserRole.CR_MANAGMENT && user.role !== UserRole.TEAMLEAD)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Get total users
    const totalUsers = await prisma.user.count()

    // Get total balance
    const totalBalanceResult = await prisma.user.aggregate({
      _sum: { TotalBalance: true }
    })

    // Get total trades
    const totalTrades = await prisma.trade_Transaction.count()

    // Get total orders
    const totalOrders = await prisma.orders.count()

    // Get active trades
    const activeTrades = await prisma.trade_Transaction.count({
      where: { status: "OPEN" }
    })

    // Get pending verifications
    const pendingVerifications = await prisma.verification.count({
      where: { status: "PENDING" }
    })

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isVerif: true,
      }
    })

    // Get recent trades
    const recentTrades = await prisma.trade_Transaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      totalUsers,
      totalBalance: totalBalanceResult._sum.TotalBalance || 0,
      totalTrades,
      totalOrders,
      activeTrades,
      pendingVerifications,
      recentUsers,
      recentTrades
    })

  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 