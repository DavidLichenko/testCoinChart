'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatUserItem } from './chat-user-item'
import { useSocket } from '@/hooks/use-socket'

interface ChatUser {
  id: string
  name: string | null
  email: string
  imageUrl: string | null
  lastMessage?: {
    content: string
    createdAt: Date
  }
}

export function AdminChatSidebar() {
  const [users, setUsers] = useState<ChatUser[]>([])
  const [search, setSearch] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const pathname = usePathname()
  const socket = useSocket()

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch('/api/chat/users')
      const data = await res.json()
      setUsers(data)
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on('user_connected', (userId: string) => {
      setOnlineUsers(prev => [...prev, userId])
    })

    socket.on('user_disconnected', (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId))
    })

    return () => {
      socket.off('user_connected')
      socket.off('user_disconnected')
    }
  }, [socket])

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase()
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] border rounded-lg">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredUsers.map((user) => (
            <ChatUserItem
              key={user.id}
              user={user}
              isActive={pathname === `/admin/chats/${user.id}`}
              isOnline={onlineUsers.includes(user.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

