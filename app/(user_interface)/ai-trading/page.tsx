"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Cpu, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Target, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Brain,
  Star,
  Activity,
  TrendingDown,
  Wallet,
  Settings,
  Play,
  Pause
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useI18n } from "@/components/i18n-provider"

export default function AITradingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Multiple parallax layers for skeleton
  const skeletonY = useTransform(scrollYProgress, [0, 1], [0, -50])
  const skeletonOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 1, 0.95, 0.9])
  const skeletonScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.98, 0.96])

  // Content parallax layers
  const content1Y = useTransform(scrollYProgress, [0, 1], [0, -300])
  const content2Y = useTransform(scrollYProgress, [0, 1], [0, -200])
  const content3Y = useTransform(scrollYProgress, [0, 1], [0, -400])
  const content4Y = useTransform(scrollYProgress, [0, 1], [0, -250])

  // Fade effects
  const fade1 = useTransform(scrollYProgress, [0, 0.2, 0.4], [0, 1, 1])
  const fade2 = useTransform(scrollYProgress, [0.2, 0.4, 0.6], [0, 1, 1])
  const fade3 = useTransform(scrollYProgress, [0.4, 0.6, 0.8], [0, 1, 1])
  const fade4 = useTransform(scrollYProgress, [0.6, 0.8, 1], [0, 1, 1])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Skeleton structure matching market/page.tsx
  const TradingSkeleton = () => (
    <motion.div
      style={{ 
        y: skeletonY,
        opacity: skeletonOpacity,
        scale: skeletonScale
      }}
      className="sticky top-0 z-20 h-screen flex items-center justify-center px-4 pointer-events-none"
    >
      <div className="w-full max-w-7xl mx-auto">
        <Card className="border-purple-500/30 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6">
            {/* Header with ticker selector */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-800/50 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                {["M1", "M5", "H1", "D1"].map((tf) => (
                  <div key={tf} className="h-7 w-12 bg-slate-800/50 rounded animate-pulse" />
                ))}
              </div>
            </div>

            {/* Chart area */}
            <div className="mb-4 h-[400px] rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
              {/* Animated chart lines */}
              <svg className="absolute inset-0 w-full h-full">
                <motion.path
                  d="M 0 200 Q 100 150, 200 180 T 400 160 T 600 140 T 800 120 T 1000 100"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Candles visualization */}
              <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-1 px-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-3 bg-gradient-to-t from-purple-500/40 to-pink-500/40 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ 
                      height: Math.random() * 60 + 20,
                      opacity: [0.4, 0.8, 0.4]
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                ))}
              </div>

              {/* Price indicators */}
              <div className="absolute top-4 left-4 right-4 flex justify-between text-xs">
                <div className="bg-slate-900/80 px-2 py-1 rounded text-emerald-400 font-mono">
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    $45,234.56
                  </motion.span>
                </div>
                <div className="bg-slate-900/80 px-2 py-1 rounded text-emerald-400 font-mono">
                  +2.34%
                </div>
              </div>
            </div>

            {/* Order form skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-800/50 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-800/50 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-800/50 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-800/50 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-800/50 rounded animate-pulse" />
                <motion.div
                  className="h-10 w-full bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(139, 92, 246, 0.5)",
                      "0 0 40px rgba(236, 72, 153, 0.5)",
                      "0 0 20px rgba(139, 92, 246, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-white text-sm font-semibold">AI Trade</span>
                </motion.div>
              </div>
            </div>

            {/* Active trades skeleton */}
            <div className="mt-4 space-y-2">
              <div className="h-3 w-32 bg-slate-800/50 rounded animate-pulse" />
              <div className="h-16 bg-slate-800/30 rounded border border-slate-700/50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )

  return (
    <div ref={containerRef} className="relative min-h-[300vh] overflow-x-hidden bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Fixed skeleton - always visible */}
      <TradingSkeleton />

      {/* Scrollable content with parallax */}
      <div className="relative z-10 space-y-8">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <motion.div
            style={{ y: content1Y, opacity: fade1 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center space-y-6"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500 mb-4 shadow-[0_0_50px_rgba(139,92,246,0.5)]"
            >
              <Brain className="h-12 w-12 text-white" />
            </motion.div>
            
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {t("aiTrading") || "AI Trading"}
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-300 max-w-3xl mx-auto">
              {t("aiTradingPoweredBy") || "Powered by advanced neural networks trained on"}{" "}
              <span className="text-purple-400 font-semibold">{t("aiTrading10Years") || "10+ years"}</span> {t("aiTradingOfMarketData") || "of market data"}
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-base text-slate-400">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-emerald-500/30"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold">{t("aiTrading2016Tickers") || "2,016 Tickers"}</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-emerald-500/30"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold">{t("aiTradingTerabytes") || "Terabytes of Data"}</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-emerald-500/30"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold">{t("aiTrading94Accuracy") || "94% Accuracy"}</span>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Step 1: Data Analysis */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <motion.div
            style={{ y: content2Y, opacity: fade2 }}
            className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                >
                  1
                </motion.div>
                <div>
                  <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Cpu className="h-8 w-8 text-purple-400" />
                    {t("aiTradingDataAnalysis") || "Data Analysis"}
                  </h3>
                  <p className="text-slate-400 mt-2 text-lg">
                    {t("aiTradingDataAnalysisDesc") || "Our AI analyzes"} <span className="text-purple-400 font-semibold">{t("aiTradingTerabytes") || "terabytes"}</span> {t("aiTradingDataAnalysisDesc2") || "of historical market data across"}{" "}
                    <span className="text-pink-400 font-semibold">{t("aiTrading2016Tickers") || "2,016 tickers"}</span>, {t("aiTradingDataAnalysisDesc3") || "identifying patterns and trends that human traders might miss."}
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-full" />
              <div className="relative bg-slate-900/80 rounded-2xl p-8 border border-purple-500/30">
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg"
                      animate={{ 
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        repeat: Infinity
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Step 2: Technical Indicators */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <motion.div
            style={{ y: content3Y, opacity: fade3 }}
            className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 md:order-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl rounded-full" />
              <div className="relative bg-slate-900/80 rounded-2xl p-8 border border-cyan-500/30">
                <div className="space-y-4">
                  {["RSI", "MACD", "Bollinger Bands", "Volume"].map((indicator, i) => (
                    <motion.div
                      key={indicator}
                      className="h-12 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-lg flex items-center justify-between px-4"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    >
                      <span className="text-white font-semibold">{indicator}</span>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      >
                        <Activity className="h-5 w-5 text-cyan-400" />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 md:order-2"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                >
                  2
                </motion.div>
                <div>
                  <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Zap className="h-8 w-8 text-cyan-400" />
                    {t("aiTradingTechnicalIndicators") || "Technical Indicators"}
                  </h3>
                  <p className="text-slate-400 mt-2 text-lg">
                    {t("aiTradingTechnicalIndicatorsDesc") || "Advanced technical indicators including"} <span className="text-cyan-400 font-semibold">RSI</span>,{" "}
                    <span className="text-purple-400 font-semibold">MACD</span>, {t("aiTradingTechnicalIndicatorsDesc2") || "Bollinger Bands, and custom algorithms work together to provide comprehensive market insights."}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Step 3: 94% Accuracy */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <motion.div
            style={{ y: content4Y, opacity: fade4 }}
            className="max-w-5xl mx-auto text-center space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center gap-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-3xl shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                >
                  3
                </motion.div>
                <div>
                  <h3 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
                    <Target className="h-10 w-10 text-emerald-400" />
                    {t("aiTrading94AccuracyTitle") || "94% Accuracy"}
                  </h3>
                </div>
              </div>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                {t("aiTrading94AccuracyDescFull") || "After processing"} <span className="text-emerald-400 font-semibold">{t("aiTradingMillionsDataPoints") || "millions of data points"}</span>, {t("aiTrading94AccuracyDescFull2") || "our neural network delivers trade recommendations with an impressive"}{" "}
                <span className="text-cyan-400 font-bold text-2xl">{t("aiTrading94AccuracyDesc") || "94% accuracy rate"}</span>.
              </p>
            </motion.div>

            {/* Accuracy visualization */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto"
            >
              {[
                { label: t("wins") || "Wins", value: 94, color: "emerald" },
                { label: t("losses") || "Losses", value: 6, color: "red" },
                { label: t("total") || "Total", value: 100, color: "purple" }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, type: "spring" }}
                  className="bg-slate-900/80 rounded-xl p-6 border border-slate-700"
                >
                  <div className={`text-4xl font-bold text-${stat.color}-400 mb-2`}>
                    {stat.value}%
                  </div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Beta Test Message & CTA */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4"
            >
              <Sparkles className="h-10 w-10 text-white" />
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t("aiTradingBetaMessage") || "Congratulations! You're in Beta"}
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              {t("aiTradingBetaDesc") || "You're among the first to experience our revolutionary AI trading system."}{" "}
              {t("aiTradingBetaDesc2") || "Help us improve by providing feedback and enjoy early access to cutting-edge technology."}
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => router.push("/market")}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              >
                {t("aiTradingTryNow") || "Try AI Trading Now"}
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </div>

      {/* Beta Badge - Fixed */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 right-4 z-50"
      >
        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-xs font-semibold shadow-lg">
          <Sparkles className="mr-2 h-3 w-3" />
          {t("aiTradingBetaTest") || "Beta Test"}
        </Badge>
      </motion.div>
    </div>
  )
}
