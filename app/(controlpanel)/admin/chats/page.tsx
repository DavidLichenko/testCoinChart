import { AdminChatList } from '@/components/admin/admin-chat-list'

export default async function AdminChatsPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Support Chats</h1>
            <AdminChatList />
        </div>
    )
}

