"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, TrendingUp, Activity, AlertTriangle } from "lucide-react"
import { hasAdminAccess } from "@/lib/admin-access"
import { useAuth } from "@/components/auth-provider"

interface DashboardStats {
  totalUsers: number
  totalBalance: number
  totalTrades: number
  totalOrders: number
  activeTrades: number
  pendingVerifications: number
  recentUsers: Array<{
    id: string
    email: string
    name: string | null
    createdAt: string
    role: string
    isVerif: boolean
  }>
  recentTrades: Array<{
    id: string
    ticker: string
    type: string
    profit: number | null
    createdAt: string
    User?: {
      name: string | null
      email: string
    }
  }>
}

export default function DashboardStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {[...Array(4)].map((_, i) => (
              <Card
                  key={i}
                  className="bg-slate-950/80 border-slate-900/80 shadow-[0_0_0_1px_rgba(148,27,255,0.2)]"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 w-2/3 rounded-full bg-slate-800/80" />
                    <div className="h-6 w-1/2 rounded-full bg-slate-800/80" />
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
    )
  }

  if (!stats) {
    return (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100">
          Failed to load dashboard stats
        </div>
    )
  }

  return (
      <div className="space-y-5 sm:space-y-6">
        {/* Верхние карточки со статистикой */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <StatCard
              title="Total Users"
              icon={Users}
              value={stats.totalUsers.toLocaleString()}
              sub="Registered users"
          />
          <StatCard
              title="Total Balance"
              icon={DollarSign}
              value={`$${stats.totalBalance.toLocaleString()}`}
              sub="Platform balance"
          />
          <StatCard
              title="Active Trades"
              icon={Activity}
              value={stats.activeTrades.toString()}
              sub="Open positions"
          />
          <StatCard
              title="Pending Verifications"
              icon={AlertTriangle}
              value={stats.pendingVerifications.toString()}
              sub="Awaiting review"
              accent="warning"
          />
        </div>

        {/* Нижний блок – недавние пользователи и сделки */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          {/* Recent Users */}
          <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
          >
            <Card className="bg-slate-950/80 border-slate-900/80 shadow-[0_0_40px_rgba(15,23,42,0.8)]">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3 sm:p-5 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/15 text-purple-300">
                  <Users className="h-4 w-4" />
                </span>
                  <span>Recent Users</span>
                </CardTitle>
                <Badge className="rounded-full bg-slate-900/80 text-[11px] text-slate-200">
                  {stats.totalUsers.toLocaleString()} total
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-1">
                <div className="space-y-2.5 sm:space-y-3">
                  {stats.recentUsers.length === 0 && (
                      <p className="py-4 text-center text-xs text-slate-500">
                        No users yet.
                      </p>
                  )}

                  {stats.recentUsers.map((user) => (
                      <div
                          key={user.id}
                          className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 text-xs sm:text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-100">
                            {user.name || user.email}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {user.email}
                          </p>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-1 text-[11px] sm:text-xs">
                          <Badge
                              variant="outline"
                              className="rounded-full border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200"
                          >
                            {user.role}
                          </Badge>
                          <span className="text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                        </div>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Trades */}
          <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
          >
            <Card className="bg-slate-950/80 border-slate-900/80 shadow-[0_0_40px_rgba(15,23,42,0.8)]">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3 sm:p-5 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
                  <TrendingUp className="h-4 w-4" />
                </span>
                  <span>Recent Trades</span>
                </CardTitle>
                <Badge className="rounded-full bg-slate-900/80 text-[11px] text-slate-200">
                  {stats.totalTrades.toLocaleString()} total
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-1">
                <div className="space-y-2.5 sm:space-y-3">
                  {stats.recentTrades.length === 0 && (
                      <p className="py-4 text-center text-xs text-slate-500">
                        No trades yet.
                      </p>
                  )}

                  {stats.recentTrades.map((trade) => {
                    const profit = trade.profit || 0
                    const positive = profit >= 0
                    const userLabel = trade.User?.name || trade.User?.email || "Unknown user"

                    return (
                        <div
                            key={trade.id}
                            className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 text-xs sm:text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-100">
                              {trade.ticker}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {trade.type} • {userLabel}
                              {trade.User?.email ? ` (${trade.User.email})` : ""}
                            </p>
                          </div>
                          <div className="ml-3 flex flex-col items-end gap-1 text-[11px] sm:text-xs">
                        <span
                            className={`font-semibold ${
                                positive ? "text-emerald-300" : "text-rose-300"
                            }`}
                        >
                          {positive ? "+" : "-"}$
                          {Math.abs(profit).toFixed(2)}
                        </span>
                            <span className="text-slate-400">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </span>
                          </div>
                        </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
  )
}

/** Маленький реюзабельный компонент для верхних карточек */
type StatCardProps = {
  title: string
  value: string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  accent?: "default" | "warning"
}

function StatCard({
                    title,
                    value,
                    sub,
                    icon: Icon,
                    accent = "default",
                  }: StatCardProps) {
  const accentColor =
      accent === "warning"
          ? "from-amber-500/30 via-amber-400/10 to-transparent"
          : "from-purple-500/30 via-indigo-500/10 to-transparent"

  const iconBg =
      accent === "warning"
          ? "bg-amber-500/15 text-amber-300"
          : "bg-purple-500/15 text-purple-300"

  return (
      <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
      >
        <Card className="relative overflow-hidden rounded-2xl border border-slate-900/90 bg-slate-950/90 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
          <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${accentColor} opacity-80`}
          />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-5 sm:pb-2">
            <CardTitle className="text-xs font-medium text-slate-300 sm:text-sm">
              {title}
            </CardTitle>
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="text-xl font-bold text-slate-50 sm:text-2xl">
              {value}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{sub}</p>
          </CardContent>
        </Card>
      </motion.div>
  )
}
