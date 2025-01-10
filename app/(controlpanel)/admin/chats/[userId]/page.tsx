import { AdminChatWindow } from '@/components/admin/admin-chat-window'
import { prisma } from '@/prisma/prisma-client'

async function getMessages(userId: string) {
  return await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: { user: true }
  })
}

export default async function AdminChatPage({ params }: { params: { userId: string } }) {
  const messages = await getMessages(params.userId)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Chat with User {params.userId}</h1>
      <AdminChatWindow initialMessages={messages} userId={params.userId} />
    </div>
  )
}

