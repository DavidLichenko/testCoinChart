"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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
} from "lucide-react"
import { toast } from "@/components/toast"

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AdminUser {
    id: string
    email: string
    name: string | null
    role: string
    status: string
    TotalBalance: number
    bonusBalanced: number | null
    can_withdraw: boolean
    isVerif: boolean
    blocked: boolean
    createdAt: string
    updatedAt: string
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
}

interface UserOrder {
    id: string
    type: "DEPOSIT" | "WITHDRAW"
    status: string
    amount: number
    createdAt: string
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

    // State for dialogs
    const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
    const [isEditTradeDialogOpen, setIsEditTradeDialogOpen] = useState(false)
    const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false)
    
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

    // Referral states
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loadingReferrals, setLoadingReferrals] = useState(false);
    const [isAddReferralDialogOpen, setIsAddReferralDialogOpen] = useState(false);
    const [isAddRewardDialogOpen, setIsAddRewardDialogOpen] = useState(false);
    const [referralEmail, setReferralEmail] = useState("");
    const [rewardAmount, setRewardAmount] = useState("");
    const [rewardReferralEmail, setRewardReferralEmail] = useState("");
    const [allUsers, setAllUsers] = useState<Array<{ id: string; email: string; name: string | null }>>([]);

    // локальные стейты для редактирования
    const [name, setName] = useState("")
    const [role, setRole] = useState("USER")
    const [status, setStatus] = useState("NEW")
    const [blocked, setBlocked] = useState(false)
    const [isVerif, setIsVerif] = useState(false)
    const [canWithdraw, setCanWithdraw] = useState(false)
    const [balance, setBalance] = useState("0")
    const [bonusBalance, setBonusBalance] = useState("0");

    useEffect(() => {
        if (!userId) return
        const fetchAll = async () => {
            setLoading(true)
            setLoadingRelations(true)
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
                    setBalance((data.TotalBalance ?? 0).toString())
                    setBonusBalance((data.bonusBalanced ?? 0).toString())
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

                // 4) referrals
                setLoadingReferrals(true);
                const referralsRes = await fetch(`/api/admin/referrals?userId=${userId}`);
                if (referralsRes.ok) {
                    const r = await referralsRes.json();
                    setReferrals(r);
                }
                setLoadingReferrals(false);

                // 5) fetch all users with role USER
                const usersRes = await fetch('/api/admin/users');
                if (usersRes.ok) {
                    const allUsersData = await usersRes.json();
                    const regularUsers = allUsersData.filter((u: any) => u.role === 'USER');
                    setAllUsers(regularUsers.map((u: any) => ({
                        id: u.id,
                        email: u.email,
                        name: u.name
                    })));
                }
            } catch (e) {
                console.error("Error loading admin user page", e)
            } finally {
                setLoading(false)
                setLoadingRelations(false)
            }
        }

        fetchAll()
    }, [userId])

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        try {
            const newBalance = parseFloat(balance) || 0
            const newBonusBalance = parseFloat(bonusBalance) || 0
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
                    TotalBalance: newBalance,
                    bonusBalanced: newBonusBalance,
                }),
            })

            if (res.ok) {
                const updated = await res.json()
                setUser(updated)
                setBalance((updated.TotalBalance ?? 0).toString())
                setBonusBalance((updated.bonusBalanced ?? 0).toString())
                toast({
                    title: "✅ User updated successfully",
                    description: `Changes for ${user.email} have been saved.`,
                    variant: "success",
                })
            } else {
                const errorData = await res.json()
                toast({
                    title: "❌ Failed to update user",
                    description: errorData.error || "An error occurred while updating the user.",
                    variant: "error",
                })
            }
        } catch (e) {
            console.error("Error updating user:", e)
            toast({
                title: "❌ Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "error",
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
                setIsTradeDialogOpen(false)
                toast({
                    title: "✅ Trade created successfully",
                    description: `${newTrade.type} trade for ${newTrade.ticker} has been created.`,
                    variant: "success",
                })
            } else {
                const errorData = await res.json()
                toast({
                    title: "❌ Failed to create trade",
                    description: errorData.error || "An error occurred while creating the trade.",
                    variant: "error",
                })
            }
        } catch (e) {
            console.error("Error creating trade:", e)
            toast({
                title: "❌ Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "error",
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
                setIsOrderDialogOpen(false)
                toast({
                    title: "✅ Order created successfully",
                    description: `${newOrder.type} order for $${newOrder.amount} has been created.`,
                    variant: "success",
                })
            } else {
                const errorData = await res.json()
                toast({
                    title: "❌ Failed to create order",
                    description: errorData.error || "An error occurred while creating the order.",
                    variant: "error",
                })
            }
        } catch (e) {
            console.error("Error creating order:", e)
            toast({
                title: "❌ Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "error",
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
                setIsEditTradeDialogOpen(false)
                toast({
                    title: "✅ Trade updated successfully",
                    description: "Trade has been updated with new values.",
                    variant: "success",
                })
            } else {
                const errorData = await res.json()
                toast({
                    title: "❌ Failed to update trade",
                    description: errorData.error || "An error occurred while updating the trade.",
                    variant: "error",
                })
            }
        } catch (e) {
            console.error("Error updating trade:", e)
            toast({
                title: "❌ Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "error",
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
                setIsEditOrderDialogOpen(false)
                toast({
                    title: "✅ Order updated successfully",
                    description: `Order status changed to ${editOrder.status}.`,
                    variant: "success",
                })
            } else {
                const errorData = await res.json()
                toast({
                    title: "❌ Failed to update order",
                    description: errorData.error || "An error occurred while updating the order.",
                    variant: "error",
                })
            }
        } catch (e) {
            console.error("Error updating order:", e)
            toast({
                title: "❌ Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "error",
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

    const handleAddReferral = async () => {
        if (!referralEmail.trim() || !userId) return;

        try {
            const res = await fetch("/api/admin/referrals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, referralEmail: referralEmail.trim() }),
            });

            if (res.ok) {
                // Refresh referrals
                const referralsRes = await fetch(`/api/admin/referrals?userId=${userId}`);
                if (referralsRes.ok) {
                    const r = await referralsRes.json();
                    setReferrals(r);
                }
                setReferralEmail("");
                setIsAddReferralDialogOpen(false);
                toast({
                    title: "✅ Referral added successfully",
                    description: `${referralEmail} has been added as a referral.`,
                    variant: "success",
                })
            } else {
                const errorData = await res.json();
                toast({
                    title: "❌ Failed to add referral",
                    description: errorData.error || "An error occurred while adding the referral.",
                    variant: "error",
                })
            }
        } catch (e) {
            console.error("Error adding referral:", e);
            toast({
                title: "❌ Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "error",
            })
        }
    };

    const handleAddReward = async () => {
        if (!rewardAmount || !userId) return;

        try {
            const res = await fetch("/api/admin/referral-rewards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    amount: parseFloat(rewardAmount),
                    referralEmail: rewardReferralEmail.trim() || null,
                }),
            });

            if (res.ok) {
                setRewardAmount("");
                setRewardReferralEmail("");
                setIsAddRewardDialogOpen(false);
                toast({
                    title: "✅ Referral reward added successfully",
                    description: `Reward of $${rewardAmount} has been added.`,
                    variant: "success",
                })
            } else {
                const errorData = await res.json();
                toast({
                    title: "❌ Failed to add reward",
                    description: errorData.error || "An error occurred while adding the reward.",
                    variant: "error",
                })
            }
        } catch (e) {
            console.error("Error adding reward:", e);
            toast({
                title: "❌ Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "error",
            })
        }
    };

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
                {/* Верхушка / хлебные крошки */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/admin")}
                            className="h-8 rounded-full border border-slate-800 bg-slate-900/80 px-3 text-xs text-slate-300 hover:bg-slate-800"
                        >
                            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                            Back to admin
                        </Button>
                        <div>
                            <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-200">
                  <Users className="h-4 w-4" />
                </span>
                                <span>
                  {user.name || "No Name"}{" "}
                                    <span className="ml-1 text-sm text-slate-400">
                    ({user.email})
                  </span>
                </span>
                            </h1>
                            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                                User ID: <span className="font-mono text-slate-300">{user.id}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
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
                        <Badge
                            variant="outline"
                            className="rounded-full border-emerald-500/40 bg-emerald-500/10 px-3 text-[11px] text-emerald-200"
                        >
                            Balance: ${user.TotalBalance?.toFixed(2) ?? "0.00"}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.05fr_1.6fr] lg:gap-6">
                    {/* Левая колонка — профиль и настройки */}
                    <div className="space-y-4 sm:space-y-5">
                        {/* Основная информация */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/20 text-purple-200">
                    <Users className="h-4 w-4" />
                  </span>
                                    Account details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400">Name</label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400">Email</label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300">
                                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400">Role</label>
                                        <Select
                                            value={role}
                                            onValueChange={setRole}
                                            disabled={false /* можно оставить проверку на OWNER */}
                                        >
                                            <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
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

                                    <div className="space-y-1.5">
                                        <label className="text-xs text-slate-400">Status</label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
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

                                <div className="flex flex-wrap gap-3 rounded-2xl bg-slate-900/60 p-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={blocked}
                                            onCheckedChange={(v) => setBlocked(!!v)}
                                            id="blocked"
                                        />
                                        <label
                                            htmlFor="blocked"
                                            className="text-xs font-medium text-slate-200"
                                        >
                                            Block user
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={isVerif}
                                            onCheckedChange={(v) => setIsVerif(!!v)}
                                            id="verified"
                                        />
                                        <label
                                            htmlFor="verified"
                                            className="text-xs font-medium text-slate-200"
                                        >
                                            Verified (KYC)
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={canWithdraw}
                                            onCheckedChange={(v) => setCanWithdraw(!!v)}
                                            id="can_withdraw"
                                        />
                                        <label
                                            htmlFor="can_withdraw"
                                            className="text-xs font-medium text-slate-200"
                                        >
                                            Can withdraw
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-between border-t border-slate-900 pt-3 text-xs text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>
                      Created:{" "}
                                            {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                                    </div>
                                    <div className="hidden items-center gap-1.5 sm:flex">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>
                      Updated:{" "}
                                            {new Date(user.updatedAt).toLocaleDateString()}
                    </span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                                    >
                                        {saving ? "Saving..." : "Save changes"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Баланс */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <DollarSign className="h-4 w-4" />
                  </span>
                                    Balance & Permissions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400">Total Balance</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={balance}
                                            onChange={(e) => setBalance(e.target.value)}
                                            className="h-9 flex-1 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                        />
                                        <span className="rounded-xl bg-slate-900 px-3 py-1 text-xs text-slate-400">
                      USD
                    </span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-400">Bonus Balance</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={bonusBalance}
                                            onChange={(e) => setBonusBalance(e.target.value)}
                                            placeholder="e.g., $100.00"
                                            className="h-9 flex-1 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                        />
                                        <span className="rounded-xl bg-purple-900/30 px-3 py-1 text-xs text-purple-300">
                      USD
                    </span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Все изменения по балансу здесь применяются мгновенно через
                                    <span className="font-mono"> /api/admin/users/[id]</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Правая колонка — Trades / Deposits / Withdrawals */}
                    <div className="space-y-4 sm:space-y-5">
                        {/* Trades */}
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
                                    <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                size="sm" 
                                                className="h-7 rounded-full bg-purple-600 px-2.5 text-xs hover:bg-purple-700"
                                                onClick={() => setIsTradeDialogOpen(true)}
                                            >
                                                New Trade
                                            </Button>
                                        </DialogTrigger>
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
                                                    <Input
                                                        value={newTrade.ticker}
                                                        onChange={(e) => setNewTrade({...newTrade, ticker: e.target.value})}
                                                        className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                                    />
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
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs sm:text-sm max-h-[300px] h-full overflow-y-auto">
                                {loadingRelations && (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        Loading trades...
                                    </div>
                                )}

                                {!loadingRelations && trades.length === 0 && (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        This user has no trades yet.
                                    </div>
                                )}

                                {!loadingRelations &&
                                    trades.map((t) => {
                                        const isProfit = (t.profit ?? 0) >= 0
                                        return (
                                            <div
                                                key={t.id}
                                                className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-semibold text-slate-100 sm:text-sm">
                                                            {t.ticker}
                                                        </span>
                                                        <Badge
                                                            className={`rounded-full px-2 text-[10px] ${
                                                                t.type === "BUY"
                                                                    ? "bg-emerald-500/15 text-emerald-300"
                                                                    : "bg-rose-500/15 text-rose-300"
                                                            }`}
                                                        >
                                                            {t.type}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-full border-slate-700 bg-slate-950/80 px-2 text-[10px] text-slate-300"
                                                        >
                                                            {t.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-0.5 text-[11px] text-slate-400">
                                                        Volume {t.volume}, {t.leverage}x •{" "}
                                                        {new Date(t.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="ml-3 flex items-center gap-2">
                                                    <div className="text-right">
                                                        <div
                                                            className={`text-xs font-semibold ${
                                                                isProfit ? "text-emerald-400" : "text-rose-400"
                                                            }`}
                                                        >
                                                            {(isProfit ? "+" : "")}$
                                                            {(t.profit ?? 0).toFixed(2)}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            Open: {t.openIn.toFixed(5)}
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                                        onClick={() => openEditTradeDialog(t)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                                        </svg>
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}

                            </CardContent>
                        </Card>

                        {/* Edit Trade Dialog */}
                        <Dialog open={isEditTradeDialogOpen} onOpenChange={setIsEditTradeDialogOpen}>
                            <DialogContent className="rounded-2xl border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-semibold">Edit Trade</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-400">Status</Label>
                                            <Select
                                                value={editTrade.status}
                                                onValueChange={(v) => setEditTrade({...editTrade, status: v})}
                                            >
                                                <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                                                    <SelectItem value="OPEN">Open</SelectItem>
                                                    <SelectItem value="CLOSE">Close</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-400">Profit</Label>
                                            <Input
                                                type="number"
                                                value={editTrade.profit || ''}
                                                onChange={(e) => setEditTrade({...editTrade, profit: e.target.value ? parseFloat(e.target.value) : null})}
                                                className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-400">Open Price</Label>
                                            <Input
                                                type="number"
                                                value={editTrade.openIn}
                                                onChange={(e) => setEditTrade({...editTrade, openIn: parseFloat(e.target.value) || 0})}
                                                className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-400">Close Price</Label>
                                            <Input
                                                type="number"
                                                value={editTrade.closeIn || ''}
                                                onChange={(e) => setEditTrade({...editTrade, closeIn: e.target.value ? parseFloat(e.target.value) : null})}
                                                className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        onClick={handleEditTrade}
                                        className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                                    >
                                        Update Trade
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Deposits / Withdrawals */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="flex items-center justify-between pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200">
                                <CreditCard className="h-4 w-4" />
                            </span>
                                    Deposits & Withdrawals
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-slate-800 bg-slate-900/80 px-2.5 text-[11px] text-slate-300"
                                    >
                                        {orders.length} records
                                    </Badge>
                                    <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                size="sm" 
                                                className="h-7 rounded-full bg-amber-600 px-2.5 text-xs hover:bg-amber-700"
                                                onClick={() => setIsOrderDialogOpen(true)}
                                            >
                                                New Order
                                            </Button>
                                        </DialogTrigger>
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
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs sm:text-sm max-h-[300px] h-full overflow-y-auto">
                                {loadingRelations && (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        Loading orders...
                                    </div>
                                )}

                                {!loadingRelations && orders.length === 0 && (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        No deposits or withdrawals yet.
                                    </div>
                                )}

                                {!loadingRelations &&
                                    orders.map((o) => (
                                        <div
                                            key={o.id}
                                            className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={`rounded-full px-2 text-[10px] ${
                                                            o.type === "DEPOSIT"
                                                                ? "bg-emerald-500/15 text-emerald-300"
                                                                : "bg-sky-500/15 text-sky-300"
                                                        }`}
                                                    >
                                                        {o.type}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-full border-slate-700 bg-slate-950/80 px-2 text-[10px] text-slate-300"
                                                    >
                                                        {o.status}
                                                    </Badge>
                                                </div>
                                                <div className="mt-0.5 text-[11px] text-slate-400">
                                                    {new Date(o.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="ml-3 flex items-center gap-2">
                                                <div className="text-right">
                                                    <div className="text-xs font-semibold text-slate-100">
                                                        ${o.amount.toFixed(2)}
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                                    onClick={() => openEditOrderDialog(o)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                                    </svg>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                            </CardContent>
                        </Card>

                        {/* Edit Order Dialog */}
                        <Dialog open={isEditOrderDialogOpen} onOpenChange={setIsEditOrderDialogOpen}>
                            <DialogContent className="rounded-2xl border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-semibold">Edit Order</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-400">Status</Label>
                                        <Select
                                            value={editOrder.status}
                                            onValueChange={(v) => setEditOrder({...editOrder, status: v})}
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
                                    
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-400">Amount (USD)</Label>
                                        <Input
                                            type="number"
                                            value={editOrder.amount}
                                            onChange={(e) => setEditOrder({...editOrder, amount: parseFloat(e.target.value) || 0})}
                                            className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                        />
                                    </div>
                                    
                                    <Button 
                                        onClick={handleEditOrder}
                                        className="w-full rounded-xl bg-amber-600 text-sm font-medium hover:bg-amber-700"
                                    >
                                        Update Order
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* User Referrals Card */}
                    <div className="space-y-4">
                        <Card className="overflow-hidden rounded-2xl border-slate-800 bg-slate-900/80 shadow-lg">
                            <CardHeader className="border-b border-slate-800 pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/20">
                                            <Users className="h-3.5 w-3.5 text-purple-300" />
                                        </span>
                                        User Referrals
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Dialog open={isAddReferralDialogOpen} onOpenChange={setIsAddReferralDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className="h-7 rounded-full bg-purple-600 px-3 text-xs font-medium hover:bg-purple-700"
                                                >
                                                    + Add Referral
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-2xl border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="text-lg font-semibold">Add Referral</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-slate-400">Select User</Label>
                                                        <Select
                                                            value={referralEmail}
                                                            onValueChange={setReferralEmail}
                                                        >
                                                            <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                                                <SelectValue placeholder="Choose a user..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px] border-slate-800 bg-slate-900 text-sm">
                                                                {allUsers.map((u) => (
                                                                    <SelectItem key={u.id} value={u.email}>
                                                                        {u.name || 'No Name'} ({u.email})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        onClick={handleAddReferral}
                                                        disabled={!referralEmail}
                                                        className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                                                    >
                                                        Add Referral
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog open={isAddRewardDialogOpen} onOpenChange={setIsAddRewardDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className="h-7 rounded-full bg-emerald-600 px-3 text-xs font-medium hover:bg-emerald-700"
                                                >
                                                    + Create Reward
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-2xl border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="text-lg font-semibold">Create Referral Reward</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-slate-400">Amount (USD)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="100.00"
                                                            value={rewardAmount}
                                                            onChange={(e) => setRewardAmount(e.target.value)}
                                                            className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-slate-400">Select User (Optional)</Label>
                                                        <Select
                                                            value={rewardReferralEmail || "NONE"}
                                                            onValueChange={(val) => setRewardReferralEmail(val === "NONE" ? "" : val)}
                                                        >
                                                            <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                                                <SelectValue placeholder="None selected" />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px] border-slate-800 bg-slate-900 text-sm">
                                                                <SelectItem value="NONE">
                                                                    None
                                                                </SelectItem>
                                                                {allUsers.map((u) => (
                                                                    <SelectItem key={u.id} value={u.email}>
                                                                        {u.name || 'No Name'} ({u.email})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        onClick={handleAddReward}
                                                        disabled={!rewardAmount}
                                                        className="w-full rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-700"
                                                    >
                                                        Create Reward
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 px-3 py-3 sm:px-4">
                                {loadingReferrals && (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                                    </div>
                                )}

                                {!loadingReferrals && referrals.length === 0 && (
                                    <div className="rounded-xl bg-slate-900/80 px-4 py-6 text-center text-slate-400">
                                        No referrals yet.
                                    </div>
                                )}

                                {!loadingReferrals &&
                                    referrals.map((ref: any) => (
                                        <div
                                            key={ref.id}
                                            className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-medium text-slate-200">
                                                    {ref.name || "Anonymous"}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {ref.email}
                                                </div>
                                                <div className="mt-0.5 text-[10px] text-slate-500">
                                                    Joined: {new Date(ref.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="ml-3 text-right">
                                                <div className="text-xs font-semibold text-emerald-300">
                                                    ${ref.TotalBalance?.toFixed(2) || "0.00"}
                                                </div>
                                                <div className="text-[10px] text-slate-500">Balance</div>
                                            </div>
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
