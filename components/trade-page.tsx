"use client"
// app/user_interface/market/page.tsx

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Newspaper,
  Home,
  User,
  X,
  Eye,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "@/components/toast";
import { Skeleton } from "@/components/ui/skeleton"

import { DepositModal } from "@/components/deposit-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import {updateBalance} from "@/app/actions/updateBalance";
import {useTickers} from "@/hooks/market-data";
import {useBalance} from "@/hooks/useBalance";
import {AdvancedChartWithDrawings} from "@/components/AdvancedChartWithDrawings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useI18n } from "@/components/i18n-provider"

// Import categories from market-data
const categories = {
  Forex: [
    'EURUSD', 'GBPUSD', 'USDCHF', 'USDJPY', 'USDCAD',
    'AUDUSD', 'AUDNZD', 'AUDCAD', 'AUDCHF', 'AUDJPY',
    'CHFJPY', 'EURGBP', 'EURAUD', 'EURJPY', 'EURCHF', 'EURNZD',
    'EURCAD', 'GBPCHF', 'GBPJPY', 'CADCHF', 'CADJPY',
    'GBPAUD', 'GBPCAD', 'GBPNZD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD',
  ],
  Commodities: ['XAUUSD', 'XAGUSD', 'USOIL'],
  Indices: ['US500', 'US30', 'USTEC', 'AUS200'],
  Crypto: ['BTCUSD', 'ETHUSD', 'XRPUSD', 'XLMUSD'],
  Stocks: [
    'AAPL.NAS', 'MSFT.NAS', 'GOOG.NAS', 'NVDA.NAS', 'TSLA.NAS',
    'MVRS.NAS', 'AMZN.NAS', 'NFLX.NAS', 'INTC.NAS', 'ADBE.NAS', 'PYPL.NAS',
    'JPM.NYSE', 'GS.NYSE', 'BAC.NYSE', 'XOM.NYSE', 'CVX.NYSE', 'UNH.NYSE',
    'JNJ.NYSE', 'PFE.NYSE', 'KO.NYSE', 'DIS.NYSE', 'WMT.NYSE',
    'V.NYSE', 'MA.NYSE', 'ORCL.NYSE',
  ],
};

interface ActiveTrade {
  id: string
  ticker: string
  type: "BUY" | "SELL"
  volume: number
  margin: number
  leverage: number
  openIn: number
  openInA: number
  profit: number | null
  status: string
  takeProfit: string
  stopLoss: string
  assetType: string
  createdAt: string
}

