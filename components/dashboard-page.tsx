"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { TrendingUp, DollarSign, Activity, Target, Users, Calendar, Shield, CreditCard, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

interface UserStats {
  totalBalance: number
  totalPnL: number
  totalPnLPercent: number
  activeTradesCount: number
  winRate: number
  isVerified: boolean
  canWithdraw: boolean
  memberSince: string
  status: string
  blocked: boolean
}

interface ActiveTrade {
  id: string
  ticker: string
  type: "BUY" | "SELL"
  volume: number
  margin: number
  leverage: number
  openIn: number
  openInA: number
  profit: number | null
  status: string
  assetType: string
  createdAt: string
}

interface Order {
  id: string
  type: "DEPOSIT" | "WITHDRAW"
  status: string
  amount: number
  depositFrom?: string
  withdrawMethod?: string
  bankName?: string
  cardNumber?: string
  createdAt: string
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch user stats
        const statsResponse = await fetch("/api/user/stats")
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setUserStats(statsData)
        }

        // Fetch active trades
        const tradesResponse = await fetch("/api/trades/active")
        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json()
          setActiveTrades(tradesData.slice(0, 5)) // Show only 5 recent
        }

        // Fetch recent orders
        const ordersResponse = await fetch("/api/orders")
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setRecentOrders(ordersData.slice(0, 5)) // Show only 5 recent
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
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
        className="p-4 lg:p-6 space-y-4 lg:space-y-6"
      >
        {/* Stats Cards - More compact on desktop */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        >
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl lg:text-2xl font-bold">${userStats?.totalBalance.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">
                {userStats?.canWithdraw ? "Available for withdrawal" : "Withdrawal restricted"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div
                className={`text-xl lg:text-2xl font-bold ${(userStats?.totalPnL || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {(userStats?.totalPnL || 0) >= 0 ? "+" : ""}${userStats?.totalPnL.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                {(userStats?.totalPnLPercent || 0) >= 0 ? "+" : ""}
                {userStats?.totalPnLPercent.toFixed(2) || "0.00"}% total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl lg:text-2xl font-bold">{userStats?.activeTradesCount || 0}</div>
              <p className="text-xs text-muted-foreground">{activeTrades.length} positions open</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl lg:text-2xl font-bold">{userStats?.winRate.toFixed(1) || "0"}%</div>
              <Progress value={userStats?.winRate || 0} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Status - More compact */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Users className="w-5 h-5 mr-2" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Verification</div>
                  <div className="text-xs text-gray-400">Identity verification</div>
                </div>
                <Badge variant={userStats?.isVerified ? "default" : "destructive"} className="text-xs">
                  {userStats?.isVerified ? "Verified" : "Not Verified"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Withdrawal</div>
                  <div className="text-xs text-gray-400">Withdrawal permissions</div>
                </div>
                <Badge variant={userStats?.canWithdraw ? "default" : "destructive"} className="text-xs">
                  {userStats?.canWithdraw ? "Enabled" : "Restricted"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Account Status</div>
                  <div className="text-xs text-gray-400">Current status</div>
                </div>
                <Badge variant={userStats?.blocked ? "destructive" : "default"} className="text-xs">
                  {userStats?.blocked ? "Blocked" : userStats?.status || "Active"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Member Since</div>
                  <div className="text-xs text-gray-400">Account creation</div>
                </div>
                <div className="flex items-center text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {userStats?.memberSince ? new Date(userStats.memberSince).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Recent Activity */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Recent Orders */}
                <div>
                  <h4 className="font-medium mb-2 text-sm">Recent Orders</h4>
                  {recentOrders.length > 0 ? (
                    recentOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              order.type === "DEPOSIT" ? "bg-green-600" : "bg-red-600"
                            }`}
                          >
                            {order.type === "DEPOSIT" ? "+" : "-"}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{order.type}</div>
                            <div className="text-xs text-gray-400">{order.depositFrom || order.withdrawMethod}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">${order.amount.toLocaleString()}</div>
                          <Badge variant={order.status === "SUCCESSFUL" ? "default" : "secondary"} className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-3 text-sm">No recent orders</div>
                  )}
                </div>

                {/* Recent Trades */}
                <div>
                  <h4 className="font-medium mb-2 text-sm">Active Positions</h4>
                  {activeTrades.length > 0 ? (
                    activeTrades.slice(0, 3).map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              trade.type === "BUY" ? "bg-green-600" : "bg-red-600"
                            }`}
                          >
                            {trade.type === "BUY" ? "B" : "S"}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{trade.ticker}</div>
                            <div className="text-xs text-gray-400">
                              {trade.volume} @ ${trade.openIn}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold text-sm ${(trade.profit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            {(trade.profit || 0) >= 0 ? "+" : ""}${(trade.profit || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400">x{trade.leverage}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-3 text-sm">No active trades</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Target className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 h-10">
                  <Activity className="w-4 h-4 mr-2" />
                  Start Trading
                </Button>
              </Link>

              <Link href="/transactions">
                <Button variant="outline" className="w-full h-10">
                  <FileText className="w-4 h-4 mr-2" />
                  View Transactions
                </Button>
              </Link>

              <Link href="/profile">
                <Button variant="outline" className="w-full h-10">
                  <Shield className="w-4 h-4 mr-2" />
                  Complete Verification
                </Button>
              </Link>

              {userStats?.canWithdraw && (
                <Link href="/profile">
                  <Button variant="outline" className="w-full h-10">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
