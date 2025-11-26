import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin using standardized function
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { userId: params.userId },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json(messages)

  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}