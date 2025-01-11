'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ChatUserItemProps {
  user: {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
    lastMessage?: {
      content: string
      createdAt: Date
    }
  }
  isActive?: boolean
  isOnline?: boolean
}

export function ChatUserItem({ user, isActive, isOnline }: ChatUserItemProps) {
  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <Link
      href={`/admin/chats/${user.id}`}
      className={cn(
        "flex items-center space-x-4 p-3 rounded-lg transition-colors hover:bg-accent my-2",
        isActive && "bg-accent"
      )}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={user.imageUrl || ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0 my-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium leading-none truncate">
            {user.name || user.email}
          </p>
          <p className="text-small font-medium leading-none truncate">
            {user.email}
          </p>
          {user.lastMessage && (
              <span className="text-xs text-muted-foreground">
              {new Date(user.lastMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
        {user.lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {user.lastMessage.content}
          </p>
        )}
      </div>
    </Link>
  )
}

