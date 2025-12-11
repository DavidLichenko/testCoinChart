"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { hasAdminAccess } from "@/lib/admin-access"
import { motion, AnimatePresence } from "framer-motion"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

import {
  Users as UsersIcon,
  Search,
  Edit2,
  Shield,
  DollarSign,
  Ban,
  CheckCircle2,
  X,
  Save,
  ArrowRight,
  Loader2,
  Star,
} from "lucide-react"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  TotalBalance: number
  totalBalance?: number
  baseCurrency?: string
  can_withdraw: boolean
  isVerif: boolean
  blocked: boolean
  createdAt: string
  updatedAt: string
}

const USERS_PER_PAGE = 10

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  WRONGNUMBER: "Wrong number",
  WRONGINFO: "Wrong info",
  CALLBACK: "Call back",
  LOWPOTENTIONAL: "Low potential",
  HIGHPOTENTIONAL: "High potential",
  NOTINTERESTED: "Not interested",
  DEPOSIT: "Deposit",
  TRASH: "Trash",
  DROP: "Drop",
  RESIGN: "Resign",
  COMPLETED: "Completed",
}

const statusColor = (status: string) => {
  switch (status) {
    case "DEPOSIT":
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/40"
    case "HIGHPOTENTIONAL":
      return "bg-sky-500/10 text-sky-500 border-sky-500/40"
    case "LOWPOTENTIONAL":
      return "bg-amber-500/10 text-amber-500 border-amber-500/40"
    case "TRASH":
    case "DROP":
    case "RESIGN":
      return "bg-rose-500/10 text-rose-500 border-rose-500/40"
    default:
      return "bg-muted text-muted-foreground border-border/60"
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

export default function UsersManagement() {
  const { user: currentUser } = useAuth()
  const router = useRouter()

  const [accessDenied, setAccessDenied] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [currentPage, setCurrentPage] = useState(1)

  const [editingBalanceUserId, setEditingBalanceUserId] = useState<string | null>(null)
  const [balanceEditValue, setBalanceEditValue] = useState("")

  const [editDialogUser, setEditDialogUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkAmount, setBulkAmount] = useState("")
  const [bulkOperation, setBulkOperation] = useState<"add" | "subtract" | "set">("add")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAllFiltered, setSelectAllFiltered] = useState(false)

  const [savingInlineBalance, setSavingInlineBalance] = useState(false)
  const [savingBulk, setSavingBulk] = useState(false)
  const [savingDialogUser, setSavingDialogUser] = useState(false)
  const [favoriteUsers, setFavoriteUsers] = useState<Set<string>>(new Set())

  // --- access guard ---
  useEffect(() => {
    if (!currentUser) return
    if (!hasAdminAccess(currentUser)) {
      setAccessDenied(true)
    }
  }, [currentUser])

  useEffect(() => {
    if (accessDenied) return
    fetchUsers()
    fetchFavorites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessDenied, currentUser])

  const fetchFavorites = async () => {
    if (!currentUser) return
    try {
      const res = await fetch("/api/admin/favorite-clients")
      if (res.ok) {
        const data = await res.json()
        setFavoriteUsers(new Set(data.map((f: any) => f.clientId)))
      }
    } catch (e) {
      console.error("Error fetching favorites:", e)
    }
  }

  const handleToggleFavorite = async (userId: string) => {
    const isFavorite = favoriteUsers.has(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !isFavorite }),
      })
      if (res.ok) {
        setFavoriteUsers((prev) => {
          const newSet = new Set(prev)
          if (isFavorite) {
            newSet.delete(userId)
          } else {
            newSet.add(userId)
          }
          return newSet
        })
      }
    } catch (e) {
      console.error("Error toggling favorite:", e)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/admin/users", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Failed to load users")
      }
      const data: User[] = await res.json()
      setUsers(data)
    } catch (e: any) {
      console.error("Error fetching users:", e)
      setError(e?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to update user")

      const updated = await res.json()
      setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, ...updated } : u)),
      )
    } catch (e) {
      console.error("Error updating user:", e)
      await fetchUsers()
    }
  }

  const handleInlineBalanceSave = async (userId: string) => {
    const val = parseFloat(balanceEditValue)
    if (isNaN(val) || val < 0) {
      setEditingBalanceUserId(null)
      setBalanceEditValue("")
      return
    }
    try {
      setSavingInlineBalance(true)
      await handleUpdateUser(userId, { TotalBalance: val })
    } finally {
      setSavingInlineBalance(false)
      setEditingBalanceUserId(null)
      setBalanceEditValue("")
    }
  }

  const handleBulkBalanceUpdate = async () => {
    const amount = parseFloat(bulkAmount)
    if (isNaN(amount) || selectedUsers.length === 0) return

    const updates = selectedUsers
        .map(id => {
          const u = users.find(x => x.id === id)
          if (!u) return null

          let newBalance = u.TotalBalance || 0
          switch (bulkOperation) {
            case "add":
              newBalance += amount
              break
            case "subtract":
              newBalance = Math.max(0, newBalance - amount)
              break
            case "set":
              newBalance = amount
              break
          }
          return { userId: id, newBalance }
        })
        .filter(Boolean)

    try {
      setSavingBulk(true)
      const res = await fetch("/api/admin/balance/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error("Bulk update failed")
      await fetchUsers()
      setBulkDialogOpen(false)
      setBulkAmount("")
      setSelectedUsers([])
      setSelectAllFiltered(false)
    } catch (e) {
      console.error("Error in bulk balance:", e)
    } finally {
      setSavingBulk(false)
    }
  }

  const handleEditDialogSave = async () => {
    if (!editDialogUser) return
    try {
      setSavingDialogUser(true)
      await handleUpdateUser(editDialogUser.id, {
        name: editDialogUser.name,
        role: editDialogUser.role,
        status: editDialogUser.status,
        blocked: editDialogUser.blocked,
        can_withdraw: editDialogUser.can_withdraw,
        isVerif: editDialogUser.isVerif,
      })
      setEditDialogOpen(false)
      setEditDialogUser(null)
    } finally {
      setSavingDialogUser(false)
    }
  }

  const handleSelectAllFiltered = (checked: boolean) => {
    setSelectAllFiltered(checked)
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev =>
        checked ? [...prev, userId] : prev.filter(id => id !== userId),
    )
  }

  const onSearchChange = (val: string) => {
    setSearchTerm(val)
    setCurrentPage(1)
  }

  const onRoleFilterChange = (val: string) => {
    setRoleFilter(val)
    setCurrentPage(1)
  }

  const onStatusFilterChange = (val: string) => {
    setStatusFilter(val)
    setCurrentPage(1)
  }

  // ---------- DERIVED DATA ----------

  const filteredUsers = (() => {
    const q = searchTerm.trim().toLowerCase()
    return users.filter(u => {
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
      const matchesRole = roleFilter === "all" || u.role === roleFilter
      const matchesStatus = statusFilter === "all" || u.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  })()

  const isSearching = searchTerm.trim().length > 0
  const totalPages = Math.max(
      1,
      Math.ceil(filteredUsers.length / USERS_PER_PAGE),
  )

  const visibleUsers = (() => {
    if (isSearching) return filteredUsers
    const start = (currentPage - 1) * USERS_PER_PAGE
    return filteredUsers.slice(start, start + USERS_PER_PAGE)
  })()

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // ---------- RENDER ----------

  if (accessDenied) {
    return (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive-foreground">
          Access denied. You don&apos;t have permission to view this page.
        </div>
    )
  }

  if (loading) {
    return (
        <div className="space-y-4 px-1 sm:px-0">
          <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UsersIcon className="h-4 w-4" />
          </span>
            <span className="font-semibold">Users Management</span>
          </div>
          <Card className="rounded-2xl border border-border bg-card shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-foreground">
                  Loading users…
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Lightweight list view for quick scanning and actions.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {[...Array(8)].map((_, i) => (
                  <div
                      key={i}
                      className="h-9 animate-pulse rounded-lg bg-muted"
                  />
              ))}
            </CardContent>
          </Card>
        </div>
    )
  }

  return (
      <div className="space-y-4 px-1 sm:px-0">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="h-4 w-4" />
            </span>
              <h2 className="text-lg font-semibold sm:text-xl text-foreground">
                Users Management
              </h2>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Lightweight list for quick scanning and admin actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* BULK BALANCE DIALOG */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-8 rounded-lg border border-primary/40 bg-background px-3 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground">
                  <DollarSign className="mr-1.5 h-3.5 w-3.5" />
                  Bulk balance
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[92vw] max-w-2xl border border-border bg-card">
                <DialogHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <DialogTitle className="text-sm font-semibold text-foreground">
                      Bulk balance update
                    </DialogTitle>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Apply the same balance operation to a group of users at once.
                    </p>
                  </div>
                  <DialogClose asChild>
                    <button className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </DialogClose>
                </DialogHeader>

                <div className="space-y-5 text-xs text-foreground">
                  {/* Operation & amount */}
                  <div className="rounded-xl border border-border bg-background/60 p-3 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex-1 sm:flex-none sm:w-44">
                        <label className="mb-1 block text-[11px] font-medium text-foreground">
                          Operation
                        </label>
                        <Select
                            value={bulkOperation}
                            onValueChange={(v: "add" | "subtract" | "set") =>
                                setBulkOperation(v)
                            }
                        >
                          <SelectTrigger className="h-8 w-full rounded-lg border border-input bg-background text-xs">
                            <SelectValue placeholder="Operation" />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-card text-xs">
                            <SelectItem value="add">Add amount</SelectItem>
                            <SelectItem value="subtract">Subtract amount</SelectItem>
                            <SelectItem value="set">Set exact amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <label className="mb-1 block text-[11px] font-medium text-foreground">
                          Amount (USD)
                        </label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={bulkAmount}
                            onChange={e => setBulkAmount(e.target.value)}
                            className="h-8 w-full rounded-lg border border-input bg-background text-xs"
                        />
                      </div>

                      <div className="hidden sm:flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
                      <span>
                        Selected users:{" "}
                        <span className="font-semibold text-foreground">
                          {selectedUsers.length}
                        </span>
                      </span>
                        <span>
                        Filtered total:{" "}
                          <span className="font-semibold text-foreground">
                          {filteredUsers.length}
                        </span>
                      </span>
                      </div>
                    </div>
                  </div>

                  {/* Users list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-foreground">
                      Affected users
                    </span>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Checkbox
                            checked={selectAllFiltered}
                            onCheckedChange={v =>
                                handleSelectAllFiltered(!!v)
                            }
                        />
                        <span>Select all filtered</span>
                      </div>
                    </div>

                    <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-background/60 p-2">
                      {filteredUsers.map(u => (
                          <div
                              key={u.id}
                              className="flex items-center gap-3 rounded-md bg-card px-2.5 py-1.5"
                          >
                            <Checkbox
                                checked={selectedUsers.includes(u.id)}
                                onCheckedChange={v =>
                                    handleSelectUser(u.id, !!v)
                                }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-xs font-medium text-foreground">
                                {u.name || "No name"}
                              </div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                {u.email}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-foreground">
                              ${u.TotalBalance?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                      ))}
                      {filteredUsers.length === 0 && (
                          <div className="py-4 text-center text-[11px] text-muted-foreground">
                            No users with current filters.
                          </div>
                      )}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] text-muted-foreground">
                      Operation:{" "}
                      <span className="font-medium text-foreground">
                      {bulkOperation.toUpperCase()}
                    </span>{" "}
                      · Selected:{" "}
                      <span className="font-medium text-foreground">
                      {selectedUsers.length}
                    </span>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="h-8 rounded-lg border border-border bg-background px-3 text-[11px]"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                          onClick={handleBulkBalanceUpdate}
                          disabled={
                              savingBulk ||
                              !bulkAmount ||
                              selectedUsers.length === 0
                          }
                          className="h-8 rounded-lg bg-primary px-4 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingBulk && (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        )}
                        Apply to {selectedUsers.length} user
                        {selectedUsers.length !== 1 ? "s" : ""}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Badge className="h-8 rounded-full border border-border bg-background px-3 text-[11px] font-normal text-muted-foreground">
              {filteredUsers.length} shown · {users.length} total
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                  placeholder="Search users (name / email / id)…"
                  value={searchTerm}
                  onChange={e => onSearchChange(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-background pl-9 text-xs sm:text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                <SelectTrigger className="h-9 w-[120px] rounded-xl border border-input bg-background text-xs sm:w-36 sm:text-sm">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card text-xs sm:text-sm">
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="CR_MANAGMENT">CR management</SelectItem>
                  <SelectItem value="TEAMLEAD">Team lead</SelectItem>
                  <SelectItem value="WORKER">Worker</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="h-9 w-[120px] rounded-xl border border-input bg-background text-xs sm:w-40 sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="max-h-72 border-border bg-card text-xs sm:text-sm">
                  <SelectItem value="all">All status</SelectItem>
                  {Object.keys(STATUS_LABELS).map(s => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl border border-border bg-card shadow-md">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-3">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-[11px] text-foreground">
                <thead>
                <tr className="border-y border-border bg-muted/20 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="w-8 px-4 py-2 text-left">
                    <Checkbox
                        checked={
                            filteredUsers.length > 0 &&
                            selectedUsers.length === filteredUsers.length
                        }
                        onCheckedChange={v =>
                            handleSelectAllFiltered(!!v)
                        }
                    />
                  </th>
                  <th className="px-2 py-2 text-left">User</th>
                  <th className="px-2 py-2 text-left">Role</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-right">Balance</th>
                  <th className="px-2 py-2 text-center">Flags</th>
                  <th className="px-2 py-2 text-right">Last activity</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
                </thead>
                <tbody>
                {visibleUsers.length === 0 && (
                    <tr>
                      <td
                          colSpan={8}
                          className="px-4 py-6 text-center text-xs text-muted-foreground"
                      >
                        No users with current filters.
                      </td>
                    </tr>
                )}

                {visibleUsers.map((u, index) => {
                  const isSelected = selectedUsers.includes(u.id)
                  return (
                      <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          className={`border-b border-border/40 bg-background  hover:bg-muted/70 transition-colors ${
                              isSelected ? "ring-1 ring-primary/40" : ""
                          }`}
                      >
                        {/* checkbox */}
                        <td className="px-4 py-2 align-middle">
                          <Checkbox
                              checked={isSelected}
                              onCheckedChange={v =>
                                  handleSelectUser(u.id, !!v)
                              }
                          />
                        </td>

                        {/* user info */}
                        <td className="px-2 py-5 align-middle">
                          <div className="max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="truncate text-xs font-semibold text-foreground">
                                {u.name || "No name"}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleFavorite(u.id)
                                }}
                                className="h-5 w-5 p-0 hover:bg-transparent"
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    favoriteUsers.has(u.id)
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-slate-500"
                                  }`}
                                />
                              </Button>
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {u.email}
                            </div>
                            <div className="mt-0.5 text-[10px] text-muted-foreground/80">
                              ID: {u.id}
                            </div>
                          </div>
                        </td>

                        {/* role */}
                        <td className="px-2 py-2 align-middle">
                          <Badge className="rounded-full border border-border bg-background px-2 text-[10px] uppercase tracking-wide text-foreground">
                            {u.role}
                          </Badge>
                        </td>

                        {/* status */}
                        <td className="px-2 py-2 align-middle">
                          <Badge
                              className={`rounded-full border px-2 text-[10px] ${statusColor(
                                  u.status,
                              )}`}
                          >
                            {STATUS_LABELS[u.status] || u.status}
                          </Badge>
                        </td>

                        {/* balance (inline edit) */}
                        <td className="px-2 py-2 text-right align-middle">
                          {editingBalanceUserId === u.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                    type="number"
                                    value={balanceEditValue}
                                    onChange={e =>
                                        setBalanceEditValue(e.target.value)
                                    }
                                    className="h-7 w-24 rounded-md border border-input bg-background text-right text-[11px]"
                                />
                                <Button
                                    size="icon"
                                    className="h-7 w-7 rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
                                    onClick={() =>
                                        handleInlineBalanceSave(u.id)
                                    }
                                    disabled={savingInlineBalance}
                                >
                                  {savingInlineBalance ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                      <Save className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 rounded-md border-border bg-background"
                                    onClick={() => {
                                      setEditingBalanceUserId(null)
                                      setBalanceEditValue("")
                                    }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                          ) : (
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-xs font-semibold text-foreground">
                                    {(u.totalBalance ?? u.TotalBalance ?? 0).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {u.baseCurrency || "USD"}
                                  </span>
                                  <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                      onClick={() => {
                                        setEditingBalanceUserId(u.id)
                                        setBalanceEditValue(
                                            ((u.totalBalance ?? u.TotalBalance) || 0).toString(),
                                        )
                                      }}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                          )}
                        </td>

                        {/* flags */}
                        <td className="px-2 py-2 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                          <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                                  u.isVerif
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : "bg-muted text-muted-foreground"
                              }`}
                          >
                            <Shield className="h-3 w-3" />
                            {u.isVerif ? "KYC" : "No KYC"}
                          </span>
                            {u.blocked && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-500">
                              <Ban className="h-3 w-3" />
                              Blocked
                            </span>
                            )}
                          </div>
                        </td>

                        {/* last activity */}
                        <td className="px-2 py-2 text-right align-middle text-[10px] text-muted-foreground">
                          {u.updatedAt
                              ? dateFormatter.format(new Date(u.updatedAt))
                              : "—"}
                        </td>

                        {/* actions + EDIT USER DIALOG */}
                        <td className="px-3 py-2 text-right align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                title="Open user page"
                                onClick={() =>
                                    router.push(`/admin/users/${u.id}`)
                                }
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>

                            <Button
                                size="icon"
                                variant={u.blocked ? "default" : "outline"}
                                className={`h-7 w-7 rounded-md ${
                                    u.blocked
                                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                        : "border-border bg-background text-foreground hover:bg-muted"
                                }`}
                                title={u.blocked ? "Unblock" : "Block"}
                                onClick={() =>
                                    handleUpdateUser(u.id, { blocked: !u.blocked })
                                }
                            >
                              {u.blocked ? (
                                  <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                  <Ban className="h-3 w-3" />
                              )}
                            </Button>

                            <Button
                                size="icon"
                                variant={u.isVerif ? "default" : "outline"}
                                className={`h-7 w-7 rounded-md ${
                                    u.isVerif
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "border-border bg-background text-foreground hover:bg-muted"
                                }`}
                                title={u.isVerif ? "Unverify" : "Mark verified"}
                                onClick={() =>
                                    handleUpdateUser(u.id, {
                                      isVerif: !u.isVerif,
                                    })
                                }
                            >
                              <Shield className="h-3 w-3" />
                            </Button>

                            {/* EDIT USER DIALOG */}
                            <Dialog
                                open={editDialogOpen && editDialogUser?.id === u.id}
                                onOpenChange={open => {
                                  setEditDialogOpen(open)
                                  if (!open) setEditDialogUser(null)
                                }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 rounded-md border-border bg-background text-foreground hover:bg-muted"
                                    onClick={() => setEditDialogUser(u)}
                                    title="Edit details"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[92vw] max-w-md border border-border bg-card">
                                <DialogHeader className="flex flex-row items-start justify-between gap-2">
                                  <div>
                                    <DialogTitle className="text-sm font-semibold text-foreground">
                                      Edit user
                                    </DialogTitle>
                                    {editDialogUser && (
                                        <p className="mt-1 text-[11px] text-muted-foreground truncate">
                                          {editDialogUser.email}
                                        </p>
                                    )}
                                  </div>
                                  <DialogClose asChild>
                                    <button className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </DialogClose>
                                </DialogHeader>

                                {editDialogUser && (
                                    <div className="space-y-4 text-xs text-foreground">
                                      {/* Basic info */}
                                      <div className="space-y-2 rounded-xl border border-border bg-background/60 p-3">
                                        <p className="text-[11px] font-semibold text-foreground">
                                          Basic info
                                        </p>
                                        <div className="space-y-2">
                                          <div>
                                            <label className="text-[11px] font-medium text-foreground">
                                              Name
                                            </label>
                                            <Input
                                                value={editDialogUser.name || ""}
                                                onChange={e =>
                                                    setEditDialogUser({
                                                      ...editDialogUser,
                                                      name: e.target.value,
                                                    })
                                                }
                                                className="mt-1 h-8 rounded-lg border border-input bg-background text-xs"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[11px] font-medium text-foreground">
                                              Email
                                            </label>
                                            <Input
                                                value={editDialogUser.email}
                                                disabled
                                                className="mt-1 h-8 rounded-lg border border-input bg-muted text-xs text-muted-foreground"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Access & status */}
                                      <div className="space-y-2 rounded-xl border border-border bg-background/60 p-3">
                                        <p className="text-[11px] font-semibold text-foreground">
                                          Access & status
                                        </p>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                          <div className="flex-1">
                                            <label className="text-[11px] font-medium text-foreground">
                                              Role
                                            </label>
                                            <Select
                                                value={editDialogUser.role}
                                                onValueChange={val =>
                                                    setEditDialogUser({
                                                      ...editDialogUser,
                                                      role: val,
                                                    })
                                                }
                                            >
                                              <SelectTrigger className="mt-1 h-8 w-full rounded-lg border border-input bg-background text-xs">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="border-border bg-card text-xs">
                                                <SelectItem value="USER">
                                                  User
                                                </SelectItem>
                                                <SelectItem value="OWNER">
                                                  Owner
                                                </SelectItem>
                                                <SelectItem value="CR_MANAGMENT">
                                                  CR management
                                                </SelectItem>
                                                <SelectItem value="TEAMLEAD">
                                                  Team lead
                                                </SelectItem>
                                                <SelectItem value="WORKER">
                                                  Worker
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className="flex-1">
                                            <label className="text-[11px] font-medium text-foreground">
                                              Status
                                            </label>
                                            <Select
                                                value={editDialogUser.status}
                                                onValueChange={val =>
                                                    setEditDialogUser({
                                                      ...editDialogUser,
                                                      status: val,
                                                    })
                                                }
                                            >
                                              <SelectTrigger className="mt-1 h-8 w-full rounded-lg border border-input bg-background text-xs">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="max-h-72 border-border bg-card text-xs">
                                                {Object.keys(STATUS_LABELS).map(s => (
                                                    <SelectItem key={s} value={s}>
                                                      {STATUS_LABELS[s]}
                                                    </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Flags */}
                                      <div className="space-y-2 rounded-xl border border-border bg-background/60 p-3">
                                        <p className="text-[11px] font-semibold text-foreground">
                                          Flags
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                          <label className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
                                            <Checkbox
                                                checked={editDialogUser.isVerif}
                                                onCheckedChange={v =>
                                                    setEditDialogUser({
                                                      ...editDialogUser,
                                                      isVerif: !!v,
                                                    })
                                                }
                                            />
                                            <span>Verified (KYC)</span>
                                          </label>
                                          <label className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
                                            <Checkbox
                                                checked={editDialogUser.blocked}
                                                onCheckedChange={v =>
                                                    setEditDialogUser({
                                                      ...editDialogUser,
                                                      blocked: !!v,
                                                    })
                                                }
                                            />
                                            <span>Blocked</span>
                                          </label>
                                          <label className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
                                            <Checkbox
                                                checked={editDialogUser.can_withdraw}
                                                onCheckedChange={v =>
                                                    setEditDialogUser({
                                                      ...editDialogUser,
                                                      can_withdraw: !!v,
                                                    })
                                                }
                                            />
                                            <span>Can withdraw</span>
                                          </label>
                                        </div>
                                      </div>

                                      {/* Footer actions */}
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-[11px] text-muted-foreground">
                                          Created:{" "}
                                          {dateFormatter.format(
                                              new Date(editDialogUser.createdAt),
                                          )}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                          <DialogClose asChild>
                                            <Button
                                                variant="outline"
                                                className="h-8 rounded-lg border border-border bg-background px-3 text-[11px]"
                                            >
                                              Cancel
                                            </Button>
                                          </DialogClose>
                                          <Button
                                              className="h-8 rounded-lg bg-primary px-4 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                                              onClick={handleEditDialogSave}
                                              disabled={savingDialogUser}
                                          >
                                            {savingDialogUser && (
                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            )}
                                            Save changes
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </td>
                      </motion.tr>
                  )
                })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isSearching && totalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px]">
                  <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg border-border bg-background px-2 text-[11px]"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                          p =>
                              p === 1 ||
                              p === totalPages ||
                              (p >= currentPage - 1 && p <= currentPage + 1),
                      )
                      .map((p, idx, arr) => (
                          <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-0.5 text-muted-foreground">…</span>
                    )}
                            <Button
                                size="icon"
                                variant={p === currentPage ? "default" : "outline"}
                                className={`h-7 w-7 rounded-lg text-[11px] ${
                                    p === currentPage
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "border-border bg-background text-foreground hover:bg-muted"
                                }`}
                                onClick={() => handlePageChange(p)}
                            >
                      {p}
                    </Button>
                  </span>
                      ))}
                  <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg border-border bg-background px-2 text-[11px]"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
