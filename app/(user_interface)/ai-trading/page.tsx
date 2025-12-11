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
  Brain
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function AITradingPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Parallax transforms
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 1, 0.8, 0.6])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Animated particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-purple-500/20"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Beta Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-50"
      >
        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-xs font-semibold">
          <Sparkles className="mr-2 h-3 w-3" />
          Beta Test
        </Badge>
      </motion.div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4"
          >
            <Brain className="h-10 w-10 text-white" />
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            AI Trading
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
            Powered by advanced neural networks trained on <span className="text-purple-400 font-semibold">10+ years</span> of market data
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>2,016 Tickers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Terabytes of Data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>94% Accuracy</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trading Interface Skeleton - Fixed in viewport */}
      <section className="sticky top-0 h-screen flex items-center justify-center px-4 z-10">
        <motion.div
          style={{ y: y1, opacity }}
          className="w-full max-w-6xl mx-auto"
        >
          <Card className="border-purple-500/30 bg-slate-900/90 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Skeleton Trading Interface */}
              <div className="space-y-4">
                {/* Chart Area */}
                <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 flex items-center justify-center">
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-slate-500 text-sm"
                  >
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Real-time Market Analysis</p>
                  </motion.div>
                </div>

                {/* Order Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-20 bg-slate-800/50 rounded-lg border border-slate-700"></div>
                  <div className="h-20 bg-slate-800/50 rounded-lg border border-slate-700"></div>
                  <div className="h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">AI Trade</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* How It Works Section - Scrollable content */}
      <section className="relative min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Step 1 */}
          <motion.div
            style={{ y: y2 }}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Cpu className="h-6 w-6 text-purple-400" />
                  Data Analysis
                </h3>
                <p className="text-slate-400 mt-2">
                  Our AI analyzes terabytes of historical market data across 2,016 tickers, 
                  identifying patterns and trends that human traders might miss.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            style={{ y: y3 }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="h-6 w-6 text-purple-400" />
                  Technical Indicators
                </h3>
                <p className="text-slate-400 mt-2">
                  Advanced technical indicators including RSI, MACD, Bollinger Bands, 
                  and custom algorithms work together to provide comprehensive market insights.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            style={{ y: y2 }}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="h-6 w-6 text-purple-400" />
                  94% Accuracy
                </h3>
                <p className="text-slate-400 mt-2">
                  After processing millions of data points, our neural network delivers 
                  trade recommendations with an impressive 94% accuracy rate.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Beta Test Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-center"
          >
            <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Congratulations! You're in Beta
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              You're among the first to experience our revolutionary AI trading system. 
              Help us improve by providing feedback and enjoy early access to cutting-edge technology.
            </p>
            <Button
              onClick={() => router.push("/market")}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Try AI Trading Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}


