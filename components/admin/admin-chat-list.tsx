'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession } from "next-auth/react"

interface ChatUser {
    id: string
    name: string | null
    email: string
    imageUrl: string | null
    lastMessage?: {
        content: string
        createdAt: string
    }
}

export function AdminChatList() {
    const [chats, setChats] = useState<ChatUser[]>([])
    const { data: session, status } = useSession()

    useEffect(() => {
        const fetchChats = async () => {
            if (status === "authenticated") {
                try {
                    const res = await fetch('/api/chat/users')
                    if (!res.ok) {
                        throw new Error('Failed to fetch chats')
                    }
                    const data = await res.json()
                    setChats(data)
                } catch (error) {
                    console.error('Error fetching chats:', error)
                    setChats([])
                }
            }
        }
        fetchChats()
    }, [status])

    if (status === "loading") {
        return <div>Loading...</div>
    }

    if (status === "unauthenticated") {
        return <div>Access Denied</div>
    }

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
                                <AvatarImage src={chat.imageUrl || '/placeholder.svg'} alt="Avatar" />
                                <AvatarFallback>{chat.name?.[0] || chat.email[0]}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{chat.name || chat.email}</p>
                                <p className="text-sm text-muted-foreground">
                                    {chat.lastMessage ? chat.lastMessage.content.substring(0, 50) + '...' : 'No messages yet'}
                                </p>
                            </div>
                            <Link href={`/admin/chats/${chat.id}`} className="ml-auto font-medium">
                                View
                            </Link>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

