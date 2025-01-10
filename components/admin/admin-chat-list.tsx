'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AdminChatList({ chats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Chats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {chats.map((chat) => (
            <div key={chat.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={chat.user.imageUrl || '/placeholder.svg'} alt="Avatar" />
                <AvatarFallback>{chat.user.name?.[0] || chat.user.email[0]}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{chat.user.name || chat.user.email}</p>
                <p className="text-sm text-muted-foreground">{chat.content.substring(0, 50)}...</p>
              </div>
              <Link href={`/admin/chats/${chat.userId}`} className="ml-auto font-medium">
                View
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

