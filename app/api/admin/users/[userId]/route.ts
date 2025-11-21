import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"

// Общая проверка админа
async function requireAdmin() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return { error: "Unauthorized" as const, status: 401, user: null }
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true },
  })

  const isAdmin =
      adminUser &&
      (adminUser.role === "OWNER" ||
          adminUser.role === "CR_MANAGMENT" ||
          adminUser.role === "TEAMLEAD")

  if (!isAdmin) {
    return { error: "Forbidden" as const, status: 403, user: null }
  }

  return { error: null, status: 200, user: currentUser }
}

// GET /api/admin/users/[userId] — данные одного юзера для админ-страницы
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
  try {
    const guard = await requireAdmin()
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    const { userId } = params

    const user = await prisma.user.findUnique({
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
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching admin user:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[userId] — обновление юзера
export async function PATCH(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
  try {
    const guard = await requireAdmin()
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    const { userId } = params
    const updates = await request.json()

    // какие поля разрешено менять
    const allowedFields = [
      "name",
      "role",
      "TotalBalance",
      "can_withdraw",
      "isVerif",
      "blocked",
      "status",
    ] as const

    const filteredUpdates: any = {}
    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field]
      }
    }

    // Если меняем баланс — отдельная транзакция + balances + pusher
    if ("TotalBalance" in filteredUpdates) {
      const newBalance = filteredUpdates.TotalBalance

      await prisma.$transaction(async (tx) => {
        // Update user's TotalBalance
        await tx.user.update({
          where: { id: userId },
          data: { TotalBalance: newBalance },
        })

        // Update or create Balances record
        await tx.balances.upsert({
          where: { userId },
          update: { usd: newBalance },
          create: { userId, usd: newBalance },
        })
      })

      // Trigger real-time update
      await pusherServer.trigger(`user-${userId}`, "balance-update", {
        totalBalance: newBalance,
      })

      // убираем TotalBalance, чтобы ниже не обновлять повторно
      delete filteredUpdates.TotalBalance
    }

    // Остальные поля (name, role, status, blocked, isVerif, can_withdraw)
    if (Object.keys(filteredUpdates).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: filteredUpdates,
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
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    )
  }
}
