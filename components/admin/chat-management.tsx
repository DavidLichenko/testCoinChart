"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Send, Image as ImageIcon, User, Clock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "react-hot-toast";
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

interface ChatSession {
  userId: string
  user: {
    email: string
    name: string | null
  }
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

export default function ChatManagement() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploading, setUploading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Fetch chat sessions
  useEffect(() => {
    fetchChatSessions()
    const interval = setInterval(fetchChatSessions, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Subscribe to Pusher for real-time updates
  useEffect(() => {
    const channel = pusherClient.subscribe("admin-chat")
    
    channel.bind("new-user-message", (data: { session: ChatSession; message: Message }) => {
      setChatSessions(prev => {
        const updated = prev.map(session => 
          session.userId === data.session.userId 
            ? { ...session, lastMessage: data.message.content, lastMessageTime: data.message.createdAt, unreadCount: session.unreadCount + 1 }
            : session
        )
        return updated
      })

      if (selectedSession?.userId === data.message.userId) {
        setMessages(prev => [...prev, data.message])
      }

      toast({
        title: "New Message",
        description: `New message from ${data.session.user.email}`,
        variant: "default",
      })
    })

    channel.bind("user-typing", (data: { userId: string; isTyping: boolean }) => {
      if (selectedSession?.userId === data.userId) {
        setIsTyping(data.isTyping)
      }
    })

    return () => {
      channel.unbind("new-user-message")
      channel.unbind("user-typing")
      pusherClient.unsubscribe("admin-chat")
    }
  }, [selectedSession])

  const fetchChatSessions = async () => {
    try {
      const response = await fetch("/api/admin/chat/sessions")
      if (response.ok) {
        const data = await response.json()
        setChatSessions(data)
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/messages/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session)
    fetchMessages(session.userId)
    // Mark as read
    setChatSessions(prev => 
      prev.map(s => 
        s.userId === session.userId 
          ? { ...s, unreadCount: 0 }
          : s
      )
    )
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return

    try {
      const response = await fetch("/api/admin/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newMessage, 
          userId: selectedSession.userId 
        }),
      })

      if (response.ok) {
        setNewMessage("")
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
    if (!file || !selectedSession) return

    if (file.size > 5 * 1024 * 1024) {
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
      const response = await fetch("/api/admin/chat/upload-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        await fetch("/api/admin/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: "📷 Image", 
            imageUrl: data.imageUrl,
            userId: selectedSession.userId
          }),
        })
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

  const filteredSessions = chatSessions.filter(session =>
    session.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.user.name && session.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Support Chat Management</h2>
        <Badge variant="outline" className="text-sm">
          {chatSessions.filter(s => s.unreadCount > 0).length} unread conversations
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat Sessions List */}
        <Card className="lg:col-span-1 bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto h-[500px]">
              <AnimatePresence>
                {filteredSessions.map((session) => (
                  <motion.div
                    key={session.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => handleSelectSession(session)}
                    className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors ${
                      selectedSession?.userId === session.userId ? "bg-gray-800 border-l-4 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gray-700">
                            {session.user.name?.[0] || session.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium truncate">
                              {session.user.name || session.user.email}
                            </p>
                            {session.isOnline && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{session.lastMessage}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {new Date(session.lastMessageTime).toLocaleTimeString()}
                        </p>
                        {session.unreadCount > 0 && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            {session.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredSessions.length === 0 && (
                <div className="p-4 text-center text-gray-400">
                  No conversations found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2 bg-gray-900 border-gray-700 flex flex-col">
          {selectedSession ? (
            <>
              <CardHeader className="pb-3 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-700">
                      {selectedSession.user.name?.[0] || selectedSession.user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedSession.user.name || selectedSession.user.email}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <User className="w-4 h-4" />
                      <span>{selectedSession.user.email}</span>
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-blue-400"
                        >
                          typing...
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${message.isSupportMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.isSupportMessage
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700 text-white"
                          }`}
                        >
                          <div className="text-xs text-gray-300 mb-1">
                            {message.isSupportMessage ? "Support" : selectedSession.user.name || selectedSession.user.email}
                          </div>
                          <div className="text-sm">{message.content}</div>
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="Chat image"
                              className="mt-2 rounded max-w-full max-h-48 object-cover"
                            />
                          )}
                          <div className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-800 border-gray-600"
                      disabled={uploading}
                    />
                    <Button
                      size="icon"
                      onClick={() => document.getElementById("admin-image-upload")?.click()}
                      disabled={uploading}
                      className="h-10 w-10 bg-gray-700 hover:bg-gray-600"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !uploading}
                      className="h-10 w-10 bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <input
                    id="admin-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a conversation to start chatting</p>
                <p className="text-sm">Choose from the list on the left to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
} 