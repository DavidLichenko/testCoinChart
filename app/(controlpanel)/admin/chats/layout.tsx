import { AdminChatSidebar } from '@/components/admin/chat/admin-chat-sidebar'

export default function AdminChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 items-start md:grid md:grid-cols-[400px_minmax(0,1fr)] md:gap-6">
      <AdminChatSidebar />
      <main className="relative h-[calc(100vh-8rem)]">
        {children}
      </main>
    </div>
  )
}

