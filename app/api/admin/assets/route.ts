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

    const assets = await prisma.asset.findMany({
      orderBy: { symbol: "asc" },
    })

    return NextResponse.json(assets)
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





