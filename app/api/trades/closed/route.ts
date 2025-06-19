import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    const closedTrades = await prisma.trade_Transaction.findMany({
      where: {
        userId,
        status: "CLOSE",
      },
      orderBy: {
        endAt: "desc",
      },
    })

    return NextResponse.json(closedTrades)
  } catch (error) {
    console.error("Error fetching closed trades:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
