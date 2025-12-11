import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active AI trading tickers
    const aiTickers = await prisma.aITradingTicker.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        symbol: true,
      },
    })

    return NextResponse.json(aiTickers.map(t => t.symbol))
  } catch (error) {
    console.error("Error fetching AI trading tickers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}




