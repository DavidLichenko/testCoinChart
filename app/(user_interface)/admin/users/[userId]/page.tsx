"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    ArrowLeft,
    Users,
    Shield,
    DollarSign,
    Ban,
    CheckCircle,
    Mail,
    Calendar,
    TrendingUp,
    CreditCard,
    MessageCircle,
    Star,
    UserCheck,
    User,
    Settings,
    Edit3,
    Send,
    Image as ImageIcon,
    Heart,
    HeartOff,
    Search,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/toast"
import { UserTradeItem } from "@/components/admin/user-trade-item";
import { WalletBalanceItem } from "@/components/admin/wallet-balance-item";
import { UserOrderItem } from "@/components/admin/user-order-item";
import { WalletManagement } from "@/components/admin/wallet-management";
import { MarginCostDisplay } from "@/components/admin/margin-cost-display";

// Add these imports for the virtualized ticker list
import { useTickers, type MarketTicker } from "@/hooks/market-data"
import { TickerAvatar } from "@/components/ticker-avatar"
import { VirtualizedTickerList } from "@/components/virtualized-ticker-list"

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
    baseCurrency: "USD" | "EUR";
    tradingBalance: number;
    tradingInTrade: number;
    walletTotal: number;
    stakingTotal: number;
    creditLimit: number;
    creditUsed: number;
    availableForWithdraw: number;
    availableForTrade: number;
}

interface WalletBalance {
    id: string;
    assetSymbol: string;
    ownBalance: number;
    creditLimit: number;
    creditUsed: number;
    locked: number;
    asset: {
        name: string;
        type: string;
    };
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

// New interfaces for creating/editing transactions
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

    const [user, setUser] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [trades, setTrades] = useState<UserTrade[]>([])
    const [orders, setOrders] = useState<UserOrder[]>([])
    const [loadingRelations, setLoadingRelations] = useState(true)
    
