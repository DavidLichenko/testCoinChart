"use client";

import {useEffect, useState} from "react";
import {motion} from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Shield,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {toast} from "@/components/toast";
import Link from "next/link";
import {updateBalance} from "@/app/actions/updateBalance";
import {useTickers} from "@/hooks/market-data";
import {useAuth} from "@/components/auth-provider";
import {useI18n} from "@/components/i18n-provider";
import {PerformanceWidget} from "./dashboard/performance-widget";

interface UserStats {
  totalBalance: number;
  totalPnL: number;
  totalPnLPercent: number;
  activeTradesCount: number;
  winRate: number;
  isVerified: boolean;
  canWithdraw: boolean;
  memberSince: string;
  status: string;
  blocked: boolean;
}

interface ActiveTrade {
  id: string;
  ticker: string;
  type: "BUY" | "SELL";
  volume: number;
  margin: number;
  leverage: number;
  openIn: number;
  openInA: number;
  profit: number | null;
  status: string;
  assetType: string;
  createdAt: string;
}

interface Order {
  id: string;
  type: "DEPOSIT" | "WITHDRAW";
  status: string;
  amount: number;
  depositFrom?: string;
  withdrawMethod?: string;
  bankName?: string;
  cardNumber?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const { tickers } = useTickers();

  // Для Market movers – предыдущие цены, чтобы считать направление
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const statsResponse = await fetch("/api/user/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats(statsData);
        }

