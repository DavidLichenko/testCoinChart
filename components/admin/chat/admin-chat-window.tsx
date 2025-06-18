'use client'

import {useState, useEffect, useRef, KeyboardEvent} from 'react'
import {ImageIcon, Send, X} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useSocket } from '@/hooks/use-socket'
import { cn } from '@/lib/utils'
import Image from 'next/image';

interface Message {
  id: string
  content: string
  imageUrl:string,
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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socket = useSocket()
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    if (!input.trim() && !file) return;
    let imageUrl = null;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('https://web-production-2d590.up.railway.app/upload/', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('File upload failed');
        }

        const data = await res.json();
        imageUrl = data.fileUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        return;
      }
    }
    const messageData = {
      content: input.trim(),
      userId: user.id,
      imageUrl,
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
      setFile(null);
      setPreviewUrl(null);
      adjustTextareaHeight();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(previewUrl);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '35px';
      textareaRef.current.style.height = (textareaRef.current.scrollHeight) + "px";
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    adjustTextareaHeight();
  }, []);

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

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
                <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "flex w-full message",
                        message.isSupportMessage ? "justify-end" : "justify-start"
                    )}
                >
                  <div className={cn(
                      "flex items-end gap-2 max-w-[85%]",
                      message.isSupportMessage ? "flex-row-reverse" : "flex-row"
                  )}>
                    {!message.isSupportMessage && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.imageUrl || ''} />
                          <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={cn(
                            "rounded-2xl px-4 py-2 text-sm",
                            message.isSupportMessage
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted rounded-tl-none"
                        )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      {message.imageUrl && (
                          <Image
                              layout="responsive" // Ensures responsiveness
                              width={800} // Aspect ratio width
                              height={600} // Aspect ratio height
                              quality={75} // Optional: Adjust image quality
                              src={message.imageUrl || "/placeholder.svg"}
                              alt="Uploaded"
                              priority // Ensures above-the-fold image loads faster
                              className="mt-2 max-w-full rounded-lg cursor-pointer"
                              onClick={() => setFullSizeImage(message.imageUrl)}
                          />
                      )}
                      <p className="text-[10px] opacity-70 mt-1 text-right">
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
            {file && (
                <div className="relative bg-gray-100 dark:bg-sidebar p-2 place-self-start rounded-md">
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-20 h-20 object-cover rounded"/>
                  <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                  >
                    <X className="h-4 w-4"/>
                  </button>
                </div>
            )}
            <div className="flex gap-2">
              <label htmlFor="fileInput"
                     className="cursor-pointer p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                <ImageIcon
                    className={`h-5 w-5 ${file ? 'text-accent dark:text-sidebar-dark' : 'text-gray-400 dark:text-gray-400 '}`}/>
              </label>
              <Input
                  type="file"
                  id="fileInput"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
              />
              <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none max-h-[100px]  py-1"
                  style={{overflow: 'auto'}}
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4"/>
              </Button>
            </div>
          </form>
          {/* Full-size Image Modal */}
          {fullSizeImage && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                   onClick={() => setFullSizeImage(null)}>
                <div className="max-w-[90%] max-h-[90%]">
                  <img src={fullSizeImage || "/placeholder.svg"} alt="Full-size"
                       className="max-w-full max-h-full object-contain"/>
                </div>
              </div>
          )}
        </div>
      </Card>
  )
}
