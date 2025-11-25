import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function GET(request: NextRequest) {
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

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all users who have sent messages
    const usersWithMessages = await prisma.user.findMany({
      where: {
        messages: {
          some: {}
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                isSupportMessage: false
              }
            }
          }
        }
      },
      orderBy: {
        messages: {
          _count: "desc"
        }
      }
    })

    const sessions = usersWithMessages.map(user => ({
      userId: user.id,
      user: {
        email: user.email,
        name: user.name
      },
      lastMessage: user.messages[0]?.content || "No messages",
      lastMessageTime: user.messages[0]?.createdAt || user.createdAt,
      unreadCount: user._count.messages,
      isOnline: true // You can implement online status logic here
    }))

    return NextResponse.json(sessions)

  } catch (error) {
    console.error("Error fetching chat sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}