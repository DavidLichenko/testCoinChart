import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"
import { pusherServer } from "@/lib/pusher-server"

export async function POST(request: NextRequest) {
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
        isSupportMessage: true,
        isRead: false // Admin messages are unread by default until user reads them
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    } as any)

    // Trigger Pusher event for real-time updates
    await pusherServer.trigger(`chat-${userId}`, "new-message", {
      ...(message as any),
      user: {
        email: (message as any).user.email,
        name: (message as any).user.name
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error sending admin message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}