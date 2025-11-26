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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, messageIds } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: "Message IDs are required" }, { status: 400 })
    }

    // Update messages to mark as read
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        userId: userId // Admin can mark user's messages as read
      },
      data: {
        isRead: true
      }
    } as any)

    // Notify user through Pusher that their messages have been read by admin
    await pusherServer.trigger(`chat-${userId}`, "messages-read-by-admin", {
      messageIds
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}