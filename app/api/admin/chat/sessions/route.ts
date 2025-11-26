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

    // Get all users who have sent messages, sorted by most recent message
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
                isSupportMessage: false,
                isRead: false // Only count unread messages
              }
            }
          }
        }
      }
    } as any)

    const sessions = usersWithMessages.map(user => ({
      userId: user.id,
      user: {
        email: user.email,
        name: user.name
      },
      lastMessage: (user as any).messages[0]?.content || "No messages",
      lastMessageTime: (user as any).messages[0]?.createdAt || new Date(0), // Use epoch time if no messages
      unreadCount: (user as any)._count.messages,
      isOnline: true // You can implement online status logic here
    }))

    // Sort sessions by lastMessageTime in descending order (most recent first)
    // This ensures that users with the most recent activity appear at the top of the list
    sessions.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime).getTime();
      const timeB = new Date(b.lastMessageTime).getTime();
      return timeB - timeA;
    });

    return NextResponse.json(sessions)

  } catch (error) {
    console.error("Error fetching chat sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
