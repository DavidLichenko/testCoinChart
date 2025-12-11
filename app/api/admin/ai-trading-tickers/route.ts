import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasOwnerAccess } from "@/lib/admin-access"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true },
    })

    if (!user || !hasOwnerAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const aiTickers = await prisma.aITradingTicker.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(aiTickers)
  } catch (error) {
    console.error("Error fetching AI trading tickers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true },
    })

    if (!user || !hasOwnerAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { symbol, isActive, priority } = await request.json()

    const aiTicker = await prisma.aITradingTicker.create({
      data: {
        symbol,
        isActive: Boolean(isActive ?? true),
        priority: Number(priority ?? 0),
      },
    })

    return NextResponse.json(aiTicker)
  } catch (error) {
    console.error("Error creating AI trading ticker:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





