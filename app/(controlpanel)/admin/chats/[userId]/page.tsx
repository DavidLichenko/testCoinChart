import { AdminChatWindow } from '@/components/admin/chat/admin-chat-window'
import { prisma } from '@/prisma/prisma-client'
import { notFound } from 'next/navigation'

async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) {
    notFound()
  }
  
  return user
}

async function getMessages(userId: string) {
  return await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  })
}

export default async function ChatPage({ params }: { params: { userId: string } }) {
  const [user, messages] = await Promise.all([
    getUser(params.userId),
    getMessages(params.userId)
  ])

  return <AdminChatWindow user={user} initialMessages={messages} />
}

