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

    const plans = await prisma.stakingPlan.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error("Error fetching staking plans:", error)
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

    const { name, assetSymbol, duration, apr, minAmount, isActive } = await request.json()

    const plan = await prisma.stakingPlan.create({
      data: {
        name,
        assetSymbol,
        duration: Number(duration),
        apr: Number(apr),
        minAmount: Number(minAmount),
        isActive: Boolean(isActive),
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Error creating staking plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





