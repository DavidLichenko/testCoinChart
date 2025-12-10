"use client"

import { motion, Variants } from "framer-motion"
import {
    Activity,
    ArrowUpRight,
    Bot,
    Brain,
    CircuitBoard,
    ShieldCheck,
    Sparkles,
    BarChart3,
} from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

/* ---------------- Framer variants ---------------- */

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
}

const fadeInScale: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" },
    },
}

/* ---------------- Mini candlestick chart ---------------- */

const demoCandles = [
    { high: 112, low: 80, open: 82, close: 108 },
    { high: 115, low: 88, open: 110, close: 94 },
    { high: 118, low: 90, open: 96, close: 116 },
    { high: 124, low: 96, open: 98, close: 122 },
    { high: 130, low: 104, open: 118, close: 110 },
    { high: 134, low: 108, open: 112, close: 130 },
    { high: 140, low: 112, open: 132, close: 136 },
    { high: 146, low: 120, open: 138, close: 142 },
]

function CandlestickMiniChart() {
    return (
        <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-b from-slate-950 to-slate-900/90 px-3 pb-3 pt-2 sm:h-36">
            <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>BTCUSD · M15</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-300">
          LIVE PREVIEW
        </span>
            </div>

            {/* сетка */}
            <div className="pointer-events-none absolute inset-x-2 top-5 bottom-4">
                <div className="h-full w-full bg-[radial-gradient(circle_at_0_0,rgba(148,163,184,0.16)_0,transparent_55%),linear-gradient(to_right,rgba(30,64,175,0.25)_1px,transparent_1px),linear-gradient(to_top,rgba(30,64,175,0.18)_1px,transparent_1px)] bg-[size:260px_260px,24px_100%,100%_18px]" />
            </div>

            {/* свечи */}
            <div className="relative mt-2 flex h-[88px] items-end gap-[7px] sm:h-[100px]">
                {demoCandles.map((c, idx) => {
                    const isUp = c.close >= c.open
                    const bodyHeight = Math.max(10, Math.abs(c.close - c.open))
                    // нормируем высоту примерно под 80% контейнера
                    const scale = 0.6
                    return (
                        <motion.div
                            key={idx}
                            className="relative flex flex-1 items-center justify-center"
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.4 }}
                            transition={{
                                duration: 0.4,
                                delay: idx * 0.04,
                            }}
                        >
                            {/* фитиль */}
                            <motion.div
                                className="w-[2px] rounded-full bg-slate-400/80"
                                style={{ height: `${(c.high - c.low) * scale}%` }}
                                animate={{
                                    opacity: [0.7, 1, 0.7],
                                }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    delay: idx * 0.1,
                                }}
                            />
                            {/* тело */}
                            <motion.div
                                className={`absolute w-[8px] rounded-[4px] ${
                                    isUp ? "bg-emerald-400" : "bg-red-400"
                                } shadow-[0_0_12px_rgba(16,185,129,0.4)]`}
                                style={{ height: `${bodyHeight * scale}%` }}
                                animate={{
                                    y: [0, -1.5, 0],
                                }}
                                transition={{
                                    duration: 1.6,
                                    repeat: Infinity,
                                    delay: idx * 0.07,
                                    ease: "easeInOut",
                                }}
                            />
                        </motion.div>
                    )
                })}
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Vol · Liquidity</span>
                <span className="font-mono text-[10px] text-slate-100">Δ +1.3%</span>
            </div>
        </div>
    )
}

/* ---------------- Main page ---------------- */

