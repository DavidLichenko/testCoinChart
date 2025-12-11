"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  User,
  Search,
  CheckCheck,
  Check,
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
  isRead: boolean
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
  const [sessionsLoading, setSessionsLoading] = useState(true)

  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [uploading, setUploading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showConversations, setShowConversations] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  // ---------- ACCESS CONTROL ----------
  useEffect(() => {
    if (!hasAdminAccess(user)) {
      setAccessDenied(true)
    }
  }, [user])

  // ---------- FETCH SESSIONS ----------
  useEffect(() => {
    if (accessDenied) return

    const load = async () => {
      await fetchChatSessions()
      setSessionsLoading(false)
    }

    load()

    const interval = setInterval(fetchChatSessions, 10000)
    return () => clearInterval(interval)
  }, [accessDenied])

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

  // ---------- PUSHER SUBSCRIPTION ----------
  useEffect(() => {
    if (!user?.id) return

    const adminChannel = pusherClient.subscribe("admin-chat")

    // новый юзер-сообщение
    adminChannel.bind(
        "new-user-message",
        (data: { session: ChatSession; message: Message }) => {
          setChatSessions((prev) => {
            const exists = prev.find((s) => s.userId === data.session.userId)

            if (!exists) {
              return [
                {
                  ...data.session,
                  lastMessage: data.message.content,
                  lastMessageTime: data.message.createdAt,
                  unreadCount: data.message.isRead ? 0 : 1,
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
                              ? session.unreadCount
                              : data.message.isRead
                                  ? session.unreadCount
                                  : session.unreadCount + 1,
                    }
                    : session,
            )
          })

          if (selectedSession?.userId === data.message.userId) {
            setMessages((prev) => [...prev, data.message])
          }

          toast({
            title: "New message",
            description: `New message from ${data.session.user.email}`,
          })
        },
    )

    // typing
    adminChannel.bind(
        "user-typing",
        (data: { userId: string; isTyping: boolean }) => {
          if (selectedSession?.userId === data.userId) {
            setIsTyping(data.isTyping)
          }
        },
    )

    // user read messages
    adminChannel.bind(
        "messages-read",
        (data: { userId: string; messageIds: string[] }) => {
          setMessages((prev) =>
              prev.map((msg) =>
                  data.messageIds.includes(msg.id) && msg.isSupportMessage
                      ? { ...msg, isRead: true }
                      : msg,
              ),
          )

          setChatSessions((prev) =>
              prev.map((session) =>
                  session.userId === data.userId
                      ? {
                        ...session,
                        unreadCount: Math.max(
                            0,
                            session.unreadCount - data.messageIds.length,
                        ),
                      }
                      : session,
              ),
          )
        },
    )

    return () => {
      adminChannel.unbind("new-user-message")
      adminChannel.unbind("user-typing")
      adminChannel.unbind("messages-read")
      pusherClient.unsubscribe("admin-chat")
    }
  }, [user?.id, selectedSession?.userId])

  // ---------- HANDLERS ----------
  const handleSelectSession = async (session: ChatSession) => {
    setSelectedSession(session)

    try {
      const res = await fetch(`/api/admin/chat/messages/${session.userId}`)
      if (res.ok) {
        const data: Message[] = await res.json()
        setMessages(data)

        // отмечаем пользовательские сообщения прочитанными
        const unreadUserMessageIds = data
            .filter((msg) => !msg.isSupportMessage /* && !msg.isRead */)
            .map((msg) => msg.id)

        if (unreadUserMessageIds.length > 0) {
          try {
            await fetch("/api/admin/chat/messages/mark-as-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: session.userId,
                messageIds: unreadUserMessageIds,
              }),
            })
            fetchChatSessions()
          } catch (err) {
            console.error("Error marking messages as read:", err)
          }
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err)
    }

    setChatSessions((prev) =>
        prev.map((s) =>
            s.userId === session.userId ? { ...s, unreadCount: 0 } : s,
        ),
    )

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
        const savedMessage: Message = await res.json()
        setMessages((prev) => [...prev, savedMessage])
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
      event: React.ChangeEvent<HTMLInputElement>,
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
      } else {
        const savedMessage: Message = await msgRes.json()
        setMessages((prev) => [...prev, savedMessage])
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

  const filteredSessions = (() =>
      chatSessions.filter(
          (session) =>
              session.user.email
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
              (session.user.name &&
                  session.user.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())),
      ))()

  const unreadConversations = chatSessions.filter(
      (s) => s.unreadCount > 0,
  ).length

  // ---------- EARLY RETURN (после всех хуков!) ----------
  if (accessDenied) {
    return (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100">
          Access denied. You don&apos;t have permission to view this page.
        </div>
    )
  }

  return (
      <div className="space-y-4 px-2 sm:space-y-6 sm:px-0">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-50 sm:text-2xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-indigo-300">
              <MessageCircle className="h-4 w-4" />
            </span>
              Support Chat Management
            </h2>
            <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
              Manage conversations with users in real-time.
            </p>
          </div>
          <Badge className="rounded-full bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100">
            {unreadConversations} unread conversations
          </Badge>
        </div>

        {/* Main layout */}
        <div className="relative grid h-[calc(100vh-220px)] grid-cols-1 gap-4 sm:h-full sm:gap-6 lg:grid-cols-3 lg:max-h-[620px]">
          {/* Conversations list */}
          <Card
              className={`absolute inset-0 z-10 flex flex-col rounded-3xl border-zinc-800 bg-zinc-950/95 shadow-[0_18px_45px_rgba(0,0,0,0.85)] lg:relative lg:inset-auto lg:z-auto lg:col-span-1 ${
                  !showConversations ? "hidden lg:flex" : "flex"
              }`}
          >
            <CardHeader className="border-b border-zinc-800 pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base text-zinc-50 sm:text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-zinc-200">
                  <MessageCircle className="h-4 w-4" />
                </span>
                  Conversations
                </CardTitle>
                {selectedSession && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConversations(false)}
                        className="text-xs text-zinc-400 lg:hidden"
                    >
                      Close
                    </Button>
                )}
              </div>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 rounded-xl border-zinc-800 bg-zinc-900 pl-9 text-xs text-zinc-100 placeholder:text-zinc-500 sm:h-10 sm:text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-full max-h-[560px] overflow-y-auto">
                {/* skeleton while loading */}
                {sessionsLoading && chatSessions.length === 0 && (
                    <div className="space-y-2 p-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                          <div
                              key={i}
                              className="flex animate-pulse items-center gap-3 rounded-2xl bg-zinc-900/80 px-3 py-3"
                          >
                            <div className="h-9 w-9 rounded-full bg-zinc-800" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-32 rounded-full bg-zinc-800" />
                              <div className="h-3 w-40 rounded-full bg-zinc-800/80" />
                            </div>
                          </div>
                      ))}
                    </div>
                )}

                <AnimatePresence>
                  {filteredSessions.map((session) => (
                      <motion.button
                          type="button"
                          key={session.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectSession(session)}
                          className={`flex w-full items-center gap-3 border-b border-zinc-900/80 px-3 py-3 text-left transition-colors sm:px-4 ${
                              selectedSession?.userId === session.userId
                                  ? "bg-zinc-900/95"
                                  : "hover:bg-zinc-900/80"
                          }`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
                          <AvatarFallback className="bg-zinc-800 text-xs text-zinc-100 sm:text-sm">
                            {session.user.name?.[0]?.toUpperCase() ||
                                session.user.email[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="truncate text-xs font-medium text-zinc-100 sm:text-sm">
                              {session.user.name || session.user.email}
                            </p>
                            {session.isOnline && (
                                <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <p className="truncate text-[11px] text-zinc-400">
                            {session.lastMessage || "No messages yet"}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          {session.lastMessageTime && (
                              <span className="text-[11px] text-zinc-500">
                          {new Date(
                              session.lastMessageTime,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                          )}
                          {session.unreadCount > 0 && (
                              <Badge className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px]">
                                {session.unreadCount}
                              </Badge>
                          )}
                        </div>
                      </motion.button>
                  ))}
                </AnimatePresence>

                {!sessionsLoading && filteredSessions.length === 0 && (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      No conversations found.
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card
              className={`absolute inset-0 z-0 flex flex-col rounded-3xl border-zinc-800 bg-zinc-950/95 shadow-[0_18px_45px_rgba(0,0,0,0.85)] lg:relative lg:inset-auto lg:col-span-2 ${
                  !selectedSession ? "hidden lg:flex" : "flex"
              }`}
          >
            {selectedSession ? (
                <>
                  <CardHeader className="border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConversations(true)}
                          className="-ml-2 text-xs text-zinc-400 lg:hidden"
                      >
                        ←
                      </Button>
                      <Avatar className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-zinc-800 text-xs text-zinc-100 sm:text-sm">
                          {selectedSession.user.name?.[0]?.toUpperCase() ||
                              selectedSession.user.email[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-sm text-zinc-50 sm:text-base">
                          {selectedSession.user.name ||
                              selectedSession.user.email}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          <User className="h-3 w-3" />
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
                                • typing…
                              </motion.span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex max-h-[560px] flex-1 flex-col p-0">
                    {/* Messages */}
                    <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
                      <AnimatePresence mode="popLayout">
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                                transition={{ duration: 0.18 }}
                                className={`flex ${
                                    message.isSupportMessage
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                              <div
                                  className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-xs shadow-sm sm:max-w-[70%] sm:text-sm ${
                                      message.isSupportMessage
                                          ? `rounded-br-none bg-indigo-600 text-zinc-50 ${
                                              !message.isRead
                                                  ? "ring-2 ring-indigo-400/70"
                                                  : ""
                                          }`
                                          : `rounded-bl-none bg-zinc-900 text-zinc-50 ${
                                              !message.isRead &&
                                              !message.isSupportMessage
                                                  ? "ring-2 ring-amber-400/70"
                                                  : ""
                                          }`
                                  }`}
                              >
                                <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-200/80">
                            <span>
                              {message.isSupportMessage
                                  ? "Support"
                                  : selectedSession.user.name ||
                                  selectedSession.user.email}
                            </span>
                                  {!message.isRead && (
                                      <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-medium text-amber-800">
                                New
                              </span>
                                  )}
                                </div>
                                <div className="whitespace-pre-wrap break-words">
                                  {message.content}
                                </div>
                                {message.imageUrl && (
                                    <img
                                        src={message.imageUrl}
                                        alt="Chat image"
                                        className="mt-2 max-h-48 w-auto rounded-lg object-cover"
                                    />
                                )}
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-300/80">
                                  {message.isRead ? (
                                      <CheckCheck className="h-3 w-3" />
                                  ) : (
                                      <Check className="h-3 w-3" />
                                  )}
                                  <span>
                              {new Date(
                                  message.createdAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                                </div>
                              </div>
                            </motion.div>
                        ))}
                      </AnimatePresence>

                      {messages.length === 0 && (
                          <div className="py-8 text-center text-xs text-zinc-500 sm:text-sm">
                            No messages yet. Say hi 👋
                          </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="border-t border-zinc-800 px-2 py-2.5 sm:px-4">
                      <div className="flex items-center gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={
                              uploading
                                  ? "Uploading image..."
                                  : "Type your message..."
                            }
                            className="flex-1 bg-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-500"
                            disabled={uploading}
                        />
                        <Button
                            size="icon"
                            type="button"
                            onClick={() =>
                                document
                                    .getElementById("admin-image-upload")
                                    ?.click()
                            }
                            disabled={uploading}
                            className="flex-shrink-0 h-9 w-9 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 sm:h-10 sm:w-10"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            type="button"
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || uploading}
                            className="flex-shrink-0 h-9 w-9 bg-indigo-600 hover:bg-indigo-700 sm:h-10 sm:w-10"
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
                <CardContent className="flex flex-1 items-center justify-center">
                  <div className="text-center text-zinc-400">
                    <MessageCircle className="mx-auto mb-4 h-10 w-10 opacity-60" />
                    <p className="text-sm sm:text-base">
                      Select a conversation to start chatting.
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
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
