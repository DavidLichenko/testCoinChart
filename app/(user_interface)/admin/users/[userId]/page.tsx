"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
    ArrowLeft,
    Users,
    Shield,
    DollarSign,
    Ban,
    Mail,
    TrendingUp,
    CreditCard,
    MessageCircle,
    Star,
    UserCheck,
    User,
    Settings,
    Edit3,
    Send,
    Search,
    Plus,
    Minus,
    Check,
    X,
    Calendar,
    Wallet,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/toast"
import { UserTradeItem } from "@/components/admin/user-trade-item"
import { WalletBalanceItem } from "@/components/admin/wallet-balance-item"
import { UserOrderItem } from "@/components/admin/user-order-item"
import { WalletManagement } from "@/components/admin/wallet-management"
import { MarginCostDisplay } from "@/components/admin/margin-cost-display"
import { useTickers, type MarketTicker } from "@/hooks/market-data"
import { TickerAvatar } from "@/components/ticker-avatar"
import { VirtualizedTickerList } from "@/components/virtualized-ticker-list"
import { useI18n } from "@/components/i18n-provider"

interface AdminUser {
    id: string
    email: string
    name: string | null
    role: string
    status: string
    TotalBalance: number
    can_withdraw: boolean
    isVerif: boolean
    blocked: boolean
    createdAt: string
    updatedAt: string
    assignedTo: string | null
    isFavorite?: boolean
    baseCurrency: "USD" | "EUR"
}

interface WalletSummary {
    baseCurrency: "USD" | "EUR"
    tradingBalance: number
    tradingInTrade: number
    walletTotal: number
    stakingTotal: number
    creditLimit: number
    creditUsed: number
    availableForWithdraw: number
    availableForTrade: number
}

interface WalletBalance {
    id: string
    assetSymbol: string
    ownBalance: number
    creditLimit: number
    creditUsed: number
    locked: number
    asset: {
        name: string
        type: string
    }
}

interface UserTrade {
    id: string
    ticker: string
    type: "BUY" | "SELL"
    volume: number
    leverage: number
    openIn: number
    closeIn: number | null
    profit: number | null
    status: string
    createdAt: string
    margin: number
    aiEnabled?: boolean
}

interface UserOrder {
    id: string
    type: "DEPOSIT" | "WITHDRAW"
    status: string
    amount: number
    createdAt: string
}

interface Message {
    id: string
    content: string
    imageUrl?: string
    isSupportMessage: boolean
    isRead: boolean
    createdAt: string
    userId: string
}

interface TeamMember {
    id: string
    name: string | null
    email: string
    role: string
}

interface NewTrade {
    type: "BUY" | "SELL"
    ticker: string
    volume: number
    leverage: number
    margin: number
    openIn: number
    takeProfit: number | null
    stopLoss: number | null
    assetType: string
}

interface EditTrade {
    id: string
    profit: number | null
    openIn: number
    closeIn: number | null
    status: string
}

interface NewOrder {
    type: "DEPOSIT" | "WITHDRAW"
    amount: number
    status: string
    orderType?: "Card" | "Crypto" | "Bank" | "Referral"
}

interface EditOrder {
    id: string
    status: string
    amount: number
}

