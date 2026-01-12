/**
 * i18n КЛЮЧИ, КОТОРЫЕ ИСПОЛЬЗУЮТСЯ НА ЭТОЙ СТРАНИЦЕ
 *
 * Уже были (у тебя они есть):
 * - signIn
 * - signUp
 * - nextGenTradingPlatform
 * - realTimeMarketData
 * - tradeSmarter
 * - notHarder
 * - joinThousandsDescription
 * - startTradingNow
 * - watchDemo
 * - activeTraders
 * - dailyVolume
 * - successRate
 * - countries
 * - liveTradingStats
 * - joinLiveTrading
 * - advancedTrading
 * - advancedTradingDesc
 * - securePlatform
 * - securePlatformDesc
 * - lightningFast
 * - lightningFastDesc
 * - marketAnalysis
 * - marketAnalysisDesc
 * - expertSupport
 * - expertSupportDesc
 * - premiumFeatures
 * - premiumFeaturesDesc
 * - whyChoose
 * - aragonTrade
 * - experienceFutureDescription
 * - readyToStart
 * - tradingJourney
 * - joinThousandsSuccessful
 * - createFreeAccount
 * - allRightsReserved
 * - termsOfConditions
 * - privacyPolicy
 *
 * Новые ключи (можешь добавить их в i18n так, как удобно):
 * - institutionalTag: "Institutional trading platform"
 * - trustedByTraders: "Trusted by active traders worldwide"
 * - stepCreateAccount: "Create your account in minutes"
 * - stepFundAccount: "Fund your balance with your preferred method"
 * - stepStartTrading: "Start trading with real-time analytics"
 * - howItWorksTitle: "How AragonTrade works"
 * - howItWorksSubtitle: "A simple path from registration to execution."
 * - educationBlockTitle: "Built for learning and long–term success"
 * - educationBlockDesc: "Whether you're a beginner or an active trader, AragonTrade gives you structure, tools, and guidance."
 * - educationItemAcademy: "Structured education and trading basics"
 * - educationItemIdeas: "Idea flows and strategy breakdowns"
 * - educationItemSupport: "1:1 support from our team"
 * - globalCoverageTitle: "Global market access"
 * - globalCoverageDesc: "Trade major forex pairs, crypto, and US stocks from a single dashboard."
 */

"use client";

