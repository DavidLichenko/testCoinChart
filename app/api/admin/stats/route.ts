import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const basicUser = await getCurrentUser()
    if (!basicUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: basicUser.id },
    })

    if (
        !user ||
        (user.role !== UserRole.OWNER &&
            user.role !== UserRole.CR_MANAGMENT &&
            user.role !== UserRole.TEAMLEAD)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ----- только обычные пользователи (ROLE = USER) -----

    // Кол-во пользователей
    const totalUsers = await prisma.user.count({
      where: { role: UserRole.USER },
    })

    // Суммарный баланс только USER
    const totalBalanceResult = await prisma.user.aggregate({
      _sum: { TotalBalance: true },
      where: { role: UserRole.USER },
    })

    // Всего сделок только USER
    const totalTrades = await prisma.trade_Transaction.count({
      where: {
        User: { role: UserRole.USER },
      },
    })

    // Кол-во ордеров (депозиты/выводы) только USER
    const totalOrders = await prisma.orders.count({
      where: {
        User: { role: UserRole.USER },
      },
    })

    // Открытые сделки только USER
    const activeTrades = await prisma.trade_Transaction.count({
      where: {
        status: "OPEN",
        User: { role: UserRole.USER },
      },
    })

    // Ожидающие верификации только USER
    const pendingVerifications = await prisma.verification.count({
      where: {
        status: "PENDING",
        // у verification связь называется `user`, не `User`
        user: { role: UserRole.USER },
      },
    })

    // Недавние пользователи (только USER)
    const recentUsers = await prisma.user.findMany({
      where: { role: UserRole.USER },
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

    // Недавние сделки (только USER) + имя/почта юзера
    const recentTrades = await prisma.trade_Transaction.findMany({
      where: {
        User: { role: UserRole.USER },
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
      totalBalance: totalBalanceResult._sum.TotalBalance || 0,
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
