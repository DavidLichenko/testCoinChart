import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const basicUser = await getCurrentUser()
    if (!basicUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: basicUser.id },
    })

    if (!user || (user.role !== UserRole.OWNER && user.role !== UserRole.CR_MANAGMENT && user.role !== UserRole.TEAMLEAD)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const verifications = await prisma.verification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            isVerif: true,
          },
        },
      },
    })

    return NextResponse.json(verifications)
  } catch (error) {
    console.error("Error fetching verifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 