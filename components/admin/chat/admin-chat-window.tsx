'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useSocket } from '@/hooks/use-socket'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  createdAt: Date
  isSupportMessage: boolean
  userId: string
}

interface User {
  id: string
  name: string | null
  email: string
  imageUrl: string | null
}

interface AdminChatWindowProps {
  user: User
  initialMessages: Message[]
}

export function AdminChatWindow({ user, initialMessages }: AdminChatWindowProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.emit('register', 'support')

    socket.on('user_connected', (userId: string) => {
      if (userId === user.id) setIsOnline(true)
    })

    socket.on('user_disconnected', (userId: string) => {
      if (userId === user.id) setIsOnline(false)
    })

    socket.on('chat message', (msg: Message) => {
      if (msg.userId === user.id) {
        setMessages(prev => [...prev, msg])
      }
    })

    return () => {
      socket.off('chat message')
      socket.off('user_connected')
      socket.off('user_disconnected')
    }
  }, [socket, user.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const messageData = {
      content: input.trim(),
      userId: user.id,
      isSupportMessage: true,
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      })

      if (!res.ok) throw new Error('Failed to send message')

      const savedMessage = await res.json()
      socket?.emit('support message', savedMessage)
      setMessages(prev => [...prev, savedMessage])
      setInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center space-x-4 p-4 border-b">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.imageUrl || ''} />
            <AvatarFallback>
              {user.name?.[0] || user.email[0]}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>
        <div>
          <p className="font-medium">{user.name || user.email}</p>
          <p className="text-sm text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-end gap-2 max-w-[80%]",
                message.isSupportMessage ? "ml-auto" : "mr-auto"
              )}
            >
              {!message.isSupportMessage && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.imageUrl || ''} />
                  <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 text-sm",
                  message.isSupportMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p>{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}

