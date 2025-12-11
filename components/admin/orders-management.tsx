"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "react-hot-toast"
import {
    CreditCard,
    Search,
    CheckCircle,
    X,
    DollarSign,
    PlusCircle,
    ChevronsUpDown,
    Edit2,
} from "lucide-react"
import { hasAdminAccess } from "@/lib/admin-access"
import { useAuth } from "@/components/auth-provider"
import { AnimatedNumber } from "@/components/animated-number"

interface Order {
    id: string
    status: string
    type: "DEPOSIT" | "WITHDRAW"
    amount: number
    userId: string
    createdAt: string
    updatedAt: string
    depositFrom?: string
    bankName?: string
    cardNumber?: string
    cryptoAddress?: string
    cryptoNetwork?: string
    withdrawMethod?: string
    User: {
        email: string
        name: string | null
    } | null
}

interface User {
    id: string
    email: string
    name: string | null
}

const ORDERS_PER_PAGE = 10

type PaymentMethod = "CARD" | "BANK" | "CRYPTO" | "OTHER"

// аккуратные статусы — как в трейдах
function statusBadgeClasses(status: string) {
    switch (status) {
        case "SUCCESSFUL":
            return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
        case "PENDING":
            return "border-amber-500/40 bg-amber-500/10 text-amber-200"
        case "CANCELLED":
            return "border-rose-500/40 bg-rose-500/10 text-rose-200"
        default:
            return "border-zinc-600/60 bg-zinc-900/80 text-zinc-200"
    }
}