    // Wallet states
    const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null)
    const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([])
    const [loadingWallet, setLoadingWallet] = useState(true)

    // State for dialogs
    const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
    const [isEditTradeDialogOpen, setIsEditTradeDialogOpen] = useState(false)
    const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false)
    const [isChatDialogOpen, setIsChatDialogOpen] = useState(false)
    const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false)
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    
    // State for new transactions
    const [newTrade, setNewTrade] = useState<NewTrade>({
        type: "BUY",
        ticker: "BTCUSDT",
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
        status: "PENDING"
    })
    
    // State for editing transactions
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

    // Chat states
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [uploading, setUploading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)

    // Comments states
    const [comments, setComments] = useState("")
    const [loadingComments, setLoadingComments] = useState(false)
    const [savingComments, setSavingComments] = useState(false)

    // Assignment states
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [selectedWorker, setSelectedWorker] = useState<string>("")
    const [isFavorite, setIsFavorite] = useState(false)

    // Ticker selection states
    const [searchTerm, setSearchTerm] = useState("")
    const { tickers } = useTickers()
    const [selectedTickerSymbol, setSelectedTickerSymbol] = useState<string>(newTrade.ticker)
    
    // Filtered tickers based on search term
    const filteredTickers = useMemo(() => {
        if (!searchTerm.trim()) return tickers;
        const term = searchTerm.toLowerCase();
        return tickers.filter(ticker => 
            ticker.symbol.toLowerCase().includes(term) ||
            ticker.showName.toLowerCase().includes(term) ||
            ticker.fullName.toLowerCase().includes(term)
        );
    }, [tickers, searchTerm]);
    
    // Helper function to format price values
    const formatPriceValue = useCallback((value?: number | null) => {
        if (value == null || Number.isNaN(value)) return null
        if (value >= 1000) return value.toFixed(2)
        if (value >= 1) return value.toFixed(3)
        if (value >= 0.1) return value.toFixed(4)
        return value.toPrecision(4)
    }, [])
    
    // локальные стейты для редактирования
    const [name, setName] = useState("")
    const [role, setRole] = useState("USER")
    const [status, setStatus] = useState("NEW")
    const [blocked, setBlocked] = useState(false)
    const [isVerif, setIsVerif] = useState(false)
    const [canWithdraw, setCanWithdraw] = useState(false)
    const [baseCurrency, setBaseCurrency] = useState<"USD" | "EUR">("USD")
    const [balance, setBalance] = useState("0")

    useEffect(() => {
        if (!userId) return
        const fetchAll = async () => {
            setLoading(true)
            setLoadingRelations(true)
            setLoadingWallet(true)
            try {
                // 1) сам юзер
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
                    setBaseCurrency(data.baseCurrency || "USD")
                    // Removed balance update as we're using the new wallet system
                    
                    // Check if user is favorited
                    if (data.isFavorite !== undefined) {
                        setIsFavorite(data.isFavorite)
                    }
                    
                    // Load comments
                    try {
                        const commentsRes = await fetch(`/api/admin/users/${userId}/comments`)
                        if (commentsRes.ok) {
                            const commentsData = await commentsRes.json()
                            setComments(commentsData.comments || "")
                        }
                    } catch (e) {
                        console.error("Error loading comments:", e)
                    }
                }

                // 2) сделки юзера
                const tradesRes = await fetch(`/api/admin/trades?userId=${userId}`)
                if (tradesRes.ok) {
                    const t = await tradesRes.json()
                    setTrades(t)
                }

                // 3) депозиты/выводы
                const ordersRes = await fetch(`/api/admin/orders?userId=${userId}`)
                if (ordersRes.ok) {
                    const o = await ordersRes.json()
                    setOrders(o)
                }

                // 4) Load comments
                const commentsRes = await fetch(`/api/admin/users/${userId}/comments`)
                if (commentsRes.ok) {
                    const data = await commentsRes.json()
                    setComments(data.comments || "")
                }

                // 5) Load team members
                const teamRes = await fetch("/api/admin/team")
                if (teamRes.ok) {
                    const data = await teamRes.json()
                    setTeamMembers(data.users.filter((u: TeamMember) => 
                        u.role === "TEAMLEAD" || u.role === "WORKER" || u.role === "CR_MANAGMENT"))
                }
                
                // 6) Load wallet data
                const walletRes = await fetch(`/api/admin/users/${userId}/wallet`)
                if (walletRes.ok) {
                    const walletData = await walletRes.json()
                    setWalletSummary(walletData.walletSummary)
                    setWalletBalances(walletData.walletBalances)
                }
            } catch (e) {
                console.error("Error loading admin user page", e)
            } finally {
                setLoading(false)
                setLoadingRelations(false)
                setLoadingWallet(false)
            }
        }

        fetchAll()
    }, [userId])

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    role,
                    status,
                    blocked,
                    isVerif,
                    can_withdraw: canWithdraw,
                    baseCurrency,
                    // Removed TotalBalance update as we're using the new wallet system
                }),
            })

            if (res.ok) {
                const updated = await res.json()
                setUser(updated)
                toast({
                    title: "Success",
                    description: "User updated successfully",
                })
            }
        } catch (e) {
            console.error("Error updating user:", e)
            toast({
                title: "Error",
                description: "Failed to update user",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleCreateTrade = async () => {
        if (!user) return
        
        try {
            const res = await fetch("/api/admin/opentrade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    ...newTrade
                }),
            })
            
            if (res.ok) {
                // Refresh trades
                const tradesRes = await fetch(`/api/admin/trades?userId=${userId}`)
                if (tradesRes.ok) {
                    const t = await tradesRes.json()
                    setTrades(t)
                }
                // Refresh wallet data as margin might have changed
                await refreshWalletData()
                setIsTradeDialogOpen(false)
                toast({
                    title: "Success",
                    description: "Trade created successfully",
                })
            }
        } catch (e) {
            console.error("Error creating trade:", e)
            toast({
                title: "Error",
                description: "Failed to create trade",
                variant: "destructive",
            })
        }
    }

    const handleCreateOrder = async () => {
        if (!user) return
        
        try {
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    ...newOrder
                }),
            })
            
            if (res.ok) {
                // Refresh orders
                const ordersRes = await fetch(`/api/admin/orders?userId=${userId}`)
                if (ordersRes.ok) {
                    const o = await ordersRes.json()
                    setOrders(o)
                }
                // Refresh wallet data as balance might have changed
                await refreshWalletData()
                setIsOrderDialogOpen(false)
                toast({
                    title: "Success",
                    description: "Order created successfully",
                })
            }
        } catch (e) {
            console.error("Error creating order:", e)
            toast({
                title: "Error",
                description: "Failed to create order",
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
                // Refresh trades
                const tradesRes = await fetch(`/api/admin/trades?userId=${userId}`)
                if (tradesRes.ok) {
                    const t = await tradesRes.json()
                    setTrades(t)
                }
                // Refresh wallet data as margin/profit might have changed
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
                // Refresh orders
                const ordersRes = await fetch(`/api/admin/orders?userId=${userId}`)
                if (ordersRes.ok) {
                    const o = await ordersRes.json()
                    setOrders(o)
                }
                // Refresh wallet data as balance might have changed
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

    // Functions to open edit dialogs with existing data
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
    
    // Refresh wallet data
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
            console.error("Error refreshing wallet data", e)
        } finally {
            setLoadingWallet(false)
        }
    }

    // Chat functions
    const handleOpenChat = async () => {
        setIsChatDialogOpen(true)
        try {
            const res = await fetch(`/api/admin/chat/messages/${userId}`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (e) {
            console.error("Error loading messages:", e)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return

        try {
            const res = await fetch("/api/admin/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newMessage,
                    userId: userId,
                }),
            })

            if (res.ok) {
                const savedMessage = await res.json()
                setMessages(prev => [...prev, savedMessage])
                setNewMessage("")
            }
        } catch (e) {
            console.error("Error sending message:", e)
        }
    }

    // Comments functions
    const handleOpenComments = async () => {
        setIsCommentsDialogOpen(true)
        setLoadingComments(true)
        try {
            const res = await fetch(`/api/admin/users/${userId}/comments`)
            if (res.ok) {
                const data = await res.json()
                setComments(data.comments || "")
            }
        } catch (e) {
            console.error("Error loading comments:", e)
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

    // Assignment functions
    const handleToggleFavorite = async () => {
        if (!user) return
        
        try {
            // Toggle favorite by calling the new API
            const res = await fetch(`/api/admin/users/${user.id}/favorite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    favorite: !isFavorite
                }),
            })

            if (res.ok) {
                setIsFavorite(!isFavorite)
                toast({
                    title: "Success",
                    description: !isFavorite ? "Added to favorites" : "Removed from favorites",
                })
            }
        } catch (e) {
            console.error("Error toggling favorite:", e)
            toast({
                title: "Error",
                description: "Failed to update favorite status",
                variant: "destructive",
            })
        }
    }

    const handleAssignUser = async () => {
        if (!user || !selectedWorker) return
        
        try {
            const res = await fetch("/api/admin/team/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    assignToId: selectedWorker,
                }),
            })

            if (res.ok) {
                setIsAssignDialogOpen(false)
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

    if (loading && !user) {
        return (
            <div className="min-h-screen bg-gray-950 px-2 py-4 text-slate-100 sm:px-6">
                <div className="mx-auto max-w-6xl space-y-4">
                    <div className="h-8 w-40 animate-pulse rounded-full bg-slate-800/80" />
                    <div className="grid gap-4 md:grid-cols-[1.2fr_2fr]">
                        <div className="h-64 animate-pulse rounded-2xl bg-slate-900/80" />
                        <div className="h-64 animate-pulse rounded-2xl bg-slate-900/80" />
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-950 px-4 py-6 text-center text-slate-400">
                User not found
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 px-2 py-4 text-slate-100 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-2xl p-4 sm:p-6 border border-slate-800/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/admin/users")}
                                className="h-9 rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                            >
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                                    <User className="h-6 w-6 text-purple-300" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {user.name || "No Name"}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        <p className="text-sm text-slate-300">
                                            {user.email}
                                        </p>
                                        <span className="text-slate-600">•</span>
                                        <p className="text-xs text-slate-500 font-mono">
                                            ID: {user.id.slice(0, 8)}...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className="rounded-full border-slate-700 bg-slate-900/80 px-3 text-[11px] uppercase tracking-wide"
                            >
                                {user.role}
                            </Badge>
                            <Badge
                                variant={user.blocked ? "destructive" : user.isVerif ? "default" : "secondary"}
                                className="rounded-full px-3 text-[11px]"
                            >
                                {user.blocked ? "Blocked" : user.isVerif ? "Verified" : "Unverified"}
                            </Badge>
                            {walletSummary && (
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-emerald-500/40 bg-emerald-500/10 px-3 text-[11px] text-emerald-200"
                                >
                                    Wallet: {walletSummary.tradingBalance.toFixed(2)} {walletSummary.baseCurrency}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content - Simplified Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left Column - User Profile and Wallet */}
                    <div className="lg:col-span-1 space-y-5">
                        {/* User Profile Card */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/20 text-purple-200">
                                        <Users className="h-4 w-4" />
                                    </span>
                                    User Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400">Full Name</label>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm mt-1"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400">Email</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 mt-1">
                                            <Mail className="h-3.5 w-3.5 text-slate-500" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-400">Role</label>
                                            <Select
                                                value={role}
                                                onValueChange={setRole}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                                                    <SelectItem value="USER">User</SelectItem>
                                                    <SelectItem value="OWNER">Owner</SelectItem>
                                                    <SelectItem value="CR_MANAGMENT">CR Management</SelectItem>
                                                    <SelectItem value="TEAMLEAD">Team Lead</SelectItem>
                                                    <SelectItem value="WORKER">Worker</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-400">Status</label>
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[280px] border-slate-800 bg-slate-900 text-sm">
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
                                        <label className="text-xs text-slate-400">Base Currency</label>
                                        <Select value={baseCurrency} onValueChange={(v: "USD" | "EUR") => setBaseCurrency(v)}>
                                            <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-slate-800">
                                    <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <Ban className="h-4 w-4 text-rose-400" />
                                            <label htmlFor="blocked" className="text-xs font-medium text-slate-200 cursor-pointer">
                                                Block user
                                            </label>
                                        </div>
                                        <Switch
                                            id="blocked"
                                            checked={blocked}
                                            onCheckedChange={(v) => setBlocked(!!v)}
                                            className="data-[state=checked]:bg-rose-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-emerald-400" />
                                            <label htmlFor="verified" className="text-xs font-medium text-slate-200 cursor-pointer">
                                                Verified (KYC)
                                            </label>
                                        </div>
                                        <Switch
                                            id="verified"
                                            checked={isVerif}
                                            onCheckedChange={(v) => setIsVerif(!!v)}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-blue-400" />
                                            <label htmlFor="can_withdraw" className="text-xs font-medium text-slate-200 cursor-pointer">
                                                Can withdraw
                                            </label>
                                        </div>
                                        <Switch
                                            id="can_withdraw"
                                            checked={canWithdraw}
                                            onCheckedChange={(v) => setCanWithdraw(!!v)}
                                            className="data-[state=checked]:bg-blue-500"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                                >
                                    {saving ? "Saving..." : "Save Profile"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Wallet Management Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                                        <DollarSign className="h-4 w-4" />
                                    </span>
                                    Wallet Management
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingWallet ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                                    </div>
                                ) : walletSummary && walletBalances ? (
                                    <WalletManagement 
                                        userId={userId} 
                                        walletBalances={walletBalances} 
                                        onRefresh={refreshWalletData} 
                                    />
                                ) : (
                                    <div className="py-4 text-center text-slate-400 text-sm">
                                        Failed to load wallet data
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        </motion.div>
                    </div>

                    {/* Middle Column - Wallet Overview and Actions */}
                    <div className="lg:col-span-1 space-y-5">
                        {/* Wallet Overview Card */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                                        <CreditCard className="h-4 w-4" />
                                    </span>
                                    Wallet Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loadingWallet ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                                    </div>
                                ) : walletSummary ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-slate-900/60 p-3">
                                                <div className="text-xs text-slate-400">Trading Balance</div>
                                                <div className="mt-1 text-lg font-semibold">
                                                    {walletSummary.tradingBalance.toFixed(2)} {walletSummary.baseCurrency}
                                                </div>
                                            </div>
                                            <div className="rounded-xl bg-slate-900/60 p-3">
                                                <div className="text-xs text-slate-400">Available to Trade</div>
                                                <div className="mt-1 text-lg font-semibold">
                                                    {walletSummary.availableForTrade.toFixed(2)} {walletSummary.baseCurrency}
                                                </div>
                                            </div>
                                            <div className="rounded-xl bg-slate-900/60 p-3">
                                                <div className="text-xs text-slate-400">In Trades</div>
                                                <div className="mt-1 text-lg font-semibold text-amber-400">
                                                    {walletSummary.tradingInTrade.toFixed(2)} {walletSummary.baseCurrency}
                                                </div>
                                            </div>
                                            <div className="rounded-xl bg-slate-900/60 p-3">
                                                <div className="text-xs text-slate-400">Available to Withdraw</div>
                                                <div className="mt-1 text-lg font-semibold text-blue-400">
                                                    {walletSummary.availableForWithdraw.toFixed(2)} {walletSummary.baseCurrency}
                                                </div>
                                            </div>
                                        </div>
                                            
                                        <div className="rounded-xl bg-slate-900/60 p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium">Credit Utilization</div>
                                                <div className="text-xs text-slate-400">
                                                    {walletSummary.creditUsed.toFixed(2)} / {walletSummary.creditLimit.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
                                                <div 
                                                    className="bg-purple-500 h-2 rounded-full" 
                                                    style={{ width: `${walletSummary.creditLimit > 0 ? (walletSummary.creditUsed / walletSummary.creditLimit) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-4 text-center text-slate-400 text-sm">
                                        Failed to load wallet data
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Wallet Assets Card */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="9" cy="21" r="1"></circle>
                                            <circle cx="20" cy="21" r="1"></circle>
                                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                        </svg>
                                    </span>
                                    Wallet Assets
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loadingWallet ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                                    </div>
                                ) : walletBalances && walletBalances.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {walletBalances.map((balance) => (
                                            <WalletBalanceItem key={balance.id} balance={balance} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-center text-slate-400 text-sm">
                                        No wallet assets found
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-green-500/15 text-green-300">
                                        <Settings className="h-4 w-4" />
                                    </span>
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsTradeDialogOpen(true)}
                                        className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs hover:bg-slate-800 hover:border-purple-500/50"
                                    >
                                        <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                                        Create Trade
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsOrderDialogOpen(true)}
                                        className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs hover:bg-slate-800 hover:border-amber-500/50"
                                    >
                                        <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                        Create Order
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAssignDialogOpen(true)}
                                        className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs hover:bg-slate-800 hover:border-blue-500/50"
                                    >
                                        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                                        Connect Referral
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleToggleFavorite}
                                        className={`h-9 rounded-xl border-slate-800 text-xs hover:bg-slate-800 ${
                                            isFavorite 
                                                ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300" 
                                                : "bg-slate-900 hover:border-yellow-500/50"
                                        }`}
                                    >
                                        {isFavorite ? (
                                            <>
                                                <Star className="mr-1.5 h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                                Favorite
                                            </>
                                        ) : (
                                            <>
                                                <Star className="mr-1.5 h-3.5 w-3.5" />
                                                Favorite
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenChat}
                                        className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs hover:bg-slate-800"
                                    >
                                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                                        Chat
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleOpenComments}
                                        className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs hover:bg-slate-800"
                                    >
                                        <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                                        Comments
                                    </Button>
                                </div>
                                    
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refreshWalletData}
                                    disabled={loadingWallet}
                                    className="w-full h-9 rounded-xl border-slate-800 bg-slate-900 text-xs hover:bg-slate-800"
                                >
                                    {loadingWallet ? (
                                        <div className="flex items-center">
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mr-2"></div>
                                            Refreshing...
                                        </div>
                                    ) : (
                                        "Refresh Wallet Data"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Trades and Orders */}
                    <div className="lg:col-span-1 space-y-5">
                        {/* Trades Card */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="flex items-center justify-between pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/20 text-sky-200">
                                        <TrendingUp className="h-4 w-4" />
                                    </span>
                                    Trades
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-slate-800 bg-slate-900/80 px-2.5 text-[11px] text-slate-300"
                                    >
                                        {trades.length} total
                                    </Badge>
                                    <Button 
                                        size="sm" 
                                        className="h-7 rounded-full bg-purple-600 px-2.5 text-xs hover:bg-purple-700"
                                        onClick={() => setIsTradeDialogOpen(true)}
                                    >
                                        New Trade
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                                {loadingRelations ? (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        Loading trades...
                                    </div>
                                ) : trades.length === 0 ? (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        This user has no trades yet.
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
                                                    });
                                                    if (res.ok) {
                                                        const updated = await res.json();
                                                        setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, profit: updated.profit } : t));
                                                    }
                                                } catch (e) {
                                                    console.error("Error updating profit:", e);
                                                }
                                            }}
                                            baseCurrency={walletSummary?.baseCurrency || "USD"}
                                        />
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Orders Card */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="flex items-center justify-between pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200">
                                        <CreditCard className="h-4 w-4" />
                                    </span>
                                    Orders
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-slate-800 bg-slate-900/80 px-2.5 text-[11px] text-slate-300"
                                    >
                                        {orders.length} records
                                    </Badge>
                                    <Button 
                                        size="sm" 
                                        className="h-7 rounded-full bg-amber-600 px-2.5 text-xs hover:bg-amber-700"
                                        onClick={() => setIsOrderDialogOpen(true)}
                                    >
                                        New Order
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                                {loadingRelations ? (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        Loading orders...
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        No deposits or withdrawals yet.
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
                            </CardContent>
                        </Card>

                        {/* Comments Card */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                                        <Edit3 className="h-4 w-4" />
                                    </span>
                                    Comments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <Textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Add your comments here..."
                                        className="min-h-[120px] rounded-xl border-slate-800 bg-slate-900 p-3 text-sm resize-none"
                                    />
                                    <Button
                                        onClick={handleSaveComments}
                                        disabled={savingComments}
                                        className="w-full rounded-xl bg-purple-600 text-sm hover:bg-purple-700"
                                    >
                                        {savingComments ? (
                                            <div className="flex items-center">
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                                                Saving...
                                            </div>
                                        ) : (
                                            "Save Comments"
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Chat Dialog */}
            <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
                <DialogContent className="max-h-[80vh] w-[95vw] max-w-2xl overflow-hidden rounded-2xl border-slate-800 bg-slate-950/95">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Chat with {user.name || user.email}</DialogTitle>
                    </DialogHeader>
                    <div className="flex h-[500px] flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.isSupportMessage ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                                            message.isSupportMessage
                                                ? "bg-purple-600 text-white"
                                                : "bg-slate-800 text-slate-100"
                                        }`}
                                    >
                                        {message.content}
                                        {message.imageUrl && (
                                            <img
                                                src={message.imageUrl}
                                                alt="Attachment"
                                                className="mt-2 max-w-full rounded-lg"
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
                                    className="flex-1 rounded-xl border-slate-800 bg-slate-900"
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
                                    className="rounded-xl bg-purple-600 hover:bg-purple-700"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Comments Dialog */}
            <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
                <DialogContent className="max-h-[80vh] w-[95vw] max-w-2xl overflow-hidden rounded-2xl border-slate-800 bg-slate-950/95">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Comments for {user.name || user.email}</DialogTitle>
                    </DialogHeader>
                    <div className="flex h-[500px] flex-col">
                        <Textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add your comments here..."
                            className="flex-1 rounded-xl border-slate-800 bg-slate-900 p-4"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsCommentsDialogOpen(false)}
                                className="rounded-xl border-slate-800 bg-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveComments}
                                disabled={savingComments}
                                className="rounded-xl bg-purple-600 hover:bg-purple-700"
                            >
                                {savingComments ? "Saving..." : "Save Comments"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="w-[95vw] max-w-md rounded-2xl border-slate-800 bg-slate-950/95">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Assign User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs text-slate-400">Assign to Worker/Team Lead</Label>
                            <Select
                                value={selectedWorker}
                                onValueChange={setSelectedWorker}
                            >
                                <SelectTrigger className="mt-1 h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                    <SelectValue placeholder="Select worker or team lead" />
                                </SelectTrigger>
                                <SelectContent className="border-slate-800 bg-slate-900 text-sm">
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
                                className="rounded-xl border-slate-800 bg-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAssignUser}
                                className="rounded-xl bg-purple-600 hover:bg-purple-700"
                            >
                                Assign User
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Trade Dialog */}
            <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
                <DialogContent className="rounded-2xl border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Create New Trade</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Type</Label>
                                <Select
                                    value={newTrade.type}
                                    onValueChange={(v) => setNewTrade({...newTrade, type: v as "BUY" | "SELL"})}
                                >
                                    <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                                        <SelectItem value="BUY">Buy</SelectItem>
                                        <SelectItem value="SELL">Sell</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Asset Type</Label>
                                <Select
                                    value={newTrade.assetType}
                                    onValueChange={(v) => setNewTrade({...newTrade, assetType: v})}
                                >
                                    <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                                        <SelectItem value="CRYPTO">Crypto</SelectItem>
                                        <SelectItem value="STOCK">Stock</SelectItem>
                                        <SelectItem value="FOREX">Forex</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Ticker</Label>
                            <div className="space-y-2">
                                {/* Search Input */}
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <Input
                                        placeholder="Search tickers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-9 rounded-xl border-slate-800 bg-slate-900 pl-8 text-sm"
                                    />
                                </div>
                                
                                {/* Ticker List */}
                                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900">
                                    {tickers.length > 0 ? (
                                        <VirtualizedTickerList
                                            tickers={filteredTickers}
                                            selectedSymbol={selectedTickerSymbol}
                                            onSelectTicker={(ticker) => {
                                                setSelectedTickerSymbol(ticker.symbol);
                                                setNewTrade({
                                                    ...newTrade,
                                                    ticker: ticker.symbol
                                                });
                                                setSearchTerm("");
                                            }}
                                            formatPriceValue={formatPriceValue}
                                            height={240}
                                        />
                                    ) : (
                                        <div className="p-4 text-center text-sm text-slate-500">
                                            No tickers available
                                        </div>
                                    )}
                                </div>
                                
                                {/* Selected Ticker Display */}
                                {selectedTickerSymbol && (
                                    <div className="rounded-xl bg-slate-800/50 p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const ticker = tickers.find(t => t.symbol === selectedTickerSymbol);
                                                    return ticker ? (
                                                        <TickerAvatar
                                                            symbol={ticker.symbol}
                                                            category={ticker.category}
                                                            baseCurrency={ticker.baseCurrency}
                                                            quoteCurrency={ticker.quoteCurrency}
                                                            size={24}
                                                            icon={ticker.icon}
                                                        />
                                                    ) : null;
                                                })()}
                                                <span className="font-medium text-slate-200">
                                                    {selectedTickerSymbol}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedTickerSymbol("");
                                                    setNewTrade({
                                                        ...newTrade,
                                                        ticker: ""
                                                    });
                                                }}
                                                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300"
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Volume</Label>
                                <Input
                                    type="number"
                                    value={newTrade.volume}
                                    onChange={(e) => setNewTrade({...newTrade, volume: parseFloat(e.target.value) || 0})}
                                    className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Leverage</Label>
                                <Input
                                    type="number"
                                    value={newTrade.leverage}
                                    onChange={(e) => setNewTrade({...newTrade, leverage: parseInt(e.target.value) || 1})}
                                    className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Margin</Label>
                                <Input
                                    type="number"
                                    value={newTrade.margin}
                                    onChange={(e) => setNewTrade({...newTrade, margin: parseFloat(e.target.value) || 0})}
                                    className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Open Price</Label>
                                <Input
                                    type="number"
                                    value={newTrade.openIn}
                                    onChange={(e) => setNewTrade({...newTrade, openIn: parseFloat(e.target.value) || 0})}
                                    className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                />
                            </div>
                        </div>
                        
                        <MarginCostDisplay 
                            ticker={newTrade.ticker}
                            volume={newTrade.volume}
                            leverage={newTrade.leverage}
                            openPrice={newTrade.openIn}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Take Profit (Optional)</Label>
                                <Input
                                    type="number"
                                    value={newTrade.takeProfit || ''}
                                    onChange={(e) => setNewTrade({...newTrade, takeProfit: e.target.value ? parseFloat(e.target.value) : null})}
                                    className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Stop Loss (Optional)</Label>
                                <Input
                                    type="number"
                                    value={newTrade.stopLoss || ''}
                                    onChange={(e) => setNewTrade({...newTrade, stopLoss: e.target.value ? parseFloat(e.target.value) : null})}
                                    className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                />
                            </div>
                        </div>
                        
                        <Button 
                            onClick={handleCreateTrade}
                            className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                        >
                            Create Trade
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Order Dialog */}
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                <DialogContent className="rounded-2xl border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Create New Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Type</Label>
                                <Select
                                    value={newOrder.type}
                                    onValueChange={(v) => setNewOrder({...newOrder, type: v as "DEPOSIT" | "WITHDRAW"})}
                                >
                                    <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                                        <SelectItem value="DEPOSIT">Deposit</SelectItem>
                                        <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-400">Status</Label>
                                <Select
                                    value={newOrder.status}
                                    onValueChange={(v) => setNewOrder({...newOrder, status: v})}
                                >
                                    <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="PROCESSING">Processing</SelectItem>
                                        <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                                        <SelectItem value="FAILED">Failed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Amount (USD)</Label>
                            <Input
                                type="number"
                                value={newOrder.amount}
                                onChange={(e) => setNewOrder({...newOrder, amount: parseFloat(e.target.value) || 0})}
                                className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                            />
                        </div>
                        
                        <Button 
                            onClick={handleCreateOrder}
                            className="w-full rounded-xl bg-amber-600 text-sm font-medium hover:bg-amber-700"
                        >
                            Create Order
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}