export default function AdminUserPage() {
    const router = useRouter()
    const params = useParams()
    const userId = params?.userId as string
    const { t } = useI18n("admin")

    const [user, setUser] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [trades, setTrades] = useState<UserTrade[]>([])
    const [orders, setOrders] = useState<UserOrder[]>([])
    const [loadingRelations, setLoadingRelations] = useState(true)
    
    const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null)
    const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([])
    const [loadingWallet, setLoadingWallet] = useState(true)

    const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
    const [isEditTradeDialogOpen, setIsEditTradeDialogOpen] = useState(false)
    const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false)
    const [isChatDialogOpen, setIsChatDialogOpen] = useState(false)
    const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    
    const [newTrade, setNewTrade] = useState<NewTrade>({
        type: "BUY",
        ticker: "",
        volume: 0.1,
        leverage: 10,
        margin: 100,
        openIn: 0,
        takeProfit: null,
        stopLoss: null,
        assetType: "CRYPTO"
    })
    
    const [newOrder, setNewOrder] = useState<NewOrder>({
        type: "DEPOSIT",
        amount: 100,
        status: "PENDING",
        orderType: "Card"
    })
    
    const [editTrade, setEditTrade] = useState<EditTrade>({
        id: "",
        profit: null,
        openIn: 0,
        closeIn: null,
        status: "OPEN"
    })
    
    const [editOrder, setEditOrder] = useState<EditOrder>({
        id: "",
        status: "PENDING",
        amount: 0
    })

    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [comments, setComments] = useState("")
    const [loadingComments, setLoadingComments] = useState(false)
    const [savingComments, setSavingComments] = useState(false)

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [selectedWorker, setSelectedWorker] = useState<string>("")
    const [isFavorite, setIsFavorite] = useState(false)

    const [searchTerm, setSearchTerm] = useState("")
    const { tickers } = useTickers()
    const [selectedTickerSymbol, setSelectedTickerSymbol] = useState<string>("")
    const [favoriteTickers, setFavoriteTickers] = useState<Set<string>>(new Set())
    
    // Fetch favorite tickers for the user
    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const res = await fetch(`/api/admin/users/${userId}/favorite-tickers`)
                if (res.ok) {
                    const data = await res.json()
                    setFavoriteTickers(new Set(data.map((t: any) => t.symbol)))
                }
            } catch (error) {
                console.error("Error fetching favorite tickers:", error)
            }
        }
        if (userId) {
            fetchFavorites()
        }
    }, [userId])
    
    const filteredTickers = useMemo(() => {
        let filtered = tickers
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            filtered = tickers.filter(ticker => 
                ticker.symbol.toLowerCase().includes(term) ||
                ticker.showName?.toLowerCase().includes(term) ||
                ticker.fullName?.toLowerCase().includes(term)
            )
        }
        // Sort: favorites first, then alphabetically
        return filtered.sort((a, b) => {
            const aIsFavorite = favoriteTickers.has(a.symbol)
            const bIsFavorite = favoriteTickers.has(b.symbol)
            if (aIsFavorite && !bIsFavorite) return -1
            if (!aIsFavorite && bIsFavorite) return 1
            return a.symbol.localeCompare(b.symbol)
        })
    }, [tickers, searchTerm, favoriteTickers])
    
    const formatPriceValue = useCallback((value?: number | null) => {
        if (value == null || Number.isNaN(value)) return null
        if (value >= 1000) return value.toFixed(2)
        if (value >= 1) return value.toFixed(3)
        if (value >= 0.1) return value.toFixed(4)
        return value.toPrecision(4)
    }, [])
    
    const [name, setName] = useState("")
    const [role, setRole] = useState("USER")
    const [status, setStatus] = useState("NEW")
    const [blocked, setBlocked] = useState(false)
    const [isVerif, setIsVerif] = useState(false)
    const [canWithdraw, setCanWithdraw] = useState(false)
    const [baseCurrency, setBaseCurrency] = useState<"USD" | "EUR">("USD")

    useEffect(() => {
        if (!userId) return
        const fetchAll = async () => {
            setLoading(true)
            setLoadingRelations(true)
            setLoadingWallet(true)
            try {
                const userRes = await fetch(`/api/admin/users/${userId}`)
                if (userRes.ok) {
                    const data: AdminUser = await userRes.json()
                    setUser(data)
                    setName(data.name || "")
                    setRole(data.role)
                    setStatus(data.status)
                    setBlocked(data.blocked)
                    setIsVerif(data.isVerif)
                    setCanWithdraw(data.can_withdraw)
                    setBaseCurrency(data.baseCurrency)
                    setIsFavorite(data.isFavorite || false)
                }

                const tradesRes = await fetch(`/api/admin/trades?userId=${userId}`)
                if (tradesRes.ok) {
                    const t = await tradesRes.json()
                    setTrades(t)
                }

                const ordersRes = await fetch(`/api/admin/orders?userId=${userId}`)
                if (ordersRes.ok) {
                    const o = await ordersRes.json()
                    setOrders(o)
                }

                const walletRes = await fetch(`/api/admin/users/${userId}/wallet`)
                if (walletRes.ok) {
                    const walletData = await walletRes.json()
                    setWalletSummary(walletData.walletSummary)
                    setWalletBalances(walletData.walletBalances)
                }
            } catch (e) {
                console.error("Error fetching data:", e)
            } finally {
                setLoading(false)
                setLoadingRelations(false)
                setLoadingWallet(false)
            }
        }
        fetchAll()
    }, [userId])

    const refreshWalletData = async () => {
        if (!userId) return
        setLoadingWallet(true)
        try {
            const walletRes = await fetch(`/api/admin/users/${userId}/wallet`)
            if (walletRes.ok) {
                const walletData = await walletRes.json()
                setWalletSummary(walletData.walletSummary)
                setWalletBalances(walletData.walletBalances)
            }
        } catch (e) {
            console.error("Error refreshing wallet:", e)
        } finally {
            setLoadingWallet(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    role,
                    status,
                    blocked,
                    isVerif,
                    can_withdraw: canWithdraw,
                    baseCurrency
                }),
            })
            
            if (res.ok) {
                const updated = await res.json()
                setUser(updated)
                if (updated.baseCurrency) {
                    setBaseCurrency(updated.baseCurrency)
                }
                await refreshWalletData()
                toast({
                    title: t("success") || "Success",
                    description: t("userUpdated") || "User updated successfully",
                })
            }
        } catch (e) {
            console.error("Error updating user:", e)
            toast({
                title: t("error") || "Error",
                description: t("userUpdateFailed") || "Failed to update user",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleCreateTrade = async () => {
        try {
            const res = await fetch("/api/admin/opentrade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    ...newTrade
                }),
            })
            
            if (res.ok) {
                const tradesRes = await fetch(`/api/admin/trades?userId=${userId}`)
                if (tradesRes.ok) {
                    const t = await tradesRes.json()
                    setTrades(t)
                }
                await refreshWalletData()
                setIsTradeDialogOpen(false)
                toast({
                    title: t("success") || "Success",
                    description: t("tradeCreated") || "Trade created successfully",
                })
            }
        } catch (e) {
            console.error("Error creating trade:", e)
            toast({
                title: t("error") || "Error",
                description: t("tradeCreateFailed") || "Failed to create trade",
                variant: "destructive",
            })
        }
    }

    const handleCreateOrder = async () => {
        try {
            const payload: any = {
                userId,
                type: newOrder.type,
                amount: newOrder.amount,
                status: newOrder.status,
            }
            
            // Map orderType to appropriate fields
            if (newOrder.orderType === "Card") {
                if (newOrder.type === "DEPOSIT") {
                    payload.depositFrom = "card"
                } else {
                    payload.withdrawMethod = "card"
                }
            } else if (newOrder.orderType === "Crypto") {
                if (newOrder.type === "DEPOSIT") {
                    payload.depositFrom = "crypto"
                } else {
                    payload.withdrawMethod = "crypto"
                }
            } else if (newOrder.orderType === "Bank") {
                if (newOrder.type === "DEPOSIT") {
                    payload.depositFrom = "bank"
                } else {
                    payload.withdrawMethod = "bank"
                }
            } else if (newOrder.orderType === "Referral") {
                if (newOrder.type === "DEPOSIT") {
                    payload.depositFrom = "referral"
                }
            }
            
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            
            if (res.ok) {
                const ordersRes = await fetch(`/api/admin/orders?userId=${userId}`)
                if (ordersRes.ok) {
                    const o = await ordersRes.json()
                    setOrders(o)
                }
                await refreshWalletData()
                setIsOrderDialogOpen(false)
                toast({
                    title: t("success") || "Success",
                    description: t("orderCreated") || "Order created successfully",
                })
            }
        } catch (e) {
            console.error("Error creating order:", e)
            toast({
                title: t("error") || "Error",
                description: t("orderCreateFailed") || "Failed to create order",
                variant: "destructive",
            })
        }
    }

    const handleEditTrade = async () => {
        try {
            const res = await fetch(`/api/admin/trades/${editTrade.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editTrade),
            })
            
            if (res.ok) {
                const tradesRes = await fetch(`/api/admin/trades?userId=${userId}`)
                if (tradesRes.ok) {
                    const t = await tradesRes.json()
                    setTrades(t)
                }
                await refreshWalletData()
                setIsEditTradeDialogOpen(false)
                toast({
                    title: "Success",
                    description: "Trade updated successfully",
                })
            }
        } catch (e) {
            console.error("Error updating trade:", e)
            toast({
                title: "Error",
                description: "Failed to update trade",
                variant: "destructive",
            })
        }
    }

    const handleEditOrder = async () => {
        try {
            const res = await fetch(`/api/admin/orders/${editOrder.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: editOrder.status }),
            })
            
            if (res.ok) {
                const ordersRes = await fetch(`/api/admin/orders?userId=${userId}`)
                if (ordersRes.ok) {
                    const o = await ordersRes.json()
                    setOrders(o)
                }
                await refreshWalletData()
                setIsEditOrderDialogOpen(false)
                toast({
                    title: "Success",
                    description: "Order updated successfully",
                })
            }
        } catch (e) {
            console.error("Error updating order:", e)
            toast({
                title: "Error",
                description: "Failed to update order",
                variant: "destructive",
            })
        }
    }

    const openEditTradeDialog = (trade: UserTrade) => {
        setEditTrade({
            id: trade.id,
            profit: trade.profit,
            openIn: trade.openIn,
            closeIn: trade.closeIn,
            status: trade.status
        })
        setIsEditTradeDialogOpen(true)
    }

    const openEditOrderDialog = (order: UserOrder) => {
        setEditOrder({
            id: order.id,
            status: order.status,
            amount: order.amount
        })
        setIsEditOrderDialogOpen(true)
    }

    const handleToggleFavorite = async () => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/favorite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ favorite: !isFavorite }),
            })
            if (res.ok) {
                setIsFavorite(!isFavorite)
            }
        } catch (e) {
            console.error("Error toggling favorite:", e)
        }
    }

    const handleOpenChat = async () => {
        setIsChatDialogOpen(true)
        try {
            const res = await fetch(`/api/admin/chat/messages/${userId}`)
            if (res.ok) {
                const msgs = await res.json()
                setMessages(msgs)
            }
        } catch (e) {
            console.error("Error fetching messages:", e)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return
        try {
            const res = await fetch("/api/admin/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    content: newMessage,
                }),
            })
            if (res.ok) {
                setNewMessage("")
                const messagesRes = await fetch(`/api/admin/chat/messages/${userId}`)
                if (messagesRes.ok) {
                    const msgs = await messagesRes.json()
                    setMessages(msgs)
                }
            }
        } catch (e) {
            console.error("Error sending message:", e)
        }
    }

    const handleOpenComments = async () => {
        setIsCommentsDialogOpen(true)
        setLoadingComments(true)
        try {
            const res = await fetch(`/api/admin/users/${userId}/comments`)
            if (res.ok) {
                const data = await res.json()
                setComments(data.comment || "")
            }
        } catch (e) {
            console.error("Error fetching comments:", e)
        } finally {
            setLoadingComments(false)
        }
    }

    const handleSaveComments = async () => {
        setSavingComments(true)
        try {
            const res = await fetch(`/api/admin/users/${userId}/comments`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comments }),
            })
            if (res.ok) {
                setIsCommentsDialogOpen(false)
                toast({
                    title: "Success",
                    description: "Comments saved successfully",
                })
            }
        } catch (e) {
            console.error("Error saving comments:", e)
            toast({
                title: "Error",
                description: "Failed to save comments",
                variant: "destructive",
            })
        } finally {
            setSavingComments(false)
        }
    }

    const handleAssignUser = async () => {
        if (!selectedWorker) return
        try {
            const res = await fetch("/api/admin/team/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    assignToId: selectedWorker,
                }),
            })
            if (res.ok) {
                setIsAssignDialogOpen(false)
                setSelectedWorker("")
                toast({
                    title: "Success",
                    description: "User assigned successfully",
                })
            }
        } catch (e) {
            console.error("Error assigning user:", e)
            toast({
                title: "Error",
                description: "Failed to assign user",
                variant: "destructive",
            })
        }
    }

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const res = await fetch("/api/admin/team")
                if (res.ok) {
                    const data = await res.json()
                    const allUsers = data.users || []
                    const filtered = allUsers.filter((u: TeamMember) => 
                        u.role === "TEAMLEAD" || u.role === "WORKER" || u.role === "CR_MANAGMENT"
                    )
                    setTeamMembers(filtered)
                }
            } catch (e) {
                console.error("Error fetching team members:", e)
            }
        }
        fetchTeamMembers()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="h-8 w-8 animate-spin border-2 border-slate-700 border-t-slate-400"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
                {t("userNotFound")}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-[1920px] mx-auto px-4 py-6">
                {/* Compact Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/admin/users")}
                                className="h-8 px-3 text-xs border border-slate-800 bg-slate-900 hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                {t("back")}
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center bg-slate-900 border border-slate-800">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold text-white">
                                        {user.name || t("noName")}
                                    </h1>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Mail className="h-3 w-3" />
                                        <span>{user.email}</span>
                                        <span className="text-slate-600">•</span>
                                        <span className="font-mono">{user.id.slice(0, 8)}...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-slate-700 bg-slate-900 text-xs px-2 py-0.5">
                                {user.role}
                            </Badge>
                            <Badge 
                                variant={user.blocked ? "destructive" : user.isVerif ? "default" : "secondary"}
                                className="text-xs px-2 py-0.5"
                            >
                                {user.blocked ? t("blocked") : user.isVerif ? t("verified") : t("unverified")}
                            </Badge>
                            {walletSummary && (
                                <Badge variant="outline" className="border-emerald-700/50 bg-emerald-950/30 text-emerald-300 text-xs px-2 py-0.5">
                                    {walletSummary.tradingBalance.toFixed(2)} {walletSummary.baseCurrency}
                                </Badge>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleToggleFavorite}
                                className={`h-8 w-8 p-0 ${isFavorite ? "text-yellow-400" : "text-slate-400"}`}
                            >
                                <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            size="sm"
                            onClick={() => setIsTradeDialogOpen(true)}
                            className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800"
                        >
                            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                            {t("createTrade")}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setIsOrderDialogOpen(true)}
                            className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800"
                        >
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                            {t("createOrder")}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setIsAssignDialogOpen(true)}
                            className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800"
                        >
                            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                            Assign
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleOpenChat}
                            className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800"
                        >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                            {t("chat")}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleOpenComments}
                            className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800"
                        >
                            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                            {t("comments")}
                        </Button>
                        <Button
                            size="sm"
                            onClick={refreshWalletData}
                            disabled={loadingWallet}
                            className="h-8 px-3 text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800"
                        >
                            <Settings className="h-3.5 w-3.5 mr-1.5" />
                            {t("refresh")}
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    {/* Left: Balance Management */}
                    <div className="lg:col-span-1">
                        <Card className="border border-slate-800 bg-slate-900/50">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-slate-400" />
                                    {t("balanceManagement")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {loadingWallet ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="h-5 w-5 animate-spin border-2 border-slate-700 border-t-slate-400"></div>
                                    </div>
                                ) : walletSummary && walletBalances ? (
                                    <WalletManagement 
                                        userId={userId} 
                                        walletBalances={walletBalances} 
                                        onRefresh={refreshWalletData}
                                        baseCurrency={walletSummary.baseCurrency}
                                    />
                                ) : (
                                    <div className="py-4 text-center text-xs text-slate-500">
                                        Failed to load wallet data
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Center: Trades */}
                    <div className="lg:col-span-1">
                        <Card className="border border-slate-800 bg-slate-900/50">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-slate-400" />
                                        {t("trades")}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-slate-700 bg-slate-900 text-xs px-2 py-0.5">
                                            {trades.length}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            onClick={() => setIsTradeDialogOpen(true)}
                                            className="h-7 px-2 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {loadingRelations ? (
                                        <div className="py-8 text-center text-xs text-slate-500">
                                            {t("loadingTrades")}
                                        </div>
                                    ) : trades.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-500">
                                            {t("noTradesYet")}
                                        </div>
                                    ) : (
                                        trades.map((t) => (
                                            <UserTradeItem 
                                                key={t.id} 
                                                trade={t} 
                                                onEdit={openEditTradeDialog}
                                                onProfitUpdate={async (tradeId, newProfit) => {
                                                    try {
                                                        const res = await fetch(`/api/admin/trades/${tradeId}`, {
                                                            method: "PATCH",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ profit: newProfit }),
                                                        })
                                                        if (res.ok) {
                                                            const updated = await res.json()
                                                            setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, profit: updated.profit } : t))
                                                        }
                                                    } catch (e) {
                                                        console.error("Error updating profit:", e)
                                                    }
                                                }}
                                                baseCurrency={walletSummary?.baseCurrency || "USD"}
                                            />
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Orders */}
                    <div className="lg:col-span-1">
                        <Card className="border border-slate-800 bg-slate-900/50">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-slate-400" />
                                        {t("orders")}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-slate-700 bg-slate-900 text-xs px-2 py-0.5">
                                            {orders.length}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            onClick={() => setIsOrderDialogOpen(true)}
                                            className="h-7 px-2 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {loadingRelations ? (
                                        <div className="py-8 text-center text-xs text-slate-500">
                                            {t("loadingOrders")}
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-500">
                                            {t("noOrdersYet")}
                                        </div>
                                    ) : (
                                        orders.map((o) => (
                                            <UserOrderItem 
                                                key={o.id} 
                                                order={o} 
                                                onEdit={openEditOrderDialog} 
                                            />
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Secondary Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* User Profile */}
                    <div className="lg:col-span-1">
                        <Card className="border border-slate-800 bg-slate-900/50">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    User Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div>
                                    <Label className="text-xs text-slate-400 mb-1.5 block">Full Name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-8 text-sm border-slate-800 bg-slate-950"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-400 mb-1.5 block">Email</Label>
                                    <div className="flex items-center gap-2 h-8 px-3 border border-slate-800 bg-slate-950 text-xs text-slate-300">
                                        <Mail className="h-3 w-3 text-slate-500" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-slate-400 mb-1.5 block">Role</Label>
                                        <Select value={role} onValueChange={setRole}>
                                            <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-slate-800 bg-slate-950">
                                                <SelectItem value="USER">User</SelectItem>
                                                <SelectItem value="OWNER">Owner</SelectItem>
                                                <SelectItem value="CR_MANAGMENT">CR Management</SelectItem>
                                                <SelectItem value="TEAMLEAD">Team Lead</SelectItem>
                                                <SelectItem value="WORKER">Worker</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-slate-400 mb-1.5 block">Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px] border-slate-800 bg-slate-950">
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="WRONGNUMBER">Wrong Number</SelectItem>
                                                <SelectItem value="WRONGINFO">Wrong Info</SelectItem>
                                                <SelectItem value="CALLBACK">Call Back</SelectItem>
                                                <SelectItem value="LOWPOTENTIONAL">Low potential</SelectItem>
                                                <SelectItem value="HIGHPOTENTIONAL">High potential</SelectItem>
                                                <SelectItem value="NOTINTERESTED">Not interested</SelectItem>
                                                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                                                <SelectItem value="TRASH">Trash</SelectItem>
                                                <SelectItem value="DROP">Drop</SelectItem>
                                                <SelectItem value="RESIGN">Resign</SelectItem>
                                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-400 mb-1.5 block">{t("baseCurrency") || "Base Currency"}</Label>
                                    <Select value={baseCurrency} onValueChange={(v: "USD" | "EUR") => setBaseCurrency(v)}>
                                        <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                            <SelectValue>
                                                <div className="flex items-center gap-2">
                                                    <img 
                                                        src={`/icons/forex_icons/${baseCurrency}.png`} 
                                                        alt={baseCurrency} 
                                                        className="h-4 w-4" 
                                                    />
                                                    <span>{baseCurrency}</span>
                                                </div>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="border-slate-800 bg-slate-950">
                                            <SelectItem value="USD">
                                                <div className="flex items-center gap-2">
                                                    <img src="/icons/forex_icons/USD.png" alt="USD" className="h-4 w-4" />
                                                    <span>USD</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="EUR">
                                                <div className="flex items-center gap-2">
                                                    <img src="/icons/forex_icons/EUR.png" alt="EUR" className="h-4 w-4" />
                                                    <span>EUR</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="flex items-center justify-between h-8 px-2 bg-slate-950 border border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Ban className="h-3.5 w-3.5 text-rose-400" />
                                            <Label htmlFor="blocked" className="text-xs text-slate-300 cursor-pointer">
                                                Block user
                                            </Label>
                                        </div>
                                        <Switch
                                            id="blocked"
                                            checked={blocked}
                                            onCheckedChange={(v) => setBlocked(!!v)}
                                            className="data-[state=checked]:bg-rose-600"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between h-8 px-2 bg-slate-950 border border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-3.5 w-3.5 text-emerald-400" />
                                            <Label htmlFor="verified" className="text-xs text-slate-300 cursor-pointer">
                                                Verified
                                            </Label>
                                        </div>
                                        <Switch
                                            id="verified"
                                            checked={isVerif}
                                            onCheckedChange={(v) => setIsVerif(!!v)}
                                            className="data-[state=checked]:bg-emerald-600"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between h-8 px-2 bg-slate-950 border border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                                            <Label htmlFor="can_withdraw" className="text-xs text-slate-300 cursor-pointer">
                                                Can withdraw
                                            </Label>
                                        </div>
                                        <Switch
                                            id="can_withdraw"
                                            checked={canWithdraw}
                                            onCheckedChange={(v) => setCanWithdraw(!!v)}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full h-8 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                                >
                                    {saving ? "Saving..." : "Save Profile"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Wallet Overview */}
                    <div className="lg:col-span-1">
                        <Card className="border border-slate-800 bg-slate-900/50">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-slate-400" />
                                    Wallet Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {loadingWallet ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="h-5 w-5 animate-spin border-2 border-slate-700 border-t-slate-400"></div>
                                    </div>
                                ) : walletSummary ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 bg-slate-950 border border-slate-800">
                                                <div className="text-xs text-slate-400 mb-1">Trading Balance</div>
                                                <div className="text-sm font-semibold">
                                                    {walletSummary.tradingBalance.toFixed(2)} {walletSummary.baseCurrency}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800">
                                                <div className="text-xs text-slate-400 mb-1">Available to Trade</div>
                                                <div className="text-sm font-semibold">
                                                    {walletSummary.availableForTrade.toFixed(2)} {walletSummary.baseCurrency}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800">
                                                <div className="text-xs text-slate-400 mb-1">In Trades</div>
                                                <div className="text-sm font-semibold text-amber-400">
                                                    {walletSummary.tradingInTrade.toFixed(2)} {walletSummary.baseCurrency}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800">
                                                <div className="text-xs text-slate-400 mb-1">Available to Withdraw</div>
                                                <div className="text-sm font-semibold text-blue-400">
                                                    {walletSummary.availableForWithdraw.toFixed(2)} {walletSummary.baseCurrency}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-950 border border-slate-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-xs text-slate-400">Credit Utilization</div>
                                                <div className="text-xs text-slate-400">
                                                    {walletSummary.creditUsed.toFixed(2)} / {walletSummary.creditLimit.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-800">
                                                <div 
                                                    className="h-full bg-slate-600" 
                                                    style={{ width: `${walletSummary.creditLimit > 0 ? (walletSummary.creditUsed / walletSummary.creditLimit) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 text-center text-xs text-slate-500">
                                        Failed to load wallet data
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Wallet Assets */}
                    <div className="lg:col-span-1">
                        <Card className="border border-slate-800 bg-slate-900/50">
                            <CardHeader className="pb-3 border-b border-slate-800">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-slate-400" />
                                    {t("walletAssets")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {loadingWallet ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="h-5 w-5 animate-spin border-2 border-slate-700 border-t-slate-400"></div>
                                    </div>
                                ) : walletBalances && walletBalances.length > 0 ? (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {walletBalances.map((balance) => (
                                            <WalletBalanceItem key={balance.id} balance={balance} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-center text-xs text-slate-500">
                                        {t("noWalletAssetsFound")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-4">
                    <Card className="border border-slate-800 bg-slate-900/50">
                        <CardHeader className="pb-3 border-b border-slate-800">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Edit3 className="h-4 w-4 text-slate-400" />
                                {t("comments")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder={t("addCommentsPlaceholder") || "Add your comments here..."}
                                className="min-h-[100px] text-sm border-slate-800 bg-slate-950 resize-none"
                            />
                            <Button
                                onClick={handleSaveComments}
                                disabled={savingComments}
                                className="mt-3 h-8 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                            >
                                {savingComments ? t("saving") || "Saving..." : t("saveComments")}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialogs */}
            {/* Trade Dialog */}
            <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
                <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">{t("newTrade")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("type")}</Label>
                                <Select
                                    value={newTrade.type}
                                    onValueChange={(v) => setNewTrade({...newTrade, type: v as "BUY" | "SELL"})}
                                >
                                    <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-950">
                                        <SelectItem value="BUY">{t("buy")}</SelectItem>
                                        <SelectItem value="SELL">{t("sell")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("assetType")}</Label>
                                <Select
                                    value={newTrade.assetType}
                                    onValueChange={(v) => setNewTrade({...newTrade, assetType: v})}
                                >
                                    <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-950">
                                        <SelectItem value="CRYPTO">{t("crypto")}</SelectItem>
                                        <SelectItem value="STOCK">{t("stock")}</SelectItem>
                                        <SelectItem value="FOREX">{t("forex")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">{t("ticker")}</Label>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        placeholder={t("searchTickers")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-8 pl-8 text-sm border-slate-800 bg-slate-950"
                                    />
                                </div>
                                
                                <div className="max-h-60 overflow-y-auto border border-slate-800 bg-slate-950">
                                    {tickers.length > 0 ? (
                                        <VirtualizedTickerList
                                            tickers={filteredTickers}
                                            selectedSymbol={selectedTickerSymbol}
                                            onSelectTicker={(ticker) => {
                                                setSelectedTickerSymbol(ticker.symbol)
                                                setNewTrade({
                                                    ...newTrade,
                                                    ticker: ticker.symbol
                                                })
                                                setSearchTerm("")
                                            }}
                                            formatPriceValue={formatPriceValue}
                                            height={240}
                                            favoriteSymbols={new Set()}
                                            onToggleFavorite={() => {}}
                                        />
                                    ) : (
                                        <div className="p-4 text-center text-xs text-slate-500">
                                            {t("noTickersAvailable")}
                                        </div>
                                    )}
                                </div>
                                
                                {selectedTickerSymbol && (
                                    <div className="p-2 bg-slate-950 border border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const ticker = tickers.find(t => t.symbol === selectedTickerSymbol)
                                                    if (!ticker) return null
                                                    return (
                                                        <TickerAvatar
                                                            symbol={ticker.symbol}
                                                            category={ticker.category}
                                                            baseCurrency={ticker.baseCurrency}
                                                            quoteCurrency={ticker.quoteCurrency}
                                                            size={20}
                                                            icon={ticker.icon}
                                                        />
                                                    )
                                                })()}
                                                <span className="text-sm font-medium text-slate-200">
                                                    {selectedTickerSymbol}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedTickerSymbol("")
                                                    setNewTrade({
                                                        ...newTrade,
                                                        ticker: ""
                                                    })
                                                }}
                                                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("volume")}</Label>
                                <Input
                                    type="number"
                                    value={newTrade.volume}
                                    onChange={(e) => setNewTrade({...newTrade, volume: parseFloat(e.target.value) || 0})}
                                    className="h-8 text-sm border-slate-800 bg-slate-950"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("leverage")}</Label>
                                <Input
                                    type="number"
                                    value={newTrade.leverage}
                                    onChange={(e) => setNewTrade({...newTrade, leverage: parseInt(e.target.value) || 1})}
                                    className="h-8 text-sm border-slate-800 bg-slate-950"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("margin")}</Label>
                                <Input
                                    type="number"
                                    value={newTrade.margin}
                                    onChange={(e) => setNewTrade({...newTrade, margin: parseFloat(e.target.value) || 0})}
                                    className="h-8 text-sm border-slate-800 bg-slate-950"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("openPrice")}</Label>
                                <Input
                                    type="number"
                                    value={newTrade.openIn}
                                    onChange={(e) => setNewTrade({...newTrade, openIn: parseFloat(e.target.value) || 0})}
                                    className="h-8 text-sm border-slate-800 bg-slate-950"
                                />
                            </div>
                        </div>
                        
                        <MarginCostDisplay 
                            ticker={newTrade.ticker}
                            volume={newTrade.volume}
                            leverage={newTrade.leverage}
                            openPrice={newTrade.openIn}
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("takeProfit")}</Label>
                                <Input
                                    type="number"
                                    value={newTrade.takeProfit || ''}
                                    onChange={(e) => setNewTrade({...newTrade, takeProfit: e.target.value ? parseFloat(e.target.value) : null})}
                                    className="h-8 text-sm border-slate-800 bg-slate-950"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("stopLoss")}</Label>
                                <Input
                                    type="number"
                                    value={newTrade.stopLoss || ''}
                                    onChange={(e) => setNewTrade({...newTrade, stopLoss: e.target.value ? parseFloat(e.target.value) : null})}
                                    className="h-8 text-sm border-slate-800 bg-slate-950"
                                />
                            </div>
                        </div>
                        
                        <Button 
                            onClick={handleCreateTrade}
                            className="w-full h-8 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                        >
                            {t("createTrade")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Order Dialog */}
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">{t("newOrder")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("type")}</Label>
                                <Select
                                    value={newOrder.type}
                                    onValueChange={(v) => setNewOrder({...newOrder, type: v as "DEPOSIT" | "WITHDRAW"})}
                                >
                                    <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-950">
                                        <SelectItem value="DEPOSIT">Deposit</SelectItem>
                                        <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-slate-400 mb-1 block">{t("status")}</Label>
                                <Select
                                    value={newOrder.status}
                                    onValueChange={(v) => setNewOrder({...newOrder, status: v})}
                                >
                                    <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-950">
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="PROCESSING">Processing</SelectItem>
                                        <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                                        <SelectItem value="FAILED">Failed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">{t("orderType")}</Label>
                            <Select
                                value={newOrder.orderType || "Card"}
                                onValueChange={(v) => setNewOrder({...newOrder, orderType: v as "Card" | "Crypto" | "Bank" | "Referral"})}
                            >
                                <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-slate-800 bg-slate-950">
                                    <SelectItem value="Card">Card</SelectItem>
                                    <SelectItem value="Crypto">Crypto</SelectItem>
                                    <SelectItem value="Bank">Bank Account</SelectItem>
                                    <SelectItem value="Referral">Referral</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">{t("amount")}</Label>
                            <Input
                                type="number"
                                value={newOrder.amount}
                                onChange={(e) => setNewOrder({...newOrder, amount: parseFloat(e.target.value) || 0})}
                                className="h-8 text-sm border-slate-800 bg-slate-950"
                            />
                        </div>
                        
                        <Button 
                            onClick={handleCreateOrder}
                            className="w-full h-8 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                        >
                            {t("createOrder")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Trade Dialog */}
            <Dialog open={isEditTradeDialogOpen} onOpenChange={setIsEditTradeDialogOpen}>
                <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">{t("editTrade")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Profit</Label>
                            <Input
                                type="number"
                                value={editTrade.profit ?? ""}
                                onChange={(e) => setEditTrade({...editTrade, profit: e.target.value ? parseFloat(e.target.value) : null})}
                                className="h-8 text-sm border-slate-800 bg-slate-950"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Open Price</Label>
                            <Input
                                type="number"
                                value={editTrade.openIn}
                                onChange={(e) => setEditTrade({...editTrade, openIn: parseFloat(e.target.value) || 0})}
                                className="h-8 text-sm border-slate-800 bg-slate-950"
                                step="0.00001"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Close Price (Optional)</Label>
                            <Input
                                type="number"
                                value={editTrade.closeIn ?? ""}
                                onChange={(e) => setEditTrade({...editTrade, closeIn: e.target.value ? parseFloat(e.target.value) : null})}
                                className="h-8 text-sm border-slate-800 bg-slate-950"
                                step="0.00001"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Status</Label>
                            <Select
                                value={editTrade.status}
                                onValueChange={(v) => setEditTrade({...editTrade, status: v})}
                            >
                                <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-slate-800 bg-slate-950">
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="CLOSE">Close</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button 
                            onClick={handleEditTrade}
                            className="w-full h-8 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                        >
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Order Dialog */}
            <Dialog open={isEditOrderDialogOpen} onOpenChange={setIsEditOrderDialogOpen}>
                <DialogContent className="border border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">{t("editOrder")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Status</Label>
                            <Select
                                value={editOrder.status}
                                onValueChange={(v) => setEditOrder({...editOrder, status: v})}
                            >
                                <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-slate-800 bg-slate-950">
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button 
                            onClick={handleEditOrder}
                            className="w-full h-8 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                        >
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Chat Dialog */}
            <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
                <DialogContent className="max-h-[80vh] w-[95vw] max-w-2xl overflow-hidden border border-slate-800 bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Chat with {user?.name || user?.email || "User"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex h-[500px] flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.isSupportMessage ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-xs p-3 text-sm border ${
                                            message.isSupportMessage
                                                ? "bg-slate-800 text-white border-slate-700"
                                                : "bg-slate-950 text-slate-100 border-slate-800"
                                        }`}
                                    >
                                        {message.content}
                                        {message.imageUrl && (
                                            <img
                                                src={message.imageUrl}
                                                alt="Attachment"
                                                className="mt-2 max-w-full"
                                            />
                                        )}
                                        <div className="mt-1 text-xs opacity-70">
                                            {new Date(message.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-800 p-4">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 h-8 text-sm border-slate-800 bg-slate-950"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage()
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="h-8 px-3 bg-slate-800 border border-slate-700 hover:bg-slate-700"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Comments Dialog */}
            <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
                <DialogContent className="max-h-[80vh] w-[95vw] max-w-2xl overflow-hidden border border-slate-800 bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Comments for {user?.name || user?.email || "User"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex h-[500px] flex-col">
                        <Textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add your comments here..."
                            className="flex-1 text-sm border-slate-800 bg-slate-950 p-4"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsCommentsDialogOpen(false)}
                                className="h-8 px-3 text-xs border-slate-800 bg-slate-950 hover:bg-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveComments}
                                disabled={savingComments}
                                className="h-8 px-3 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                            >
                                {savingComments ? t("saving") || "Saving..." : t("saveComments")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="w-[95vw] max-w-md border border-slate-800 bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Assign User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Assign to Worker/Team Lead</Label>
                            <Select
                                value={selectedWorker}
                                onValueChange={setSelectedWorker}
                            >
                                <SelectTrigger className="h-8 text-sm border-slate-800 bg-slate-950">
                                    <SelectValue placeholder="Select worker or team lead" />
                                </SelectTrigger>
                                <SelectContent className="border-slate-800 bg-slate-950">
                                    {teamMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.name || member.email} ({member.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsAssignDialogOpen(false)}
                                className="h-8 px-3 text-xs border-slate-800 bg-slate-950 hover:bg-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAssignUser}
                                className="h-8 px-3 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700"
                            >
                                Assign User
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
