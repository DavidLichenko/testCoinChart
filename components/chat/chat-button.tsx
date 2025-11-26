"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Image as ImageIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { toast } from "@/components/toast"
import { pusherClient } from "@/lib/pusher-client"
import { useIsMobile } from "@/hooks/use-mobile"

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

export default function ChatButton() {
    const { user } = useAuth()
    const isMobile = useIsMobile()

    const [chatOpen, setChatOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [uploading, setUploading] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    // чтобы портал не ломал SSR
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // авто-скролл
    useEffect(() => {
        if (chatOpen && messagesEndRef.current) {
            const el = messagesEndRef.current
            setTimeout(() => {
                el.scrollIntoView({ behavior: "smooth", block: "end" })
            }, 80)
        }
    }, [messages, chatOpen])

    // загрузка истории при открытии
    useEffect(() => {
        if (chatOpen) {
            fetchMessages()
            setUnreadCount(0)
        }
    }, [chatOpen])

    // pusher
    useEffect(() => {
        if (!user?.id) return

        const channelName = `chat-${user.id}`
        const channel = pusherClient.subscribe(channelName)

        const handleNewMessage = (data: Message) => {
            setMessages(prev => [...prev, data])
            if (!chatOpen) {
                setUnreadCount(prev => prev + 1)
                toast({
                    title: "New support message",
                    description: "You have a new message from support",
                    variant: "default",
                })
            }
        }

        const handleTyping = (data: { userId: string; isTyping: boolean }) => {
            if (data.userId !== user.id) {
                setIsTyping(data.isTyping)
            }
        }

        // Listen for when admin reads user messages
        const handleMessagesReadByAdmin = (data: { messageIds: string[] }) => {
            // Update the messages state to mark messages as read
            setMessages(prev => prev.map(msg => 
                data.messageIds.includes(msg.id) && !msg.isSupportMessage 
                    ? { ...msg, isRead: true } 
                    : msg
            ))
            
            // Update unread count
            const readUnreadMessages = data.messageIds.filter(id => 
                messages.some(msg => msg.id === id && !msg.isSupportMessage && !msg.isRead)
            ).length
            
            if (readUnreadMessages > 0) {
                setUnreadCount(prev => Math.max(0, prev - readUnreadMessages))
            }
        }

        channel.bind("new-message", handleNewMessage)
        channel.bind("typing", handleTyping)
        channel.bind("messages-read-by-admin", handleMessagesReadByAdmin)

        return () => {
            channel.unbind("new-message", handleNewMessage)
            channel.unbind("typing", handleTyping)
            channel.unbind("messages-read-by-admin", handleMessagesReadByAdmin)
            pusherClient.unsubscribe(channelName)
        }
    }, [user?.id, chatOpen])

    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat/messages")
        if (res.ok) {
          const data = await res.json()
          setMessages(data)
          
          // Mark admin messages as read
          const unreadAdminMessageIds = data
            .filter((msg: Message) => msg.isSupportMessage && !msg.isRead)
            .map((msg: Message) => msg.id)
          
          if (unreadAdminMessageIds.length > 0) {
            await fetch("/api/chat/messages/mark-as-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageIds: unreadAdminMessageIds })
            })
          }
        }
      } catch (e) {
        console.error("Error fetching messages", e)
      }
    }

    const sendMessage = async () => {
        if (!newMessage.trim() && !uploading) return

        const content = newMessage.trim()
        setNewMessage("")

        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            })

            if (res.ok) {
                const saved = await res.json()
                setMessages(prev => [...prev, saved])
            } else {
                toast({
                    title: "Error",
                    description: "Failed to send message",
                    variant: "destructive",
                })
            }
        } catch (e) {
            console.error("Error sending message", e)
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
        if (!file) return

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
            const uploadRes = await fetch("/api/chat/upload-image", {
                method: "POST",
                body: formData,
            })

            if (!uploadRes.ok) {
                throw new Error("Upload failed")
            }

            const { imageUrl } = await uploadRes.json()

            const messageRes = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: "📷 Image",
                    imageUrl,
                }),
            })

            if (messageRes.ok) {
                const saved = await messageRes.json()
                setMessages(prev => [...prev, saved])
            } else {
                throw new Error("Failed to send image message")
            }
        } catch (e) {
            console.error("Error uploading image", e)
            toast({
                title: "Upload failed",
                description: "Failed to upload image",
                variant: "destructive",
            })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // ---------- основная разметка -------------

    // 1) кнопка в хедере (остаётся там же)
    const triggerButton = (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
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
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    </motion.div>
                )}
            </Button>
        </motion.div>
    )

    // 2) окно чата, которое рисуем через портал в body
    const chatOverlay =
        mounted &&
        createPortal(
            <AnimatePresence>
                {chatOpen && (
                    <>
                        {isMobile ? (
                            // -------- MOBILE: bottom sheet --------
                            <motion.div
                                className="fixed inset-0 z-[70]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* затемнение */}
                                <div
                                    className="absolute inset-0 bg-black/40"
                                    onClick={() => setChatOpen(false)}
                                />

                                {/* панель */}
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                                    className="absolute inset-x-0 bottom-0 flex max-h-[60vh] h-full flex-col rounded-t-3xl border border-gray-800 bg-gray-900 shadow-2xl"
                                >
                                    {/* header */}
                                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                                        <p className="text-sm font-medium">Support Chat</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setChatOpen(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* сообщения */}
                                    <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
                                        <AnimatePresence mode="popLayout">
                                            {messages.map(message => (
                                                <motion.div
                                                    key={message.id}
                                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`flex ${
                                                        message.isSupportMessage
                                                            ? "justify-start"
                                                            : "justify-end"
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] w-1/2 rounded-2xl py-2 px-2 text-sm shadow-lg ${
                                                            message.isSupportMessage
                                                                ? `bg-gray-800 text-white ${!message.isRead && message.isSupportMessage ? 'ring-2 ring-blue-400' : ''}`
                                                                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white  text-right"
                                                        }`}
                                                    >
                                                        <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">
                                                            {message.isSupportMessage ? "Support" : "You"}
                                                            {!message.isRead && message.isSupportMessage && (
                                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-blue-100 text-blue-800">
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="leading-relaxed">
                                                            {message.content}
                                                        </div>
                                                        {message.imageUrl && (
                                                            <img
                                                                src={message.imageUrl}
                                                                alt="Chat image"
                                                                className="mt-2 rounded-lg max-h-48 w-auto object-cover"
                                                            />
                                                        )}
                                                        <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-300/70">
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
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* typing */}
                                    <AnimatePresence>
                                        {isTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                className="flex items-center gap-2 px-4 pb-1 text-xs text-gray-400"
                                            >
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0.3s]" />
                        </span>
                                                Support is typing…
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* input */}
                                    <div className="border-t border-gray-800 px-3 py-3">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                placeholder="Type your message..."
                                                className="flex-1 rounded-2xl border-gray-700 bg-gray-800 text-sm"
                                                disabled={uploading}
                                            />
                                            <Button
                                                size="icon"
                                                className="h-9 w-9 rounded-2xl bg-gray-800 hover:bg-gray-700"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                className="h-9 w-9 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                                onClick={sendMessage}
                                                disabled={!newMessage.trim() && !uploading}
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </motion.div>
                            </motion.div>
                        ) : (
                            // -------- DESKTOP: fixed bottom-right --------
                            <motion.div
                                className="fixed bottom-4 right-4 z-[70]"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex h-[460px] w-[360px] flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
                                    {/* header */}
                                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                                        <p className="text-sm font-semibold">Support Chat</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setChatOpen(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* messages */}
                                    <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
                                        <AnimatePresence mode="popLayout">
                                            {messages.map(message => (
                                                <motion.div
                                                    key={message.id}
                                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`flex ${
                                                        message.isSupportMessage
                                                            ? "justify-start"
                                                            : "justify-end"
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] w-1/2 rounded-2xl p-3 text-sm shadow-lg ${
                                                            message.isSupportMessage
                                                                ? "bg-gray-800 text-white"
                                                                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                                                        }`}
                                                    >
                                                        <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-300/80">
                                                            {message.isSupportMessage ? "Support" : "You"}
                                                        </div>
                                                        <div className="leading-relaxed">
                                                            {message.content}
                                                        </div>
                                                        {message.imageUrl && (
                                                            <img
                                                                src={message.imageUrl}
                                                                alt="Chat image"
                                                                className="mt-2 max-h-40 w-full rounded-lg object-cover"
                                                            />
                                                        )}
                                                        <div className="mt-1 text-[10px] text-gray-300/70">
                                                            {new Date(message.createdAt).toLocaleTimeString(
                                                                [],
                                                                { hour: "2-digit", minute: "2-digit" }
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* typing */}
                                    <AnimatePresence>
                                        {isTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                className="flex items-center gap-2 px-4 pb-1 text-xs text-gray-400"
                                            >
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0.3s]" />
                        </span>
                                                Support is typing…
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* input */}
                                    <div className="border-t border-gray-800 px-3 py-3">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                placeholder="Type your message..."
                                                className="flex-1 rounded-2xl border-gray-700 bg-gray-800 text-sm"
                                                disabled={uploading}
                                            />
                                            <Button
                                                size="icon"
                                                className="h-9 w-9 rounded-2xl bg-gray-800 hover:bg-gray-700"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                className="h-9 w-9 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                                onClick={sendMessage}
                                                disabled={!newMessage.trim() && !uploading}
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>,
            document.body
        )

    return (
        <>
            {triggerButton}
            {chatOverlay}
        </>
    )
}
