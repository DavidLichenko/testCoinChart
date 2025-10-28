"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Plus,
  Minus
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

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

export default function UsersManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingBalance, setEditingBalance] = useState<string | null>(null)
  const [balanceEditValue, setBalanceEditValue] = useState("")
  const [bulkBalanceDialog, setBulkBalanceDialog] = useState(false)
  const [bulkBalanceAmount, setBulkBalanceAmount] = useState("")
  const [bulkBalanceOperation, setBulkBalanceOperation] = useState<"add" | "subtract" | "set">("add")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

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
    console.log(updates)
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
  console.log(users)
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

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const handleBulkBalanceUpdate = async () => {
    const amount = parseFloat(bulkBalanceAmount)
    if (isNaN(amount) || selectedUsers.length === 0) return

    const updates = selectedUsers.map(userId => {
      const user = users.find(u => u.id === userId)
      if (!user) return null

      let newBalance = user.TotalBalance || 0
      
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
    }).filter(Boolean)

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

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            Users Management
          </h2>
          <p className="text-sm sm:text-base text-gray-400">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={bulkBalanceDialog} onOpenChange={setBulkBalanceDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Bulk Balance
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl w-[95vw] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Bulk Balance Update</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Select value={bulkBalanceOperation} onValueChange={(value: "add" | "subtract" | "set") => setBulkBalanceOperation(value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="add" className="text-sm">Add Amount</SelectItem>
                      <SelectItem value="subtract" className="text-sm">Subtract Amount</SelectItem>
                      <SelectItem value="set" className="text-sm">Set Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={bulkBalanceAmount}
                    onChange={(e) => setBulkBalanceAmount(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-sm"
                  />
                </div>
                
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Select Users ({selectedUsers.length} selected)</h4>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-xs text-gray-400">Select All</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{user.name || "No Name"}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                        <div className="text-sm text-gray-300">
                          ${user.TotalBalance?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleBulkBalanceUpdate} 
                  className="w-full text-sm"
                  disabled={selectedUsers.length === 0 || !bulkBalanceAmount}
                >
                  Update Selected Users ({selectedUsers.length})
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Badge variant="outline" className="text-sm">
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-sm">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all" className="text-sm">All Roles</SelectItem>
                <SelectItem value="USER" className="text-sm">User</SelectItem>
                <SelectItem value="OWNER" className="text-sm">Owner</SelectItem>
                <SelectItem value="CR_MANAGMENT" className="text-sm">CR Management</SelectItem>
                <SelectItem value="TEAMLEAD" className="text-sm">Team Lead</SelectItem>
                <SelectItem value="WORKER" className="text-sm">Worker</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 max-h-[300px]">
                <SelectItem value="all" className="text-sm">All Status</SelectItem>
                <SelectItem value="NEW" className="text-sm">New</SelectItem>
                <SelectItem value="WRONGNUMBER" className="text-sm">Wrong Number</SelectItem>
                <SelectItem value="WRONGINFO" className="text-sm">Wrong Info</SelectItem>
                <SelectItem value="CALLBACK" className="text-sm">Call Back</SelectItem>
                <SelectItem value="LOWPOTENTIONAL" className="text-sm">Low potential</SelectItem>
                <SelectItem value="HIGHPOTENTIONAL" className="text-sm">High potential</SelectItem>
                <SelectItem value="NOTINTERESTED" className="text-sm">Not interested</SelectItem>
                <SelectItem value="DEPOSIT" className="text-sm">Deposit</SelectItem>
                <SelectItem value="TRASH" className="text-sm">Trash</SelectItem>
                <SelectItem value="DROP" className="text-sm">Drop</SelectItem>
                <SelectItem value="RESIGN" className="text-sm">Resign</SelectItem>
                <SelectItem value="COMPLETED" className="text-sm">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="p-4">
          <CardTitle className="text-base sm:text-lg">Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            {filteredUsers.map((userItem) => (
              <div key={userItem.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700 rounded-lg gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm">{userItem.name || "No Name"}</div>
                  <div className="text-xs text-gray-400 truncate">{userItem.email}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {userItem.role}
                    </Badge>
                    <Badge 
                      variant={userItem.blocked ? "destructive" : userItem.isVerif ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {userItem.blocked ? "Blocked" : userItem.isVerif ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
                  {/* Balance Display/Edit */}
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {editingBalance === userItem.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={balanceEditValue}
                          onChange={(e) => setBalanceEditValue(e.target.value)}
                          className="w-24 sm:w-20 h-8 text-xs sm:text-sm bg-gray-600 border-gray-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveBalanceEdit(userItem.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelBalanceEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm font-medium">${userItem.TotalBalance?.toFixed(2) || "0.00"}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startBalanceEdit(userItem.id, userItem.TotalBalance || 0)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={userItem.blocked ? "default" : "outline"}
                      onClick={() => handleBlockUser(userItem.id, !userItem.blocked)}
                      className="h-8"
                    >
                      {userItem.blocked ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={userItem.isVerif ? "default" : "outline"}
                      onClick={() => handleVerifyUser(userItem.id, !userItem.isVerif)}
                      className="h-8"
                    >
                      <Shield className="w-3 h-3" />
                    </Button>
                    <Dialog open={editDialogOpen && selectedUser?.id === userItem.id} onOpenChange={(open) => {
                      setEditDialogOpen(open)
                      if (!open) setSelectedUser(null)
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(userItem)}
                          className="h-8"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700 w-[95vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-3 sm:space-y-4">
                            <div>
                              <label className="text-sm font-medium">Name</label>
                              <Input
                                defaultValue={selectedUser.name || ""}
                                onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                                className="bg-gray-700 border-gray-600 text-sm mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Role</label>
                              <Select
                                value={selectedUser.role}
                                onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                                disabled={user.role !== "OWNER"}
                              >
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-sm mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600">
                                  <SelectItem value="USER" className="text-sm">User</SelectItem>
                                  <SelectItem value="OWNER" className="text-sm">Owner</SelectItem>
                                  <SelectItem value="CR_MANAGMENT" className="text-sm">CR Management</SelectItem>
                                  <SelectItem value="TEAMLEAD" className="text-sm">Team Lead</SelectItem>
                                  <SelectItem value="WORKER" className="text-sm">Worker</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <Select value={selectedUser.status} onValueChange={(value) => setSelectedUser({...selectedUser, status: value})}>
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-sm mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600 max-h-[300px]">
                                  <SelectItem value="NEW" className="text-sm">New</SelectItem>
                                  <SelectItem value="WRONGNUMBER" className="text-sm">Wrong Number</SelectItem>
                                  <SelectItem value="WRONGINFO" className="text-sm">Wrong Info</SelectItem>
                                  <SelectItem value="CALLBACK" className="text-sm">Call Back</SelectItem>
                                  <SelectItem value="LOWPOTENTIONAL" className="text-sm">Low potential</SelectItem>
                                  <SelectItem value="HIGHPOTENTIONAL" className="text-sm">High potential</SelectItem>
                                  <SelectItem value="NOTINTERESTED" className="text-sm">Not interested</SelectItem>
                                  <SelectItem value="DEPOSIT" className="text-sm">Deposit</SelectItem>
                                  <SelectItem value="TRASH" className="text-sm">Trash</SelectItem>
                                  <SelectItem value="DROP" className="text-sm">Drop</SelectItem>
                                  <SelectItem value="RESIGN" className="text-sm">Resign</SelectItem>
                                  <SelectItem value="COMPLETED" className="text-sm">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="blocked"
                                checked={selectedUser.blocked}
                                onCheckedChange={(checked) => setSelectedUser({...selectedUser, blocked: checked as boolean})}
                              />
                              <label htmlFor="blocked" className="text-sm font-medium">Block User</label>
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
                              className="w-full text-sm">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
