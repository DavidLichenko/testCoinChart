"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { 
  CreditCard, 
  Search, 
  CheckCircle,
  X,
  DollarSign,
  PlusCircle,
  ChevronsUpDown
} from "lucide-react"

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
  } | null // <-- allow null for robustness
}

interface User {
  id: string;
  email: string;
  name: string | null;
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { toast } = useToast()
  
  // Create Order Form State
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
        fetch("/api/admin/users")
      ])
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({ title: "Error", description: "Failed to load orders or users.", variant: "destructive" })
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
      toast({ title: "Missing fields", description: "Please select a user and enter an amount.", variant: "destructive" })
      return
    }

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          type: orderType,
          amount: parseFloat(orderAmount),
          status: orderStatus,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Order created successfully." })
        setCreateDialogOpen(false)
        fetchData()
        setSelectedUserId(null)
        setOrderAmount("")
      } else {
        const errorData = await response.json()
        toast({ title: "Error", description: errorData.error || "Failed to create order.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    }
  }

  // Filter orders, handle null User
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      (order.User?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.User?.name && order.User.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesType = typeFilter === "all" || order.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Orders Management
          </h2>
          <p className="text-gray-400">Manage deposits and withdrawals</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700">
            <">
              <div className="space-y-2">
                <Label>User</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between">
                      {selectedUserId ? users.find(u => u.id === selectedUserId)?.email : "Select user..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." />
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
              <div className="space-y-2">
                <Label htmlFor="order-type">Type</Label>
                <Select value={orderType} onValueChange={(v) => setOrderType(v as "DEPOSIT" | "WITHDRAW")}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-amount">Amount (USD)</Label>
                <Input id="order-amount" type="number" value={orderAmount} onChange={e => setOrderAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-status">Status</Label>
                 <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button onClick={handleCreateOrder}>Create</Button>
            </DialogFooter>
          </Dialog </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEPOSIT">Deposits</SelectItem>
                <SelectItem value="WITHDRAW">Withdrawals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    order.type === "DEPOSIT" ? "bg-green-600" : "bg-red-600"
                  }`}>
                    {order.type === "DEPOSIT" ? "+" : "-"}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{order.type}</div>
                    <div className="text-xs text-gray-400">
                      {order.User?.name || order.User?.email || "Unknown User"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {order.depositFrom || order.withdrawMethod || order.bankName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold">${order.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        order.status === "SUCCESSFUL" 
                          ? "default" 
                          : order.status === "PENDING" 
                            ? "secondary" 
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                    
                    {order.status === "PENDING" && (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUpdateOrderStatus(order.id, "SUCCESSFUL")}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-sm text-gray-400">Total Deposits</div>
                <div className="text-xl font-bold text-green-400">
                  ${orders
                    .filter(o => o.type === "DEPOSIT" && o.status === "SUCCESSFUL")
                    .reduce((sum, o) => sum + o.amount, 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-sm text-gray-400">Total Withdrawals</div>
                <div className="text-xl font-bold text-red-400">
                  ${orders
                    .filter(o => o.type === "WITHDRAW" && o.status === "SUCCESSFUL")
                    .reduce((sum, o) => sum + o.amount, 0)
                    .toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-sm text-gray-400">Pending Orders</div>
                <div className="text-xl font-bold">
                  {orders.filter(o => o.status === "PENDING").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}