import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Optimized: Only select essential user fields, no wallet balances
    // Wallet data should be fetched separately when needed
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        can_withdraw: true,
        isVerif: true,
        blocked: true,
        status: true,
        createdAt: true,
        role: true,
        aiTrading: true,
        baseCurrency: true,
        // Removed walletBalances - fetch separately when needed for better performance
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
