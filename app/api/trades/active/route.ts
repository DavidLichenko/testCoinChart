import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    const activeTrades = await prisma.trade_Transaction.findMany({
      where: {
        userId,
        status: "OPEN",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(activeTrades)
  } catch (error) {
    console.error("Error fetching active trades:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
