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
} from "lucide-react"
import { hasAdminAccess } from "@/lib/admin-access"
import { useAuth } from "@/components/auth-provider"

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

const ORDERS_PER_PAGE = 15

export default function OrdersManagement() {
    const { user } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
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
    
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // pagination
    const [currentPage, setCurrentPage] = useState(1)

    // Create Order form state
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [orderType, setOrderType] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT")
    const [orderAmount, setOrderAmount] = useState("")
    const [orderStatus, setOrderStatus] = useState("SUCCESSFUL")
    const [popoverOpen, setPopoverOpen] = useState(false)

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line
    }, [])

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

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            })

            if (response.ok) {
                fetchData()
            }
        } catch (error) {
            console.error("Error updating order:", error)
        }
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

        try {
            const response = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUserId,
                    type: orderType,
                    amount: parseFloat(orderAmount),
                    status: orderStatus,
                }),
            })

            if (response.ok) {
                // @ts-ignore
                toast({ title: "Success", description: "Order created successfully." })
                setCreateDialogOpen(false)
                fetchData()
                setSelectedUserId(null)
                setOrderAmount("")
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
            // @ts-ignore
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            })
        }
    }

    const filteredOrders = orders.filter((order) => {
        const q = searchTerm.toLowerCase()
        const matchesSearch =
            !q ||
            order.User?.email?.toLowerCase().includes(q) ||
            (order.User?.name && order.User.name.toLowerCase().includes(q))
        const matchesStatus = statusFilter === "all" || order.status === statusFilter
        const matchesType = typeFilter === "all" || order.type === typeFilter
        return matchesSearch && matchesStatus && matchesType
    })

    const totalPages =
        filteredOrders.length === 0
            ? 1
            : Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)

    const ordersToShow = filteredOrders.slice(
        (currentPage - 1) * ORDERS_PER_PAGE,
        currentPage * ORDERS_PER_PAGE,
    )

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return
        setCurrentPage(newPage)
    }

    const totalDeposits = orders
        .filter((o) => o.type === "DEPOSIT" && o.status === "SUCCESSFUL")
        .reduce((sum, o) => sum + o.amount, 0)

    const totalWithdraws = orders
        .filter((o) => o.type === "WITHDRAW" && o.status === "SUCCESSFUL")
        .reduce((sum, o) => sum + o.amount, 0)

    const pendingCount = orders.filter((o) => o.status === "PENDING").length

    if (loading && orders.length === 0) {
        return (
            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-0">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 animate-pulse rounded-full bg-slate-800/70" />
                    <div className="h-8 w-32 animate-pulse rounded-full bg-slate-800/70" />
                </div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 animate-pulse rounded-2xl bg-slate-900/80"
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 px-2 sm:space-y-6 sm:px-0">
            {/* Header */}
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold text-slate-50 sm:text-2xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200 sm:h-9 sm:w-9">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
                        Orders Management
                    </h2>
                    <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        Manage deposits and withdrawals
                    </p>
                </div>

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700 sm:w-auto sm:text-base">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Order
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] w-[95vw] max-w-sm overflow-y-auto border-slate-800 bg-slate-950/95">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-slate-50 sm:text-xl">
                                Create Order
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-3 text-sm sm:space-y-4">
                            {/* User select */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">User</Label>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={popoverOpen}
                                            className="h-9 w-full justify-between rounded-xl border-slate-800 bg-slate-900 text-xs text-slate-100 sm:h-10 sm:text-sm"
                                        >
                                            {selectedUserId
                                                ? users.find((u) => u.id === selectedUserId)?.email
                                                : "Select user..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] border-slate-800 bg-slate-950 p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search users..."
                                                className="text-xs"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No user found.</CommandEmpty>
                                                <CommandGroup>
                                                    {users.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            value={user.email}
                                                            onSelect={() => {
                                                                setSelectedUserId(user.id)
                                                                setPopoverOpen(false)
                                                            }}
                                                            className="text-xs sm:text-sm"
                                                        >
                                                            {user.name || user.email} ({user.email})
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
                                <Label className="text-xs text-slate-400">Type</Label>
                                <Select
                                    value={orderType}
                                    onValueChange={(v) => setOrderType(v as "DEPOSIT" | "WITHDRAW")}
                                >
                                    <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs text-slate-100 sm:h-10 sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-950 text-xs sm:text-sm">
                                        <SelectItem value="DEPOSIT">Deposit</SelectItem>
                                        <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">
                                    Amount <span className="text-slate-500">(USD)</span>
                                </Label>
                                <Input
                                    id="order-amount"
                                    type="number"
                                    value={orderAmount}
                                    onChange={(e) => setOrderAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm text-slate-100"
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">Status</Label>
                                <Select value={orderStatus} onValueChange={setOrderStatus}>
                                    <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-xs text-slate-100 sm:h-10 sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-950 text-xs sm:text-sm">
                                        <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="mt-4 flex gap-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 rounded-xl border-slate-700 text-sm"
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

            {/* Summary cards (перенёс НАД списком) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
                <Card className="rounded-2xl border-slate-900/80 bg-slate-950/90">
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 sm:h-10 sm:w-10">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
                        <div className="min-w-0">
                            <div className="text-xs text-slate-400 sm:text-sm">
                                Total Deposits
                            </div>
                            <div className="truncate text-lg font-bold text-emerald-400 sm:text-xl">
                                ${totalDeposits.toLocaleString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-900/80 bg-slate-950/90">
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300 sm:h-10 sm:w-10">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
                        <div className="min-w-0">
                            <div className="text-xs text-slate-400 sm:text-sm">
                                Total Withdrawals
                            </div>
                            <div className="truncate text-lg font-bold text-rose-400 sm:text-xl">
                                ${totalWithdraws.toLocaleString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-900/80 bg-slate-950/90 sm:col-span-2 md:col-span-1">
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 sm:h-10 sm:w-10">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
                        <div>
                            <div className="text-xs text-slate-400 sm:text-sm">
                                Pending Orders
                            </div>
                            <div className="text-lg font-bold text-slate-50 sm:text-xl">
                                {pendingCount}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="rounded-2xl border-slate-900/80 bg-slate-950/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
                <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-5">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                            placeholder="Search orders by email or name..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="h-10 rounded-xl border-slate-800 bg-slate-900 pl-9 text-sm text-slate-100 placeholder:text-slate-500"
                        />
                    </div>

                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v)
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-800 bg-slate-900 text-sm text-slate-100 sm:w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-800 bg-slate-950 text-sm">
                            <SelectItem value="all">All Status</SelectItem>
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
                        <SelectTrigger className="h-10 w-full rounded-xl border-slate-800 bg-slate-900 text-sm text-slate-100 sm:w-40">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-800 bg-slate-950 text-sm">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="DEPOSIT">Deposits</SelectItem>
                            <SelectItem value="WITHDRAW">Withdrawals</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Orders list */}
            <Card className="rounded-2xl border-slate-900/80 bg-slate-950/80 shadow-[0_16px_40px_rgba(15,23,42,0.85)]">
                <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 sm:p-5 sm:pb-3">
                    <CardTitle className="text-base font-semibold text-slate-50 sm:text-lg">
                        Orders ({filteredOrders.length})
                    </CardTitle>
                    <Badge className="rounded-full bg-slate-900/80 text-[11px] text-slate-200">
                        {orders.length} total
                    </Badge>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-5 sm:pt-1">
                    {filteredOrders.length === 0 && !loading && (
                        <div className="rounded-2xl bg-slate-900/80 px-4 py-6 text-center text-sm text-slate-400">
                            No orders match current filters.
                        </div>
                    )}

                    <div className="space-y-2.5 sm:space-y-3">
                        {ordersToShow.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18 }}
                            >
                                <div className="flex flex-col gap-3 rounded-2xl bg-slate-900/80 px-3 py-3 text-xs text-slate-100 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3.5 sm:text-sm">
                                    {/* Left: type + user */}
                                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                                        <div
                                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-10 sm:w-10 sm:text-sm ${
                                                order.type === "DEPOSIT"
                                                    ? "bg-emerald-500/20 text-emerald-200"
                                                    : "bg-rose-500/20 text-rose-200"
                                            }`}
                                        >
                                            {order.type === "DEPOSIT" ? "+" : "-"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-100 sm:text-sm">
                          {order.type}
                        </span>
                                                <Badge
                                                    variant={
                                                        order.status === "SUCCESSFUL"
                                                            ? "default"
                                                            : order.status === "PENDING"
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                    className={`rounded-full border-slate-700 ${order.status === "SUCCESSFUL" ? 'bg-green-700/35' : 'bg-red-700/35'} px-2 text-[10px]`}
                                                >
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-0.5 truncate text-[11px] text-slate-400 sm:text-xs">
                                                {order.User?.name || order.User?.email || "Unknown user"}
                                            </p>
                                            {(order.depositFrom ||
                                                order.withdrawMethod ||
                                                order.bankName) && (
                                                <p className="truncate text-[11px] text-slate-500 sm:text-xs">
                                                    {order.depositFrom ||
                                                        order.withdrawMethod ||
                                                        order.bankName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: amount + date + actions */}
                                    <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
                                        <div className="text-right">
                                            <div className="text-xs font-semibold text-slate-50 sm:text-sm">
                                                ${order.amount.toLocaleString()}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {order.status === "PENDING" && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleUpdateOrderStatus(order.id, "SUCCESSFUL")
                                                    }
                                                    className="h-8 w-8 rounded-xl border-emerald-500/40 bg-emerald-500/10 p-0 text-emerald-200 hover:bg-emerald-500/20"
                                                >
                                                    <CheckCircle className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleUpdateOrderStatus(order.id, "CANCELLED")
                                                    }
                                                    className="h-8 w-8 rounded-xl p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {filteredOrders.length > ORDERS_PER_PAGE && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1 sm:mt-4 sm:gap-2">
                    <Button
                        onClick={() => handlePageChange(currentPage - 1)}
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
                    <span className="px-1 text-xs text-slate-500">...</span>
                )}
                                <Button
                                    variant={p === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(p)}
                                    className="h-8 w-8 rounded-xl text-xs sm:h-9 sm:w-9 sm:text-sm"
                                >
                  {p}
                </Button>
              </span>
                        ))}

                    <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 rounded-xl px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                        variant="outline"
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