        const balanceResponse = await fetch("/api/user/balance");
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setUserId(balanceData.userId);
        }

        const tradesResponse = await fetch("/api/trades/active");
        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json();
          setActiveTrades(tradesData.slice(0, 5));
        }

        const ordersResponse = await fetch("/api/orders");
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setRecentOrders(ordersData.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCloseTrade = async (tradeId: string, currentPrice: number) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closePrice: currentPrice }),
      });

      if (response.ok) {
        toast({
          title: "Trade Closed Successfully",
          description: `Your trade has been closed at $${currentPrice.toFixed(
              2
          )}`,
          variant: "default",
        });

        const tradesResponse = await fetch("/api/trades/active");
        if (tradesResponse.ok) {
          const data = await tradesResponse.json();
          setActiveTrades(data.slice(0, 5));
        }

        const balanceResponse = await fetch("/api/user/balance");
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          await updateBalance(userId, balanceData.totalBalance);
        }

        const statsResponse = await fetch("/api/user/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats(statsData);
        }
      } else {
        toast({
          title: "Error Closing Trade",
          description: "Failed to close the trade. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error closing trade:", error);
      toast({
        title: "Error Closing Trade",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Auto-close логика
  useEffect(() => {
    if (!activeTrades.length || !userStats) return;

    const checkForAutoClose = async () => {
      for (const trade of activeTrades) {
        const currentPrice =
            Number(
                tickers.find((d: any) => d.symbol === trade.ticker)?.bid
            ) || trade.openIn;

        const profit =
            trade.type === "BUY"
                ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
                : (trade.openIn - currentPrice) * trade.volume * trade.leverage;

        if (profit < 0 && Math.abs(profit) >= userStats.totalBalance) {
          try {
            const tradeResponse = await fetch(`/api/trades/active`);
            if (tradeResponse.ok) {
              const activeTradesData = await tradeResponse.json();
              const isStillActive = activeTradesData.some(
                  (t: any) => t.id === trade.id
              );
              if (!isStillActive) continue;
            }

            const response = await fetch(`/api/trades/${trade.id}/close`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ closePrice: currentPrice }),
            });

            if (response.ok) {
              toast({
                title: "Auto-Close Alert",
                description: `Your ${trade.ticker} trade was automatically closed due to insufficient balance.`,
                variant: "destructive",
              });

              await updateBalance(userId, 0);

              const tradesResponse = await fetch("/api/trades/active");
              if (tradesResponse.ok) {
                const data = await tradesResponse.json();
                setActiveTrades(data.slice(0, 5));
              }

              const statsResponse = await fetch("/api/user/stats");
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setUserStats(statsData);
              }

              break;
            }
          } catch (error) {
            console.error("Error auto-closing trade:", error);
          }
        }
      }
    };

    checkForAutoClose();
  }, [activeTrades, userStats, tickers, userId]);

  // обновляем prevPrices для market movers
  useEffect(() => {
    if (!tickers || !tickers.length) return;
    setPrevPrices((prev) => {
      const next = { ...prev };
      for (const t of tickers as any[]) {
        const symbol = t.symbol;
        const price = Number(t.bid ?? 0);
        if (!symbol || !price) continue;
        if (!(symbol in next)) {
          next[symbol] = price;
        }
      }
      return next;
    });
  }, [tickers]);

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto" />
            <p className="mt-4 text-slate-400">{t("loadingDashboard")}</p>
          </div>
        </div>
    );
  }

  const balance = userStats?.totalBalance ?? 0;
  const pnl = userStats?.totalPnL ?? 0;
  const pnlPercent = userStats?.totalPnLPercent ?? 0;
  const winRate = userStats?.winRate ?? 0;

  // простые декоративные sparklines (можно заменить реальными данными)
  const sparklinePath = "M2 14 L8 8 L14 10 L20 5 L26 9 L32 4";

  // --- Portfolio breakdown по activeTrades.assetType ---
  type Allocation = { label: string; key: string; value: number; color: string };
  const allocations: Allocation[] = [
    { key: "Crypto", label: "Crypto", value: 0, color: "#a855f7" },
    { key: "Forex", label: "Forex", value: 0, color: "#22c55e" },
    { key: "IEX", label: "Stocks", value: 0, color: "#38bdf8" },
    { key: "Metal", label: "Metals", value: 0, color: "#f97316" },
  ];

  activeTrades.forEach((trade) => {
    const exposure = Math.abs(trade.openIn * trade.volume * trade.leverage);
    const idx = allocations.findIndex((a) => a.key === trade.assetType);
    if (idx >= 0) allocations[idx].value += exposure;
  });

  const totalExposure = allocations.reduce((acc, a) => acc + a.value, 0);
  const allocationsWithPercent = allocations.map((a) => ({
    ...a,
    percent: totalExposure ? (a.value / totalExposure) * 100 : 0,
  }));

  // gradient для круговой диаграммы
  const gradientSegments: string[] = [];
  let currentAngle = 0;
  allocationsWithPercent.forEach((a) => {
    if (!a.percent) return;
    const start = currentAngle;
    const end = currentAngle + (a.percent / 100) * 360;
    gradientSegments.push(
        `${a.color} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`
    );
    currentAngle = end;
  });
  const pieBackground =
      gradientSegments.length > 0
          ? `conic-gradient(${gradientSegments.join(", ")})`
          : "radial-gradient(circle at 30% 20%, rgba(148,163,255,0.4), transparent 55%), #020617";

  // --- Market movers: фиксированный набор символов ---
  const featuredSymbols = ["BTCUSD", "ETHUSD", "AAPL.NAS"];
  const marketMovers = featuredSymbols
      .map((sym) => {
        const t = (tickers as any[])?.find((x) => x.symbol === sym);
        if (!t) return null;
        const price = Number(t.bid ?? 0);
        const prev = prevPrices[sym] ?? price;
        const diff = price - prev;
        const percent = prev ? (diff / prev) * 100 : 0;
        return {
          symbol: sym,
          price,
          diff,
          percent,
        };
      })
      .filter(Boolean) as {
    symbol: string;
    price: number;
    diff: number;
    percent: number;
  }[];

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#120626] via-[#1b1033] to-[#070316] text-white"
      >
        <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.22),_transparent_55%)]"/>
        <div className="relative mx-auto max-w-screen-2xl px-4 py-4 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">
          {/* TOP: приветствие + краткий summary */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("welcomeBack") || "Welcome back,"}{" "}
                <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                {user?.name || user?.email || "Trader"}
              </span>
              </h1>
              <p className="mt-1 text-xs text-slate-300 text-wrap sm:w-2/3 sm:text-sm">
                {t("dashboardSubtitle") ||
                    "Track your performance, monitor open positions and stay in sync with the market in one place."}
              </p>
            </div>

            <div className="hidden sm:block rounded-2xl bg-gradient-to-br from-purple-500/20 via-fuchsia-500/10 to-indigo-500/20 px-4 py-3 text-xs sm:text-sm ring-1 ring-purple-500/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-slate-300">{t("totalEquity")}</div>
                  <div className="text-lg font-semibold text-white">
                    ${balance.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300">{t("totalPnL")}</div>
                  <div
                      className={`text-lg font-semibold ${
                          pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                  >
                    {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN STATS with sparklines */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Total balance */}
            <StatCard
                title={t("totalEquity")}
                subtitle={
                  userStats?.canWithdraw
                      ? t("withdrawalStatusAvailable")
                      : t("withdrawalStatusRestricted")
                }
                icon={<DollarSign className="h-4 w-4 text-purple-200" />}
                value={`$${balance.toLocaleString()}`}
                valueClass=""
                sparklinePath={sparklinePath}
            />

            {/* PnL */}
            <StatCard
                title={t("totalPnL")}
                subtitle={`${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(
                    2
                )}% ${t("total")}`}
                icon={<TrendingUp className="h-4 w-4 text-purple-200" />}
                value={`${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toLocaleString()}`}
                valueClass={pnl >= 0 ? "text-emerald-400" : "text-red-400"}
                sparklinePath={sparklinePath}
            />

            {/* Active trades */}
            <StatCard
                title={t("activeTrades")}
                subtitle={`${activeTrades.length} ${t("positionsOpen")}`}
                icon={<Activity className="h-4 w-4 text-purple-200" />}
                value={(userStats?.activeTradesCount || 0).toString()}
                valueClass=""
                sparklinePath={sparklinePath}
            />

            {/* Win rate */}
            <StatCard
                title={t("winRate")}
                subtitle={t("winRateSubtitle") || "Win rate across closed trades."}
                icon={<Target className="h-4 w-4 text-purple-200" />}
                value={`${winRate.toFixed(1)}%`}
                valueClass=""
                sparklinePath={sparklinePath}
                extra={
                  <Progress
                      value={winRate}
                      className="mt-2 h-1.5 bg-slate-800"
                  />
                }
            />
          </div>

          {/* ACCOUNT STATUS + PORTFOLIO */}
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Account status */}
            <Card className="border-slate-800 bg-slate-950/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-4 w-4" />
                  {t("accountStatus")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-xl bg-slate-900/70 px-3 py-3 ring-1 ring-slate-800">
                    <div>
                      <div className="font-medium">
                        {t("verificationShort")}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {t("identityVerificationShort")}
                      </div>
                    </div>
                    <Badge
                        variant={userStats?.isVerified ? "default" : "destructive"}
                        className="text-[11px]"
                    >
                      {userStats?.isVerified
                          ? t("verified")
                          : t("notVerified")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-900/70 px-3 py-3 ring-1 ring-slate-800">
                    <div>
                      <div className="font-medium">
                        {t("memberSince")}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {t("accountCreation")}
                      </div>
                    </div>
                    <div className="flex items-center text-[11px] text-slate-200">
                      <Calendar className="mr-1 h-3 w-3" />
                      {userStats?.memberSince
                          ? new Date(
                              userStats.memberSince
                          ).toLocaleDateString()
                          : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  {!userStats?.isVerified && (
                      <Link href="/profile" className="underline">
                        {t("completeVerification")}
                      </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            <PerformanceWidget />
          </div>

          {/* ACTIVITY + MARKET MOVERS + QUICK ACTIONS */}
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Recent activity */}
            <Card className="border-slate-800 bg-slate-950/70 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Activity className="h-4 w-4" />
                  {t("recentActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Orders */}
                <div>
                  <h4 className="mb-2 text-xs font-medium text-slate-200 sm:text-sm">
                    {t("recentOrders")}
                  </h4>
                  {recentOrders.length > 0 ? (
                      recentOrders.slice(0, 3).map((order) => (
                          <div
                              key={order.id}
                              className="mb-2 flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 text-xs ring-1 ring-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                                      order.type === "DEPOSIT"
                                          ? "bg-emerald-500/80"
                                          : "bg-red-500/80"
                                  }`}
                              >
                                {order.type === "DEPOSIT" ? "+" : "-"}
                              </div>
                              <div>
                                <div className="font-medium text-slate-100">
                                  {order.type}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {order.depositFrom || order.withdrawMethod || "—"}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-slate-50">
                                ${order.amount.toLocaleString()}
                              </div>
                              <Badge
                                  variant={
                                    order.status === "SUCCESSFUL"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="mt-0.5 text-[10px]"
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                      ))
                  ) : (
                      <div className="py-3 text-center text-xs text-slate-400">
                        {t("noRecentOrders")}
                      </div>
                  )}
                </div>

                {/* Active trades */}
                <div>
                  <h4 className="mb-2 text-xs font-medium text-slate-200 sm:text-sm">
                    {t("activePositions")}
                  </h4>
                  {activeTrades.length > 0 ? (
                      activeTrades.slice(0, 3).map((trade) => {
                        const currentPrice =
                            Number(
                                (tickers as any[]).find(
                                    (d) => d.symbol === trade.ticker
                                )?.bid
                            ) || trade.openIn;
                        const profit =
                            trade.type === "BUY"
                                ? (currentPrice - trade.openIn) *
                                trade.volume *
                                trade.leverage
                                : (trade.openIn - currentPrice) *
                                trade.volume *
                                trade.leverage;

                        return (
                            <div
                                key={trade.id}
                                className="mb-2 flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 text-xs ring-1 ring-slate-800"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                                        trade.type === "BUY"
                                            ? "bg-emerald-500/80"
                                            : "bg-red-500/80"
                                    }`}
                                >
                                  {trade.type === "BUY" ? "B" : "S"}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-100">
                                    {trade.ticker}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {trade.volume} @ ${trade.openIn.toFixed(2)} · x
                                    {trade.leverage}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {t("currentLabel") || "Current"}: $
                                    {currentPrice.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                    className={`text-sm font-semibold ${
                                        profit >= 0
                                            ? "text-emerald-400"
                                            : "text-red-400"
                                    }`}
                                >
                                  {profit >= 0 ? "+" : "-"}$
                                  {Math.abs(profit).toFixed(2)}
                                </div>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCloseTrade(trade.id, currentPrice)}
                                    className="mt-1 h-6 px-2 text-[11px]"
                                >
                                  <X className="mr-1 h-3 w-3" />
                                  Close
                                </Button>
                              </div>
                            </div>
                        );
                      })
                  ) : (
                      <div className="py-3 text-center text-xs text-slate-400">
                        {t("noActiveTrades")}
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* RIGHT COLUMN: Market movers + Quick actions */}
            <div className="space-y-4">
              {/* Market movers */}
              <Card className="border-slate-800 bg-slate-950/70 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <TrendingUp className="h-4 w-4" />
                    {t("marketMoversTitle") || "Market movers"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs sm:text-sm">
                  {marketMovers.length ? (
                      marketMovers.map((m) => (
                          <div
                              key={m.symbol}
                              className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2 ring-1 ring-slate-800"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                          <span className="text-slate-100">
                            {m.symbol.replace(".NAS", "")}
                          </span>
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                            Live
                          </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                ${m.price.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right text-[11px]">
                              <div
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                                      m.diff >= 0
                                          ? "bg-emerald-500/10 text-emerald-300"
                                          : "bg-red-500/10 text-red-300"
                                  }`}
                              >
                                {m.diff >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                )}
                                <span>
                            {m.percent >= 0 ? "+" : ""}
                                  {m.percent.toFixed(2)}%
                          </span>
                              </div>
                            </div>
                          </div>
                      ))
                  ) : (
                      <div className="py-3 text-center text-xs text-slate-400">
                        {t("noMarketMovers") ||
                            "Live market data is not available at the moment."}
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card className="border-slate-800 bg-slate-950/70 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Target className="h-4 w-4" />
                    {t("quickActions")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 flex-col flex gap-0.5 text-xs sm:text-sm">
                  <Link href="/market">
                    <Button className="h-9 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-xs font-semibold shadow-purple-500/40 hover:brightness-110">
                      <Activity className="mr-2 h-4 w-4" />
                      {t("startTrading")}
                    </Button>
                  </Link>

                  <Link href="/transactions">
                    <Button
                        variant="outline"
                        className="h-9 w-full border-slate-700 bg-slate-900/80 text-xs hover:border-purple-400"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {t("viewTransactions")}
                    </Button>
                  </Link>

                  <Link href="/profile">
                    <Button
                        variant="outline"
                        className="h-9 w-full border-slate-700 bg-slate-900/80 text-xs hover:border-purple-400"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {t("completeVerification")}
                    </Button>
                  </Link>

                  {userStats?.canWithdraw && (
                      <Link href="/profile">
                        <Button
                            variant="outline"
                            className="h-9 w-full border-slate-700 bg-slate-900/80 text-xs hover:border-purple-400"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {t("withdrawFunds")}
                        </Button>
                      </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
  );
}

/**
 * Вспомогательная карточка для верхних метрик со спарклайном
 */
interface StatCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  value: string;
  valueClass?: string;
  sparklinePath?: string;
  extra?: React.ReactNode;
}

function StatCard({
                    title,
                    subtitle,
                    icon,
                    value,
                    valueClass,
                    sparklinePath,
                    extra,
                  }: StatCardProps) {
  return (
      <Card className="border-slate-800 bg-slate-950/70 backdrop-blur">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-xs font-medium text-slate-300">
              {title}
            </CardTitle>
            {subtitle && (
                <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10">
            {icon}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div
              className={`text-lg font-semibold text-slate-50 sm:text-xl ${
                  valueClass || ""
              }`}
          >
            {value}
          </div>
          {sparklinePath && (
              <div className="mt-2 h-8 w-full">
                <svg
                    viewBox="0 0 34 16"
                    className="h-full w-full text-purple-400/80"
                >
                  <path
                      d={sparklinePath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  />
                </svg>
              </div>
          )}
          {extra}
        </CardContent>
      </Card>
  );
}
