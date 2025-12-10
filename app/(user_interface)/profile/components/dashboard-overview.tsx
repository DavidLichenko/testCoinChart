"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { useBalance } from "@/hooks/useBalance";
import {
  TrendingUp,
  Wallet,
  Activity,
  Users,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import LinkBox from "@/components/link-box";

interface UserStats {
  totalBalance: number;
  totalPnL: number;
  totalPnLPercent: number;
  activeTradesCount: number;
  winRate: number;
  isVerified: boolean;
  canWithdraw: boolean;
  memberSince: string;
}

interface WalletSummary {
  totalBalance: number;
  ownFunds: number;
  creditUsed: number;
  creditLimit: number;
  availableToTrade: number;
  baseCurrency: string;
  approxUsd?: number;
}

export function DashboardOverview() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { balance, liveProfit } = useBalance();

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [statsResponse, walletResponse] = await Promise.all([
          fetch("/api/user/stats"),
          fetch("/api/wallet/summary"),
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats(statsData);
        }

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          setWalletSummary(walletData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalEquity = balance + liveProfit;
  const pnl = userStats?.totalPnL ?? 0;
  const pnlPercent = userStats?.totalPnLPercent ?? 0;
  const winRate = userStats?.winRate ?? 0;
  const activeTrades = userStats?.activeTradesCount ?? 0;

  if (loading) {
    return (
        <div className="space-y-4 sm:space-y-6">
          <div className="h-16 sm:h-20 rounded-sm bg-[#0b0b18] border border-[#17172b] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="h-24 rounded-sm bg-[#0b0b18] border border-[#17172b] animate-pulse"
                />
            ))}
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <header className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-50 tracking-tight">
                {t("dashboard")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t("dashboardSubtitle")}
              </p>
            </div>

            {userStats?.memberSince && (
                <div className="inline-flex items-center gap-2 rounded-sm border border-[#242443] bg-[#080815] px-3 py-1.5 text-[11px] text-slate-300">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/15 text-[10px] text-violet-300">
                ⓘ
              </span>
                  <div className="flex flex-col">
                <span className="uppercase tracking-[0.12em] text-[10px] text-slate-500">
                  {t("memberSinceLabel") ?? "Member since"}
                </span>
                    <span className="font-medium">
                  {new Date(userStats.memberSince).toLocaleDateString()}
                </span>
                  </div>
                </div>
            )}
          </div>
        </header>

        {/* Primary stats row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total equity */}
          <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <CardContent className="px-4 sm:px-5 py-4 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {t("totalEquity")}
                  </p>
                  <p className="mt-2 text-lg sm:text-xl font-semibold text-slate-50">
                    ${totalEquity.toFixed(2)}
                  </p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-violet-500/15 text-violet-300">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Realized PnL */}
          <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <CardContent className="px-4 sm:px-5 py-4 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {t("totalPnL")}
                  </p>
                  <p
                      className={`mt-2 text-lg sm:text-xl font-semibold ${
                          pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                  >
                    {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Percent className="h-3 w-3 text-slate-500" />
                    <span
                        className={
                          pnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                        }
                    >
                    {pnlPercent >= 0 ? "+" : "-"}
                      {Math.abs(pnlPercent).toFixed(2)}%
                  </span>
                  </p>
                </div>
                <div
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-sm ${
                        pnl >= 0
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-rose-500/15 text-rose-300"
                    }`}
                >
                  {pnl >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                  ) : (
                      <ArrowDownRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active trades */}
          <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <CardContent className="px-4 sm:px-5 py-4 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {t("activeTrades")}
                  </p>
                  <p className="mt-2 text-lg sm:text-xl font-semibold text-slate-50">
                    {activeTrades}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {t("openPositionsLabel") ?? "Open positions"}
                  </p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-sky-500/15 text-sky-300">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Win rate */}
          <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <CardContent className="px-4 sm:px-5 py-4 sm:py-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {t("winRate")}
                  </p>
                  <p className="mt-2 text-lg sm:text-xl font-semibold text-slate-50">
                    {winRate.toFixed(1)}%
                  </p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-amber-500/15 text-amber-300">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <Progress
                  value={winRate}
                  className="h-1.5 bg-[#111122] [&>div]:bg-amber-400"
              />
            </CardContent>
          </Card>
        </section>

        {/* Lower grid: wallet snapshot + account blocks */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 sm:gap-5">
          {/* Wallet snapshot */}
          <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <CardContent className="px-4 sm:px-5 py-4 sm:py-5 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {t("walletOverview") ?? "Wallet overview"}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {t("manageYourAssets")}
                  </p>
                </div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-emerald-500/15 text-emerald-300">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>

              {walletSummary && (
                  <div className="space-y-4">
                    <div className="rounded-sm border border-[#20203a] bg-[#080818]/80 px-3 sm:px-4 py-3 sm:py-3.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                            {t("totalBalance")}
                          </p>
                          <p className="mt-1.5 text-base sm:text-lg font-semibold text-slate-50">
                            {walletSummary.totalBalance.toFixed(2)}{" "}
                            {walletSummary.baseCurrency}
                          </p>
                        </div>
                        {walletSummary.baseCurrency === "EUR" &&
                            walletSummary.approxUsd && (
                                <p className="text-[11px] text-slate-500 text-right">
                                  ≈ ${walletSummary.approxUsd.toFixed(2)} USD
                                </p>
                            )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-sm border border-[#20203a] bg-[#080818]/80 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                          {t("availableToTrade")}
                        </p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-50">
                          {walletSummary.availableToTrade.toFixed(2)}{" "}
                          {walletSummary.baseCurrency}
                        </p>
                      </div>

                      <div className="rounded-sm border border-[#20203a] bg-[#080818]/80 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                          {t("creditLine") ?? "Credit line"}
                        </p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-50">
                          {walletSummary.creditUsed.toFixed(2)} /{" "}
                          {walletSummary.creditLimit.toFixed(2)}{" "}
                          {walletSummary.baseCurrency}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <LinkBox
                          href="/wallet"
                          name={t("openWallet")}
                          icon={<ArrowUpRight className="h-4 w-4" />}
                          color="hover:bg-[#14b8a6]/10"
                          bg="bg-[#14b8a6]/10"
                      />
                      <LinkBox
                          href="/profile/deposits"
                          name={t("depositFunds")}
                          icon={<ArrowUpRight className="h-4 w-4" />}
                          color="hover:bg-[#22c55e]/10"
                          bg="bg-[#22c55e]/10"
                      />
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Account status / referrals */}
          <div className="space-y-4 sm:space-y-5">
            {/* Account status */}
            <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
              <CardContent className="px-4 sm:px-5 py-4 sm:py-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      {t("accountStatus") ?? "Account status"}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-300">
                      {userStats?.isVerified
                          ? t("accountVerified") ?? "Your account is verified"
                          : t("verificationRequired") ??
                          "Complete verification to unlock limits"}
                    </p>
                  </div>
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-cyan-500/15 text-cyan-300">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <LinkBox
                      href="/profile/verification"
                      name={
                        userStats?.isVerified
                            ? t("checkStatus")
                            : t("startVerification")
                      }
                      icon={<ArrowUpRight className="h-4 w-4" />}
                      color="hover:bg-[#22d3ee]/10"
                      bg="bg-[#22d3ee]/10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Referrals mini block */}
            <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
              <CardContent className="px-4 sm:px-5 py-4 sm:py-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      {t("referrals")}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-300">
                      {t("inviteFriendsEarnRewards")}
                    </p>
                  </div>
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-amber-500/15 text-amber-300">
                    <Users className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <LinkBox
                      href="/profile/referrals"
                      name={t("manageReferrals")}
                      icon={<ArrowUpRight className="h-4 w-4" />}
                      color="hover:bg-[#fbbf24]/10"
                      bg="bg-[#fbbf24]/10"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
  );
}
