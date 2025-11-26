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

    const { messageIds } = await request.json()

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: "Message IDs are required" }, { status: 400 })
    }

    // Update messages to mark as read
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        userId: currentUser.id // Ensure user can only mark their own messages as read
      },
      data: {
        isRead: true
      }
    } as any)

    // Notify admin through Pusher that messages have been read
    await pusherServer.trigger("admin-chat", "messages-read", {
      userId: currentUser.id,
      messageIds
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}