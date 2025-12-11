"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, DollarSign, TrendingUp, Activity, AlertTriangle, Plus, Minus, Edit3, Check, X } from "lucide-react"
import { hasAdminAccess } from "@/lib/admin-access"
import { useAuth } from "@/components/auth-provider"
import { toast } from "@/components/toast"
import { useI18n } from "@/components/i18n-provider"

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
  const router = useRouter()
  const { t } = useI18n("admin")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [editingProfit, setEditingProfit] = useState<string | null>(null)
  const [profitValue, setProfitValue] = useState("")
  const [profitOperation, setProfitOperation] = useState<"add" | "subtract" | "set">("set")

  // Add access control check
  useEffect(() => {
    if (!hasAdminAccess(user)) {
      setAccessDenied(true)
    }
  }, [user])

  // If access is denied, show an error message
  if (accessDenied) {
    return (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive-foreground">
          Access denied. You don&apos;t have permission to view this page.
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
                  className="bg-card border-border shadow-sm"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 w-2/3 rounded-full bg-muted" />
                    <div className="h-6 w-1/2 rounded-full bg-muted" />
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
    )
  }

  if (!stats) {
    return (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive-foreground">
          {t("failedToLoadStats")}
        </div>
    )
  }

  return (
      <div className="space-y-5 sm:space-y-6">
        {/* Верхние карточки со статистикой */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <StatCard
              title={t("totalUsers")}
              icon={Users}
              value={stats.totalUsers.toLocaleString()}
              sub={t("registeredUsers")}
          />
          <StatCard
              title={t("totalBalance")}
              icon={DollarSign}
              value={`$${stats.totalBalance.toLocaleString()}`}
              sub={t("platformBalance")}
          />
          <StatCard
              title={t("activeTrades")}
              icon={Activity}
              value={stats.activeTrades.toString()}
              sub={t("openPositions")}
          />
          <StatCard
              title={t("pendingVerifications")}
              icon={AlertTriangle}
              value={stats.pendingVerifications.toString()}
              sub={t("awaitingReview")}
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
            <Card className="bg-card border-border shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3 sm:p-5 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </span>
                  <span>{t("recentUsers")}</span>
                </CardTitle>
                <Badge className="rounded-full bg-muted text-[11px] text-muted-foreground border border-border/60">
                  {stats.totalUsers.toLocaleString()} {t("total")}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-1">
                <div className="space-y-2.5 sm:space-y-3">
                  {stats.recentUsers.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        {t("noUsersYet")}
                      </p>
                  )}

                  {stats.recentUsers.map((user) => (
                      <div
                          key={user.id}
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5 text-xs sm:text-sm cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">
                            {user.name || user.email}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-1 text-[11px] sm:text-xs">
                          <Badge
                              variant="outline"
                              className="rounded-full border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground"
                          >
                            {user.role}
                          </Badge>
                          <span className="text-muted-foreground">
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
            <Card className="bg-card border-border shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3 sm:p-5 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </span>
                  <span>{t("recentTrades")}</span>
                </CardTitle>
                <Badge className="rounded-full bg-muted text-[11px] text-muted-foreground border border-border/60">
                  {stats.totalTrades.toLocaleString()} total
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-1">
                <div className="space-y-2.5 sm:space-y-3">
                  {stats.recentTrades.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        {t("noTradesYet")}
                      </p>
                  )}

                  {stats.recentTrades.map((trade) => {
                    const profit = trade.profit || 0
                    const positive = profit >= 0
                    const userLabel =
                        trade.User?.name || trade.User?.email || "Unknown user"
                    const isEditing = editingProfit === trade.id

                    const handleSaveProfit = async () => {
                      try {
                        let finalProfit = parseFloat(profitValue)
                        if (isNaN(finalProfit)) {
                          toast({
                            title: "Error",
                            description: "Invalid profit value",
                            variant: "destructive",
                          })
                          return
                        }
                        
                        if (profitOperation === "add") {
                          finalProfit = profit + finalProfit
                        } else if (profitOperation === "subtract") {
                          finalProfit = profit - finalProfit
                        }

                        const res = await fetch(`/api/admin/trades/${trade.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ profit: finalProfit }),
                        })

                        if (res.ok) {
                          const updated = await res.json()
                          setStats(prev => prev ? {
                            ...prev,
                            recentTrades: prev.recentTrades.map(t => 
                              t.id === trade.id ? { ...t, profit: updated.profit } : t
                            )
                          } : null)
                          setEditingProfit(null)
                          setProfitValue("")
                          toast({
                            title: "Success",
                            description: "Profit updated successfully",
                          })
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to update profit",
                          variant: "destructive",
                        })
                      }
                    }

                    return (
                        <div
                            key={trade.id}
                            className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5 text-xs sm:text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">
                              {trade.ticker}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {trade.type} • {userLabel}
                              {trade.User?.email ? ` (${trade.User.email})` : ""}
                            </p>
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-0.5 border border-border rounded-lg bg-background">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-6 w-6 p-0 ${profitOperation === "subtract" ? "bg-rose-500/20 text-rose-400" : "text-muted-foreground"}`}
                                    onClick={() => setProfitOperation("subtract")}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={profitValue}
                                    onChange={(e) => setProfitValue(e.target.value)}
                                    className="h-6 w-16 border-0 bg-transparent text-xs text-center focus-visible:ring-0"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-6 w-6 p-0 ${profitOperation === "add" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground"}`}
                                    onClick={() => setProfitOperation("add")}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-emerald-400 hover:bg-emerald-500/20"
                                  onClick={handleSaveProfit}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
                                  onClick={() => {
                                    setEditingProfit(null)
                                    setProfitValue("")
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col items-end gap-1 text-[11px] sm:text-xs">
                                  <span
                                      className={`font-semibold cursor-pointer hover:opacity-80 ${
                                          positive ? "text-emerald-400" : "text-rose-400"
                                      }`}
                                      onClick={() => {
                                        setEditingProfit(trade.id)
                                        setProfitValue(Math.abs(profit).toString())
                                        setProfitOperation("set")
                                      }}
                                  >
                                    {positive ? "+" : "-"}$
                                    {Math.abs(profit).toFixed(2)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {new Date(trade.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </>
                            )}
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
          ? "from-amber-500/25 via-amber-500/5 to-transparent"
          : "from-primary/25 via-primary/5 to-transparent"

  const iconBg =
      accent === "warning"
          ? "bg-amber-500/15 text-amber-500"
          : "bg-primary/10 text-primary"

  return (
      <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
      >
        <Card className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
          <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${accentColor} opacity-80`}
          />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-5 sm:pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              {title}
            </CardTitle>
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="text-xl font-bold text-foreground sm:text-2xl">
              {value}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
              {sub}
            </p>
          </CardContent>
        </Card>
      </motion.div>
  )
}