export default function TradePage() {
  const { user, logout } = useAuth()
  const { balance, setLiveProfit } = useBalance()
  const { t } = useI18n()
  const isMobile = useIsMobile()
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([])
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [chartModalOpen, setChartModalOpen] = useState(false)
  const [selectedTradeForChart, setSelectedTradeForChart] = useState<ActiveTrade | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY")
  const [volume, setVolume] = useState("0.01")
  const [leverage, setLeverage] = useState("100")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false)
  const [stopLossEnabled, setStopLossEnabled] = useState(false)
  const [takeProfit, setTakeProfit] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [userId, setUserId] = useState("")
  const [chartLoading, setChartLoading] = useState(true)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const modalChartRef = useRef<HTMLDivElement>(null)
  const { tickers, setSelectedTicker, selectedTicker, candlesBySymbol, timeframe, setTimeframe, isLoading } = useTickers()

  const tradeForTicker = selectedTicker
      ? activeTrades.find((trade) => trade.ticker === selectedTicker.symbol)
      : undefined;

  // Helper function to get real-time price from tickers array
  const getRealTimePrice = (symbol: string): number | null => {
    const tickerData = tickers.find((ticker) => ticker.symbol === symbol);
    return tickerData?.bid ?? tickerData?.price ?? null;
  };

  // Get real-time price for selected ticker
  const realTimePrice = selectedTicker ? getRealTimePrice(selectedTicker.symbol) : null;

  // Update live profit
  useEffect(() => {
    const totalProfit = activeTrades.reduce((acc, trade) => {
      const tickerData = tickers.find((d) => d.symbol === trade.ticker);
      const currentPrice = tickerData?.bid ?? trade.openIn;
      const profit = trade.type === "BUY"
          ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
          : (trade.openIn - currentPrice) * trade.volume * trade.leverage;
      return acc + (profit || 0);
    }, 0);
    setLiveProfit(totalProfit);
  }, [activeTrades, tickers, setLiveProfit]);

  // Fetch user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch("/api/user/balance")
        if (response.ok) {
          const data = await response.json()
          setUserId(data.userId)
        }
      } catch (error) {
        console.error("Error fetching user ID:", error)
      }
    }
    fetchUserId()
  }, [])

  // Fetch active trades
  useEffect(() => {
    const fetchActiveTrades = async () => {
      try {
        const response = await fetch("/api/trades/active")
        if (response.ok) {
          const data = await response.json()
          setActiveTrades(data)
        }
      } catch (error) {
        console.error("Error fetching active trades:", error)
      }
    }
    fetchActiveTrades()
    const interval = setInterval(fetchActiveTrades, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(()=>{
    if (selectedTicker && candlesBySymbol && candlesBySymbol.length > 10 ) {
      setChartLoading(false)
    }
  },[candlesBySymbol, selectedTicker])

  // Helper function to get category for a symbol
  const getCategoryForSymbol = (symbol: string): string => {
    for (const [category, symbols] of Object.entries(categories)) {
      if (symbols.includes(symbol)) {
        return category
      }
    }
    return "Other"
  }

  const filteredTickers = tickers.filter((ticker) => {
    const matchesSearch = ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const tickerCategory = getCategoryForSymbol(ticker.symbol)
    const matchesCategory = categoryFilter === "all" || tickerCategory === categoryFilter
    return matchesSearch && matchesCategory
  })

  const calculateMargin = () => {
    if (!selectedTicker) return "0.00"
    const price = realTimePrice || selectedTicker.bid || selectedTicker.price || 0
    const vol = Number.parseFloat(volume) || 0
    const lev = Number.parseFloat(leverage) || 1
    return ((price * vol) / lev).toFixed(2)
  }

  const handleCloseTrade = async (tradeId: string, currentPrice:number) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closePrice: currentPrice }),
      });

      if (response.ok) {
        // Show success notification
        toast({
          title: "✅ Trade Closed",
          description: `Your ${selectedTicker?.symbol} position was closed successfully.`,
          variant: "default",
        })

        // Обновляем активные сделки
        const tradesResponse = await fetch("/api/trades/active");
        if (tradesResponse.ok) {
          const data = await tradesResponse.json();
          setActiveTrades(data);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "❌ Error Closing Trade",
          description: errorData.error || "Failed to close the trade. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error closing trade:", error);
      toast({
        title: "❌ Error Closing Trade",
        description: "An unexpected network error occurred. Please try again.",
        variant: "destructive",
      })
    }
  };

  const handleOpenChart = (trade: ActiveTrade) => {
    setSelectedTradeForChart(trade)
    setChartModalOpen(true)
  }

  const handlePlaceOrder = async () => {
    if (!selectedTicker) return

    try {
      const margin = Number.parseFloat(calculateMargin());

      // Check if user has enough balance
      if (margin > (balance || 0)) {
        toast({
          title: "Insufficient Balance",
          description: `Required: $${calculateMargin()}, Available: $${balance || 0}`,
          variant: "destructive",
        })
        return;
      }

      const orderData = {
        type: orderType,
        ticker: selectedTicker.symbol,
        volume: Number.parseFloat(volume),
        leverage: Number.parseInt(leverage),
        margin: margin,
        openIn: realTimePrice || selectedTicker.bid,
        takeProfit: takeProfitEnabled ? Number.parseFloat(takeProfit) : null,
        stopLoss: stopLossEnabled ? Number.parseFloat(stopLoss) : null,
        assetType: getCategoryForSymbol(selectedTicker.symbol) === "Crypto" ? "Crypto" : "IEX",
      };

      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        // Show success notification
        toast({
          title: `✅ ${orderType} Order Placed`,
          description: `Your ${orderData.volume} lot order for ${selectedTicker.symbol} has been placed.`,
          variant: "default",
        })

        // Update active trades
        const tradesResponse = await fetch("/api/trades/active");
        if (tradesResponse.ok) {
          const data = await tradesResponse.json();
          setActiveTrades(data);
        }

        // Reset form
        setVolume("0.01");
        setTakeProfit("");
        setStopLoss("");
        setTakeProfitEnabled(false);
        setStopLossEnabled(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "❌ Error Placing Order",
          description: errorData.error || "Failed to place the order. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "❌ Error Placing Order",
        description: "An unexpected network error occurred. Please try again.",
        variant: "destructive",
      })
    }
  };

  // Check for automatic order closure when profit loss exceeds total balance
  useEffect(() => {
    if (!activeTrades.length || !balance) return;

    const checkForAutoClose = async () => {
      for (const trade of activeTrades) {
        const tickerData = tickers.find((d) => d.symbol === trade.ticker);
        const currentPrice = tickerData?.bid ?? trade.openIn;

        const profit = trade.type === "BUY"
            ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
            : (trade.openIn - currentPrice) * trade.volume * trade.leverage;

        // If loss exceeds total balance, close the order and set balance to zero
        if (profit < 0 && Math.abs(profit) >= balance) {
          try {
            // Check if trade is still active before closing
            const tradeResponse = await fetch(`/api/trades/active`);
            if (tradeResponse.ok) {
              const activeTradesData = await tradeResponse.json();
              const isStillActive = activeTradesData.some((t: any) => t.id === trade.id);

              if (!isStillActive) {
                continue; // Trade already closed, skip
              }
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
              })

              // Refresh active trades
              const tradesResponse = await fetch("/api/trades/active");
              if (tradesResponse.ok) {
                const data = await tradesResponse.json();
                setActiveTrades(data);
              }

              // Break after closing one trade to prevent multiple closures
              break;
            }
          } catch (error) {
            console.error("Error auto-closing trade:", error);
          }
        }
      }
    };

    checkForAutoClose();
  }, [activeTrades, balance, tickers]);

  // Convert timeframe string to seconds
  const getTimeframeInSeconds = (tf: string) => {
    const timeframes: Record<string, number> = {
      'M1': 60,
      'M5': 300,
      'M15': 900,
      'M30': 1800,
      'H1': 3600,
      'H4': 14400,
      'D1': 86400,
    };
    return timeframes[tf] || 60;
  };

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-950 text-white overflow-y-auto lg:overflow-hidden h-screen lg:h-[calc(100vh-100px)]"
      >
        <div
            className="flex flex-col lg:flex-row min-h-screen lg:min-h-full"
        >
          {/* Left Sidebar - Ticker List - Mobile optimized */}
          <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-80 border-r border-gray-800 bg-gray-900 flex flex-col lg:max-h-[calc(100vh-64px)]"
          >
            <div className="p-3 border-b border-gray-800 flex-shrink-0">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder={t("searchTickers")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white h-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="Forex">{t("forex")}</SelectItem>
                  <SelectItem value="Crypto">{t("cryptoCat")}</SelectItem>
                  <SelectItem value="Stocks">{t("stocks")}</SelectItem>
                  <SelectItem value="Commodities">{t("commodities")}</SelectItem>
                  <SelectItem value="Indices">{t("indices")}</SelectItem>
                </SelectContent>
              </Select>

              {isLoading && (
                  <div className="mt-2 text-xs text-gray-400 text-center">
                    {t("loadingMarketData")}
                  </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto h-40 flex lg:block lg:h-auto">
              {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="p-2 border-b border-gray-800">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="w-16 h-3 bg-gray-700 rounded animate-pulse mb-1"></div>
                            <div className="w-12 h-2 bg-gray-700 rounded animate-pulse"></div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="w-8 h-3 bg-gray-700 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                  ))
              ) : filteredTickers.length > 0 ? (
                  filteredTickers.map((ticker) => {
                    const category = getCategoryForSymbol(ticker.symbol)
                    const getCategoryColor = (cat: string) => {
                      switch (cat) {
                        case 'Forex': return 'bg-green-500/20 text-green-400 border-green-500/30'
                        case 'Crypto': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        case 'Stocks': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        case 'Commodities': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        case 'Indices': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }
                    }
                    return (
                        <div
                            key={ticker.symbol}
                            onClick={() => setSelectedTicker(ticker)}
                            className={`p-2 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                                selectedTicker?.symbol === ticker.symbol ? "bg-gray-800 border-l-4 border-l-purple-500" : ""
                            }`}
                        >
                          <div className="flex justify-between items-start py-1 lg:py-0">
                            <div className="flex-1">
                              <div className="font-semibold text-xs">{ticker.symbol}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                    variant="outline"
                                    className={`text-xs px-2 py-0.5 border ${getCategoryColor(category)}`}
                                >
                                  {category}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-xs font-mono">
                                {ticker.bid !== null && ticker.bid !== undefined && !isNaN(ticker.bid) ? (
                                    `$ ${Number(ticker.bid).toFixed(2)}`
                                ) : (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-8 h-3 bg-gray-700 rounded animate-pulse"></div>
                                    </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                    )
                  })
              ) : (
                  <div className="p-4 text-center text-gray-400">
                    {t("noTickersFound")}
                  </div>
              )}
            </div>
          </motion.div>

          {/* Main Content - Mobile optimized */}
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="flex-1 flex flex-col lg:flex-row">
            {/* Chart Area & Active Trades */}
            <div className="flex-1 p-3 flex flex-col">
              <div className="flex-1 lg:h-[calc(100vh-400px)] order-1">
                {/* Chart Component */}
                {selectedTicker && candlesBySymbol && candlesBySymbol.length > 10 ? (
                    <AdvancedChartWithDrawings
                        candles={candlesBySymbol}
                        liveTickers={tickers}
                        selectedSymbol={selectedTicker.symbol}
                        timeframeInSeconds={getTimeframeInSeconds(timeframe)}
                        isLoaded={true}
                        currentTimeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                        isMobile={isMobile}
                    />
                ) : selectedTicker ? (
                    <div className="flex items-center justify-center w-full h-full bg-gray-800 rounded-lg border border-gray-700">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400 text-lg font-medium">{t("loadingChartData")}</p>
                        <p className="text-gray-500 text-sm mt-2">{t("preparingChart").replace("{symbol}", selectedTicker.symbol)}</p>
                      </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full h-96 lg:h-full bg-gray-800 rounded-lg border border-gray-700">
                      <div className="text-center max-w-md px-4">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">{t("selectTickerToStart")}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                          {t("choosePairToView")}
                        </p>
                        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400 flex-wrap">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{t("forex")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{t("cryptoCat")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>{t("stocks")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>{t("commodities")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>{t("indices")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </div>

              {/* Trading Panel (Mobile) */}
              <div className="w-full lg:hidden order-2 my-3">
                {selectedTicker ? (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">
                          {t("placeOrder")}: {selectedTicker.symbol}
                        </CardTitle>
                        <div className="text-right">
                          <p className="text-lg font-mono font-bold text-white">${realTimePrice?.toFixed(2) ?? '0.00'}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "BUY" | "SELL")} className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="BUY" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">{t("buyUpper")}</TabsTrigger>
                            <TabsTrigger value="SELL" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">{t("sellUpper")}</TabsTrigger>
                          </TabsList>
                        </Tabs>

                        <div>
                          <Label htmlFor="volume-mobile" className="text-xs text-gray-400">{t("volume")}</Label>
                          <Input id="volume-mobile" value={volume} onChange={(e) => setVolume(e.target.value)} className="bg-gray-900 border-gray-700 h-9" placeholder="0.01" />
                        </div>

                        <div>
                          <Label htmlFor="leverage-mobile" className="text-xs text-gray-400">{t("leverage")}</Label>
                          <Select value={leverage} onValueChange={setLeverage}>
                            <SelectTrigger className="bg-gray-900 border-gray-700 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="1">1:1</SelectItem>
                              <SelectItem value="5">1:5</SelectItem>
                              <SelectItem value="10">1:10</SelectItem>
                              <SelectItem value="25">1:25</SelectItem>
                              <SelectItem value="50">1:50</SelectItem>
                              <SelectItem value="100">1:100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="text-xs text-gray-400 flex justify-between">
                          <span>{t("marginRequired")}</span>
                          <span className="font-mono">${calculateMargin()}</span>
                        </div>

                        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                          <CollapsibleTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-xs text-purple-400">
                              {t("advancedOptions")}
                              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-3 mt-2">
                            <div className="flex items-center space-x-2">
                              <Switch id="tp-switch-mobile" checked={takeProfitEnabled} onCheckedChange={
                                ()=> {
                                  setTakeProfitEnabled(!takeProfitEnabled)
                                  setTakeProfit((((candlesBySymbol[candlesBySymbol.length - 1].close) + (candlesBySymbol[candlesBySymbol.length - 1].close) / 100)).toString())
                                }
                              } />
                              <Label htmlFor="tp-switch-mobile" className="text-xs">{t("takeProfit")}</Label>
                            </div>
                            {takeProfitEnabled && (
                                <Input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={t("enterTp")} className="bg-gray-900 border-gray-700 h-9" />
                            )}
                            <div className="flex items-center space-x-2">
                              <Switch id="sl-switch-mobile" checked={stopLossEnabled} onCheckedChange={
                                () => {
                                  setStopLossEnabled(!stopLossEnabled)
                                  setStopLoss((((candlesBySymbol[candlesBySymbol.length - 1].close) - (candlesBySymbol[candlesBySymbol.length - 1].close) / 100)).toString())
                                }
                              } />
                              <Label htmlFor="sl-switch-mobile" className="text-xs">{t("stopLoss")}</Label>
                            </div>
                            {stopLossEnabled && (
                                <Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={t("enterSl")} className="bg-gray-900 border-gray-700 h-9" />
                            )}
                          </CollapsibleContent>
                        </Collapsible>

                        <Button onClick={handlePlaceOrder} className="w-full bg-purple-600 hover:bg-purple-700">
                          {t("placeOrderCta").replace("{type}", orderType)}
                        </Button>

                        <div className="text-xs text-gray-400 flex justify-between">
                          <span>{t("balance")}</span>
                          <span className="font-mono">${balance?.toFixed(2) ?? '0.00'}</span>
                        </div>
                      </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="flex items-center justify-center p-6 h-24">
                        <div className="text-center">
                          <p className="text-sm text-gray-400">{t("selectTicker")}</p>
                        </div>
                      </CardContent>
                    </Card>
                )}
              </div>

              {/* Active Trades */}
              <Card className="bg-gray-800 border-gray-700 flex flex-col lg:h-52 overflow-y-auto order-3">
                <CardHeader className="p-4 pb-2 flex-shrink-0">
                  <CardTitle className="text-sm">{t("activeTradesCount").replace("{count}", String(activeTrades.length))}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 px-2 space-y-3 overflow-y-auto">
                  {activeTrades.length > 0 ? (
                      activeTrades.map((trade) => {
                        const tickerData = tickers.find((d) => d.symbol === trade.ticker);
                        const currentPrice = tickerData?.bid ?? trade.openIn;
                        const profit = trade.type === "BUY"
                            ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
                            : (trade.openIn - currentPrice) * trade.volume * trade.leverage;
                        const isProfit = profit >= 0;

                        return (
                            <div key={trade.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="font-semibold text-sm">{trade.ticker}</div>
                                    <Badge
                                        variant={trade.type === "BUY" ? "default" : "secondary"}
                                        className={`text-xs px-2 py-0.5 ${trade.type === "BUY" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                                    >
                                      {trade.type}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col text-xs text-gray-400 mb-2">
                                    <span>{trade.volume} lot • x{trade.leverage} leverage</span>
                                    <div className={'flex flex-col text-mono'}>
                                      {trade.takeProfit && (<span>Take Profit: {trade.takeProfit}<br/></span>)}
                                      {trade.stopLoss && (<span>Stop Loss: {trade.stopLoss}<br/></span>)}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">Entry:</span>
                                      <span className="text-gray-300 ml-1 font-mono">${trade.openIn?.toFixed(2) ?? '0.00'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Current:</span>
                                      <span className="text-gray-300 ml-1 font-mono">${currentPrice?.toFixed(2) ?? '0.00'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 ml-4">
                                  <div className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                    ${profit?.toFixed(2) ?? '0.00'}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleCloseTrade(trade.id, currentPrice || 0)}
                                        className="text-xs h-7 px-3"
                                    >
                                      <X className="w-3 h-3 mr-1"/>
                                      {t("close")}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                        );
                      })
                  ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                          <p>{t("noOpenPositions")}</p>
                          <p className="text-xs mt-1">{t("selectTickerToStartShort")}</p>
                        </div>
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Trading Panel (Desktop) */}
          <div className="w-full lg:w-80 border-l border-gray-800 bg-gray-900 p-3 space-y-3 flex-shrink-0 hidden lg:block">
            {selectedTicker ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="p-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                      {t("placeOrder").replace("{type}", orderType)}: {selectedTicker.symbol}
                    </CardTitle>
                    <div className="text-right">
                      <p className="text-lg font-mono font-bold text-white">${realTimePrice?.toFixed(2) ?? '0.00'}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 py-4 px-4">
                    <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "BUY" | "SELL")} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="BUY" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">{t("buyUpper")}</TabsTrigger>
                        <TabsTrigger value="SELL" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">{t("sellUpper")}</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div>
                      <Label htmlFor="volume-desktop" className="text-xs text-gray-400">{t("volume")}</Label>
                      <Input id="volume-desktop" value={volume} onChange={(e) => setVolume(e.target.value)} className="bg-gray-900 border-gray-700 h-9" placeholder="0.01" />
                    </div>

                    <div>
                      <Label htmlFor="leverage-desktop" className="text-xs text-gray-400">{t("leverage")}</Label>
                      <Select value={leverage} onValueChange={setLeverage}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="1">1:1</SelectItem>
                          <SelectItem value="5">1:5</SelectItem>
                          <SelectItem value="10">1:10</SelectItem>
                          <SelectItem value="25">1:25</SelectItem>
                          <SelectItem value="50">1:50</SelectItem>
                          <SelectItem value="100">1:100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-xs text-gray-400 flex justify-between">
                      <span>{t("marginRequired")}</span>
                      <span className="font-mono">${calculateMargin()}</span>
                    </div>

                    <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-xs text-purple-400">
                          {t("advancedOptions")}
                          <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="tp-switch-desktop" checked={takeProfitEnabled} onCheckedChange={
                            ()=> {
                              setTakeProfitEnabled(!takeProfitEnabled)
                              setTakeProfit((((candlesBySymbol[candlesBySymbol.length - 1].close) + (candlesBySymbol[candlesBySymbol.length - 1].close) / 100)).toString())
                            }
                          } />
                          <Label htmlFor="tp-switch-desktop" className="text-xs">{t("takeProfit")}</Label>
                        </div>
                        {takeProfitEnabled && (
                            <Input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={t("enterTp")} className="bg-gray-900 border-gray-700 h-9" />
                        )}
                        <div className="flex items-center space-x-2">
                          <Switch id="sl-switch-desktop" checked={stopLossEnabled} onCheckedChange={
                            () => {
                              setStopLossEnabled(!stopLossEnabled)
                              setStopLoss((((candlesBySymbol[candlesBySymbol.length - 1].close) - (candlesBySymbol[candlesBySymbol.length - 1].close) / 100)).toString())
                            }
                          } />
                          <Label htmlFor="sl-switch-desktop" className="text-xs">{t("stopLoss")}</Label>
                        </div>
                        {stopLossEnabled && (
                            <Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={t("enterSl")} className="bg-gray-900 border-gray-700 h-9" />
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    <Button onClick={handlePlaceOrder} className="w-full bg-purple-600 hover:bg-purple-700">
                      {t("placeOrderCta").replace("{type}", orderType)}
                    </Button>

                    <div className="text-xs text-gray-400 flex justify-between">
                      <span>{t("balance")}</span>
                      <span className="font-mono">${balance?.toFixed(2) ?? '0.00'}</span>
                    </div>
                  </CardContent>
                </Card>
            ) : (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="flex items-center justify-center p-6 h-full">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">{t("selectTicker")}</p>
                    </div>
                  </CardContent>
                </Card>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation with logout */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
          <div className="flex justify-around py-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                <Home className="w-5 h-5" />
                <span className="text-xs">{t("bottomDashboard")}</span>
              </Button>
            </Link>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                <FileText className="w-5 h-5" />
                <span className="text-xs">{t("bottomTransactions")}</span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-purple-400">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">{t("bottomTrade")}</span>
              </Button>
            </Link>
            <Link href="/news">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                <Newspaper className="w-5 h-5" />
                <span className="text-xs">{t("bottomNews")}</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                <User className="w-5 h-5" />
                <span className="text-xs">{t("bottomProfile")}</span>
              </Button>
            </Link>
            <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center space-y-1 text-gray-400"
                onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">{t("bottomLogout")}</span>
            </Button>
          </div>
        </div>

        {/* Chart Modal */}
        <Dialog open={chartModalOpen} onOpenChange={setChartModalOpen}>
          <DialogContent className="max-w-4xl h-[80vh] bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedTradeForChart?.ticker} - {selectedTradeForChart?.type} Position
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-4">
              <div ref={modalChartRef} className="h-full w-full" />
            </div>
          </DialogContent>
        </Dialog>

        {/* Deposit Modal */}
        <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
      </motion.div>
  )
}
