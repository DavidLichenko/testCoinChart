"use client"

import { useState, useEffect } from "react"
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
  Users,
  Search,
  Edit,
  Shield,
  DollarSign,
  Ban,
  CheckCircle,
  X,
  Save,
  ArrowRight,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

interface User {
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

const USERS_PER_PAGE = 15

export default function UsersManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [editingBalance, setEditingBalance] = useState<string | null>(null)
  const [balanceEditValue, setBalanceEditValue] = useState("")

  const [bulkBalanceDialog, setBulkBalanceDialog] = useState(false)
  const [bulkBalanceAmount, setBulkBalanceAmount] = useState("")
  const [bulkBalanceOperation, setBulkBalanceOperation] =
      useState<"add" | "subtract" | "set">("add")

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        fetchUsers()
        setEditDialogOpen(false)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleBlockUser = async (userId: string, blocked: boolean) => {
    await handleUpdateUser(userId, { blocked })
  }

  const handleVerifyUser = async (userId: string, isVerif: boolean) => {
    await handleUpdateUser(userId, { isVerif })
  }

  const handleUpdateBalance = async (userId: string, balance: number) => {
    await handleUpdateUser(userId, { TotalBalance: balance })
  }

  const startBalanceEdit = (userId: string, currentBalance: number) => {
    setEditingBalance(userId)
    setBalanceEditValue(currentBalance.toString())
  }

  const saveBalanceEdit = async (userId: string) => {
    const newBalance = parseFloat(balanceEditValue)
    if (!isNaN(newBalance) && newBalance >= 0) {
      await handleUpdateBalance(userId, newBalance)
    }
    setEditingBalance(null)
    setBalanceEditValue("")
  }

  const cancelBalanceEdit = () => {
    setEditingBalance(null)
    setBalanceEditValue("")
  }

