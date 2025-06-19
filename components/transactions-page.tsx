"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { Search, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ClosedTrade {
  id: string
  ticker: string
  type: "BUY" | "SELL"
  openIn: number
  closeIn: number | null
  volume: number
  profit: number | null
  margin: number
  leverage: number
  createdAt: string
  endAt: string | null
  status: string
  assetType: string
  isPaid: boolean
}

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
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        setLoading(true)

        // Fetch closed trades
        const tradesResponse = await fetch("/api/trades/closed")
        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json()
          setClosedTrades(tradesData)
        }

        // Fetch orders
        const ordersResponse = await fetch("/api/orders")
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setOrders(ordersData)
        }
      } catch (error) {
        console.error("Error fetching transaction data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactionData()
  }, [])

  const filteredTrades = closedTrades.filter((trade) => {
    const matchesSearch = trade.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || trade.type.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesType
  })

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.depositFrom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.withdrawMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.bankName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || order.type.toLowerCase() === filterType.toLowerCase()
    const matchesStatus = filterStatus === "all" || order.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0)
  const winningTrades = closedTrades.filter((trade) => (trade.profit || 0) > 0).length
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return "N/A"
    const startTime = new Date(start)
    const endTime = new Date(end)
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[100vh-100px] bg-gray-950 text-white"
    >


      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 lg:p-6"
      >
        <Tabs defaultValue="trades" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 h-10">
            <TabsTrigger value="trades" className="text-sm">
              Closed Trades
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-sm">
              Deposits & Withdrawals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trades" className="space-y-4">
            {/* Trading Summary - More compact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className={`text-xl font-bold ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-xl font-bold">{closedTrades.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-xl font-bold text-green-400">{winRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters - More compact */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 h-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700 h-9">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trades List - More compact */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Closed Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTrades.length > 0 ? (
                    filteredTrades.map((trade) => (
                      <div key={trade.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-2 lg:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                trade.type === "BUY" ? "bg-green-600" : "bg-red-600"
                              }`}
                            >
                              {trade.type === "BUY" ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{trade.ticker}</div>
                              <div className="text-xs text-gray-400">
                                {trade.type} • {trade.volume} units • x{trade.leverage}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <div>
                              <div className="text-gray-400">Entry</div>
                              <div className="font-semibold">${trade.openIn}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Exit</div>
                              <div className="font-semibold">${trade.closeIn || "N/A"}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Duration</div>
                              <div className="font-semibold">{calculateDuration(trade.createdAt, trade.endAt)}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">P&L</div>
                              <div
                                className={`font-semibold ${(trade.profit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                              >
                                {(trade.profit || 0) >= 0 ? "+" : ""}${(trade.profit || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <Badge variant={trade.isPaid ? "default" : "secondary"} className="text-xs">
                            {trade.isPaid ? "Paid" : "Pending"}
                          </Badge>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
                          <div className="flex justify-between">
                            <span>Opened: {new Date(trade.createdAt).toLocaleString()}</span>
                            <span>Closed: {trade.endAt ? new Date(trade.endAt).toLocaleString() : "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-6">No closed trades found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 h-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700 h-9">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdraw">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700 h-9">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Deposit & Withdrawal History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <div key={order.id} className="p-3 bg-gray-700 rounded-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-2 lg:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                order.type === "DEPOSIT" ? "bg-green-600" : "bg-red-600"
                              }`}
                            >
                              {order.type === "DEPOSIT" ? "+" : "-"}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{order.type}</div>
                              <div className="text-xs text-gray-400">
                                {order.depositFrom || order.withdrawMethod}
                                {order.bankName && ` • ${order.bankName}`}
                                {order.cardNumber && ` • ${order.cardNumber}`}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            <div>
                              <div className="text-gray-400">Amount</div>
                              <div className="font-semibold">${order.amount.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Method</div>
                              <div className="font-semibold">{order.depositFrom || order.withdrawMethod}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Date</div>
                              <div className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>

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
                        </div>

                        {order.cryptoAddress && (
                          <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
                            <div className="flex justify-between">
                              <span>Address: {order.cryptoAddress}</span>
                              <span>Network: {order.cryptoNetwork}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-6">No transactions found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
