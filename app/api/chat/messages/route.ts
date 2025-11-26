import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const messages = await prisma.message.findMany({
      where: { userId: currentUser.id },
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

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, imageUrl } = await request.json()

    if (!content && !imageUrl) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        content: content || "📷 Image",
        imageUrl,
        userId: currentUser.id,
        isSupportMessage: false,
        isRead: false // User messages are unread by default until admin reads them
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

    // Trigger Pusher event for admin
    await pusherServer.trigger("admin-chat", "new-user-message", {
      session: {
        userId: currentUser.id,
        user: {
          email: currentUser.email,
          name: currentUser.name
        },
        lastMessage: message.content,
        lastMessageTime: message.createdAt,
        unreadCount: (message as any).isRead ? 0 : 1,
        isOnline: true
      },
      message
    })

    return NextResponse.json(message)

  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 