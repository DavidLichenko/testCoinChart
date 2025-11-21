"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/components/i18n-provider";

interface ClosedTrade {
  id: string;
  ticker: string;
  type: "BUY" | "SELL";
  openIn: number;
  closeIn: number | null;
  volume: number;
  profit: number | null;
  margin: number;
  leverage: number;
  createdAt: string;
  endAt: string | null;
  status: string;
  assetType: string;
  isPaid: boolean;
}

interface Order {
  id: string;
  status: string;
  type: "DEPOSIT" | "WITHDRAW";
  amount: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  depositFrom?: string;
  bankName?: string;
  cardNumber?: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  withdrawMethod?: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        setLoading(true);

        const [tradesResponse, ordersResponse] = await Promise.all([
          fetch("/api/trades/closed"),
          fetch("/api/orders"),
        ]);

        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json();
          setClosedTrades(tradesData);
        }

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        }
      } catch (error) {
        console.error("Error fetching transaction data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionData();
  }, []);

  const filteredTrades = closedTrades.filter((trade) => {
    const matchesSearch = trade.ticker
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesType =
        filterType === "all" ||
        trade.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
        !term ||
        order.depositFrom?.toLowerCase().includes(term) ||
        order.withdrawMethod?.toLowerCase().includes(term) ||
        order.bankName?.toLowerCase().includes(term) ||
        order.cardNumber?.toLowerCase().includes(term);

    const matchesType =
        filterType === "all" ||
        order.type.toLowerCase() === filterType.toLowerCase();

    const matchesStatus =
        filterStatus === "all" ||
        order.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPnL = closedTrades.reduce(
      (sum, trade) => sum + (trade.profit || 0),
      0
  );
  const winningTrades = closedTrades.filter(
      (trade) => (trade.profit || 0) > 0
  ).length;
  const winRate =
      closedTrades.length > 0
          ? (winningTrades / closedTrades.length) * 100
          : 0;

  // simple motion helper
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay },
  });

  if (loading) {
    return (
        <div className="min-h-screen bg-[#050416] text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto" />
            <p className="mt-4 text-slate-400">
              {t("loadingTransactions") || "Loading transactions..."}
            </p>
          </div>
        </div>
    );
  }

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="min-h-[calc(100vh-65px)] sm:min-h-[calc(100vh-65px)] bg-gradient-to-b from-[#050416] via-[#050013] to-[#050416] text-slate-50"
      >
        <div className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-4 lg:px-6 lg:pt-6">
          {/* Header */}
          <motion.div
              {...fadeUp(0.05)}
              className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">
                {t("transactionsTitle") || "Transactions & History"}
              </h1>
              <p className="text-xs text-slate-400 sm:text-sm">
                {t("transactionsSubtitle") ||
                    "View your closed trades, deposits and withdrawals in one place"}
              </p>
            </div>
          </motion.div>

          <Tabs defaultValue="trades" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-slate-900/80 p-1 text-xs sm:text-sm">
              <TabsTrigger
                  value="trades"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                {t("closedTradesTab") || "Closed trades"}
              </TabsTrigger>
              <TabsTrigger
                  value="transactions"
                  className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                {t("depositsWithdrawalsTab") || "Deposits & Withdrawals"}
              </TabsTrigger>
            </TabsList>

            {/* CLOSED TRADES TAB */}
            <TabsContent value="trades" className="space-y-5 pt-2">
              {/* Summary row */}
              <motion.div
                  {...fadeUp(0.08)}
                  className="grid gap-3 sm:grid-cols-3"
              >
                <Card className="border-slate-800 bg-slate-950/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-slate-300">
                      {t("totalPnL") || "Total PnL"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div
                        className={`text-xl font-semibold ${
                            totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                    >
                      {totalPnL >= 0 ? "+" : ""}
                      {totalPnL.toFixed(2)}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {t("totalPnLHint") || "Sum of all closed trades"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-950/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-slate-300">
                      {t("totalTrades") || "Total trades"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-xl font-semibold text-slate-100">
                      {closedTrades.length}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {t("totalTradesHint") || "Completed positions"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-950/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-slate-300">
                      {t("winRate") || "Win rate"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-xl font-semibold text-emerald-400">
                      {winRate.toFixed(1)}%
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {t("winRateHint") || "Profitable trades vs total"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Filters */}
              <motion.div
                  {...fadeUp(0.12)}
                  className="flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                      placeholder={t("searchTrades") || "Search by symbol"}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 border-slate-800 bg-slate-950/80 pl-9 text-xs sm:text-sm"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 w-full border-slate-800 bg-slate-950/80 text-xs sm:w-40 sm:text-sm">
                    <SelectValue
                        placeholder={t("filterByType") || "Type"}
                    />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-950">
                    <SelectItem value="all">
                      {t("allTypes") || "All types"}
                    </SelectItem>
                    <SelectItem value="buy">{t("buy") || "Buy"}</SelectItem>
                    <SelectItem value="sell">{t("sell") || "Sell"}</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Trades list */}
              <motion.div {...fadeUp(0.16)}>
                <Card className="border-slate-800 bg-slate-950/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-100">
                      {t("closedTrades") || "Closed trades"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filteredTrades.length > 0 ? (
                        filteredTrades.map((trade) => {
                          const profit = trade.profit || 0;
                          const positive = profit >= 0;

                          return (
                              <div
                                  key={trade.id}
                                  className="rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-3 text-xs sm:px-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  {/* Left part: type + ticker */}
                                  <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                            trade.type === "BUY"
                                                ? "bg-emerald-500/20 text-emerald-300"
                                                : "bg-rose-500/20 text-rose-300"
                                        }`}
                                    >
                                      {trade.type === "BUY" ? (
                                          <TrendingUp className="h-4 w-4" />
                                      ) : (
                                          <TrendingDown className="h-4 w-4" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-slate-50">
                                        {trade.ticker}
                                      </div>
                                      <div className="text-[11px] text-slate-400">
                                        {trade.type} • {trade.volume} • x
                                        {trade.leverage} • {trade.assetType}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right stats */}
                                  <div className="grid flex-1 grid-cols-3 gap-3 text-[11px] sm:max-w-md sm:text-xs">
                                    <div>
                                      <div className="text-slate-400">
                                        {t("entry") || "Entry"}
                                      </div>
                                      <div className="font-medium text-slate-100">
                                        ${trade.openIn.toFixed(2)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-slate-400">
                                        {t("exit") || "Exit"}
                                      </div>
                                      <div className="font-medium text-slate-100">
                                        {trade.closeIn !== null
                                            ? `$${trade.closeIn.toFixed(2)}`
                                            : "N/A"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-slate-400">
                                        P&amp;L
                                      </div>
                                      <div
                                          className={`font-semibold ${
                                              positive
                                                  ? "text-emerald-400"
                                                  : "text-red-400"
                                          }`}
                                      >
                                        {positive ? "+" : ""}
                                        {profit.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-col justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-500 sm:flex-row">
                            <span>
                              {t("opened") || "Opened"}:{" "}
                              {new Date(
                                  trade.createdAt
                              ).toLocaleString()}
                            </span>
                                  <span>
                              {t("closed") || "Closed"}:{" "}
                                    {trade.endAt
                                        ? new Date(
                                            trade.endAt
                                        ).toLocaleString()
                                        : "N/A"}
                            </span>
                                </div>
                              </div>
                          );
                        })
                    ) : (
                        <div className="py-6 text-center text-xs text-slate-400">
                          {t("noClosedTrades") || "No closed trades found."}
                        </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* DEPOSITS / WITHDRAWALS TAB */}
            <TabsContent value="transactions" className="space-y-5 pt-2">
              {/* Filters */}
              <motion.div
                  {...fadeUp(0.08)}
                  className="flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                      placeholder={
                          t("searchTransactions") ||
                          "Search by method, bank or card"
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 border-slate-800 bg-slate-950/80 pl-9 text-xs sm:text-sm"
                  />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 w-full border-slate-800 bg-slate-950/80 text-xs sm:w-36 sm:text-sm">
                    <SelectValue
                        placeholder={t("filterByType") || "Type"}
                    />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-950">
                    <SelectItem value="all">
                      {t("allTypes") || "All types"}
                    </SelectItem>
                    <SelectItem value="deposit">
                      {t("deposits") || "Deposits"}
                    </SelectItem>
                    <SelectItem value="withdraw">
                      {t("withdrawals") || "Withdrawals"}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 w-full border-slate-800 bg-slate-950/80 text-xs sm:w-40 sm:text-sm">
                    <SelectValue
                        placeholder={t("filterByStatus") || "Status"}
                    />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-950">
                    <SelectItem value="all">
                      {t("allStatus") || "All status"}
                    </SelectItem>
                    <SelectItem value="successful">
                      {t("successful") || "Successful"}
                    </SelectItem>
                    <SelectItem value="pending">
                      {t("pending") || "Pending"}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("cancelled") || "Cancelled"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Orders list */}
              <motion.div {...fadeUp(0.12)}>
                <Card className="border-slate-800 bg-slate-950/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-100">
                      {t("depositWithdrawalHistory") ||
                          "Deposit & withdrawal history"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => {
                          const isDeposit = order.type === "DEPOSIT";

                          const statusVariant =
                              order.status === "SUCCESSFUL"
                                  ? "default"
                                  : order.status === "PENDING"
                                      ? "secondary"
                                      : "destructive";

                          return (
                              <div
                                  key={order.id}
                                  className="rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-3 text-xs sm:px-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  {/* Icon + type */}
                                  <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                            isDeposit
                                                ? "bg-emerald-500/15 text-emerald-300"
                                                : "bg-rose-500/15 text-rose-300"
                                        }`}
                                    >
                                      {isDeposit ? (
                                          <ArrowDownCircle className="h-4 w-4" />
                                      ) : (
                                          <ArrowUpCircle className="h-4 w-4" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-slate-50">
                                        {isDeposit
                                            ? t("deposit") || "Deposit"
                                            : t("withdrawal") || "Withdrawal"}
                                      </div>
                                      <div className="text-[11px] text-slate-400">
                                        {order.depositFrom ||
                                            order.withdrawMethod ||
                                            "-"}
                                        {order.bankName &&
                                            ` • ${order.bankName}`}
                                        {order.cardNumber &&
                                            ` • ${order.cardNumber}`}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Details */}
                                  <div className="grid flex-1 grid-cols-2 gap-3 text-[11px] sm:max-w-md sm:grid-cols-3 sm:text-xs">
                                    <div>
                                      <div className="text-slate-400">
                                        {t("amount") || "Amount"}
                                      </div>
                                      <div className="font-semibold text-slate-100">
                                        ${order.amount.toLocaleString()}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-slate-400">
                                        {t("method") || "Method"}
                                      </div>
                                      <div className="font-medium text-slate-100">
                                        {order.depositFrom ||
                                            order.withdrawMethod ||
                                            "-"}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-slate-400">
                                        {t("date") || "Date"}
                                      </div>
                                      <div className="font-medium text-slate-100">
                                        {new Date(
                                            order.createdAt
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>

                                  <Badge
                                      variant={statusVariant}
                                      className="self-start text-[10px] uppercase tracking-wide"
                                  >
                                    {order.status}
                                  </Badge>
                                </div>

                                {order.cryptoAddress && (
                                    <div className="mt-3 border-t border-slate-800 pt-2 text-[11px] text-slate-500">
                                      <div className="flex flex-col justify-between gap-1 sm:flex-row">
                                <span>
                                  {t("address") || "Address"}:{" "}
                                  {order.cryptoAddress}
                                </span>
                                        <span>
                                  {t("network") || "Network"}:{" "}
                                          {order.cryptoNetwork || "-"}
                                </span>
                                      </div>
                                    </div>
                                )}
                              </div>
                          );
                        })
                    ) : (
                        <div className="py-6 text-center text-xs text-slate-400">
                          {t("noTransactionsFound") ||
                              "No transactions found for the selected filters."}
                        </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
  );
}