export default function OrdersManagement() {
    const { user } = useAuth()

    // -------- state --------
    const [orders, setOrders] = useState<Order[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)

    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)

    // create order
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [orderType, setOrderType] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT")
    const [orderAmount, setOrderAmount] = useState("")
    const [orderStatus, setOrderStatus] = useState("SUCCESSFUL")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD")
    const [bankName, setBankName] = useState("")
    const [cardNumber, setCardNumber] = useState("")
    const [cryptoNetwork, setCryptoNetwork] = useState("")
    const [cryptoAddress, setCryptoAddress] = useState("")
    const [popoverOpen, setPopoverOpen] = useState(false)

    // detail dialog
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [detailOrder, setDetailOrder] = useState<Order | null>(null)

    const [detailStatus, setDetailStatus] = useState<string>("")
    const [detailAmount, setDetailAmount] = useState<string>("")
    const [detailPaymentMethod, setDetailPaymentMethod] =
        useState<PaymentMethod>("CARD")
    const [detailBankName, setDetailBankName] = useState("")
    const [detailCardNumber, setDetailCardNumber] = useState("")
    const [detailCryptoNetwork, setDetailCryptoNetwork] = useState("")
    const [detailCryptoAddress, setDetailCryptoAddress] = useState("")
    const [savingDetail, setSavingDetail] = useState(false)

    // inline edit
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
    const [editingAmount, setEditingAmount] = useState<string>("")
    const [editingStatus, setEditingStatus] = useState<string>("PENDING")
    const [savingInline, setSavingInline] = useState(false)

    // -------- access guard --------
    useEffect(() => {
        if (!hasAdminAccess(user)) {
            setAccessDenied(true)
        }
    }, [user])

    useEffect(() => {
        if (accessDenied) return
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessDenied])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [ordersRes, usersRes] = await Promise.all([
                fetch("/api/admin/orders"),
                fetch("/api/admin/users"),
            ])

            if (ordersRes.ok) setOrders(await ordersRes.json())
            if (usersRes.ok) setUsers(await usersRes.json())
        } catch (error) {
            console.error("Error fetching data:", error)
            // @ts-ignore
            toast({
                title: "Error",
                description: "Failed to load orders or users.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const updateOrder = async (orderId: string, updates: Partial<Order>) => {
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error || "Failed to update order")
            }
            await fetchData()
        } catch (e) {
            console.error("Error updating order:", e)
            // @ts-ignore
            toast({
                title: "Error",
                description: "Failed to update order.",
                variant: "destructive",
            })
        }
    }

    const handleUpdateOrderStatus = async (
        orderId: string,
        status: string,
        amount?: number,
    ) => {
        const body: any = { status }
        if (typeof amount === "number") {
            body.amount = amount
        }
        await updateOrder(orderId, body)
    }

    const handleCreateOrder = async () => {
        if (!selectedUserId || !orderAmount) {
            // @ts-ignore
            toast({
                title: "Missing fields",
                description: "Please select a user and enter an amount.",
                variant: "destructive",
            })
            return
        }

        const amount = parseFloat(orderAmount)
        if (isNaN(amount) || amount <= 0) {
            // @ts-ignore
            toast({
                title: "Invalid amount",
                description: "Amount must be positive number.",
                variant: "destructive",
            })
            return
        }

        const payload: any = {
            userId: selectedUserId,
            type: orderType,
            amount,
            status: orderStatus,
        }

        // маппим метод на поля
        if (orderType === "DEPOSIT") {
            payload.depositFrom = paymentMethod
        } else {
            payload.withdrawMethod = paymentMethod
        }

        if (bankName) payload.bankName = bankName
        if (cardNumber) payload.cardNumber = cardNumber
        if (cryptoNetwork) payload.cryptoNetwork = cryptoNetwork
        if (cryptoAddress) payload.cryptoAddress = cryptoAddress

        try {
            const response = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                // @ts-ignore
                toast({ title: "Success", description: "Order created successfully." })
                setCreateDialogOpen(false)
                await fetchData()

                // reset
                setSelectedUserId(null)
                setOrderAmount("")
                setOrderStatus("SUCCESSFUL")
                setOrderType("DEPOSIT")
                setPaymentMethod("CARD")
                setBankName("")
                setCardNumber("")
                setCryptoNetwork("")
                setCryptoAddress("")
            } else {
                const errorData = await response.json()
                // @ts-ignore
                toast({
                    title: "Error",
                    description: errorData.error || "Failed to create order.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error(error)
            // @ts-ignore
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            })
        }
    }

    // -------- filters / derived --------
    const filteredOrders = (() =>
        orders.filter((order) => {
            const q = searchTerm.toLowerCase()
            const matchesSearch =
                !q ||
                order.User?.email?.toLowerCase().includes(q) ||
                (order.User?.name && order.User.name.toLowerCase().includes(q))
            const matchesStatus = statusFilter === "all" || order.status === statusFilter
            const matchesType = typeFilter === "all" || order.type === typeFilter
            return matchesSearch && matchesStatus && matchesType
        }))()

    const totalPages =
        filteredOrders.length === 0 ? 1 : Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)

    const ordersToShow = (() =>
        filteredOrders.slice(
            (currentPage - 1) * ORDERS_PER_PAGE,
            currentPage * ORDERS_PER_PAGE,
        ))()

    const totalDeposits = orders
        .filter((o) => o.type === "DEPOSIT" && o.status === "SUCCESSFUL")
        .reduce((sum, o) => sum + o.amount, 0)

    const totalWithdraws = orders
        .filter((o) => o.type === "WITHDRAW" && o.status === "SUCCESSFUL")
        .reduce((sum, o) => sum + o.amount, 0)

    const pendingCount = orders.filter((o) => o.status === "PENDING").length

    // -------- detail dialog helpers --------
    const openDetailDialog = (order: Order) => {
        setDetailOrder(order)
        setDetailStatus(order.status)
        setDetailAmount(order.amount.toString())
        const pm =
            order.type === "DEPOSIT"
                ? (order.depositFrom as PaymentMethod | undefined)
                : (order.withdrawMethod as PaymentMethod | undefined)

        setDetailPaymentMethod(pm || "CARD")
        setDetailBankName(order.bankName || "")
        setDetailCardNumber(order.cardNumber || "")
        setDetailCryptoNetwork(order.cryptoNetwork || "")
        setDetailCryptoAddress(order.cryptoAddress || "")
        setDetailDialogOpen(true)
    }

    const handleSaveDetail = async () => {
        if (!detailOrder) return
        const amount = parseFloat(detailAmount)
        if (isNaN(amount) || amount <= 0) {
            // @ts-ignore
            toast({
                title: "Invalid amount",
                description: "Amount must be positive number.",
                variant: "destructive",
            })
            return
        }

        const payload: Partial<Order> = {
            status: detailStatus,
            amount,
            bankName: detailBankName || undefined,
            cardNumber: detailCardNumber || undefined,
            cryptoNetwork: detailCryptoNetwork || undefined,
            cryptoAddress: detailCryptoAddress || undefined,
        }

        if (detailOrder.type === "DEPOSIT") {
            payload.depositFrom = detailPaymentMethod
        } else {
            payload.withdrawMethod = detailPaymentMethod
        }

        try {
            setSavingDetail(true)
            await updateOrder(detailOrder.id, payload)
            setDetailDialogOpen(false)
            setDetailOrder(null)
        } finally {
            setSavingDetail(false)
        }
    }

    // -------- inline edit --------
    const startInlineEdit = (order: Order) => {
        setEditingOrderId(order.id)
        setEditingAmount(order.amount.toString())
        setEditingStatus(order.status)
    }

    const cancelInlineEdit = () => {
        setEditingOrderId(null)
        setEditingAmount("")
        setEditingStatus("PENDING")
    }

    const saveInlineEdit = async () => {
        if (!editingOrderId) return
        const amount = parseFloat(editingAmount)
        if (isNaN(amount) || amount <= 0) {
            // @ts-ignore
            toast({
                title: "Invalid amount",
                description: "Amount must be positive number.",
                variant: "destructive",
            })
            return
        }

        try {
            setSavingInline(true)
            await updateOrder(editingOrderId, {
                status: editingStatus,
                amount,
            })
            cancelInlineEdit()
        } finally {
            setSavingInline(false)
        }
    }

    // -------- render --------

    if (accessDenied) {
        return (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100">
                Access denied. You don&apos;t have permission to view this page.
            </div>
        )
    }

    if (loading && orders.length === 0) {
        return (
            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-0">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 animate-pulse rounded-full bg-zinc-800/70" />
                    <div className="h-8 w-32 animate-pulse rounded-full bg-zinc-800/70" />
                </div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 animate-pulse rounded-2xl bg-zinc-900/80"
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 px-2 sm:space-y-6 sm:px-0">
            {/* Header — ближе к Trades, без жёстких цветов */}
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-50 sm:text-2xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-200 sm:h-9 sm:w-9">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
                        Orders Management
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                        Manage deposits and withdrawals in real-time.
                    </p>
                </div>

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700 sm:w-auto sm:text-base">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Order
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] w-[95vw] max-w-md overflow-y-auto border-zinc-800 bg-zinc-950/95">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-zinc-50 sm:text-xl">
                                Create Order
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3 text-sm sm:space-y-4">
                            {/* User select */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">User</Label>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={popoverOpen}
                                            className="h-10 w-full justify-between rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-100 sm:text-sm"
                                        >
                                            {selectedUserId
                                                ? users.find((u) => u.id === selectedUserId)?.email
                                                : "Select user..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] border-zinc-800 bg-zinc-950 p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search users..."
                                                className="text-xs"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No user found.</CommandEmpty>
                                                <CommandGroup>
                                                    {users.map((u) => (
                                                        <CommandItem
                                                            key={u.id}
                                                            value={u.email}
                                                            onSelect={() => {
                                                                setSelectedUserId(u.id)
                                                                setPopoverOpen(false)
                                                            }}
                                                            className="text-xs sm:text-sm"
                                                        >
                                                            {u.name || "Unnamed"} ({u.email})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Type */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">Type</Label>
                                <Select
                                    value={orderType}
                                    onValueChange={(v) => setOrderType(v as "DEPOSIT" | "WITHDRAW")}
                                >
                                    <SelectTrigger className="h-10 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-100 sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-zinc-800 bg-zinc-950 text-xs sm:text-sm">
                                        <SelectItem value="DEPOSIT">Deposit</SelectItem>
                                        <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">
                                    Amount <span className="text-zinc-500">(USD)</span>
                                </Label>
                                <Input
                                    type="number"
                                    value={orderAmount}
                                    onChange={(e) => setOrderAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="h-10 rounded-xl border-zinc-800 bg-zinc-900 text-sm text-zinc-100"
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">Status</Label>
                                <Select value={orderStatus} onValueChange={setOrderStatus}>
                                    <SelectTrigger className="h-10 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-100 sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-zinc-800 bg-zinc-950 text-xs sm:text-sm">
                                        <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Payment method */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">Method</Label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                                >
                                    <SelectTrigger className="h-10 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-100 sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-zinc-800 bg-zinc-950 text-xs sm:text-sm">
                                        <SelectItem value="CARD">Card</SelectItem>
                                        <SelectItem value="BANK">Bank transfer</SelectItem>
                                        <SelectItem value="CRYPTO">Crypto</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Extra fields (card/bank/crypto) */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400">Bank name</Label>
                                    <Input
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="h-9 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-400">Card number</Label>
                                    <Input
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        className="h-9 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
                                        placeholder="**** **** **** 1234"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">Crypto network</Label>
                                <Input
                                    value={cryptoNetwork}
                                    onChange={(e) => setCryptoNetwork(e.target.value)}
                                    className="h-9 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
                                    placeholder="TRC20 / ERC20 / BTC..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-400">Crypto address</Label>
                                <Input
                                    value={cryptoAddress}
                                    onChange={(e) => setCryptoAddress(e.target.value)}
                                    className="h-9 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-100"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-4 flex gap-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 rounded-xl border-zinc-700 text-sm"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleCreateOrder}
                                className="flex-1 rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                            >
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary cards + AnimatedNumber */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
                <Card className="rounded-2xl border-zinc-800/80 bg-zinc-950/90">
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 sm:h-10 sm:w-10">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
                        <div className="min-w-0">
                            <div className="text-xs text-zinc-400 sm:text-sm">Total deposits</div>
                            <div className="truncate text-lg font-bold text-emerald-400 sm:text-xl">
                                <AnimatedNumber
                                    value={totalDeposits}
                                    format={(v) => `$${v.toLocaleString()}`}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-zinc-800/80 bg-zinc-950/90">
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300 sm:h-10 sm:w-10">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
                        <div className="min-w-0">
                            <div className="text-xs text-zinc-400 sm:text-sm">
                                Total withdrawals
                            </div>
                            <div className="truncate text-lg font-bold text-rose-400 sm:text-xl">
                                <AnimatedNumber
                                    value={totalWithdraws}
                                    format={(v) => `$${v.toLocaleString()}`}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-zinc-800/80 bg-zinc-950/90 sm:col-span-2 md:col-span-1">
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 sm:h-10 sm:w-10">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
                        <div>
                            <div className="text-xs text-zinc-400 sm:text-sm">Pending orders</div>
                            <div className="text-lg font-bold text-zinc-50 sm:text-xl">
                                <AnimatedNumber value={pendingCount} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="rounded-2xl border-zinc-800/80 bg-zinc-950/80 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
                <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-5">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                            placeholder="Search orders by email or name..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="h-10 rounded-xl border-zinc-800 bg-zinc-900 pl-9 text-sm text-zinc-100 placeholder:text-zinc-500"
                        />
                    </div>

                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v)
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-zinc-800 bg-zinc-900 text-sm text-zinc-100 sm:w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-800 bg-zinc-950 text-sm">
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={typeFilter}
                        onValueChange={(v) => {
                            setTypeFilter(v)
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-zinc-800 bg-zinc-900 text-sm text-zinc-100 sm:w-40">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-800 bg-zinc-950 text-sm">
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="DEPOSIT">Deposits</SelectItem>
                            <SelectItem value="WITHDRAW">Withdrawals</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Orders list — визуально ближе к трейдам */}
            <Card className="rounded-2xl border-zinc-800/80 bg-zinc-950/80 shadow-[0_16px_40px_rgba(0,0,0,0.75)]">
                <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 sm:p-5 sm:pb-3">
                    <CardTitle className="text-base font-semibold text-zinc-50 sm:text-lg">
                        Orders ({filteredOrders.length})
                    </CardTitle>
                    <Badge className="rounded-full bg-zinc-900/90 text-[11px] text-zinc-200">
                        {orders.length} total
                    </Badge>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-5 sm:pt-1">
                    {filteredOrders.length === 0 && !loading && (
                        <div className="rounded-2xl bg-zinc-900/80 px-4 py-6 text-center text-sm text-zinc-400">
                            No orders match current filters.
                        </div>
                    )}

                    <div className="space-y-2.5 sm:space-y-3">
                        {ordersToShow.map((order) => {
                            const isEditing = editingOrderId === order.id

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.16 }}
                                >
                                    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-zinc-100 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5 sm:text-sm">
                                        {/* left: type + user */}
                                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                                            <div
                                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-xs font-semibold sm:h-11 sm:w-11 sm:text-sm ${
                                                    order.type === "DEPOSIT"
                                                        ? "bg-emerald-500/20 text-emerald-200"
                                                        : "bg-rose-500/20 text-rose-200"
                                                }`}
                                            >
                                                {order.type === "DEPOSIT" ? "+" : "-"}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-100 sm:text-sm">
                            {order.type}
                          </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`rounded-full border px-2 text-[10px] ${statusBadgeClasses(
                                                            order.status,
                                                        )}`}
                                                    >
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                                <p className="mt-0.5 truncate text-[11px] text-zinc-400 sm:text-xs">
                                                    {order.User?.name || order.User?.email || "Unknown user"}
                                                </p>
                                                {(order.depositFrom ||
                                                    order.withdrawMethod ||
                                                    order.bankName) && (
                                                    <p className="truncate text-[11px] text-zinc-500 sm:text-xs">
                                                        {order.depositFrom ||
                                                            order.withdrawMethod ||
                                                            order.bankName}
                                                    </p>
                                                )}
                                                {order.cryptoAddress && (
                                                    <p className="truncate text-[11px] text-zinc-500 sm:text-xs">
                                                        {order.cryptoNetwork
                                                            ? `${order.cryptoNetwork}: `
                                                            : ""}
                                                        {order.cryptoAddress}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* right: amount + date + actions / inline edit */}
                                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                                            <div className="text-right">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Input
                                                            type="number"
                                                            value={editingAmount}
                                                            onChange={(e) => setEditingAmount(e.target.value)}
                                                            className="h-8 w-28 rounded-lg border-zinc-700 bg-zinc-950 text-right text-[11px]"
                                                        />
                                                        <Select
                                                            value={editingStatus}
                                                            onValueChange={setEditingStatus}
                                                        >
                                                            <SelectTrigger className="h-8 w-32 rounded-lg border-zinc-700 bg-zinc-950 text-[11px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="border-zinc-700 bg-zinc-950 text-[11px]">
                                                                <SelectItem value="SUCCESSFUL">
                                                                    Successful
                                                                </SelectItem>
                                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-semibold text-zinc-50 sm:text-sm">
                                                        <AnimatedNumber
                                                            value={order.amount}
                                                            format={(v) => `$${v.toLocaleString()}`}
                                                        />
                                                    </div>
                                                )}

                                                <div className="mt-0.5 text-[11px] text-zinc-400">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={savingInline}
                                                            onClick={saveInlineEdit}
                                                            className="h-8 rounded-xl border-emerald-500/50 bg-emerald-500/10 px-3 text-[11px] text-emerald-100 hover:bg-emerald-500/20"
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={cancelInlineEdit}
                                                            className="h-8 rounded-xl border-zinc-700 bg-zinc-900 px-3 text-[11px]"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => startInlineEdit(order)}
                                                        className="h-8 w-8 rounded-xl border-zinc-700 bg-zinc-900 p-0 text-zinc-200 hover:bg-zinc-800"
                                                        title="Quick edit"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openDetailDialog(order)}
                                                    className="h-8 rounded-xl border-zinc-700 bg-zinc-900 px-3 text-[11px] hover:bg-zinc-800"
                                                >
                                                    Details
                                                </Button>

                                                {order.status === "PENDING" && !isEditing && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleUpdateOrderStatus(
                                                                    order.id,
                                                                    "SUCCESSFUL",
                                                                    order.amount,
                                                                )
                                                            }
                                                            className="h-8 w-8 rounded-xl border-emerald-500/40 bg-emerald-500/10 p-0 text-emerald-200 hover:bg-emerald-500/20"
                                                            title="Mark successful"
                                                        >
                                                            <CheckCircle className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                handleUpdateOrderStatus(order.id, "CANCELLED")
                                                            }
                                                            className="h-8 w-8 rounded-xl p-0"
                                                            title="Cancel order"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {filteredOrders.length > ORDERS_PER_PAGE && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1 sm:mt-4 sm:gap-2">
                    <Button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 rounded-xl px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                        variant="outline"
                    >
                        Prev
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                            (p) =>
                                p === 1 ||
                                p === totalPages ||
                                (p >= currentPage - 2 && p <= currentPage + 2),
                        )
                        .map((p, idx, arr) => (
                            <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-xs text-zinc-500">…</span>
                )}
                                <Button
                                    variant={p === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(p)}
                                    className="h-8 w-8 rounded-xl text-xs sm:h-9 sm:w-9 sm:text-sm"
                                >
                  {p}
                </Button>
              </span>
                        ))}

                    <Button
                        onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="h-8 rounded-xl px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                        variant="outline"
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Detail dialog с редактированием метода / реквизитов */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-h-[90vh] w-[95vw] max-w-md overflow-y-auto border-zinc-800 bg-zinc-950/95">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-50 sm:text-xl">
                            Order details
                        </DialogTitle>
                    </DialogHeader>

                    {detailOrder && (
                        <div className="space-y-3 text-xs text-zinc-200 sm:text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[11px] text-zinc-400">Type</p>
                                    <p className="font-medium">{detailOrder.type}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-zinc-400">Status</p>
                                    <Select
                                        value={detailStatus}
                                        onValueChange={setDetailStatus}
                                    >
                                        <SelectTrigger className="mt-0.5 h-9 w-full rounded-lg border-zinc-700 bg-zinc-900 text-[11px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-zinc-700 bg-zinc-950 text-[11px]">
                                            <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <p className="text-[11px] text-zinc-400">Amount</p>
                                    <Input
                                        type="number"
                                        value={detailAmount}
                                        onChange={(e) => setDetailAmount(e.target.value)}
                                        className="mt-0.5 h-9 rounded-lg border-zinc-700 bg-zinc-900 text-[11px]"
                                    />
                                </div>

                                <div>
                                    <p className="text-[11px] text-zinc-400">User</p>
                                    <p className="truncate">
                                        {detailOrder.User?.name ||
                                            detailOrder.User?.email ||
                                            "Unknown"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-zinc-400">Created</p>
                                    <p>{new Date(detailOrder.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-zinc-400">Updated</p>
                                    <p>{new Date(detailOrder.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="mb-2 text-[11px] font-semibold text-zinc-300">
                                    Payment / withdrawal method
                                </p>

                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-zinc-400">
                                            Method
                                        </Label>
                                        <Select
                                            value={detailPaymentMethod}
                                            onValueChange={(v) =>
                                                setDetailPaymentMethod(v as PaymentMethod)
                                            }
                                        >
                                            <SelectTrigger className="h-9 rounded-lg border-zinc-700 bg-zinc-900 text-[11px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-zinc-700 bg-zinc-950 text-[11px]">
                                                <SelectItem value="CARD">Card</SelectItem>
                                                <SelectItem value="BANK">Bank transfer</SelectItem>
                                                <SelectItem value="CRYPTO">Crypto</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] text-zinc-400">
                                                Bank name
                                            </Label>
                                            <Input
                                                value={detailBankName}
                                                onChange={(e) => setDetailBankName(e.target.value)}
                                                className="h-8 rounded-lg border-zinc-700 bg-zinc-900 text-[11px]"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px] text-zinc-400">
                                                Card number
                                            </Label>
                                            <Input
                                                value={detailCardNumber}
                                                onChange={(e) => setDetailCardNumber(e.target.value)}
                                                className="h-8 rounded-lg border-zinc-700 bg-zinc-900 text-[11px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-zinc-400">
                                            Crypto network
                                        </Label>
                                        <Input
                                            value={detailCryptoNetwork}
                                            onChange={(e) =>
                                                setDetailCryptoNetwork(e.target.value)
                                            }
                                            className="h-8 rounded-lg border-zinc-700 bg-zinc-900 text-[11px]"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-zinc-400">
                                            Crypto address
                                        </Label>
                                        <Input
                                            value={detailCryptoAddress}
                                            onChange={(e) =>
                                                setDetailCryptoAddress(e.target.value)
                                            }
                                            className="h-8 rounded-lg border-zinc-700 bg-zinc-900 text-[11px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl border-zinc-700 text-xs sm:text-sm"
                                    onClick={() => setDetailDialogOpen(false)}
                                    disabled={savingDetail}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 rounded-xl bg-purple-600 text-xs font-semibold hover:bg-purple-700 sm:text-sm"
                                    onClick={handleSaveDetail}
                                    disabled={savingDetail}
                                >
                                    {savingDetail ? "Saving..." : "Save changes"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
