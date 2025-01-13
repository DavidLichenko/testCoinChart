import { notFound } from 'next/navigation'
import { prisma } from '@/prisma/prisma-client'
import { AdminChatWindow } from '@/components/admin/chat/admin-chat-window'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

async function getUserData(userId: string, currentUserRole: string, currentUserId: string) {
  let user;

  if (currentUserRole === 'WORKER') {
    user = await prisma.user.findFirst({
      where: {
        id: userId,
        assignedTo: currentUserId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
  } else {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
  }

  if (!user) {
    notFound()
  }

  return user
}

export default async function ChatPage({ params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    notFound()
  }

  const user = await getUserData(params.userId, session.user.role, session.user.id)

  return <AdminChatWindow user={user} initialMessages={user.messages} />
}

