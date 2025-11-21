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

    // локальные стейты для редактирования
    const [name, setName] = useState("")
    const [role, setRole] = useState("USER")
    const [status, setStatus] = useState("NEW")
    const [blocked, setBlocked] = useState(false)
    const [isVerif, setIsVerif] = useState(false)
    const [canWithdraw, setCanWithdraw] = useState(false)
    const [balance, setBalance] = useState("0")

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
                }),
            })

            if (res.ok) {
                const updated = await res.json()
                setUser(updated)
            }
        } catch (e) {
            console.error("Error updating user:", e)
        } finally {
            setSaving(false)
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
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-slate-800 bg-slate-900/80 px-2.5 text-[11px] text-slate-300"
                                >
                                    {trades.length} total
                                </Badge>
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
                                                <div className="ml-3 text-right">
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
                                            </div>
                                        )
                                    })}
                            </CardContent>
                        </Card>

                        {/* Deposits / Withdrawals */}
                        <Card className="rounded-2xl border-slate-900 bg-slate-950/80">
                            <CardHeader className="flex items-center justify-between pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200">
                    <CreditCard className="h-4 w-4" />
                  </span>
                                    Deposits & Withdrawals
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-slate-800 bg-slate-900/80 px-2.5 text-[11px] text-slate-300"
                                >
                                    {orders.length} records
                                </Badge>
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
                                            <div className="ml-3 text-right">
                                                <div className="text-xs font-semibold text-slate-100">
                                                    ${o.amount.toFixed(2)}
                                                </div>
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
