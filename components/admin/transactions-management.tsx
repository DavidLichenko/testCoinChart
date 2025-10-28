"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TrendingUp, Search, X, Edit } from "lucide-react";
import { useTickers } from "@/hooks/market-data";
import OpenTradeAdminDialog from "./open-trade_modal";

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
  User: {
    email: string;
    name: string | null;
  };
}

const TRADES_PER_PAGE = 15;

export default function TransactionsManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "OPEN" | "CLOSE">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "BUY" | "SELL">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [openTradeOpen, setOpenTradeOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editValues, setEditValues] = useState({
    profit: "",
    openIn: "",
    closeIn: "",
  });
  const { tickers } = useTickers();

  useEffect(() => {
    fetchTrades();
    fetchUsers();
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trades");
      if (res.ok) setTrades(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    const searchMatch =
      trade.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.User.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trade.User.name &&
        trade.User.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const statusMatch = statusFilter === "all" || trade.status === statusFilter;
    const typeMatch = typeFilter === "all" || trade.type === typeFilter;
    return searchMatch && statusMatch && typeMatch;
  });

  const totalPages = Math.ceil(filteredTrades.length / TRADES_PER_PAGE);

  const tradesToShow = filteredTrades.slice(
    (currentPage - 1) * TRADES_PER_PAGE,
    currentPage * TRADES_PER_PAGE
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
      })

      if (response.ok) {
        fetchTrades()
      }
    } catch (error) {
      console.error("Error closing trade:", error)
    }
  }
  const getCurrentPrice = (ticker: string) =>
    Number(tickers.find((t) => t.symbol === ticker)?.bid) || 0;

  const calculateCurrentProfit = (trade: Trade) => {
    const currentPrice = getCurrentPrice(trade.ticker) || trade.openIn;
    if (trade.status === "CLOSE") return trade.profit || 0;
    return trade.type === "BUY"
      ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
      : (trade.openIn - currentPrice) * trade.volume * trade.leverage;
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
    if (editValues.profit !== "")
      updates.profit = parseFloat(editValues.profit);
    if (editValues.openIn !== "")
      updates.openIn = parseFloat(editValues.openIn);
    if (editValues.closeIn !== "")
      updates.closeIn = parseFloat(editValues.closeIn);

    try {
      const res = await fetch(`/api/admin/trades/${selectedTrade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchTrades();
        setEditModalOpen(false);
        setSelectedTrade(null);
        setEditValues({ profit: "", openIn: "", closeIn: "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="animate-pulse text-center py-10">Loading trades...</div>
    );

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> Trades Management
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            Monitor and manage all trading transactions
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Button onClick={() => setOpenTradeOpen(true)} className="text-sm sm:text-base w-full sm:w-auto">Open Trade</Button>
          <Badge variant="outline" className="text-xs sm:text-sm text-center">{trades.length} Total Trades</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search trades by ticker, email or name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-gray-700 border-gray-600 text-sm"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all" className="text-sm">All Status</SelectItem>
              <SelectItem value="OPEN" className="text-sm">Open</SelectItem>
              <SelectItem value="CLOSE" className="text-sm">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as any)}
          >
            <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all" className="text-sm">All Types</SelectItem>
              <SelectItem value="BUY" className="text-sm">Buy</SelectItem>
              <SelectItem value="SELL" className="text-sm">Sell</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Trades List */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {tradesToShow.map((trade) => {
          const currentProfit = calculateCurrentProfit(trade);
          const currentPrice = getCurrentPrice(trade.ticker);

          return (
            <Card key={trade.id} className="bg-gray-700 border-gray-600">
              <CardContent className="flex flex-col sm:flex-row justify-between py-4 sm:py-5 w-full gap-3 sm:gap-4">
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base">{trade.ticker}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {trade.User.name || trade.User.email}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(trade.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 flex-wrap">
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="text-xs sm:text-sm">Volume: {trade.volume}</div>
                    <div className="text-xs sm:text-sm">Leverage: {trade.leverage}x</div>
                    <div className="text-xs sm:text-sm">Margin: ${trade.margin}</div>
                  </div>
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="text-xs sm:text-sm">
                      Profit:{" "}
                      <span
                        className={
                          currentProfit > 0 ? "text-green-400" : "text-red-400"
                        }
                      >
                        ${trade.profit?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm">Current: ${currentPrice.toFixed(2)}</div>
                    <div className="text-xs sm:text-sm">
                      P&L:{" "}
                      <span
                        className={
                          currentProfit > 0 ? "text-green-400" : "text-red-400"
                        }
                      >
                        ${currentProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <Badge
                    variant={trade.status === "OPEN" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {trade.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(trade)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  {trade.status === "OPEN" && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleCloseTrade(trade.id, currentPrice)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 flex-wrap">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-xs sm:text-sm"
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
                  <span className="px-1 text-xs">...</span>
                )}
                <Button
                  variant={p === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(p)}
                  className="text-xs sm:text-sm h-8 w-8"
                >
                  {p}
                </Button>
              </span>
            ))}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="text-xs sm:text-sm"
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
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Trade</DialogTitle>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label className="text-sm">Ticker</Label>
                <div className="text-gray-300 text-sm mt-1">{selectedTrade.ticker}</div>
              </div>

              <div>
                <Label className="text-sm">Type</Label>
                <div className="text-gray-300 text-sm mt-1">{selectedTrade.type}</div>
              </div>

              <div>
                <Label className="text-sm">Open Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editValues.openIn}
                  onChange={(e) =>
                    setEditValues({ ...editValues, openIn: e.target.value })
                  }
                  className="text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Close Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editValues.closeIn}
                  onChange={(e) =>
                    setEditValues({ ...editValues, closeIn: e.target.value })
                  }
                  className="text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Profit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editValues.profit}
                  onChange={(e) =>
                    setEditValues({ ...editValues, profit: e.target.value })
                  }
                  className="text-sm mt-1"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 text-sm"
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateTrade} className="flex-1 text-sm">
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
