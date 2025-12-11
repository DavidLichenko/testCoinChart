"use client"

import { useEffect, useState } from "react"
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
  Activity
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useI18n } from "@/components/i18n-provider"

export default function AITradingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950">
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg">
            <Brain className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            {t("aiTrading") || "AI Trading"}
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
            {t("aiTradingPoweredBy") || "Powered by advanced neural networks trained on"}{" "}
            <span className="text-purple-400 font-semibold">{t("aiTrading10Years") || "10+ years"}</span> {t("aiTradingOfMarketData") || "of market data"}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Badge variant="secondary" className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t("aiTrading2016Tickers") || "2,016 Tickers"}
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-purple-500/10 text-purple-400 border-purple-500/30">
              <Cpu className="h-4 w-4 mr-2" />
              {t("aiTradingTerabytes") || "Terabytes of Data"}
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-sky-500/10 text-sky-400 border-sky-500/30">
              <Target className="h-4 w-4 mr-2" />
              {t("aiTrading94Accuracy") || "94% Accuracy"}
            </Badge>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          {/* Data Analysis */}
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t("aiTradingDataAnalysis") || "Data Analysis"}
                </h3>
              </div>
              <p className="text-slate-400 text-sm">
                {t("aiTradingDataAnalysisDesc") || "Our AI analyzes"} <span className="text-purple-400">{t("aiTradingTerabytes") || "terabytes"}</span> {t("aiTradingDataAnalysisDesc2") || "of historical market data"}
              </p>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          <Card className="border-pink-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t("aiTradingTechnicalIndicators") || "Technical Indicators"}
                </h3>
              </div>
              <p className="text-slate-400 text-sm">
                {t("aiTradingTechnicalIndicatorsDesc") || "Advanced indicators including RSI, MACD, and custom algorithms"}
              </p>
            </CardContent>
          </Card>

          {/* High Accuracy */}
          <Card className="border-emerald-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {t("aiTrading94AccuracyTitle") || "94% Accuracy"}
                </h3>
              </div>
              <p className="text-slate-400 text-sm">
                {t("aiTrading94AccuracyDesc") || "94% accuracy rate across millions of data points"}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Beta Access Card */}
        <section>
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-slate-900/50 to-pink-900/20 backdrop-blur">
            <CardContent className="p-8 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                {t("aiTradingBetaTest") || "Beta Test"}
              </div>
              
              <h2 className="text-3xl font-bold text-white">
                {t("aiTradingBetaMessage") || "Congratulations! You're in Beta"}
              </h2>
              
              <p className="text-slate-300 max-w-2xl mx-auto">
                {t("aiTradingBetaDesc") || "You're among the first to experience our revolutionary AI trading system."}
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Button
                  onClick={() => router.push("/market")}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {t("aiTradingTryNow") || "Try AI Trading Now"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Statistics */}
        <section className="grid md:grid-cols-3 gap-6">
          <Card className="border-slate-700/50 bg-slate-900/30 backdrop-blur">
            <CardContent className="p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-emerald-400">94%</div>
              <div className="text-slate-400 text-sm">{t("wins") || "Wins"}</div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-700/50 bg-slate-900/30 backdrop-blur">
            <CardContent className="p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-rose-400">6%</div>
              <div className="text-slate-400 text-sm">{t("losses") || "Losses"}</div>
            </CardContent>
          </Card>
          
          <Card className="border-slate-700/50 bg-slate-900/30 backdrop-blur">
            <CardContent className="p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-purple-400">2,016</div>
              <div className="text-slate-400 text-sm">{t("total") || "Total"}</div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