  // фильтрация — ВСЕ пользователи (до пагинации)
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q))
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    const matchesStatus = statusFilter === "all" || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  // пагинация только когда нет поискового запроса
  const isSearching = searchTerm.trim().length > 0
  const totalPages = Math.max(
      1,
      Math.ceil(filteredUsers.length / USERS_PER_PAGE),
  )

  const visibleUsers = isSearching
      ? filteredUsers
      : filteredUsers.slice(
          (currentPage - 1) * USERS_PER_PAGE,
          currentPage * USERS_PER_PAGE,
      )

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(!!checked)
    if (checked) {
      // выбираем всех отфильтрованных (не только текущую страницу)
      setSelectedUsers(filteredUsers.map((u) => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId])
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleBulkBalanceUpdate = async () => {
    const amount = parseFloat(bulkBalanceAmount)
    if (isNaN(amount) || selectedUsers.length === 0) return

    const updates = selectedUsers
        .map((userId) => {
          const u = users.find((x) => x.id === userId)
          if (!u) return null

          let newBalance = u.TotalBalance || 0

          switch (bulkBalanceOperation) {
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

          return { userId, newBalance }
        })
        .filter(Boolean)

    try {
      const response = await fetch("/api/admin/balance/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })

      if (response.ok) {
        fetchUsers()
        setBulkBalanceDialog(false)
        setBulkBalanceAmount("")
        setSelectedUsers([])
        setSelectAll(false)
      }
    } catch (error) {
      console.error("Error updating bulk balances:", error)
    }
  }

  // сброс страницы при изменении фильтров / поиска
  const onSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const onRoleFilterChange = (value: string) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const onStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  if (loading) {
    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-1/4 rounded-full bg-slate-800/80" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                  <div
                      key={i}
                      className="h-16 rounded-2xl bg-slate-900/80"
                  ></div>
              ))}
            </div>
          </div>
        </div>
    )
  }

  return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-200">
              <Users className="h-4 w-4" />
            </span>
              <span>Users Management</span>
            </h2>
            <p className="mt-1 text-sm text-slate-400 sm:text-base">
              Manage user accounts, roles, balances and permissions
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Dialog open={bulkBalanceDialog} onOpenChange={setBulkBalanceDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-slate-950/80 text-sm hover:bg-purple-600/80">
                  <DollarSign className="h-4 w-4" />
                  Bulk Balance
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-2xl max-h-[80vh] overflow-y-auto border-slate-800 bg-slate-950/95">
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle className="text-lg font-semibold">
                    Bulk Balance Update
                  </DialogTitle>
                  <DialogClose asChild>
                    <button className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
                      <X className="h-4 w-4" />
                    </button>
                  </DialogClose>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                        value={bulkBalanceOperation}
                        onValueChange={(v: "add" | "subtract" | "set") =>
                            setBulkBalanceOperation(v)
                        }
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-900 text-sm">
                        <SelectItem value="add">Add Amount</SelectItem>
                        <SelectItem value="subtract">Subtract Amount</SelectItem>
                        <SelectItem value="set">Set Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        placeholder="Amount"
                        value={bulkBalanceAmount}
                        onChange={(e) => setBulkBalanceAmount(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-sm"
                    />
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        Select Users ({selectedUsers.length} selected)
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Checkbox
                            checked={selectAll}
                            onCheckedChange={(v) => handleSelectAll(!!v)}
                        />
                        <span>Select all filtered</span>
                      </div>
                    </div>

                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {filteredUsers.map((u) => (
                          <div
                              key={u.id}
                              className="flex items-center gap-3 rounded-xl bg-slate-900/80 px-3 py-2"
                          >
                            <Checkbox
                                checked={selectedUsers.includes(u.id)}
                                onCheckedChange={(v) =>
                                    handleSelectUser(u.id, !!v)
                                }
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-100">
                                {u.name || "No Name"}
                              </div>
                              <div className="text-xs text-slate-400">
                                {u.email}
                              </div>
                            </div>
                            <div className="text-sm text-slate-200">
                              ${u.TotalBalance?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>

                  <Button
                      onClick={handleBulkBalanceUpdate}
                      disabled={selectedUsers.length === 0 || !bulkBalanceAmount}
                      className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                  >
                    Update Selected Users ({selectedUsers.length})
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Badge
                variant="outline"
                className="flex items-center justify-center rounded-full border-slate-700 bg-slate-900/80 px-3 text-xs text-slate-200 sm:text-sm"
            >
              {users.length} Total Users
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-slate-900 bg-slate-950/80 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                  placeholder="Search users (name / email)..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-9 rounded-xl border-slate-800 bg-slate-900 pl-9 text-sm"
              />
            </div>

            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
              <SelectTrigger className="h-9 w-full rounded-xl border-slate-800 bg-slate-900 text-sm sm:w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-sm">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="CR_MANAGMENT">CR Management</SelectItem>
                <SelectItem value="TEAMLEAD">Team Lead</SelectItem>
                <SelectItem value="WORKER">Worker</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="h-9 w-full rounded-xl border-slate-800 bg-slate-900 text-sm sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] border-slate-700 bg-slate-900 text-sm">
                <SelectItem value="all">All Status</SelectItem>
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
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="rounded-2xl border-slate-900 bg-slate-950/80 shadow-[0_18px_45px_rgba(15,23,42,0.7)]">
          <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-3">
            <CardTitle className="text-base font-semibold text-slate-100 sm:text-lg">
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 sm:space-y-3 sm:p-5">
            {visibleUsers.length === 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-6 text-center text-sm text-slate-400">
                  No users found with current filters.
                </div>
            )}

            {visibleUsers.map((userItem) => (
                <div
                    key={userItem.id}
                    className="flex flex-col gap-3 rounded-2xl bg-slate-900/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-100 sm:text-sm">
                      {userItem.name || "No Name"}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {userItem.email}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge
                          variant="outline"
                          className="rounded-full border-slate-700 bg-slate-950/80 px-2 text-[11px] uppercase tracking-wide text-slate-200"
                      >
                        {userItem.role}
                      </Badge>
                      <Badge
                          variant={
                            userItem.blocked
                                ? "destructive"
                                : userItem.isVerif
                                    ? "default"
                                    : "secondary"
                          }
                          className="rounded-full px-2 text-[11px]"
                      >
                        {userItem.blocked
                            ? "Blocked"
                            : userItem.isVerif
                                ? "Verified"
                                : "Unverified"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
                    {/* Balance */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                      {editingBalance === userItem.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                                type="number"
                                value={balanceEditValue}
                                onChange={(e) => setBalanceEditValue(e.target.value)}
                                className="h-8 w-24 bg-slate-800 text-xs sm:w-20 sm:text-sm"
                            />
                            <Button
                                size="sm"
                                onClick={() => saveBalanceEdit(userItem.id)}
                                className="h-8 w-8 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelBalanceEdit}
                                className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                      ) : (
                          <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-100 sm:text-sm">
                        ${userItem.TotalBalance?.toFixed(2) || "0.00"}
                      </span>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                    startBalanceEdit(
                                        userItem.id,
                                        userItem.TotalBalance || 0,
                                    )
                                }
                                className="h-6 w-6 p-0 text-slate-300 hover:text-white"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/admin/users/${userItem.id}`)}
                          className="h-8 w-8 rounded-xl p-0 text-slate-300 hover:text-white"
                          title="Open user page"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>

                      <Button
                          size="sm"
                          variant={userItem.blocked ? "default" : "outline"}
                          onClick={() =>
                              handleBlockUser(userItem.id, !userItem.blocked)
                          }
                          className="h-8 rounded-xl"
                      >
                        {userItem.blocked ? (
                            <CheckCircle className="h-3 w-3" />
                        ) : (
                            <Ban className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                          size="sm"
                          variant={userItem.isVerif ? "default" : "outline"}
                          onClick={() =>
                              handleVerifyUser(userItem.id, !userItem.isVerif)
                          }
                          className="h-8 rounded-xl"
                      >
                        <Shield className="h-3 w-3" />
                      </Button>

                      <Dialog
                          open={editDialogOpen && selectedUser?.id === userItem.id}
                          onOpenChange={(open) => {
                            setEditDialogOpen(open)
                            if (!open) setSelectedUser(null)
                          }}
                      >
                        <DialogTrigger asChild>
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(userItem)}
                              className="h-8 rounded-xl"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950/95">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold">
                              Edit User
                            </DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                              <div className="space-y-4 text-sm">
                                <div>
                                  <label className="text-xs font-medium text-slate-300">
                                    Name
                                  </label>
                                  <Input
                                      defaultValue={selectedUser.name || ""}
                                      onChange={(e) =>
                                          setSelectedUser({
                                            ...selectedUser,
                                            name: e.target.value,
                                          })
                                      }
                                      className="mt-1 h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-slate-300">
                                    Role
                                  </label>
                                  <Select
                                      value={selectedUser.role}
                                      onValueChange={(value) =>
                                          setSelectedUser({
                                            ...selectedUser,
                                            role: value,
                                          })
                                      }
                                      disabled={user.role !== "OWNER"}
                                  >
                                    <SelectTrigger className="mt-1 h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                                      <SelectItem value="USER">User</SelectItem>
                                      <SelectItem value="OWNER">Owner</SelectItem>
                                      <SelectItem value="CR_MANAGMENT">
                                        CR Management
                                      </SelectItem>
                                      <SelectItem value="TEAMLEAD">
                                        Team Lead
                                      </SelectItem>
                                      <SelectItem value="WORKER">Worker</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-slate-300">
                                    Status
                                  </label>
                                  <Select
                                      value={selectedUser.status}
                                      onValueChange={(value) =>
                                          setSelectedUser({
                                            ...selectedUser,
                                            status: value,
                                          })
                                      }
                                  >
                                    <SelectTrigger className="mt-1 h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] border-slate-800 bg-slate-900 text-sm">
                                      <SelectItem value="NEW">New</SelectItem>
                                      <SelectItem value="WRONGNUMBER">
                                        Wrong Number
                                      </SelectItem>
                                      <SelectItem value="WRONGINFO">
                                        Wrong Info
                                      </SelectItem>
                                      <SelectItem value="CALLBACK">
                                        Call Back
                                      </SelectItem>
                                      <SelectItem value="LOWPOTENTIONAL">
                                        Low potential
                                      </SelectItem>
                                      <SelectItem value="HIGHPOTENTIONAL">
                                        High potential
                                      </SelectItem>
                                      <SelectItem value="NOTINTERESTED">
                                        Not interested
                                      </SelectItem>
                                      <SelectItem value="DEPOSIT">
                                        Deposit
                                      </SelectItem>
                                      <SelectItem value="TRASH">Trash</SelectItem>
                                      <SelectItem value="DROP">Drop</SelectItem>
                                      <SelectItem value="RESIGN">Resign</SelectItem>
                                      <SelectItem value="COMPLETED">
                                        Completed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                      id="blocked"
                                      checked={selectedUser.blocked}
                                      onCheckedChange={(checked) =>
                                          setSelectedUser({
                                            ...selectedUser,
                                            blocked: !!checked,
                                          })
                                      }
                                  />
                                  <label
                                      htmlFor="blocked"
                                      className="text-xs font-medium text-slate-300"
                                  >
                                    Block User
                                  </label>
                                </div>

                                <Button
                                    onClick={() =>
                                        handleUpdateUser(selectedUser.id, {
                                          name: selectedUser.name,
                                          role: selectedUser.role,
                                          status: selectedUser.status,
                                          blocked: selectedUser.blocked,
                                          isVerif: selectedUser.isVerif,
                                          can_withdraw: selectedUser.can_withdraw,
                                        })
                                    }
                                    className="mt-2 w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                                >
                                  Save Changes
                                </Button>
                              </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
            ))}
          </CardContent>
        </Card>

        {/* Pagination – только если нет поиска */}
        {!isSearching && totalPages > 1 && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 rounded-xl border-slate-800 bg-slate-950/80 text-xs"
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
                    <span className="px-1 text-xs text-slate-500">…</span>
                )}
                        <Button
                            variant={p === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(p)}
                            className={`h-8 w-8 rounded-xl text-xs ${
                                p === currentPage
                                    ? "bg-purple-600 hover:bg-purple-700"
                                    : "border-slate-800 bg-slate-950/80"
                            }`}
                        >
                  {p}
                </Button>
              </span>
                  ))}
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-xl border-slate-800 bg-slate-950/80 text-xs"
              >
                Next
              </Button>
            </div>
        )}
      </div>
  )
}