export default function AITradingPage() {
    const { t } = useI18n()

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#050012] via-[#060118] to-[#04000f] px-3 py-6 sm:px-6 lg:px-10">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:gap-12">
                {/* HERO */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.3 }}
                    className="grid gap-8 lg:grid-cols-[1.15fr_minmax(0,1fr)] lg:items-center"
                >
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-200">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{t("aiTrading.badge")}</span>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-balance text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                                {t("aiTrading.hero.title")}
                            </h1>
                            <p className="max-w-xl text-sm text-slate-200 sm:text-base">
                                {t("aiTrading.hero.subtitle")}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button className="rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(16,185,129,0.6)] hover:bg-emerald-400">
                                {t("aiTrading.hero.ctaPrimary")}
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl border-slate-700/80 bg-slate-950/60 text-xs text-slate-200 hover:bg-slate-900"
                            >
                                {t("aiTrading.hero.ctaSecondary")}
                            </Button>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                <span>{t("aiTrading.hero.riskNote")}</span>
                            </div>
                        </div>

                        <div className="grid gap-3 text-xs sm:grid-cols-3 sm:text-[13px]">
                            <Card className="border-slate-800/80 bg-slate-950/80">
                                <CardContent className="flex items-start gap-2 p-3">
                                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                                        <Activity className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-100">
                                            {t("aiTrading.hero.points.alwaysOn.title")}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            {t("aiTrading.hero.points.alwaysOn.desc")}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-800/80 bg-slate-950/80">
                                <CardContent className="flex items-start gap-2 p-3">
                                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
                                        <CircuitBoard className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-100">
                                            {t("aiTrading.hero.points.serverSide.title")}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            {t("aiTrading.hero.points.serverSide.desc")}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-800/80 bg-slate-950/80">
                                <CardContent className="flex items-start gap-2 p-3">
                                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                                        <Brain className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-100">
                                            {t("aiTrading.hero.points.youDecide.title")}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            {t("aiTrading.hero.points.youDecide.desc")}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* справа — общий превью-блок */}
                    <motion.div
                        variants={fadeInScale}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.4 }}
                    >
                        <Card className="relative overflow-hidden border-slate-800/80 bg-gradient-to-b from-slate-950/95 via-slate-950 to-slate-950">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-sm text-slate-100">
                                            {t("aiTrading.preview.title")}
                                        </CardTitle>
                                        <p className="text-[11px] text-slate-400">
                                            {t("aiTrading.preview.subtitle")}
                                        </p>
                                    </div>
                                </div>
                                <Badge className="rounded-full bg-slate-900 text-[10px] text-slate-300">
                                    {t("aiTrading.preview.badge")}
                                </Badge>
                            </CardHeader>
                            <CardContent className="pb-4 pt-1">
                                <CandlestickMiniChart />
                                <p className="mt-3 text-[11px] text-slate-400">
                                    {t("aiTrading.preview.disclaimer")}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.section>

                {/* PIPELINE: 3 шага — график → AI → сигнал */}
                <section className="space-y-4">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.4 }}
                        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-white sm:text-xl">
                                {t("aiTrading.pipeline.title")}
                            </h2>
                            <p className="max-w-xl text-sm text-slate-300">
                                {t("aiTrading.pipeline.subtitle")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
                            <span>{t("aiTrading.pipeline.note")}</span>
                        </div>
                    </motion.div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        {/* Step 1 */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.5 }}
                            className="relative"
                        >
                            <Card className="relative h-full border-slate-800/80 bg-slate-950/90">
                                <CardHeader className="flex items-center gap-2 pb-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] text-slate-300">
                                        1
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm text-slate-100">
                                            {t("aiTrading.pipeline.step1.title")}
                                        </CardTitle>
                                        <p className="text-[11px] text-slate-400">
                                            {t("aiTrading.pipeline.step1.label")}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-3">
                                    <CandlestickMiniChart />
                                    <p className="text-[11px] text-slate-400">
                                        {t("aiTrading.pipeline.step1.desc")}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* стрелка к шагу 2 */}
                            <motion.div
                                className="pointer-events-none absolute right-[-18px] top-1/2 hidden translate-y-[-50%] lg:block"
                                initial={{ opacity: 0, x: -6 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: false, amount: 0.4 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                            >
                                <ArrowUpRight className="h-5 w-5 rotate-[-45deg] text-slate-500" />
                            </motion.div>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.5 }}
                            className="relative"
                        >
                            <Card className="relative h-full overflow-hidden border-slate-800/80 bg-slate-950/90">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18)_0,transparent_55%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.16)_0,transparent_55%)]" />
                                <CardHeader className="relative z-10 flex items-center gap-2 pb-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] text-slate-300">
                                        2
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm text-slate-100">
                                            {t("aiTrading.pipeline.step2.title")}
                                        </CardTitle>
                                        <p className="text-[11px] text-slate-400">
                                            {t("aiTrading.pipeline.step2.label")}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10 space-y-3 pb-4 pt-1">
                                    <motion.div
                                        className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/90 shadow-[0_0_26px_rgba(15,23,42,1)] sm:h-32 sm:w-32"
                                        animate={{
                                            boxShadow: [
                                                "0 0 26px rgba(16,185,129,0.4)",
                                                "0 0 38px rgba(59,130,246,0.55)",
                                                "0 0 26px rgba(16,185,129,0.4)",
                                            ],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        <motion.div
                                            className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950"
                                            animate={{
                                                scale: [1, 1.06, 1],
                                            }}
                                            transition={{
                                                duration: 1.4,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        >
                                            <Bot className="h-9 w-9 text-emerald-300" />
                                            <motion.div
                                                className="pointer-events-none absolute inset-0 rounded-2xl border border-emerald-400/40"
                                                animate={{
                                                    opacity: [0.2, 0.7, 0.2],
                                                }}
                                                transition={{
                                                    duration: 1.6,
                                                    repeat: Infinity,
                                                }}
                                            />
                                        </motion.div>
                                    </motion.div>

                                    <p className="text-[11px] text-slate-400">
                                        {t("aiTrading.pipeline.step2.desc")}
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
                    <span className="rounded-full bg-slate-900 px-2 py-0.5">
                      {t("aiTrading.pipeline.step2.chip1")}
                    </span>
                                        <span className="rounded-full bg-slate-900 px-2 py-0.5">
                      {t("aiTrading.pipeline.step2.chip2")}
                    </span>
                                        <span className="rounded-full bg-slate-900 px-2 py-0.5">
                      {t("aiTrading.pipeline.step2.chip3")}
                    </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* стрелка к шагу 3 */}
                            <motion.div
                                className="pointer-events-none absolute right-[-18px] top-1/2 hidden translate-y-[-50%] lg:block"
                                initial={{ opacity: 0, x: -6 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: false, amount: 0.4 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                            >
                                <ArrowUpRight className="h-5 w-5 rotate-[-45deg] text-slate-500" />
                            </motion.div>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.5 }}
                        >
                            <Card className="relative h-full border-slate-800/80 bg-slate-950/90">
                                <CardHeader className="flex items-center gap-2 pb-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] text-slate-300">
                                        3
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm text-slate-100">
                                            {t("aiTrading.pipeline.step3.title")}
                                        </CardTitle>
                                        <p className="text-[11px] text-slate-400">
                                            {t("aiTrading.pipeline.step3.label")}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-4">
                                    <motion.div
                                        className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent px-3 py-2"
                                        animate={{
                                            boxShadow: [
                                                "0 0 0 rgba(16,185,129,0.0)",
                                                "0 0 18px rgba(16,185,129,0.75)",
                                                "0 0 0 rgba(16,185,129,0.0)",
                                            ],
                                        }}
                                        transition={{
                                            duration: 2.2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        <div>
                                            <p className="text-[11px] text-slate-300">
                                                {t("aiTrading.preview.action")}
                                            </p>
                                            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                                                BUY · 0.50 lot
                                                <ArrowUpRight className="h-3 w-3" />
                                            </p>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-300">
                                            <p>
                                                TP 72 430 · SL 69 850
                                            </p>
                                            <p className="mt-0.5 text-emerald-300">
                                                {t("aiTrading.preview.confidence")}: 87%
                                            </p>
                                        </div>
                                    </motion.div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>{t("aiTrading.preview.riskLevel")}</span>
                                        <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300">
                      {t("aiTrading.preview.riskMedium")}
                    </span>
                                    </div>

                                    <p className="text-[11px] text-slate-400">
                    <span className="font-medium text-slate-200">
                      {t("aiTrading.preview.commentLabel")}:{" "}
                    </span>
                                        {t("aiTrading.preview.commentText")}
                                    </p>

                                    <p className="text-[10px] text-slate-500">
                                        {t("aiTrading.pipeline.step3.desc")}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* WHY SERVER-SIDE AI */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.3 }}
                    className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
                >
                    <Card className="border-slate-800/80 bg-slate-950/95">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg">
                                {t("aiTrading.howItWorks.title")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-300">
                            <p>{t("aiTrading.howItWorks.intro")}</p>
                            <ol className="space-y-2 text-[13px] text-slate-200">
                                <li>
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px]">
                    1
                  </span>
                                    {t("aiTrading.howItWorks.step1")}
                                </li>
                                <li>
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px]">
                    2
                  </span>
                                    {t("aiTrading.howItWorks.step2")}
                                </li>
                                <li>
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px]">
                    3
                  </span>
                                    {t("aiTrading.howItWorks.step3")}
                                </li>
                            </ol>
                            <p className="text-xs text-slate-500">
                                {t("aiTrading.howItWorks.disclaimer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-950/95">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                            <CardTitle className="text-base">
                                {t("aiTrading.metrics.title")}
                            </CardTitle>
                            <Badge className="rounded-full bg-slate-900 text-[11px] text-slate-200">
                                {t("aiTrading.metrics.badge")}
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-xl bg-slate-900/85 px-3 py-2">
                                <div>
                                    <p className="text-xs text-slate-400">
                                        {t("aiTrading.metrics.previewWinRate.label")}
                                    </p>
                                    <p className="text-sm font-semibold text-emerald-400">
                                        90%
                                        <span className="ml-1 text-[11px] text-slate-400">
                      {t("aiTrading.metrics.previewWinRate.sublabel")}
                    </span>
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">
                  {t("aiTrading.metrics.previewWinRate.badge")}
                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-900/85 px-3 py-2">
                                <div>
                                    <p className="text-xs text-slate-400">
                                        {t("aiTrading.metrics.latency.label")}
                                    </p>
                                    <p className="text-sm font-semibold text-sky-300">~50 ms</p>
                                </div>
                                <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[11px] text-sky-300">
                  {t("aiTrading.metrics.latency.badge")}
                </span>
                            </div>

                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                {t("aiTrading.metrics.note")}
                            </div>
                        </CardContent>
                    </Card>
                </motion.section>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------
   i18n KEYS + TEXTS
   ------------------------------------------------------------------

   ❗ ВАЖНО: все цифры (90%, ~50 ms и т.п.) на странице — это демо-значения.
   В текстах ниже мы подчёркиваем, что это только превью и не гарантия результата.
*/

/* EN (example dictionary shape)

{
  "aiTrading.badge": "New · AI Trading Engine",

  "aiTrading.hero.title": "Let the AI watch the market while you trade smarter",
  "aiTrading.hero.subtitle": "Our server-side engine analyzes thousands of data points per symbol and turns them into clear BUY / SELL suggestions — you stay in control of every position.",
  "aiTrading.hero.ctaPrimary": "Activate AI Trading",
  "aiTrading.hero.ctaSecondary": "Watch demo",
  "aiTrading.hero.riskNote": "Performance preview only · No guarantees of profit",

  "aiTrading.hero.points.alwaysOn.title": "Always on",
  "aiTrading.hero.points.alwaysOn.desc": "The engine keeps simulating strategies 24/7, even when your browser is closed.",

  "aiTrading.hero.points.serverSide.title": "Server-side decisions",
  "aiTrading.hero.points.serverSide.desc": "All heavy calculations run on our servers — your device only shows the result in milliseconds.",

  "aiTrading.hero.points.youDecide.title": "You stay in control",
  "aiTrading.hero.points.youDecide.desc": "AI suggests entries, targets and risk, but you confirm every trade with one click.",

  "aiTrading.preview.title": "AI trading preview",
  "aiTrading.preview.subtitle": "Example of how a symbol is analyzed before a signal appears.",
  "aiTrading.preview.badge": "Simulation only",
  "aiTrading.preview.disclaimer": "This animation shows a simplified example of how AI could analyze a candlestick chart. It is not real market data, not a backtest, and not a promise of 90% profitable trades.",

  "aiTrading.preview.action": "Suggested action",
  "aiTrading.preview.confidence": "Model confidence",
  "aiTrading.preview.riskLevel": "Risk level",
  "aiTrading.preview.riskMedium": "Balanced",
  "aiTrading.preview.commentLabel": "Comment",
  "aiTrading.preview.commentText": "Momentum is bullish, volume is increasing and higher lows are holding. AI suggests a limited-risk BUY with predefined TP / SL.",

  "aiTrading.pipeline.title": "How AI Trading works on your account",
  "aiTrading.pipeline.subtitle": "Think of it as a three-step loop that runs on our servers: read the market, simulate outcomes, then send you a clear signal.",
  "aiTrading.pipeline.note": "Below is a visual demo. It does not represent real results.",

  "aiTrading.pipeline.step1.title": "1. Market data & candlesticks",
  "aiTrading.pipeline.step1.label": "Price feed in real time",
  "aiTrading.pipeline.step1.desc": "Your chart is streamed to the AI engine as structured OHLC data — exactly like the candlesticks you see in the platform.",

  "aiTrading.pipeline.step2.title": "2. AI engine on the server",
  "aiTrading.pipeline.step2.label": "Pattern, volatility and risk analysis",
  "aiTrading.pipeline.step2.desc": "On the server we layer classic technical patterns with our own ML models, ranking possible scenarios for the next candles.",
  "aiTrading.pipeline.step2.chip1": "Trend & structure",
  "aiTrading.pipeline.step2.chip2": "Volatility & liquidity",
  "aiTrading.pipeline.step2.chip3": "Risk / reward map",

  "aiTrading.pipeline.step3.title": "3. Human-ready signal",
  "aiTrading.pipeline.step3.label": "BUY / SELL with TP & SL",
  "aiTrading.pipeline.step3.desc": "The result is a human-readable suggestion: direction, size, suggested TP / SL and a confidence score. You decide whether to execute it.",

  "aiTrading.howItWorks.title": "What exactly runs on the server?",
  "aiTrading.howItWorks.intro": "We treat AI trading as an assistant, not an auto-pilot. The stack behind the scenes combines several layers:",
  "aiTrading.howItWorks.step1": "Real-time feeds for FX, indices, metals, crypto and stocks, normalized into unified OHLCV streams.",
  "aiTrading.howItWorks.step2": "Rule-based risk engine that checks leverage, margin impact and maximum drawdown per user.",
  "aiTrading.howItWorks.step3": "Machine-learning models that score potential entries and filter out low-quality setups.",
  "aiTrading.howItWorks.disclaimer": "Aragon Trade does not provide investment advice. AI suggestions are informational and must be validated by your own analysis and risk management.",

  "aiTrading.metrics.title": "Preview metrics (simulation)",
  "aiTrading.metrics.badge": "Demo only",
  "aiTrading.metrics.previewWinRate.label": "Simulated win-rate on historical scenarios",
  "aiTrading.metrics.previewWinRate.sublabel": "on filtered setups",
  "aiTrading.metrics.previewWinRate.badge": "Up to 90% in preview",
  "aiTrading.metrics.latency.label": "Typical time to generate a new signal",
  "aiTrading.metrics.latency.badge": "Server-side",
  "aiTrading.metrics.note": "All numbers above are example values from internal simulations and do not represent live performance. Markets are risky and past performance does not guarantee future results."
}

*/

/* ES (Spanish texts)

{
  "aiTrading.badge": "Nuevo · Motor de Trading con IA",

  "aiTrading.hero.title": "Deja que la IA vigile el mercado mientras tú decides mejor",
  "aiTrading.hero.subtitle": "Nuestro motor en el servidor analiza miles de puntos de datos por símbolo y los convierte en señales claras de COMPRA / VENTA. Tú mantienes el control de cada operación.",
  "aiTrading.hero.ctaPrimary": "Activar Trading con IA",
  "aiTrading.hero.ctaSecondary": "Ver demo",
  "aiTrading.hero.riskNote": "Vista previa de rendimiento · Sin garantía de beneficio",

  "aiTrading.hero.points.alwaysOn.title": "Siempre encendida",
  "aiTrading.hero.points.alwaysOn.desc": "El motor sigue simulando estrategias 24/7, incluso cuando tu navegador está cerrado.",

  "aiTrading.hero.points.serverSide.title": "Decisiones en el servidor",
  "aiTrading.hero.points.serverSide.desc": "Todos los cálculos pesados se ejecutan en nuestros servidores; tu dispositivo solo recibe el resultado en milisegundos.",

  "aiTrading.hero.points.youDecide.title": "Tú sigues al mando",
  "aiTrading.hero.points.youDecide.desc": "La IA propone entradas, objetivos y riesgo, pero cada operación se confirma con tu propio clic.",

  "aiTrading.preview.title": "Vista previa del trading con IA",
  "aiTrading.preview.subtitle": "Ejemplo de cómo se analiza un símbolo antes de que aparezca una señal.",
  "aiTrading.preview.badge": "Solo simulación",
  "aiTrading.preview.disclaimer": "Esta animación muestra un ejemplo simplificado de cómo la IA podría analizar un gráfico de velas. No son datos reales de mercado, ni un backtest, ni una promesa de operaciones ganadoras al 90%.",

  "aiTrading.preview.action": "Acción sugerida",
  "aiTrading.preview.confidence": "Confianza del modelo",
  "aiTrading.preview.riskLevel": "Nivel de riesgo",
  "aiTrading.preview.riskMedium": "Equilibrado",
  "aiTrading.preview.commentLabel": "Comentario",
  "aiTrading.preview.commentText": "El impulso es alcista, el volumen aumenta y los mínimos crecientes se mantienen. La IA sugiere una COMPRA con riesgo limitado y TP / SL definidos.",

  "aiTrading.pipeline.title": "Cómo funciona el Trading con IA en tu cuenta",
  "aiTrading.pipeline.subtitle": "Piensa en él como un ciclo de tres pasos que corre en nuestros servidores: leer el mercado, simular escenarios y enviarte una señal clara.",
  "aiTrading.pipeline.note": "Lo que ves a continuación es una demo visual. No representa resultados reales.",

  "aiTrading.pipeline.step1.title": "1. Datos de mercado y velas",
  "aiTrading.pipeline.step1.label": "Flujo de precios en tiempo real",
  "aiTrading.pipeline.step1.desc": "Tu gráfico se envía al motor de IA como datos estructurados OHLC, exactamente igual que las velas que ves en la plataforma.",

  "aiTrading.pipeline.step2.title": "2. Motor de IA en el servidor",
  "aiTrading.pipeline.step2.label": "Análisis de patrón, volatilidad y riesgo",
  "aiTrading.pipeline.step2.desc": "En el servidor combinamos patrones técnicos clásicos con modelos de ML propios, puntuando los posibles escenarios para las siguientes velas.",
  "aiTrading.pipeline.step2.chip1": "Tendencia y estructura",
  "aiTrading.pipeline.step2.chip2": "Volatilidad y liquidez",
  "aiTrading.pipeline.step2.chip3": "Mapa riesgo / beneficio",

  "aiTrading.pipeline.step3.title": "3. Señal lista para el trader",
  "aiTrading.pipeline.step3.label": "COMPRA / VENTA con TP y SL",
  "aiTrading.pipeline.step3.desc": "El resultado es una sugerencia legible para humanos: dirección, tamaño, TP / SL sugeridos y un nivel de confianza. Tú decides si ejecutarla o no.",

  "aiTrading.howItWorks.title": "¿Qué es exactamente lo que corre en el servidor?",
  "aiTrading.howItWorks.intro": "Tratamos el trading con IA como un asistente, no como un piloto automático. La pila que hay detrás combina varias capas:",
  "aiTrading.howItWorks.step1": "Flujos en tiempo real para FX, índices, metales, cripto y acciones, normalizados en streams OHLCV unificados.",
  "aiTrading.howItWorks.step2": "Motor de riesgo basado en reglas que comprueba apalancamiento, impacto en margen y drawdown máximo por usuario.",
  "aiTrading.howItWorks.step3": "Modelos de aprendizaje automático que puntúan posibles entradas y filtran los setups de baja calidad.",
  "aiTrading.howItWorks.disclaimer": "Demium Capital / Aragon Trade no ofrece asesoramiento de inversión. Las sugerencias de IA son informativas y deben validarse con tu propio análisis y gestión de riesgo.",

  "aiTrading.metrics.title": "Métricas de vista previa (simulación)",
  "aiTrading.metrics.badge": "Solo demo",
  "aiTrading.metrics.previewWinRate.label": "Tasa de acierto simulada en escenarios históricos",
  "aiTrading.metrics.previewWinRate.sublabel": "en setups filtrados",
  "aiTrading.metrics.previewWinRate.badge": "Hasta 90% en la vista previa",
  "aiTrading.metrics.latency.label": "Tiempo típico para generar una nueva señal",
  "aiTrading.metrics.latency.badge": "Procesado en servidor",
  "aiTrading.metrics.note": "Todas las cifras anteriores son valores de ejemplo obtenidos en simulaciones internas y no representan rendimiento en vivo. Operar en mercados financieros conlleva riesgo y el rendimiento pasado no garantiza resultados futuros."
}

*/
