import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all active referral rewards for public display
    const rewards = await prisma.referralReward.findMany({
      where: { isActive: true },
      orderBy: { rewardAmount: "desc" },
    })

    return NextResponse.json(rewards)
  } catch (error) {
    console.error("Error fetching referral rewards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

