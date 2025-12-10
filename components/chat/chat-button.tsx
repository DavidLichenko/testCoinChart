"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Image as ImageIcon, Check, CheckCheck} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { toast } from "@/components/toast"
import { pusherClient } from "@/lib/pusher-client"
import { useIsMobile } from "@/hooks/use-mobile"
import { MdSupportAgent } from "react-icons/md"

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

// локальный тип с оптимистичными флагами
type ChatMessage = Message & {
    isPending?: boolean
    isError?: boolean
}

export default function ChatButton() {
    const { user } = useAuth()
    const isMobile = useIsMobile()

    const [chatOpen, setChatOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [uploading, setUploading] = useState(false)

    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const messagesContainerRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    // чтобы портал не ломал SSR
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])
    useEffect(() => {
        const handleOpen = () => setChatOpen(true)
        const handleClose = () => setChatOpen(false)

        window.addEventListener("support-chat:open", handleOpen)
        window.addEventListener("support-chat:close", handleClose)

        return () => {
            window.removeEventListener("support-chat:open", handleOpen)
            window.removeEventListener("support-chat:close", handleClose)
        }
    }, [])
    // блокируем скролл body на мобиле, когда открыт чат
    useEffect(() => {
        if (!isMobile) return

        if (chatOpen) {
            const prev = document.body.style.overflow
            document.body.style.overflow = "hidden"
            return () => {
                document.body.style.overflow = prev
            }
        }
    }, [chatOpen, isMobile])

    const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
        const container = messagesContainerRef.current
        if (!container) return
        container.scrollTo({
            top: container.scrollHeight,
            behavior,
        })
    }

    // авто-скролл + фокус при открытии
    useEffect(() => {
        if (!chatOpen) return
        scrollToBottom("auto")

        const id = setTimeout(() => {
            inputRef.current?.focus()
        }, 80)

        return () => clearTimeout(id)
    }, [chatOpen])

    // авто-скролл при новых сообщениях
    useEffect(() => {
        if (!chatOpen) return
        if (!messages.length) return
        scrollToBottom("smooth")
    }, [messages.length, chatOpen])

    // загрузка истории при открытии
    useEffect(() => {
        if (chatOpen) {
            fetchMessages()
            setUnreadCount(0)
        }
    }, [chatOpen])

    // Pusher
    useEffect(() => {
        if (!user?.id) return

        const channelName = `chat-${user.id}`
        const channel = pusherClient.subscribe(channelName)

        const handleNewMessage = (data: Message) => {
            // если это наш же юзерский месседж — мы уже добавляем его локально через API, не дублируем
            if (!data.isSupportMessage && data.userId === user.id) {
                return
            }

            setMessages(prev => {
                // если вдруг уже есть с таким id — не дублируем
                if (prev.some(m => m.id === data.id)) return prev
                return [...prev, data]
            })

            if (!chatOpen && data.isSupportMessage) {
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

        const handleMessagesReadByAdmin = (data: { messageIds: string[] }) => {
            setMessages(prev => {
                const updated = prev.map(msg =>
                    data.messageIds.includes(msg.id) && !msg.isSupportMessage
                        ? { ...msg, isRead: true }
                        : msg
                )

                const unreadUser = updated.filter(
                    m => !m.isSupportMessage && !m.isRead
                ).length
                setUnreadCount(unreadUser)

                return updated
            })
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
                const data: Message[] = await res.json()
                setMessages(data)

                const unreadAdminMessageIds = data
                    .filter(msg => msg.isSupportMessage && !msg.isRead)
                    .map(msg => msg.id)

                if (unreadAdminMessageIds.length > 0) {
                    await fetch("/api/chat/messages/mark-as-read", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ messageIds: unreadAdminMessageIds }),
                    })
                }
            }
        } catch (e) {
            console.error("Error fetching messages", e)
        }
    }

    // ------- ОПТИМИСТИЧЕСКАЯ ОТПРАВКА -------

    const sendMessage = async () => {
        if (!newMessage.trim() && !uploading) return
        if (!user) return

        const content = newMessage.trim()
        setNewMessage("")

        const tempId = `temp-${Date.now()}`
        const optimistic: ChatMessage = {
            id: tempId,
            content,
            imageUrl: undefined,
            isSupportMessage: false,
            isRead: false,
            createdAt: new Date().toISOString(),
            userId: user.id,
            user: {
                email: user.email,
                name: user.name,
            },
            isPending: true,
            isError: false,
        }

        // сразу показываем сообщение
        setMessages(prev => [...prev, optimistic])

        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            })

            if (res.ok) {
                const saved: Message = await res.json()
                // заменяем оптимистичное сообщение реальным
                setMessages(prev =>
                    prev.map(m =>
                        m.id === tempId
                            ? { ...saved, isPending: false, isError: false }
                            : m
                    )
                )
            } else {
                throw new Error("Failed to send message")
            }
        } catch (e) {
            console.error("Error sending message", e)
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive",
            })
            // помечаем как ошибку
            setMessages(prev =>
                prev.map(m =>
                    m.id === tempId
                        ? { ...m, isPending: false, isError: true }
                        : m
                )
            )
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

            const tempId = `temp-img-${Date.now()}`
            const optimistic: ChatMessage = {
                id: tempId,
                content: "📷 Image",
                imageUrl,
                isSupportMessage: false,
                isRead: false,
                createdAt: new Date().toISOString(),
                userId: user?.id || "",
                user: {
                    email: user?.email || "",
                    name: user?.name || null,
                },
                isPending: true,
                isError: false,
            }

            setMessages(prev => [...prev, optimistic])

            const messageRes = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: "📷 Image",
                    imageUrl,
                }),
            })

            if (messageRes.ok) {
                const saved: Message = await messageRes.json()
                setMessages(prev =>
                    prev.map(m =>
                        m.id === tempId
                            ? { ...saved, isPending: false, isError: false }
                            : m
                    )
                )
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
            setMessages(prev =>
                prev.map(m =>
                    m.id.startsWith("temp-img-")
                        ? { ...m, isPending: false, isError: true }
                        : m
                )
            )
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

    // ---------- кнопка-триггер ----------

    const triggerButton = (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="hidden md:relative"
        >
            <Button
                onClick={() => setChatOpen(true)}
                variant="outline"
                size="icon"
                className="relative h-10 w-10 rounded-md border-app-cardBorder bg-app-card text-app-accent/70 hover:bg-app-card/80 hover:text-app-accent hover:border-app-accent/60 shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
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
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-app-danger p-0 text-[10px] leading-none"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    </motion.div>
                )}
            </Button>
        </motion.div>
    )

    // ---------- helper для метаданных под сообщением ----------

    const renderMeta = (message: ChatMessage) => {
        const time = new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })

        // для сообщений поддержки — просто время
        if (message.isSupportMessage) {
            return (
                <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                    <span>{time}</span>
                </div>
            )
        }

        // для сообщений пользователя — статус
        return (
            <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                <span>{time}</span>
                {message.isPending && (
                    <span className="ml-1 italic text-[9px] text-slate-400">
            Sending…
          </span>
                )}
                {message.isError && (
                    <span className="ml-1 text-[9px] text-app-danger">
            Failed
          </span>
                )}
                {!message.isPending && !message.isError && (
                    <span className="ml-1 text-[9px]">
            {message.isRead ? <CheckCheck className={'text-app-accentStrong w-[13px] '}/> : <Check className={'w-[13px] '}/>  }
          </span>
                )}
            </div>
        )
    }

    // ---------- окно чата через портал ----------

    const chatOverlay =
        mounted &&
        createPortal(
            <AnimatePresence>
                {chatOpen && (
                    <>
                        {isMobile ? (
                            // MOBILE: full-screen bottom sheet
                            <motion.div
                                className="fixed inset-0 z-[70]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div
                                    className="absolute inset-0 bg-black/40"
                                    onClick={() => setChatOpen(false)}
                                />

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                                    className="absolute inset-0 flex h-full max-h-full flex-col rounded-none border-none bg-app-bgSurface shadow-[0_18px_50px_rgba(0,0,0,0.7)]"
                                >
                                    {/* header */}
                                    <div className="flex items-center justify-between border-b border-app-cardBorder px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-app-bgTileSoft text-app-text text-xs font-semibold">
                                                <MdSupportAgent className="h-8 w-8" />
                                            </div>
                                            <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-50">
                          Support
                        </span>
                                                <span className="text-[10px] text-slate-500">
                          Usually replies in a few minutes
                        </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-slate-100"
                                            onClick={() => setChatOpen(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* messages */}
                                    <div
                                        ref={messagesContainerRef}
                                        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {messages.map((message) => {
                                                const isSupport = message.isSupportMessage

                                                return (
                                                    <motion.div
                                                        key={message.id}
                                                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                                        transition={{ duration: 0.18 }}
                                                        className={`flex ${isSupport ? "justify-start" : "justify-end"} px-1`}
                                                    >
                                                        <div
                                                            className={`
            relative max-w-[80%] sm:max-w-[70%] 
            rounded-2xl px-3.5 py-2.5 text-xs
            border shadow-[0_16px_40px_rgba(0,0,0,0.65)]
            ${isSupport
                                                                ? "bg-[#0F1020] border-[#252749] text-[#EAEAFB]"
                                                                : "bg-app-accentSoft border-[#8B5CF6] text-[#F9FAFF]"
                                                            }
          `}
                                                        >
                                                            {/* Верхняя подпись: Support / You + бейдж New */}
                                                            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]">
            <span
                className={
                    isSupport
                        ? "text-[#9CA3C9] font-semibold"
                        : "text-white font-semibold"
                }
            >
              {isSupport ? "Support" : "You"}
            </span>

                                                                {isSupport && !message.isRead && (
                                                                    <span className="rounded-full bg-[rgba(139,92,246,0.18)] px-1.5 py-0.5 text-[9px] font-medium text-[#C4B5FD]">
                New
              </span>
                                                                )}
                                                            </div>

                                                            {/* Текст сообщения */}
                                                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                                                                {message.content}
                                                            </div>

                                                            {/* Картинка, если есть */}
                                                            {message.imageUrl && (
                                                                <img
                                                                    src={message.imageUrl}
                                                                    alt="Chat image"
                                                                    className="mt-2 max-h-48 w-full rounded-xl object-cover"
                                                                />
                                                            )}

                                                            {/* Метаданные (время, статус) */}
                                                            {renderMeta(message)}
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                    </div>

                                    {/* typing */}
                                    <AnimatePresence>
                                        {isTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                className="flex items-center gap-2 px-4 pb-1 text-[10px] text-slate-400"
                                            >
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-accent" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-accent [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-accent [animation-delay:0.3s]" />
                        </span>
                                                Support is typing…
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* input */}
                                    <div className="border-t border-app-cardBorder px-3 py-3">
                                        <div className="flex gap-2">
                                            <Input
                                                ref={inputRef}
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                placeholder="Type your message..."
                                                className="flex-1 rounded-lg border-app-cardBorder bg-app-cardSoft text-xs"
                                                disabled={uploading}
                                            />
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-lg border-app-cardBorder bg-app-card text-slate-300 hover:bg-app-panel"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-lg bg-app-accent text-slate-950 hover:bg-app-accent/90 disabled:opacity-40"
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
                            // DESKTOP: bottom-right
                            <motion.div
                                className="fixed bottom-4 right-4 z-[70]"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex h-[640px] w-[440px] flex-col overflow-hidden rounded-xl border border-app-cardBorder bg-app-bgSurface shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
                                    {/* header */}
                                    <div className="flex items-center justify-between border-b border-app-cardBorder px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-app-bgTileSoft text-[11px] font-semibold text-app-text">
                                                <MdSupportAgent className="h-8 w-8" />
                                            </div>
                                            <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-50">
                          Support
                        </span>
                                                <span className="text-[10px] text-slate-500">
                          We&apos;re here to help you
                        </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-slate-100"
                                            onClick={() => setChatOpen(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* messages */}
                                    <div
                                        ref={messagesContainerRef}
                                        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
                                    >
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
                                                        className={`max-w-[80%] rounded-xl px-3 py-2 text-xs shadow-lg ${
                                                            message.isSupportMessage
                                                                ? "bg-app-bgTileSoft text-slate-100 font-medium"
                                                                : "bg-app-bgTile text-slate-100 font-medium"
                                                        }`}
                                                    >
                                                        <div className="mb-0.5 text-[9px] uppercase tracking-wide text-slate-400/90">
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
                                                        {renderMeta(message)}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {/* typing */}
                                    <AnimatePresence>
                                        {isTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                className="flex items-center gap-2 px-4 pb-1 text-[10px] text-slate-400"
                                            >
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-accent" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-accent [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-accent [animation-delay:0.3s]" />
                        </span>
                                                Support is typing…
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* input */}
                                    <div className="border-t border-app-cardBorder px-3 py-3">
                                        <div className="flex gap-2">
                                            <Input
                                                ref={inputRef}
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                placeholder="Type your message..."
                                                className="flex-1 rounded-lg border-app-cardBorder bg-app-cardSoft text-xs"
                                                disabled={uploading}
                                            />
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-lg border-app-cardBorder bg-app-card text-slate-300 hover:bg-app-panel"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                className="h-8 w-8 rounded-lg bg-app-accent text-slate-950 hover:bg-app-accent/90 disabled:opacity-40"
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
        <div className="fixed bottom-5 right-5 z-[60]">
            {triggerButton}
            {chatOverlay}
        </div>
    )
}
