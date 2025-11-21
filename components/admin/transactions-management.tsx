"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { TrendingUp, Search, X, Edit } from "lucide-react"
import { useTickers } from "@/hooks/market-data"
import OpenTradeAdminDialog from "./open-trade_modal"

interface Trade {
  id: string
  ticker: string
  type: "BUY" | "SELL"
  volume: number
  margin: number
  leverage: number
  openIn: number
  openInA: number
  closeIn: number | null
  profit: number | null
  status: string
  assetType: string
  createdAt: string
  endAt: string | null
  userId: string
  User: {
    email: string
    name: string | null
  }
}

const TRADES_PER_PAGE = 15

export default function TransactionsManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "OPEN" | "CLOSE">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "BUY" | "SELL">("all")
  const [currentPage, setCurrentPage] = useState(1)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [openTradeOpen, setOpenTradeOpen] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [editValues, setEditValues] = useState({
    profit: "",
    openIn: "",
    closeIn: "",
  })

  const { tickers } = useTickers()

  useEffect(() => {
    fetchTrades()
    fetchUsers()
  }, [])

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/trades")
      if (res.ok) {
        const data = await res.json()
        setTrades(data)
      }
    } catch (err) {
      console.error("Error loading trades:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error("Error loading users for trade dialog:", err)
    }
  }

  const filteredTrades = trades.filter((trade) => {
    const query = searchTerm.toLowerCase()
    const searchMatch =
        trade.ticker.toLowerCase().includes(query) ||
        trade.User.email.toLowerCase().includes(query) ||
        (trade.User.name && trade.User.name.toLowerCase().includes(query))

    const statusMatch = statusFilter === "all" || trade.status === statusFilter
    const typeMatch = typeFilter === "all" || trade.type === typeFilter

    return searchMatch && statusMatch && typeMatch
  })

  const totalPages = Math.ceil(filteredTrades.length / TRADES_PER_PAGE) || 1

  const tradesToShow = filteredTrades.slice(
      (currentPage - 1) * TRADES_PER_PAGE,
      currentPage * TRADES_PER_PAGE
  )

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
  }

  const handleCloseTrade = async (tradeId: string, currentPrice: number) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closePrice: currentPrice }),
      })

      if (response.ok) {
        fetchTrades()
      }
    } catch (error) {
      console.error("Error closing trade:", error)
    }
  }

  const getCurrentPrice = (ticker: string) =>
      Number(tickers.find((t) => t.symbol === ticker)?.bid) || 0

  const calculateCurrentProfit = (trade: Trade) => {
    const currentPrice = getCurrentPrice(trade.ticker) || trade.openIn
    if (trade.status === "CLOSE") return trade.profit || 0
    return trade.type === "BUY"
        ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
        : (trade.openIn - currentPrice) * trade.volume * trade.leverage
  }

  const openEditModal = (trade: Trade) => {
    setSelectedTrade(trade)
    setEditValues({
      profit: trade.profit?.toString() || "",
      openIn: trade.openIn?.toString() || "",
      closeIn: trade.closeIn?.toString() || "",
    })
    setEditModalOpen(true)
  }

  const handleUpdateTrade = async () => {
    if (!selectedTrade) return
    const updates: any = {}

    if (editValues.profit !== "") updates.profit = parseFloat(editValues.profit)
    if (editValues.openIn !== "") updates.openIn = parseFloat(editValues.openIn)
    if (editValues.closeIn !== "") updates.closeIn = parseFloat(editValues.closeIn)

    try {
      const res = await fetch(`/api/admin/trades/${selectedTrade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        fetchTrades()
        setEditModalOpen(false)
        setSelectedTrade(null)
        setEditValues({ profit: "", openIn: "", closeIn: "" })
      }
    } catch (err) {
      console.error("Error updating trade:", err)
    }
  }

  if (loading && trades.length === 0) {
    return (
        <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded-full bg-slate-800/70" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-slate-800/70" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
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
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 sm:h-9 sm:w-9">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
              Trades Management
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Monitor and manage all trading transactions
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <Button
                onClick={() => setOpenTradeOpen(true)}
                className="w-full rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700 sm:w-auto sm:text-base"
            >
              Open Trade
            </Button>
            <Badge
                variant="outline"
                className="flex items-center justify-center rounded-full border-slate-700 bg-slate-900/80 px-3 text-xs text-slate-200"
            >
              {trades.length} Total Trades
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-slate-900/80 bg-slate-950/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                  placeholder="Search trades by ticker, email or name..."
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
                onValueChange={(v) =>
                    setStatusFilter(v as "all" | "OPEN" | "CLOSE")
                }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-800 bg-slate-900 text-sm text-slate-100 sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSE">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as "all" | "BUY" | "SELL")}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-800 bg-slate-900 text-sm text-slate-100 sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Trades List */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {filteredTrades.length === 0 && !loading && (
              <Card className="rounded-2xl border-slate-900/80 bg-slate-950/80">
                <CardContent className="py-8 text-center text-sm text-slate-400">
                  No trades match current filters.
                </CardContent>
              </Card>
          )}

          {tradesToShow.map((trade) => {
            const currentProfit = calculateCurrentProfit(trade)
            const currentPrice = getCurrentPrice(trade.ticker)
            const isPositive = currentProfit >= 0

            return (
                <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                >
                  <Card className="rounded-2xl border-slate-800 bg-slate-950/80 shadow-[0_16px_40px_rgba(15,23,42,0.85)]">
                    <CardContent className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:gap-4 sm:py-5">
                      {/* left: user + ticker */}
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 sm:text-base">
                        {trade.ticker}
                      </span>
                          <Badge
                              className={`rounded-full px-2 text-[10px] ${
                                  trade.type === "BUY"
                                      ? "bg-emerald-500/15 text-emerald-300"
                                      : "bg-rose-500/15 text-rose-300"
                              }`}
                          >
                            {trade.type}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400 sm:text-xs">
                          {trade.User.name || trade.User.email}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(trade.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {/* middle: numbers */}
                      <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                        <div className="flex flex-col gap-1">
                      <span className="text-slate-400">
                        Volume:{" "}
                        <span className="text-slate-100">{trade.volume}</span>
                      </span>
                          <span className="text-slate-400">
                        Leverage:{" "}
                            <span className="text-slate-100">
                          {trade.leverage}x
                        </span>
                      </span>
                          <span className="text-slate-400">
                        Margin:{" "}
                            <span className="text-slate-100">
                          ${trade.margin.toFixed(2)}
                        </span>
                      </span>
                        </div>

                        <div className="flex flex-col gap-1">
                      <span className="text-slate-400">
                        Profit:{" "}
                        <span
                            className={
                              (trade.profit || 0) >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                            }
                        >
                          ${trade.profit?.toFixed(2) || "0.00"}
                        </span>
                      </span>
                          <span className="text-slate-400">
                        Current:{" "}
                            <span className="text-slate-100">
                          ${currentPrice.toFixed(2)}
                        </span>
                      </span>
                          <span className="text-slate-400">
                        P&amp;L:{" "}
                            <span
                                className={
                                  isPositive ? "text-emerald-400" : "text-rose-400"
                                }
                            >
                          ${currentProfit.toFixed(2)}
                        </span>
                      </span>
                        </div>
                      </div>

                      {/* right: status + actions */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Badge
                            variant={
                              trade.status === "OPEN" ? "default" : "secondary"
                            }
                            className="rounded-full bg-slate-900/90 px-3 text-[11px] uppercase tracking-wide"
                        >
                          {trade.status}
                        </Badge>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(trade)}
                            className="h-8 w-8 rounded-xl p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {trade.status === "OPEN" && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                    handleCloseTrade(trade.id, currentPrice)
                                }
                                className="h-8 w-8 rounded-xl p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && filteredTrades.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1 sm:mt-6 sm:gap-2">
              <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 rounded-full px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                  variant="outline"
              >
                Prev
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                      (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= currentPage - 2 && p <= currentPage + 2)
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
                            className="h-8 w-8 rounded-full text-xs sm:h-9 sm:w-9 sm:text-sm"
                        >
                  {p}
                </Button>
              </span>
                  ))}

              <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-full px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                  variant="outline"
              >
                Next
              </Button>
            </div>
        )}

        {/* Open Trade Modal */}
        <OpenTradeAdminDialog
            openTradeOpen={openTradeOpen}
            setOpenTradeOpen={setOpenTradeOpen}
            users={users}
            tickers={tickers}
            onTradeAdded={fetchTrades}
        />

        {/* Edit Trade Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-h-[90vh] w-[95vw] max-w-md overflow-y-auto border-slate-800 bg-slate-950/95">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-50 sm:text-xl">
                Edit Trade
              </DialogTitle>
            </DialogHeader>

            {selectedTrade && (
                <div className="space-y-3 text-sm sm:space-y-4">
                  <div>
                    <Label className="text-xs text-slate-400">Ticker</Label>
                    <div className="mt-1 text-slate-100">
                      {selectedTrade.ticker}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-400">Type</Label>
                    <div className="mt-1 text-slate-100">{selectedTrade.type}</div>
                  </div>

                  <div>
                    <Label className="text-xs text-slate-400">Open Price</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={editValues.openIn}
                        onChange={(e) =>
                            setEditValues({ ...editValues, openIn: e.target.value })
                        }
                        className="mt-1 h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-400">Close Price</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={editValues.closeIn}
                        onChange={(e) =>
                            setEditValues({ ...editValues, closeIn: e.target.value })
                        }
                        className="mt-1 h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-slate-400">Profit</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={editValues.profit}
                        onChange={(e) =>
                            setEditValues({ ...editValues, profit: e.target.value })
                        }
                        className="mt-1 h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-3 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => setEditModalOpen(false)}
                        className="flex-1 rounded-xl text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateTrade}
                        className="flex-1 rounded-xl bg-purple-600 text-sm font-medium hover:bg-purple-700"
                    >
                      Save
                    </Button>
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}
