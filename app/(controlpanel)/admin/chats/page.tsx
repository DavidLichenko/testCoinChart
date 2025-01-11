import { AdminChatList } from '@/components/admin/admin-chat-list'
import { prisma } from '@/prisma/prisma-client'

async function getChats() {
    return await prisma.message.findMany({
        where: {
            isSupportMessage: false
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 50,
        include: {
            user: true
        }
    })
}

export default async function AdminChatsPage() {
    const chats = await getChats()

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Support Chats</h1>
            <AdminChatList chats={chats} />
        </div>
    )
}

