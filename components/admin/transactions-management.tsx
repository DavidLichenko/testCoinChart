"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TrendingUp, Search, X, Edit2, Loader2, Cpu } from "lucide-react";

import { useTickers } from "@/hooks/market-data";
import OpenTradeAdminDialog from "./open-trade_modal";
import { hasAdminAccess } from "@/lib/admin-access";
import { useAuth } from "@/components/auth-provider";

import { TickerAvatar } from "@/components/ticker-avatar";
import { tickerMetaMap, type TickerCategory } from "@/data/ticker-meta";

interface Trade {
  id: string;
  ticker: string;
  type: "BUY" | "SELL";
  volume: number;
  margin: number;
  leverage: number;
  openIn: number;
  openInA: number;
  closeIn: number | null;
  profit: number | null;
  status: string;
  assetType: string;
  createdAt: string;
  endAt: string | null;
  userId: string;
  aiEnabled?: boolean;
  User: {
    email: string;
    name: string | null;
  };
}

const TRADES_PER_PAGE = 10;

export default function TransactionsManagement() {
  const { user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "OPEN" | "CLOSE">(
      "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "BUY" | "SELL">("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [openTradeOpen, setOpenTradeOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editValues, setEditValues] = useState({
    profit: "",
    openIn: "",
    closeIn: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const { tickers } = useTickers();

  // --- access guard ---
  useEffect(() => {
    if (!user) return;
    if (!hasAdminAccess(user)) {
      setAccessDenied(true);
    }
  }, [user]);

  useEffect(() => {
    if (accessDenied) return;
    fetchTrades();
    fetchUsers();
  }, [accessDenied]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trades", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      }
    } catch (err) {
      console.error("Error loading trades:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error loading users for trade dialog:", err);
    }
  };

  const getCurrentPrice = (ticker: string) =>
      Number(tickers.find(t => t.symbol === ticker)?.bid) || 0;

  const calculateCurrentProfit = (trade: Trade) => {
    const currentPrice = getCurrentPrice(trade.ticker) || trade.openIn;
    if (trade.status === "CLOSE") return trade.profit || 0;

    return trade.type === "BUY"
        ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
        : (trade.openIn - currentPrice) * trade.volume * trade.leverage;
  };

  const filteredTrades = trades.filter(trade => {
    const query = searchTerm.toLowerCase();
    const searchMatch =
        trade.ticker.toLowerCase().includes(query) ||
        trade.User.email.toLowerCase().includes(query) ||
        (trade.User.name && trade.User.name.toLowerCase().includes(query));

    const statusMatch = statusFilter === "all" || trade.status === statusFilter;
    const typeMatch = typeFilter === "all" || trade.type === typeFilter;
    const assetMatch =
        assetTypeFilter === "all" || trade.assetType === assetTypeFilter;

    return searchMatch && statusMatch && typeMatch && assetMatch;
  });

  const totalPages =
      Math.ceil(filteredTrades.length / TRADES_PER_PAGE) || 1;

  const tradesToShow = filteredTrades.slice(
      (currentPage - 1) * TRADES_PER_PAGE,
      currentPage * TRADES_PER_PAGE,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handleCloseTrade = async (tradeId: string, currentPrice: number) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closePrice: currentPrice }),
      });

      if (response.ok) {
        fetchTrades();
      }
    } catch (error) {
      console.error("Error closing trade:", error);
    }
  };

  const openEditModal = (trade: Trade) => {
    setSelectedTrade(trade);
    setEditValues({
      profit: trade.profit?.toString() || "",
      openIn: trade.openIn?.toString() || "",
      closeIn: trade.closeIn?.toString() || "",
    });
    setEditModalOpen(true);
  };

  const handleUpdateTrade = async () => {
    if (!selectedTrade) return;
    const updates: any = {};

    if (editValues.profit !== "") updates.profit = parseFloat(editValues.profit);
    if (editValues.openIn !== "") updates.openIn = parseFloat(editValues.openIn);
    if (editValues.closeIn !== "")
      updates.closeIn = parseFloat(editValues.closeIn);

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/admin/trades/${selectedTrade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await fetchTrades();
        setEditModalOpen(false);
        setSelectedTrade(null);
        setEditValues({ profit: "", openIn: "", closeIn: "" });
      }
    } catch (err) {
      console.error("Error updating trade:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const openTradesCount = trades.filter(t => t.status === "OPEN").length;
  const closedTradesCount = trades.filter(t => t.status === "CLOSE").length;

  const assetTypes = Array.from(
      new Set(trades.map(t => t.assetType).filter(Boolean)),
  );

  // ---------- RENDER GUARDS ----------

  if (accessDenied) {
    return (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive-foreground">
          Access denied. You don&apos;t have permission to view this page.
        </div>
    );
  }

  if (loading && trades.length === 0) {
    return (
        <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl border border-border/70 bg-card"
                />
            ))}
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </span>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Trades Management
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Monitor and manage all trading transactions in real-time.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Badge className="rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                {openTradesCount} open
              </Badge>
              <Badge className="rounded-full border border-border/70 bg-muted text-muted-foreground">
                {closedTradesCount} closed
              </Badge>
            </div>

            <Button
                onClick={() => setOpenTradeOpen(true)}
                className="w-full rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto sm:text-sm"
            >
              Open Trade
            </Button>

            <Badge className="flex items-center justify-center rounded-full border border-border bg-background px-3 text-[11px] font-normal text-muted-foreground">
              {trades.length} total trades
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                  placeholder="Search trades by ticker, email or name…"
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 w-full rounded-xl border border-input bg-background pl-9 text-xs text-foreground placeholder:text-muted-foreground sm:text-sm"
              />
            </div>

            <Select
                value={statusFilter}
                onValueChange={v => {
                  setStatusFilter(v as "all" | "OPEN" | "CLOSE");
                  setCurrentPage(1);
                }}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-input bg-background text-xs text-foreground sm:w-40 sm:text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border border-border bg-card text-xs sm:text-sm">
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSE">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
                value={assetTypeFilter}
                onValueChange={v => {
                  setAssetTypeFilter(v as "all" | string);
                  setCurrentPage(1);
                }}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-input bg-background text-xs text-foreground sm:w-40 sm:text-sm">
                <SelectValue placeholder="Asset" />
              </SelectTrigger>
              <SelectContent className="border border-border bg-card text-xs sm:text-sm">
                <SelectItem value="all">All assets</SelectItem>
                {assetTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
                value={typeFilter}
                onValueChange={v => {
                  setTypeFilter(v as "all" | "BUY" | "SELL");
                  setCurrentPage(1);
                }}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-input bg-background text-xs text-foreground sm:w-32 sm:text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="border border-border bg-card text-xs sm:text-sm">
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Trades List */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {filteredTrades.length === 0 && !loading && (
              <Card className="rounded-2xl border border-border bg-card">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No trades match current filters.
                </CardContent>
              </Card>
          )}

          {tradesToShow.map(trade => {
            const currentProfit = calculateCurrentProfit(trade);
            const currentPrice = getCurrentPrice(trade.ticker);
            const isPositive = currentProfit >= 0;

            const pnlColor = isPositive ? "text-emerald-400" : "text-rose-400";
            const typeBadge =
                trade.type === "BUY"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/40";

            const statusBadge =
                trade.status === "OPEN"
                    ? "bg-primary/10 text-primary border border-primary/40"
                    : "bg-muted text-muted-foreground border border-border/70";

            const liveTicker = tickers.find(t => t.symbol === trade.ticker);
            const meta = tickerMetaMap.get(trade.ticker.toUpperCase());

            const category: TickerCategory =
                (liveTicker?.category as TickerCategory | undefined) ??
                (meta?.category as TickerCategory | undefined) ??
                "other";

            const baseCurrency =
                liveTicker?.baseCurrency ?? meta?.baseCurrency;
            const quoteCurrency =
                liveTicker?.quoteCurrency ?? meta?.quoteCurrency;
            const icon = liveTicker?.icon ?? meta?.icon;

            return (
                <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                >
                  <Card className={`rounded-2xl border shadow-sm hover:shadow-md transition-colors ${
                    trade.aiEnabled 
                      ? "border-purple-500/50 bg-gradient-to-br from-purple-950/40 to-purple-900/20 hover:border-purple-500/70" 
                      : "border-border bg-card hover:border-primary/40"
                  }`}>
                    <CardContent className="flex flex-col justify-between gap-4 py-4 pl-4 pr-4 sm:flex-row sm:items-center sm:gap-6 sm:py-5">
                      {/* left: user + ticker + icon */}
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <TickerAvatar
                            symbol={trade.ticker}
                            className={trade.aiEnabled ? "border-purple-500/50" : ""}
                            category={category}
                            baseCurrency={baseCurrency}
                            quoteCurrency={quoteCurrency}
                            icon={icon}
                            size={32}
                        />

                        <div className="min-w-0 flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground sm:text-base">
                          {trade.ticker}
                        </span>
                            {trade.aiEnabled && (
                              <Badge className="rounded-full px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                <Cpu className="h-3 w-3" />
                                AI
                              </Badge>
                            )}
                            <Badge
                                className={`rounded-full px-2 text-[10px] ${typeBadge}`}
                            >
                              {trade.type}
                            </Badge>
                            {trade.assetType && (
                                <Badge className="rounded-full border border-border/70 bg-muted/60 text-[10px] text-muted-foreground">
                                  {trade.assetType}
                                </Badge>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                            {trade.User.name || trade.User.email}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(trade.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* middle: numbers */}
                      <div className="grid grid-cols-2 gap-4 text-[11px] sm:text-xs md:flex md:flex-row md:gap-8">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">
                            Volume{" "}
                            <span className="font-semibold text-foreground">
                          {trade.volume}
                        </span>
                          </p>
                          <p className="text-muted-foreground">
                            Leverage{" "}
                            <span className="font-semibold text-foreground">
                          {trade.leverage}x
                        </span>
                          </p>
                          <p className="text-muted-foreground">
                            Margin{" "}
                            <span className="font-semibold text-foreground">
                          ${trade.margin.toFixed(2)}
                        </span>
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground">
                            Profit{" "}
                            <span
                                className={
                                  (trade.profit || 0) >= 0
                                      ? "font-semibold text-emerald-400"
                                      : "font-semibold text-rose-400"
                                }
                            >
                          ${trade.profit?.toFixed(2) || "0.00"}
                        </span>
                          </p>
                          <p className="text-muted-foreground">
                            Current{" "}
                            <span className="font-semibold text-foreground">
                          ${currentPrice.toFixed(2)}
                        </span>
                          </p>
                          <p className="text-muted-foreground">
                            P&amp;L{" "}
                            <span className={`font-semibold ${pnlColor}`}>
                          ${currentProfit.toFixed(2)}
                        </span>
                          </p>
                        </div>
                      </div>

                      {/* right: status + actions */}
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
                        <Badge
                            className={`rounded-full px-3 text-[10px] uppercase tracking-wide ${statusBadge}`}
                        >
                          {trade.status}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(trade)}
                              className="h-8 w-8 rounded-xl border border-border bg-background p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {trade.status === "OPEN" && (
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                      handleCloseTrade(trade.id, currentPrice)
                                  }
                                  className="h-8 w-8 rounded-xl border border-destructive/40 bg-destructive/10 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && filteredTrades.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6 sm:gap-2">
              <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 rounded-full border border-border bg-background px-3 text-[11px] text-foreground hover:bg-muted sm:h-9 sm:px-4 sm:text-sm"
                  variant="outline"
              >
                Prev
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                      p =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= currentPage - 2 && p <= currentPage + 2),
                  )
                  .map((p, idx, arr) => (
                      <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-xs text-muted-foreground">…</span>
                )}
                        <Button
                            variant={p === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(p)}
                            className={`h-8 w-8 rounded-full text-[11px] sm:h-9 sm:w-9 sm:text-sm ${
                                p === currentPage
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent"
                                    : "border border-border bg-background text-foreground hover:bg-muted"
                            }`}
                        >
                  {p}
                </Button>
              </span>
                  ))}

              <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-full border border-border bg-background px-3 text-[11px] text-foreground hover:bg-muted sm:h-9 sm:px-4 sm:text-sm"
                  variant="outline"
              >
                Next
              </Button>
            </div>
        )}

        {/* Open Trade Modal (сам компонент в другом файле) */}
        <OpenTradeAdminDialog
            openTradeOpen={openTradeOpen}
            setOpenTradeOpen={setOpenTradeOpen}
            users={users}
            tickers={tickers}
            onTradeAdded={fetchTrades}
        />

        {/* Edit Trade Modal – ПОЛНОСТЬЮ в новых цветах */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-h-[90vh] w-[95vw] max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-0 shadow-xl">
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <DialogHeader className="flex flex-row items-start justify-between gap-2 border-b border-border/70 bg-background/60 px-4 py-3">
                <div>
                  <DialogTitle className="text-sm font-semibold text-foreground">
                    Edit trade
                  </DialogTitle>
                  {selectedTrade && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {selectedTrade.ticker} ·{" "}
                        {selectedTrade.User.name || selectedTrade.User.email}
                      </p>
                  )}
                </div>
                <DialogClose asChild>
                  <button className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </DialogClose>
              </DialogHeader>

              {selectedTrade && (
                  <div className="space-y-4 px-4 py-4 text-xs text-foreground sm:text-sm">
                    {/* meta block */}
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3 text-[11px] sm:grid-cols-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Type
                        </p>
                        <p className="font-semibold">
                          {selectedTrade.type} · {selectedTrade.assetType}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Volume
                        </p>
                        <p className="font-semibold">{selectedTrade.volume}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Leverage
                        </p>
                        <p className="font-semibold">
                          {selectedTrade.leverage}x
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">
                          Open price
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={editValues.openIn}
                            onChange={e =>
                                setEditValues(prev => ({
                                  ...prev,
                                  openIn: e.target.value,
                                }))
                            }
                            className="mt-1 h-9 rounded-lg border border-input bg-background text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-[11px] text-muted-foreground">
                          Close price
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={editValues.closeIn}
                            onChange={e =>
                                setEditValues(prev => ({
                                  ...prev,
                                  closeIn: e.target.value,
                                }))
                            }
                            className="mt-1 h-9 rounded-lg border border-input bg-background text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Profit
                      </Label>
                      <Input
                          type="number"
                          step="0.01"
                          value={editValues.profit}
                          onChange={e =>
                              setEditValues(prev => ({
                                ...prev,
                                profit: e.target.value,
                              }))
                          }
                          className="mt-1 h-9 rounded-lg border border-input bg-background text-xs"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Current P&amp;L (live):{" "}
                        <span
                            className={
                              calculateCurrentProfit(selectedTrade) >= 0
                                  ? "font-semibold text-emerald-400"
                                  : "font-semibold text-rose-400"
                            }
                        >
                      ${calculateCurrentProfit(selectedTrade).toFixed(2)}
                    </span>
                      </p>
                    </div>

                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <DialogClose asChild>
                        <Button
                            variant="outline"
                            className="h-8 flex-1 rounded-lg border border-border bg-background text-xs sm:flex-none sm:px-4"
                            disabled={savingEdit}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                          onClick={handleUpdateTrade}
                          className="h-8 flex-1 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-none sm:px-4"
                          disabled={savingEdit}
                      >
                        {savingEdit && (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        )}
                        Save changes
                      </Button>
                    </div>
                  </div>
              )}
            </motion.div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
