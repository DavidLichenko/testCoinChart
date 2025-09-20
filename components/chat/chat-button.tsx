"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { toast } from "@/components/toast";
import { pusherClient } from "@/lib/pusher-client"

interface Message {
  id: string
  content: string
  imageUrl?: string
  isSupportMessage: boolean
  createdAt: string
  userId: string
  user: {
    email: string
    name: string | null
  }
}

export default function ChatButton() {
  const { user } = useAuth()
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        })
      }, 100) // Small delay to ensure animation completes
    }
  }, [messages, chatOpen])

  // Fetch messages when chat opens
  useEffect(() => {
    if (chatOpen) {
      fetchMessages()
      setUnreadCount(0)
    }
  }, [chatOpen])

  // Subscribe to Pusher for real-time messages
  useEffect(() => {
    if (!user?.id) return

    const channel = pusherClient.subscribe(`chat-${user.id}`)
    
    channel.bind("new-message", (data: Message) => {
      setMessages(prev => [...prev, data])
      if (!chatOpen) {
        setUnreadCount(prev => prev + 1)
        toast({
          title: "New Support Message",
          description: "You have a new message from support",
          variant: "default",
        })
      }
    })

    channel.bind("typing", (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user.id) {
        setIsTyping(data.isTyping)
      }
    })

    return () => {
      channel.unbind("new-message")
      channel.unbind("typing")
      pusherClient.unsubscribe(`chat-${user.id}`)
    }
  }, [user?.id, chatOpen])

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/chat/messages")
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() && !uploading) return

    const messageContent = newMessage.trim()
    setNewMessage("") // Clear input immediately

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const savedMessage = await response.json()
        // Add message to local state
        setMessages(prev => [...prev, savedMessage])
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch("/api/chat/upload-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Send message with image
        const messageResponse = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: "📷 Image", 
            imageUrl: data.imageUrl 
          }),
        })

        if (messageResponse.ok) {
          const savedMessage = await messageResponse.json()
          setMessages(prev => [...prev, savedMessage])
        } else {
          toast({
            title: "Upload failed",
            description: "Failed to send image message",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload image",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative"
      >
        <Button
          onClick={() => setChatOpen(true)}
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-full bg-gray-800 border-gray-700 hover:bg-gray-700"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </motion.div>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="bg-gray-900 border-gray-700  lg:max-w-md h-[600px] flex flex-col p-0 max-w-96" >
          <DialogHeader className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">Support Chat</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-gray-400 flex items-center space-x-2"
                >
                  <div className="flex space-x-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                  </div>
                  <span>Support is typing...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeOut",
                    delay: index === messages.length - 1 ? 0.1 : 0
                  }}
                  className={`flex ${message.isSupportMessage ? "justify-start" : "justify-end"}`}
                >
                  <motion.div
                    className={`max-w-[80%] rounded-2xl p-3 shadow-lg ${
                      message.isSupportMessage
                        ? "bg-gray-700 text-white"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-xs text-gray-300 mb-1 font-medium">
                      {message.isSupportMessage ? "Support" : "You"}
                    </div>
                    <div className="text-sm leading-relaxed">{message.content}</div>
                    {message.imageUrl && (
                      <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        src={message.imageUrl}
                        alt="Chat image"
                        className="mt-2 rounded-lg max-w-full max-h-48 object-cover shadow-md"
                      />
                    )}
                    <motion.div 
                      className="text-xs text-gray-400 mt-1 opacity-75"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.75 }}
                      transition={{ delay: 0.2 }}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </motion.div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            {/* Invisible div for auto-scrolling */}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 border-gray-600 focus:border-blue-500 transition-colors"
                disabled={uploading}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  disabled={uploading}
                  className="h-10 w-10 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() && !uploading}
                  className="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 