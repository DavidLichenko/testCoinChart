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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Build where clause
    const whereClause: any = {}
    if (userId) {
      whereClause.userId = userId
    }

    // Get trades (filtered by userId if provided)
    const trades = await prisma.trade_Transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(trades)

  } catch (error) {
    console.error("Error fetching trades:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}