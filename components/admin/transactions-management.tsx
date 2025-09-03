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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Search,
  X,
  Eye,
  DollarSign,
  Activity,
  Edit,
  Save,
  TrendingDown,
} from "lucide-react";
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

export default function TransactionsManagement() {
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [openTradeOpen, setOpenTradeOpen] = useState(false);
  const [openTradeValues, setOpenTradeValues] = useState<{
    ticker: string;
    price: number;
    type: string;
    openIn: string;
    profit: string;
    user: string;
  }>({
    ticker: "",
    price: 0,
    type: "OPEN",
    openIn: "",
    profit: "",
    user: "",
  });

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editValues, setEditValues] = useState<{
    profit: string;
    openIn: string;
    closeIn: string;
  }>({
    profit: "",
    openIn: "",
    closeIn: "",
  });
  const { tickers } = useTickers();
  useEffect(() => {
    fetchTrades();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await fetch("/api/admin/trades");
      if (response.ok) {
        const data = await response.json();
        setTrades(data);
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
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
  const handleUpdateTrade = async () => {
    if (!selectedTrade) return;

    const updates: any = {};

    if (editValues.profit !== "") {
      const profit = parseFloat(editValues.profit);
      if (!isNaN(profit)) updates.profit = profit;
    }

    if (editValues.openIn !== "") {
      const openIn = parseFloat(editValues.openIn);
      if (!isNaN(openIn)) updates.openIn = openIn;
    }

    if (editValues.closeIn !== "") {
      const closeIn = parseFloat(editValues.closeIn);
      if (!isNaN(closeIn)) updates.closeIn = closeIn;
    }

    try {
      const response = await fetch(`/api/admin/trades/${selectedTrade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchTrades();
        setEditModalOpen(false);
        setSelectedTrade(null);
        setEditValues({ profit: "", openIn: "", closeIn: "" });
      }
    } catch (error) {
      console.error("Error updating trade:", error);
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

  const calculateCurrentProfit = (trade: Trade) => {
    const currentPrice =
      Number(tickers.find((d) => d.symbol === trade.ticker)?.bid) ||
      trade.openIn;
    if (trade.status === "CLOSE") {
      return trade.profit || 0;
    }

    return trade.type === "BUY"
      ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
      : (trade.openIn - currentPrice) * trade.volume * trade.leverage;
  };

  const calculatePotentialProfit = (trade: Trade, newOpenPrice: number) => {
    if (trade.status === "CLOSE") return trade.profit || 0;

    const currentPrice =
      Number(tickers.find((d) => d.symbol === trade.ticker)?.bid) ||
      trade.openIn;

    return trade.type === "BUY"
      ? (currentPrice - newOpenPrice) * trade.volume * trade.leverage
      : (newOpenPrice - currentPrice) * trade.volume * trade.leverage;
  };

  const getCurrentPrice = (ticker: string) => {
    return Number(tickers.find((d) => d.symbol === ticker)?.bid) || 0;
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.User.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trade.User.name &&
        trade.User.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || trade.status === statusFilter;
    const matchesType = typeFilter === "all" || trade.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Trades Management
          </h2>
          <p className="text-gray-400">
            Monitor and manage all trading transactions
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              setOpenTradeOpen(true);
            }}
          >
            Open Trade
          </Button>
          <Badge variant="outline" className="text-sm">
            {trades.length} Total Trades
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search trades..."
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
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSE">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trades List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Trades ({filteredTrades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTrades.map((trade) => {
              const currentProfit = calculateCurrentProfit(trade);
              const currentPrice = getCurrentPrice(trade.ticker);

              return (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        trade.type === "BUY" ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {trade.type === "BUY" ? "B" : "S"}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{trade.ticker}</div>
                      <div className="text-xs text-gray-400">
                        {trade.User.name || trade.User.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Trade Details */}
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="text-gray-400">Volume:</span>{" "}
                        {trade.volume}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Leverage:</span>{" "}
                        {trade.leverage}x
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Margin:</span> $
                        {trade.margin}
                      </div>
                    </div>

                    {/* Price Information */}
                    <div className="text-right">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-400">Open:</span> $
                          {trade.openIn?.toFixed(2)}
                        </div>
                        {trade.closeIn && (
                          <div className="text-sm">
                            <span className="text-gray-400">Close:</span> $
                            {trade.closeIn.toFixed(2)}
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-gray-400">Profit:</span>
                          <span
                            className={
                              trade.profit && trade.profit > 0
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            ${trade.profit?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="text-right">
                      <Badge
                        variant={
                          trade.status === "OPEN" ? "default" : "secondary"
                        }
                        className="text-xs mb-1"
                      >
                        {trade.status}
                      </Badge>
                      <div className="text-xs text-gray-400">
                        Current: ${currentPrice.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs ${
                          currentProfit > 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        P&L: ${currentProfit.toFixed(2)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
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
                          onClick={() =>
                            handleCloseTrade(trade.id, currentPrice)
                          }
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Button onClick={() => setOpenTradeOpen(true)}>Open Trade</Button>
      <OpenTradeAdminDialog
        openTradeOpen={openTradeOpen}
        setOpenTradeOpen={setOpenTradeOpen}
        users={users}
        tickers={tickers}
        onTradeAdded={() => {
          fetchTrades();
          fetchUsers();
        }}
      />
      {/* Edit Trade Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Ticker</Label>
                  <div className="text-sm text-gray-300">
                    {selectedTrade.ticker}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="text-sm text-gray-300">
                    {selectedTrade.type}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="openIn" className="text-sm font-medium">
                  Open Price
                </Label>
                <Input
                  id="openIn"
                  type="number"
                  step="0.01"
                  value={editValues.openIn}
                  onChange={(e) =>
                    setEditValues({ ...editValues, openIn: e.target.value })
                  }
                  className="bg-gray-700 border-gray-600"
                  placeholder="Enter open price"
                />
                {/* Show potential profit for open trades */}
                {selectedTrade.status === "OPEN" && editValues.openIn && (
                  <div className="mt-1 text-xs text-gray-400">
                    Potential P&L:
                    <span
                      className={
                        calculatePotentialProfit(
                          selectedTrade,
                          parseFloat(editValues.openIn) || 0
                        ) > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      $
                      {calculatePotentialProfit(
                        selectedTrade,
                        parseFloat(editValues.openIn) || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Only show close price for closed trades */}
              {selectedTrade.status === "CLOSE" && (
                <div>
                  <Label htmlFor="closeIn" className="text-sm font-medium">
                    Close Price
                  </Label>
                  <Input
                    id="closeIn"
                    type="number"
                    step="0.01"
                    value={editValues.closeIn}
                    onChange={(e) =>
                      setEditValues({ ...editValues, closeIn: e.target.value })
                    }
                    className="bg-gray-700 border-gray-600"
                    placeholder="Enter close price"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="profit" className="text-sm font-medium">
                  Profit
                </Label>
                <Input
                  id="profit"
                  type="number"
                  step="0.01"
                  value={editValues.profit}
                  onChange={(e) =>
                    setEditValues({ ...editValues, profit: e.target.value })
                  }
                  className="bg-gray-700 border-gray-600"
                  placeholder="Enter profit amount"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedTrade(null);
                    setEditValues({ profit: "", openIn: "", closeIn: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateTrade} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
