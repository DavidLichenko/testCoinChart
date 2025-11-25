"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  User,
  Clock,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/toast"
import { pusherClient } from "@/lib/pusher-client"
import { hasAdminAccess } from "@/lib/admin-access"
import { useAuth } from "@/components/auth-provider"

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
  const { user } = useAuth()
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploading, setUploading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showConversations, setShowConversations] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  
  // Add access control check
  useEffect(() => {
    if (!hasAdminAccess(user)) {
      setAccessDenied(true)
    }
  }, [user])
  
  // If access is denied, show an error message
  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100">
        Access denied. You don't have permission to view this page.
      </div>
    )
  }
  
  // загрузка сессий
  useEffect(() => {
    fetchChatSessions()
    const interval = setInterval(fetchChatSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  // Pusher
  useEffect(() => {
    const channel = pusherClient.subscribe("admin-chat")

    channel.bind(
        "new-user-message",
        (data: { session: ChatSession; message: Message }) => {
          setChatSessions((prev) => {
            const exists = prev.find((s) => s.userId === data.session.userId)

            if (!exists) {
              // новая сессия
              return [
                {
                  ...data.session,
                  lastMessage: data.message.content,
                  lastMessageTime: data.message.createdAt,
                  unreadCount: 1,
                },
                ...prev,
              ]
            }

            return prev.map((session) =>
                session.userId === data.session.userId
                    ? {
                      ...session,
                      lastMessage: data.message.content,
                      lastMessageTime: data.message.createdAt,
                      unreadCount:
                          selectedSession?.userId === data.session.userId
                              ? 0
                              : session.unreadCount + 1,
                    }
                    : session
            )
          })

          if (selectedSession?.userId === data.message.userId) {
            setMessages((prev) => [...prev, data.message])
          }

          toast({
            title: "New Message",
            description: `New message from ${data.session.user.email}`,
            variant: "default",
          })
        }
    )

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
      const res = await fetch("/api/admin/chat/sessions")
      if (res.ok) {
        const data = await res.json()
        setChatSessions(data)
      }
    } catch (err) {
      console.error("Error fetching chat sessions:", err)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/chat/messages/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error("Error fetching messages:", err)
    }
  }

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session)
    fetchMessages(session.userId)

    // сброс непрочитанных
    setChatSessions((prev) =>
        prev.map((s) =>
            s.userId === session.userId ? { ...s, unreadCount: 0 } : s
        )
    )

    // на мобиле прячем список
    setShowConversations(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return

    try {
      const res = await fetch("/api/admin/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          userId: selectedSession.userId,
        }),
      })

      if (res.ok) {
        setNewMessage("")
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error sending message:", err)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      const uploadRes = await fetch("/api/admin/chat/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        toast({
          title: "Upload failed",
          description: "Failed to upload image",
          variant: "destructive",
        })
        return
      }

      const data = await uploadRes.json()

      const msgRes = await fetch("/api/admin/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "📷 Image",
          imageUrl: data.imageUrl,
          userId: selectedSession.userId,
        }),
      })

      if (!msgRes.ok) {
        toast({
          title: "Error",
          description: "Failed to send image message",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filteredSessions = chatSessions.filter(
      (session) =>
          session.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (session.user.name &&
              session.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const unreadConversations = chatSessions.filter((s) => s.unreadCount > 0).length

  return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <MessageCircle className="h-4 w-4" />
            </span>
              Support Chat Management
            </h2>
            <p className="text-sm text-slate-400">
              Manage conversations with users in real-time.
            </p>
          </div>
          <Badge className="rounded-full bg-slate-900/70 text-xs sm:text-sm text-slate-200">
            {unreadConversations} unread conversations
          </Badge>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-220px)] sm:max-h[550px] sm:h-full relative">
          {/* Conversations list */}
          <Card
              className={`lg:col-span-1 bg-slate-950/90 border-slate-900/80 shadow-[0_18px_45px_rgba(15,23,42,0.7)] ${
                  !showConversations ? "hidden lg:flex" : "flex"
              } flex-col absolute lg:relative inset-0 lg:inset-auto z-10 lg:z-auto`}
          >
            <CardHeader className="pb-3 border-b border-slate-900">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-slate-200">
                  <MessageCircle className="h-4 w-4" />
                </span>
                  Conversations
                </CardTitle>
                {selectedSession && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConversations(false)}
                        className="lg:hidden text-xs"
                    >
                      Close
                    </Button>
                )}
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-800 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="max-h-[550px] h-full overflow-y-auto">
                <AnimatePresence>
                  {filteredSessions.map((session) => (
                      <motion.button
                          type="button"
                          key={session.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          onClick={() => handleSelectSession(session)}
                          className={`w-full text-left px-3 sm:px-4 py-3 border-b border-slate-900/80 hover:bg-slate-900/80 transition-colors flex items-center gap-3 ${
                              selectedSession?.userId === session.userId
                                  ? "bg-slate-900/90 border-l-2 border-l-indigo-500"
                                  : ""
                          }`}
                      >
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                          <AvatarFallback className="bg-slate-800 text-xs sm:text-sm">
                            {session.user.name?.[0]?.toUpperCase() ||
                                session.user.email[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs sm:text-sm font-medium text-slate-100 truncate">
                              {session.user.name || session.user.email}
                            </p>
                            {session.isOnline && (
                                <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {session.lastMessage || "No messages yet"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {session.lastMessageTime && (
                              <span className="text-[11px] text-slate-500">
                          {new Date(session.lastMessageTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                          )}
                          {session.unreadCount > 0 && (
                              <Badge className="bg-rose-500 text-[10px] px-1.5 py-0">
                                {session.unreadCount}
                              </Badge>
                          )}
                        </div>
                      </motion.button>
                  ))}
                </AnimatePresence>

                {filteredSessions.length === 0 && (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      No conversations found.
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card
              className={`lg:col-span-2 bg-slate-950/90 border-slate-900/80 shadow-[0_18px_45px_rgba(15,23,42,0.7)] flex flex-col absolute lg:relative inset-0 lg:inset-auto z-0 ${
                  !selectedSession ? "hidden lg:flex" : "flex"
              }`}
          >
            {selectedSession ? (
                <>
                  <CardHeader className="pb-3 border-b border-slate-900">
                    <div className="flex items-center gap-3">
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConversations(true)}
                          className="lg:hidden -ml-2 text-xs"
                      >
                        ←
                      </Button>
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                        <AvatarFallback className="bg-slate-800 text-xs sm:text-sm">
                          {selectedSession.user.name?.[0]?.toUpperCase() ||
                              selectedSession.user.email[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base truncate text-slate-50">
                          {selectedSession.user.name || selectedSession.user.email}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <User className="w-3 h-3" />
                          <span className="truncate">
                        {selectedSession.user.email}
                      </span>
                          {isTyping && (
                              <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="text-indigo-400"
                              >
                                • typing...
                              </motion.span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0 flex flex-col max-h-[550px]">
                    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-3 sm:space-y-4">
                      <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex ${
                                    message.isSupportMessage
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                              <div
                                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3 py-2.5 text-xs sm:text-sm shadow-sm ${
                                      message.isSupportMessage
                                          ? "bg-indigo-600 text-slate-50 rounded-br-none"
                                          : "bg-slate-800 text-slate-50 rounded-bl-none"
                                  }`}
                              >
                                <div className="text-[10px] text-slate-200/80 mb-1">
                                  {message.isSupportMessage
                                      ? "Support"
                                      : selectedSession.user.name ||
                                      selectedSession.user.email}
                                </div>
                                <div className="whitespace-pre-wrap break-words">
                                  {message.content}
                                </div>
                                {message.imageUrl && (
                                    <img
                                        src={message.imageUrl}
                                        alt="Chat image"
                                        className="mt-2 rounded-lg max-h-48 w-auto object-cover"
                                    />
                                )}
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-300/80">
                                  <Clock className="h-3 w-3" />
                                  <span>
                              {new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                                </div>
                              </div>
                            </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Input */}
                    <div className="border-t border-slate-900 px-2 sm:px-4 py-2.5">
                      <div className="flex gap-2 items-center">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={
                              uploading ? "Uploading image..." : "Type your message..."
                            }
                            className="flex-1 bg-slate-900 border-slate-800 text-sm"
                            disabled={uploading}
                        />
                        <Button
                            size="icon"
                            type="button"
                            onClick={() =>
                                document.getElementById("admin-image-upload")?.click()
                            }
                            disabled={uploading}
                            className="h-9 w-9 sm:h-10 sm:w-10 bg-slate-900 border border-slate-700 hover:bg-slate-800 flex-shrink-0"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            type="button"
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || uploading}
                            className="h-9 w-9 sm:h-10 sm:w-10 bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
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
                  <div className="text-center text-slate-400">
                    <MessageCircle className="mx-auto mb-4 h-10 w-10 opacity-60" />
                    <p className="text-sm sm:text-base">
                      Select a conversation to start chatting.
                    </p>
                    <p className="text-[11px] sm:text-xs mt-1 text-slate-500">
                      Choose a user from the left panel.
                    </p>
                  </div>
                </CardContent>
            )}
          </Card>
        </div>
      </div>
  )
}