import React, { useEffect, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Star,
  BookOpen,
  Globe2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { useI18n } from "@/components/i18n-provider";

interface PriceData {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
}

export default function WelcomePage({
                                      onAuthSuccess,
                                    }: {
  onAuthSuccess: () => void;
}) {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { t } = useI18n();

  const features = [
    {
      icon: BarChart3,
      title: t("advancedTrading"),
      description: t("advancedTradingDesc"),
    },
    {
      icon: Shield,
      title: t("securePlatform"),
      description: t("securePlatformDesc"),
    },
    {
      icon: Zap,
      title: t("lightningFast"),
      description: t("lightningFastDesc"),
    },
    {
      icon: TrendingUp,
      title: t("marketAnalysis"),
      description: t("marketAnalysisDesc"),
    },
    {
      icon: Users,
      title: t("expertSupport"),
      description: t("expertSupportDesc"),
    },
  ];

  const stats = [
    { label: t("activeTraders"), value: "20K+" },
    { label: t("dailyVolume"), value: "$2.5M" },
    { label: t("successRate"), value: "84%" },
    { label: t("countries"), value: "150+" },
  ];

  // ─── Загрузка цен ─────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchLastPrices() {
      try {
        setLoading(true);

        const [btcResponse, ethResponse, aaplResponse] = await Promise.all([
          fetch(
              "https://https://b7e852d78a9f.ngrok-free.app/candles?symbol=BTCUSD&timeframe=D1&count=2"
          ),
          fetch(
              "https://https://b7e852d78a9f.ngrok-free.app/candles?symbol=ETHUSD&timeframe=D1&count=2"
          ),
          fetch(
              "https://https://b7e852d78a9f.ngrok-free.app/candles?symbol=AAPL.NAS&timeframe=D1&count=2"
          ),
        ]);

        const btcData = await btcResponse.json();
        const ethData = await ethResponse.json();
        const aaplData = await aaplResponse.json();

        const next: PriceData[] = [];

        const pushSymbol = (label: string, data: any[]) => {
          if (!data || data.length < 2) return;
          const current = data[0].close;
          const prev = data[1].close;
          const changePercent = ((current - prev) / prev) * 100;
          const positive = changePercent >= 0;
          next.push({
            symbol: label,
            price: current.toFixed(2),
            change: `${positive ? "+" : ""}${changePercent.toFixed(2)}%`,
            positive,
          });
        };

        pushSymbol("BTC / USD", btcData);
        pushSymbol("ETH / USD", ethData);
        pushSymbol("AAPL", aaplData);

        if (next.length === 0) {
          const fallback = [
            {
              symbol: "BTC / USD",
              price: "—",
              change: "0.00%",
              positive: true,
            },
            {
              symbol: "ETH / USD",
              price: "—",
              change: "0.00%",
              positive: true,
            },
            {
              symbol: "AAPL",
              price: "—",
              change: "0.00%",
              positive: true,
            },
          ];
          setPrices(fallback);
          setSelectedSymbol(fallback[0].symbol);
        } else {
          setPrices(next);
          setSelectedSymbol(next[0].symbol);
        }
      } catch (e) {
        console.error("Failed to fetch prices:", e);
        const fallback = [
          {
            symbol: "BTC / USD",
            price: "—",
            change: "0.00%",
            positive: true,
          },
          {
            symbol: "ETH / USD",
            price: "—",
            change: "0.00%",
            positive: true,
          },
          {
            symbol: "AAPL",
            price: "—",
            change: "0.00%",
            positive: true,
          },
        ];
        setPrices(fallback);
        setSelectedSymbol(fallback[0].symbol);
      } finally {
        setLoading(false);
      }
    }

    fetchLastPrices();
  }, []);

  const handleRegisterSuccess = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    onAuthSuccess();
  };

  // ─── Переключение форм ────────────────────────────────────────────────
  if (showLogin) {
    return (
        <LoginForm
            onSwitchToRegister={() => {
              setShowLogin(false);
              setShowRegister(true);
            }}
            onSuccess={handleLoginSuccess}
        />
    );
  }

  if (showRegister) {
    return (
        <RegisterForm
            onSwitchToLogin={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
            onSuccess={handleRegisterSuccess}
        />
    );
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay, ease: "easeOut" },
    },
  });

  const selectedPrice =
      prices.find((p) => p.symbol === selectedSymbol) || prices[0];

  // ─── UI ────────────────────────────────────────────────────────────────
  return (
      <MotionConfig transition={{ duration: 0.3, ease: "easeOut" }}>
        <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#090b1a] to-[#05040c] text-white">
          {/* Лёгкие фоновые блики, но не жёсткий неон */}
          <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute -top-24 left-[-8%] h-72 w-72 rounded-full bg-purple-500/25 blur-3xl" />
            <div className="absolute top-10 right-[-10%] h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute bottom-[-12%] left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto flex min-h-screen max-w-screen-2xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
            {/* HEADER + компактный верх */}
            <motion.header
                {...fadeUp(0)}
                className="mb-8 flex flex-row  justify-between gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-0 flex-col md:items-start">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center">
                    <img src={'/logo.png'} className="h-14 w-14 text-white"/>
                  </div>
                  <span className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                  ARAGON<br/>TRADE
                </span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="hidden md:block md:text-[11px] text-slate-200/80">
                  {t("institutionalTag")}
                </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    onClick={() => setShowLogin(true)}
                    className="border-slate-500/60 bg-slate-900/60 text-xs font-medium text-slate-100 hover:border-purple-400 hover:bg-slate-900"
                >
                  {t("signIn")}
                </Button>
                <Button
                    onClick={() => setShowRegister(true)}
                    className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 px-5 text-xs font-semibold shadow-md shadow-purple-500/40 hover:brightness-110"
                >
                  {t("signUp")}
                </Button>
              </div>
            </motion.header>

            {/* HERO БЛОК: две колонки, более светлый центр */}
            <motion.section
                {...fadeUp(0.05)}
                className="mb-14 grid gap-8 rounded-3xl border border-slate-700/60 bg-slate-900/70 px-5 py-7 shadow-xl shadow-black/40 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
            >
              {/* ЛЕВАЯ КОЛОНКА */}
              <div className="flex flex-col gap-7">

                <div className="space-y-4">
                  <h1 className="text-balance text-4xl font-semibold sm:leading-[1.2] leading-tight tracking-tight sm:text-5xl lg:text-[3.1rem]">
                    {t("tradeSmarter")}{" "}
                    <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-200 bg-clip-text text-transparent">
                    {t("notHarder")}
                  </span>
                  </h1>
                  <p className="max-w-xl text-balance text-sm text-slate-200/85 sm:text-base">
                    {t("joinThousandsDescription")}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex flex-col gap-3 sm:flex-row sm:w-1/2">
                  <Button
                      size="lg"
                      onClick={() => setShowRegister(true)}
                      className="flex-1 py-2 sm:py-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-sm font-semibold shadow-lg shadow-purple-500/40 hover:brightness-110"
                  >
                    {t("startTradingNow")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>

                {/* Статистика в одну линию */}
                <div className="grid gap-4 rounded-2xl bg-slate-950/60 p-4 sm:grid-cols-4">
                  {stats.map((s) => (
                      <div
                          key={s.label}
                          className="space-y-1 text-left sm:text-center"
                      >
                        <div className="text-[11px] text-slate-300/80">
                          {s.label}
                        </div>
                        <div className="text-lg font-semibold text-purple-200 sm:text-xl">
                          {s.value}
                        </div>
                      </div>
                  ))}
                </div>
              </div>

              {/* ПРАВАЯ КОЛОНКА: простая, чистая карточка рынка */}
              <div className="flex flex-col gap-4">
                {/* текущий выбранный инструмент */}
                <Card className="flex-1 border-slate-700/70 bg-slate-950/80 shadow-md">
                  <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          {t("liveTradingStats")}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {t("realTimeMarketData")}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300">
                      {t("joinLiveTrading")}
                    </span>
                    </div>

                    <div className="rounded-2xl bg-slate-900/80 p-4">
                      {loading || !selectedPrice ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3 w-20 rounded bg-slate-700/80" />
                            <div className="h-7 w-28 rounded bg-slate-700/80" />
                            <div className="h-3 w-16 rounded bg-slate-700/60" />
                          </div>
                      ) : (
                          <div className="flex items-end justify-between gap-4">
                            <div className="space-y-1">
                              <div className="text-[11px] uppercase tracking-wide text-slate-300">
                                {selectedPrice.symbol}
                              </div>
                              <div className="text-2xl font-semibold text-white">
                                {selectedPrice.price}
                              </div>
                              <div className="text-[11px] text-slate-400">24h</div>
                            </div>
                            <div
                                className={`text-right text-sm font-semibold ${
                                    selectedPrice.positive
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                }`}
                            >
                              <div>{selectedPrice.change}</div>
                              <div className="text-[10px] text-slate-400">
                                24h change
                              </div>
                            </div>
                          </div>
                      )}
                    </div>

                    {/* компактный список остальных инструментов */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                      {prices.map((p) => (
                          <button
                              key={p.symbol}
                              onClick={() => setSelectedSymbol(p.symbol)}
                              className={`rounded-xl border bg-slate-900/80 px-2 py-2 text-left transition-all ${
                                  selectedSymbol === p.symbol
                                      ? "border-purple-400/80"
                                      : "border-slate-700/70 hover:border-purple-400/60"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[10px]">
                            {p.symbol}
                          </span>
                              <span
                                  className={`text-[10px] ${
                                      p.positive ? "text-emerald-400" : "text-red-400"
                                  }`}
                              >
                            {p.change}
                          </span>
                            </div>
                            <div className="text-xs text-slate-300 mt-1">
                              {p.price}
                            </div>
                          </button>
                      ))}
                    </div>

                    <Button
                        onClick={() => setShowRegister(true)}
                        className="mt-1 w-full bg-purple-600 text-xs font-semibold hover:bg-purple-700"
                    >
                      {t("startTradingNow")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            {/* БЛОК 1: How it works (НОВЫЙ) */}
            <motion.section
                {...fadeUp(0.08)}
                className="mb-12 rounded-3xl border border-slate-800/70 bg-slate-900/70 px-5 py-7 sm:px-8"
            >
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">
                    {t("howItWorksTitle") || "How AragonTrade works"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {t("howItWorksSubtitle") ||
                        "A simple path from registration to your first trade."}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    step: 1,
                    label:
                        t("stepCreateAccount") ||
                        "Create your account in minutes",
                  },
                  {
                    step: 2,
                    label:
                        t("stepFundAccount") ||
                        "Fund your balance with your preferred method",
                  },
                  {
                    step: 3,
                    label:
                        t("stepStartTrading") ||
                        "Start trading with real-time analytics",
                  },
                ].map((s) => (
                    <div
                        key={s.step}
                        className="flex items-start gap-3 rounded-2xl bg-slate-950/70 px-4 py-4 ring-1 ring-slate-700/70"
                    >
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-xs font-semibold">
                        {s.step}
                      </div>
                      <div className="text-xs text-slate-200">{s.label}</div>
                    </div>
                ))}
              </div>
            </motion.section>

            {/* БЛОК 2: FEATURES (как раньше, но чище) */}
            <motion.section
                {...fadeUp(0.1)}
                className="mb-12 border-t border-slate-800/70 pt-10"
            >
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {t("whyChoose")}{" "}
                  <span className="bg-gradient-to-r from-purple-300 to-indigo-200 bg-clip-text text-transparent">
                  {t("aragonTrade")}
                </span>
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                  {t("experienceFutureDescription")}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                        whileHover={{
                          y: -3,
                          scale: 1.01,
                          transition: { duration: 0.12, ease: "easeOut" },
                        }}
                        className="will-change-transform"
                    >
                      <Card className="h-full border-slate-800/80 bg-slate-900/80">
                        <CardContent className="flex h-full flex-col gap-4 p-6">
                          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600/15 ring-1 ring-purple-500/40">
                            <feature.icon className="h-5 w-5 text-purple-200" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-white">
                              {feature.title}
                            </h3>
                            <p className="text-xs text-slate-300">
                              {feature.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                ))}
              </div>
            </motion.section>

            {/* БЛОК 3: Education / Support (НОВЫЙ) */}
            <motion.section
                {...fadeUp(0.12)}
                className="mb-12 grid gap-8 rounded-3xl border border-slate-800/70 bg-slate-900/75 px-5 py-7 sm:px-8 md:grid-cols-[1.05fr_0.95fr]"
            >
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-[11px] text-slate-100/90">
                  <BookOpen className="h-3.5 w-3.5 text-purple-200" />
                  <span>
                  {t("educationBlockTitle") ||
                      "Built for learning and long–term success"}
                </span>
                </div>
                <p className="text-sm text-slate-200">
                  {t("educationBlockDesc") ||
                      "Whether you're just starting out or actively trading every day, AragonTrade gives you structure, tools, and guidance to improve your decisions over time."}
                </p>
                <ul className="mt-2 space-y-2 text-xs text-slate-200">

                  <li>
                    •{" "}
                    {t("educationItemIdeas") ||
                        "Regular idea flows and strategy breakdowns."}
                  </li>
                  <li>
                    •{" "}
                    {t("educationItemSupport") ||
                        "1:1 support from our team when you need it most."}
                  </li>
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
                  <div className="text-xs font-semibold text-slate-200">
                    {t("globalCoverageTitle") || "Global market access"}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {t("globalCoverageDesc") ||
                        "Trade major forex pairs, crypto, and US stocks from a single dashboard."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-200">
                  <span className="rounded-full bg-slate-800/80 px-3 py-1">
                    Forex
                  </span>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1">
                    Crypto
                  </span>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1">
                    Stocks
                  </span>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Globe2 className="h-4 w-4 text-purple-200" />
                    <span>{t("trustedByTraders")}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {t("joinThousandsSuccessful")}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-slate-200">
                    <div>
                      <div className="text-lg font-semibold text-purple-200">
                        24/5
                      </div>
                      <div className="text-slate-400">Trading sessions</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-200">
                        {stats[3].value}
                      </div>
                      <div className="text-slate-400">Countries</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* БЛОК 4: Финальный CTA */}
            <motion.section
                {...fadeUp(0.14)}
                className="mb-8 rounded-3xl border border-slate-800/70 bg-slate-900/80 px-5 py-8 text-center sm:px-8"
            >
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("readyToStart")}{" "}
                <span className="bg-gradient-to-r from-purple-300 to-indigo-200 bg-clip-text text-transparent">
                {t("tradingJourney")}
              </span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
                {t("joinThousandsSuccessful")}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                    size="lg"
                    onClick={() => setShowRegister(true)}
                    className="min-w-[200px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-sm font-semibold hover:brightness-110"
                >
                  {t("createFreeAccount")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowLogin(true)}
                    className="min-w-[200px] border-slate-500/60 bg-slate-900/80 text-sm text-slate-100 hover:border-purple-400 hover:bg-slate-900"
                >
                  {t("signIn")}
                </Button>
              </div>
            </motion.section>

            {/* FOOTER */}
            <footer className="mt-auto border-t border-slate-800/70 pt-4">
              <div className="flex flex-col items-center justify-between gap-4 text-xs text-slate-400 sm:flex-row sm:text-[13px]">
                <div>{t("allRightsReserved")}</div>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                      href="/AragonTrade_Terms&Conditions.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-200"
                  >
                    {t("termsOfConditions")}
                  </a>
                  <span className="hidden h-3 w-[1px] bg-slate-600 sm:block" />
                  <a
                      href="/AragonTrade_Privacy_Policy.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-200"
                  >
                    {t("privacyPolicy")}
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </MotionConfig>
  );
}
