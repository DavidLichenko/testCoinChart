'use client'

import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Paperclip } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

const socket = io('https://web-production-2d590.up.railway.app', {
  path: '/socket.io',
  transports: ['websocket'],
  withCredentials: true,
})

export function AdminChatWindow({ initialMessages, userId }) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    socket.emit('register', 'support')

    socket.on('chat message', (msg) => {
      if (msg.userId === userId) {
        setMessages((prev) => [...prev, msg])
      }
    })

    return () => {
      socket.off('chat message')
    }
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    let imageUrl = null

    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          throw new Error('File upload failed')
        }

        const data = await res.json()
        imageUrl = data.fileUrl
      } catch (error) {
        console.error('Error uploading file:', error)
        toast({
          title: 'Error',
          description: 'Failed to upload file',
          variant: 'destructive',
        })
        return
      }
    }

    const messageData = {
      content: input.trim(),
      userId,
      imageUrl,
      isSupportMessage: true,
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      })

      if (!res.ok) {
        throw new Error('Failed to save message')
      }

      const savedMessage = await res.json()
      socket.emit('support message', savedMessage)
      setMessages((prev) => [...prev, savedMessage])
      setInput('')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat with User {userId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto mb-4 p-4 border rounded">
          {messages.map((message) => (
            <div key={message.id} className={`mb-4 ${message.isSupportMessage ? 'text-right' : 'text-left'}`}>
              <p>{message.content}</p>
              {message.imageUrl && (
                <img src={message.imageUrl} alt="Uploaded" className="mt-2 max-w-xs" />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow"
          />
          <Input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            id="fileInput"
          />
          <Label htmlFor="fileInput" className="cursor-pointer">
            <Paperclip className="h-6 w-6" />
          </Label>
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

