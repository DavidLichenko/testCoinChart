import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    })

    if (!user || (user.role !== 'OWNER' && user.role !== 'CR_MANAGMENT' && user.role !== 'TEAMLEAD')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { content, imageUrl, userId } = await request.json()

    if (!content && !imageUrl) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        content: content || "📷 Image",
        imageUrl,
        userId: userId,
        isSupportMessage: true
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    // Trigger Pusher event for the specific user
    await pusherServer.trigger(`chat-${userId}`, "new-message", message)

    return NextResponse.json(message)

  } catch (error) {
    console.error("Error creating support message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 