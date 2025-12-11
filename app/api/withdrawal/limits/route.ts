import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const limits = await prisma.withdrawalLimit.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(limits)
  } catch (error) {
    console.error("Error fetching withdrawal limits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


