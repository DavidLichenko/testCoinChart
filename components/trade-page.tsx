"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react"
import { motion } from "framer-motion"
import {
  Search,
  BarChart3,
  FileText,
  Newspaper,
  Home,
  User,
  X,
  ChevronDown,
  LogOut,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  MousePointer,
  LineChart,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/toast"

import Link from "next/link"

import { useTickers, type MarketTicker } from "@/hooks/market-data"
import { useBalance, refetchBalance } from "@/hooks/useBalance"
import {
  AdvancedChartWithDrawings,
  type AdvancedChartHandle,
} from "@/components/AdvancedChartWithDrawings"
import { useIsMobile } from "@/hooks/use-mobile"
import { useI18n } from "@/components/i18n-provider"
import { DepositModal } from "@/components/deposit-modal"
import { TickerAvatar } from "@/components/ticker-avatar"
import {
  tickerCategoryLabels,
  tickerMetaMap,
  orderedCategories,
  type TickerCategory,
} from "@/data/ticker-meta"
import { VirtualizedTickerList } from "@/components/virtualized-ticker-list"

const categoryAccent: Record<TickerCategory, string> = {
  forex: "from-blue-400 to-sky-500",
  stocks: "from-emerald-400 to-lime-500",
  crypto: "from-amber-400 to-orange-500",
  indices: "from-purple-400 to-pink-500",
  commodities: "from-rose-400 to-red-500",
  other: "from-slate-400 to-slate-600",
}

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

// Define the ticker type that matches what the chart component expects
interface ChartTicker {
  symbol: string
  price: number
  time: number
  type: string
  bid?: number
}

export default function TradePage() {
  const { logout, user } = useAuth()
  const { balance, setLiveProfit } = useBalance()
  const { t } = useI18n()
  const isMobile = useIsMobile()

  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([])
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [chartModalOpen, setChartModalOpen] = useState(false)
  const [selectedTradeForChart, setSelectedTradeForChart] =
      useState<ActiveTrade | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY")
  const [volume, setVolume] = useState("0.01")
  const [leverage, setLeverage] = useState("100")

  const [advancedOpen, setAdvancedOpen] = useState(true) // Expanded by default on desktop
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false)
  const [stopLossEnabled, setStopLossEnabled] = useState(false)
  const [takeProfit, setTakeProfit] = useState("")
  const [stopLoss, setStopLoss] = useState("")

  const [chartLoading, setChartLoading] = useState(true)

  const [mobileView, setMobileView] = useState<"market" | "trade">("market")
  const [openCategory, setOpenCategory] = useState<TickerCategory | null>(
      "forex",
  )

  const [selectedTool, setSelectedTool] = useState<"none" | "line">("none")
  const [isBalanceUpdating, setIsBalanceUpdating] = useState(false)

  const modalChartRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<AdvancedChartHandle | null>(null)

  const {
    tickers,
    setSelectedTicker,
    selectedTicker,
    candlesBySymbol,
    timeframe,
    setTimeframe,
    isLoading,
    isCandlesLoading,
  } = useTickers()

  useEffect(() => {
    setChartLoading(isCandlesLoading)
  }, [isCandlesLoading])

  const tickersByCategory = useMemo(() => {
    const map = orderedCategories.reduce(
        (acc, category) => {
          acc[category] = []
          return acc
        },
        {} as Record<TickerCategory, MarketTicker[]>,
    )

    tickers.forEach((ticker) => {
      if (!map[ticker.category]) {
        map[ticker.category] = []
      }
      map[ticker.category].push(ticker)
    })

    Object.values(map).forEach((list) =>
        list.sort((a, b) => a.showName.localeCompare(b.showName)),
    )

    return map
  }, [tickers])

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return []
    return tickers.filter((ticker) => {
      return (
          ticker.symbol.toLowerCase().includes(term) ||
          ticker.showName.toLowerCase().includes(term) ||
          ticker.fullName.toLowerCase().includes(term)
      )
    })
  }, [searchTerm, tickers])

  const formatPriceValue = useCallback((value?: number | null) => {
    if (value == null || Number.isNaN(value)) return null
    if (value >= 1000) return value.toFixed(2)
    if (value >= 1) return value.toFixed(3)
    if (value >= 0.1) return value.toFixed(4)
    return value.toPrecision(4)
  }, [])

  const formatStatValue = useCallback(
      (value?: number | null) => {
        const formatted = formatPriceValue(value)
        return formatted ?? "—"
      },
      [formatPriceValue],
  )

  const [dayHigh, dayLow] = useMemo(() => {
    if (!candlesBySymbol?.length) return [null, null]
    let high = Number.NEGATIVE_INFINITY
    let low = Number.POSITIVE_INFINITY
    candlesBySymbol.forEach((candle) => {
      if (typeof candle.high === "number") {
        high = Math.max(high, candle.high)
      }
      if (typeof candle.low === "number") {
        low = Math.min(low, candle.low)
      }
    })
    return [
      Number.isFinite(high) ? high : null,
      Number.isFinite(low) ? low : null,
    ]
  }, [candlesBySymbol])

  const getRealTimePrice = (symbol: string): number | null => {
    const tickerData = tickers.find((t) => t.symbol === symbol)
    return tickerData?.bid ?? tickerData?.price ?? null
  }

  const realTimePrice = selectedTicker
      ? getRealTimePrice(selectedTicker.symbol)
      : null

  const selectedPrice = selectedTicker
      ? formatPriceValue(
          realTimePrice ?? selectedTicker.bid ?? selectedTicker.price,
      )
      : null

  const spreadValue =
      selectedTicker?.ask != null && selectedTicker?.bid != null
          ? selectedTicker.ask - selectedTicker.bid
          : null

  useEffect(() => {
    const fetchActiveTrades = async () => {
      try {
        // Always fetch fresh data without caching
        const response = await fetch("/api/trades/active")
        if (response.ok) {
          const data = await response.json()
          // Ensure we only display OPEN trades
          const openTrades = data.filter((trade: ActiveTrade) => trade.status === "OPEN")
          setActiveTrades(openTrades)
        } else {
          console.error("Failed to fetch active trades:", response.status)
          // Clear trades on error to prevent stale data
          setActiveTrades([])
        }
      } catch (error) {
        console.error("Error fetching active trades:", error)
        // Clear trades on error to prevent stale data
        setActiveTrades([])
      }
    }

    fetchActiveTrades()
    // Reduce interval to 10 seconds for more frequent updates
    const interval = setInterval(fetchActiveTrades, 10000)
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    if (!activeTrades.length || !tickers.length) {
      setLiveProfit(0);
      return;
    }

    const total = activeTrades.reduce((acc, trade) => {
      const tickerData = tickers.find((d: any) => d.symbol === trade.ticker);
      if (!tickerData) return acc;
      
      const currentPrice = tickerData.bid ?? tickerData.price ?? trade.openIn;
      const profit =
          trade.type === "BUY"
              ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
              : (trade.openIn - currentPrice) * trade.volume * trade.leverage;
      return acc + (profit || 0);
    }, 0);
    
    setLiveProfit(total);
  }, [activeTrades, tickers, setLiveProfit]);

  useEffect(() => {
    setChartLoading(isCandlesLoading)
  }, [isCandlesLoading])

  const handleSelectTicker = useCallback(
      (ticker: MarketTicker) => {
        setSelectedTicker(ticker)
        if (isMobile) {
          setMobileView("trade")
        }
      },
      [isMobile, setSelectedTicker],
  )

  const TickerRowMemo = memo<{ ticker: MarketTicker }>(({ ticker }) => {
    const isSelected = selectedTicker?.symbol === ticker.symbol
    const priceValue = formatPriceValue(ticker.bid ?? ticker.price)

    return (
        <button
            onClick={() => handleSelectTicker(ticker)}
            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 ${
                isSelected
                    ? "border-purple-500/70 bg-purple-950/40"
                    : "border-slate-800/70 bg-slate-900/70 hover:bg-slate-900"
            }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <TickerAvatar
                symbol={ticker.symbol}
                category={ticker.category}
                baseCurrency={ticker.baseCurrency}
                quoteCurrency={ticker.quoteCurrency}
                size={32}
            />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-100">
                {ticker.showName}
              </div>
            </div>
          </div>
          <div className="text-right">
            {priceValue ? (
                <div className="font-mono text-xs text-slate-100">
                  ${priceValue}
                </div>
            ) : (
                <span className="inline-flex h-3 w-10 animate-pulse rounded bg-slate-800" />
            )}
          </div>
        </button>
    )
  }, areTickerRowsEqual)

  function areTickerRowsEqual(
      prevProps: { ticker: MarketTicker },
      nextProps: { ticker: MarketTicker },
  ) {
    return (
        prevProps.ticker.symbol === nextProps.ticker.symbol &&
        prevProps.ticker.bid === nextProps.ticker.bid &&
        prevProps.ticker.price === nextProps.ticker.price &&
        (selectedTicker?.symbol === prevProps.ticker.symbol) ===
        (selectedTicker?.symbol === nextProps.ticker.symbol)
    )
  }

  TickerRowMemo.displayName = "TickerRowMemo"

  const renderTickerRow = useCallback(
      (ticker: MarketTicker) => {
        return <TickerRowMemo key={ticker.symbol} ticker={ticker} />
      },
      [handleSelectTicker, formatPriceValue, selectedTicker],
  )

  const calculateMargin = () => {
    if (!selectedTicker) return "0.00"
    
    // Get the current price for margin calculation
    const price =
        realTimePrice || selectedTicker.bid || selectedTicker.price || 0
        
    // Validate price
    if (price <= 0) return "0.00"
    
    // Parse volume and leverage
    const vol = Number.parseFloat(volume) || 0
    const lev = Number.parseFloat(leverage) || 1
    
    // Validate inputs
    if (vol <= 0 || lev <= 0) return "0.00"
    
    // Calculate margin: (price * volume) / leverage
    const margin = (price * vol) / lev
    
    // Return formatted margin
    return margin.toFixed(2)
  }

  // Format price with proper precision based on asset type
  const formatPriceForAsset = (price: number, assetType: string) => {
    if (assetType === "Crypto") {
      // Crypto prices can have more precision
      if (price >= 1000) return price.toFixed(2);
      if (price >= 1) return price.toFixed(3);
      if (price >= 0.1) return price.toFixed(4);
      return price.toPrecision(6);
    } else {
      // Traditional assets with standard precision
      if (price >= 1000) return price.toFixed(2);
      if (price >= 1) return price.toFixed(3);
      return price.toFixed(4);
    }
  }

  // Calculate required margin with validation
  const calculateRequiredMargin = (price: number, vol: number, lev: number, assetType: string) => {
    // Validate inputs
    if (price <= 0 || vol <= 0 || lev <= 0) return 0;
    
    // Calculate margin: (price * volume) / leverage
    const margin = (price * vol) / lev;
    
    // Apply Binance-style minimums based on asset type
    const minMargin = assetType === "Crypto" ? 1 : 10; // $1 for crypto, $10 for others
    return Math.max(margin, minMargin);
  }

  const handleCloseTrade = async (tradeId: string, currentPrice: number) => {
    try {
      // Find the trade being closed
      const tradeToClose = activeTrades.find(trade => trade.id === tradeId)
      if (!tradeToClose) {
        toast({
          title: "❌",
          description: "Trade not found.",
          variant: "destructive",
        })
        return
      }

      // Optimistically update UI by removing the trade
      setActiveTrades(prev => prev.filter(trade => trade.id !== tradeId))
      
      // Show balance updating state
      setIsBalanceUpdating(true)

      // Retry mechanism for trade closing
      let retryCount = 0
      const maxRetries = 3
      
      const attemptClose = async (): Promise<Response> => {
        try {
          const response = await fetch(`/api/trades/${tradeId}/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ closePrice: currentPrice }),
          })
          return response
        } catch (error) {
          if (retryCount < maxRetries) {
            retryCount++
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
            return attemptClose()
          }
          throw error
        }
      }

      const response = await attemptClose()

      if (response.ok) {
        const result = await response.json()
        
        // Calculate profit for display in toast
        const profit = result.trade.profit || 0;
        const isProfit = profit >= 0;
        
        toast({
          title: isProfit ? "✅ Trade Closed with Profit" : "⚠️ Trade Closed with Loss",
          description: `Profit from this order: $${profit.toFixed(2)}`,
        })
        
        // Refresh balance after trade closure
        try {
          await refetchBalance()
        } catch (error) {
          console.error("Error refreshing balance:", error)
        } finally {
          // Hide balance updating state
          setIsBalanceUpdating(false)
        }
      } else {
        // Rollback optimistic update on error
        setActiveTrades(prev => [...prev, tradeToClose])
        
        // Hide balance updating state on error
        setIsBalanceUpdating(false)
        
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "❌",
          description:
              errorData.error ||
              t("closeTradeFailed") ||
              `Failed to close trade. ${retryCount > 0 ? `(Retried ${retryCount} times)` : ''}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error closing trade:", error)
      // Hide balance updating state on error
      setIsBalanceUpdating(false)
      toast({
        title: "❌",
        description: t("networkErrorTryAgain"),
        variant: "destructive",
      })
    }
  }

  const handleOpenChart = (trade: ActiveTrade) => {
    setSelectedTradeForChart(trade)
    setChartModalOpen(true)
  }

  const handlePlaceOrder = async () => {
    if (!selectedTicker) return

    try {
      const margin = Number.parseFloat(calculateMargin())

      // Validate margin calculation
      if (isNaN(margin) || margin <= 0) {
        toast({
          title: "❌ Invalid Margin",
          description: "Failed to calculate margin. Please check your inputs.",
          variant: "destructive",
        })
        return
      }

      // Check if user has sufficient balance
      if (margin > (balance || 0)) {
        toast({
          title: t("insufficientBalanceTitle") || "Insufficient balance",
          description:
              t("insufficientBalanceDesc") ||
              `Required: $${margin.toFixed(2)}, Available: $${balance?.toFixed(2) || "0.00"}`,
          variant: "destructive",
        })
        return
      }

      const orderData = {
        type: orderType,
        ticker: selectedTicker.symbol,
        volume: Number.parseFloat(volume),
        leverage: Number.parseInt(leverage),
        margin,
        openIn: realTimePrice || selectedTicker.bid || selectedTicker.price,
        takeProfit: takeProfitEnabled ? Number.parseFloat(takeProfit) : null,
        stopLoss: stopLossEnabled ? Number.parseFloat(stopLoss) : null,
        assetType: selectedTicker.category === "crypto" ? "Crypto" : "IEX",
      }

      // Validate all required fields
      if (!orderData.type || !orderData.ticker || !orderData.volume || !orderData.leverage || 
          !orderData.margin || !orderData.openIn || !orderData.assetType) {
        toast({
          title: "❌ Invalid Order",
          description: "Missing required order information. Please check your inputs.",
          variant: "destructive",
        })
        return
      }

      // Optimistically update UI
      const optimisticTrade: ActiveTrade = {
        id: `temp-${Date.now()}`,
        ticker: orderData.ticker,
        type: orderData.type as "BUY" | "SELL",
        volume: orderData.volume,
        margin: orderData.margin,
        leverage: orderData.leverage,
        openIn: orderData.openIn,
        openInA: orderData.openIn,
        profit: 0,
        status: "OPEN",
        takeProfit: takeProfitEnabled ? takeProfit : "",
        stopLoss: stopLossEnabled ? stopLoss : "",
        assetType: orderData.assetType,
        createdAt: new Date().toISOString(),
      }

      // Update UI immediately
      setActiveTrades(prev => [...prev, optimisticTrade])
      
      // Update balance optimistically
      const newBalance = (balance || 0) - orderData.margin
      // Note: We're not calling refetchBalance here as we're updating optimistically

      // Reset form immediately for better UX
      setVolume("0.01")
      setTakeProfit("")
      setStopLoss("")
      setTakeProfitEnabled(false)
      setStopLossEnabled(false)

      // Show balance updating state
      setIsBalanceUpdating(true)
      
      // Retry mechanism for trade placement
      let retryCount = 0
      const maxRetries = 3
      
      const attemptTrade = async (): Promise<Response> => {
        try {
          const response = await fetch("/api/trades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
          })
          return response
        } catch (error) {
          if (retryCount < maxRetries) {
            retryCount++
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
            return attemptTrade()
          }
          throw error
        }
      }

      const response = await attemptTrade()

      if (response.ok) {
        const createdTrade = await response.json()
        
        // Replace optimistic trade with real trade
        setActiveTrades(prev => [
          ...prev.filter(t => t.id !== optimisticTrade.id),
          createdTrade
        ])
        
        toast({
          title: `✅ ${orderType} Order Placed`,
          description: `Your ${orderData.volume} lot order for ${selectedTicker.symbol} has been placed.`,
        })

        // Refresh balance after trade placement
        try {
          await refetchBalance()
        } catch (error) {
          console.error("Error refreshing balance:", error)
        } finally {
          // Hide balance updating state
          setIsBalanceUpdating(false)
        }
      } else {
        // Rollback optimistic update on error
        setActiveTrades(prev => prev.filter(t => t.id !== optimisticTrade.id))
        
        // Hide balance updating state on error
        setIsBalanceUpdating(false)
        
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "❌",
          description:
              errorData.error ||
              t("orderPlaceFailed") ||
              `Failed to place order. ${retryCount > 0 ? `(Retried ${retryCount} times)` : ''}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "❌",
        description: t("networkErrorTryAgain"),
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!activeTrades.length || !balance) return

    const checkForAutoClose = async () => {
      for (const trade of activeTrades) {
        const tickerData = tickers.find((d: any) => d.symbol === trade.ticker)
        if (!tickerData) continue
      
        const currentPrice = tickerData.bid ?? tickerData.price ?? trade.openIn

        const profit =
            trade.type === "BUY"
                ? (currentPrice - trade.openIn) * trade.volume * trade.leverage
                : (trade.openIn - currentPrice) * trade.volume * trade.leverage

        // Auto-close if loss exceeds available balance
        if (profit < 0 && Math.abs(profit) >= balance) {
          try {
            // Check if trade is still active
            const tradeResponse = await fetch(`/api/trades/active`)
            if (tradeResponse.ok) {
              const activeTradesData = await tradeResponse.json()
              const isStillActive = activeTradesData.some(
                  (t: any) => t.id === trade.id,
              )
              if (!isStillActive) continue
            }

            // Close the trade
            const response = await fetch(`/api/trades/${trade.id}/close`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ closePrice: currentPrice }),
            })

            if (response.ok) {
              toast({
                title: "Auto-Close Alert",
                description: `Your ${trade.ticker} trade was automatically closed due to insufficient balance.`,
                variant: "destructive",
              })

              // Refresh active trades
              const tradesResponse = await fetch("/api/trades/active")
              if (tradesResponse.ok) {
                const data = await tradesResponse.json()
                setActiveTrades(data)
              }
              
              // Show balance updating state
              setIsBalanceUpdating(true)
              
              // Refresh balance after auto-close
              try {
                await refetchBalance()
              } catch (error) {
                console.error("Error refreshing balance:", error)
              } finally {
                // Hide balance updating state
                setIsBalanceUpdating(false)
              }

              break
            }
          } catch (error) {
            console.error("Error auto-closing trade:", error)
          }
        }
      }
    }

    checkForAutoClose()
  }, [activeTrades, balance, tickers, t])

  const getTimeframeInSeconds = (tf: string) => {
    const map: Record<string, number> = {
      M1: 60,
      M5: 300,
      M15: 900,
      M30: 1800,
      H1: 3600,
      H4: 14400,
      D1: 86400,
    }
    return map[tf] || 60
  }

  const timeframeInSeconds = getTimeframeInSeconds(timeframe)

  const handleZoomIn = () => {
    chartRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    chartRef.current?.zoomOut()
  }

  const handleResetView = () => {
    chartRef.current?.resetView()
  }

  const handleClearDrawings = () => {
    chartRef.current?.clearDrawings()
  }

  const handleToolSelect = (tool: "none" | "line") => {
    setSelectedTool(tool)
    chartRef.current?.setTool(tool)
  }

  // Convert MarketTicker to ChartTicker
  const convertToChartTickers = useCallback((): ChartTicker[] => {
    return tickers.map(ticker => ({
      symbol: ticker.symbol,
      price: ticker.price,
      time: ticker.time,
      type: "ticker", // Default type
      bid: ticker.bid
    }));
  }, [tickers]);

  const renderOrderPanel = (mode: "desktop" | "mobile") => {
    const compact = mode === "mobile"
    // Set advanced options to be expanded by default on desktop only
    const isAdvancedOpen = mode === "desktop" ? true : advancedOpen;

    if (!selectedTicker) {
      return (
          <Card className="border-slate-800 bg-slate-950/80">
            <CardContent className="flex h-16 items-center justify-center text-xs text-slate-500">
              {t("selectTicker")}
            </CardContent>
          </Card>
      )
    }

    return (
        <Card className="rounded-2xl border-slate-800 bg-slate-950/95 shadow-[0_0_40px_rgba(88,28,135,0.35)]">
          <CardContent
              className={`space-y-4 ${
                  compact ? "px-4 py-3" : "px-5 py-4"
              } text-xs`}
          >
            <Tabs
                value={orderType}
                onValueChange={(v) => setOrderType(v as "BUY" | "SELL")}
            >
              <TabsList className="grid h-9 w-full grid-cols-2 rounded-full bg-slate-900/80">
                <TabsTrigger
                    value="BUY"
                    className="h-9 rounded-full text-[11px] data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  {t("buyUpper")}
                </TabsTrigger>
                <TabsTrigger
                    value="SELL"
                    className="h-9 rounded-full text-[11px] data-[state=active]:bg-red-500 data-[state=active]:text-white"
                >
                  {t("sellUpper")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1">
              <Label className="text-[11px] text-slate-300">
                {t("volume")}
              </Label>
              <Input
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  placeholder="0.01"
                  className="h-9 rounded-md border-slate-800 bg-slate-950 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-slate-300">
                {t("leverage")}
              </Label>
              <Select value={leverage} onValueChange={setLeverage}>
                <SelectTrigger className="h-9 rounded-md border-slate-800 bg-slate-950 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-xs">
                  <SelectItem value="1">1:1</SelectItem>
                  <SelectItem value="5">1:5</SelectItem>
                  <SelectItem value="10">1:10</SelectItem>
                  <SelectItem value="25">1:25</SelectItem>
                  <SelectItem value="50">1:50</SelectItem>
                  <SelectItem value="100">1:100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{t("marginRequired")}</span>
              <span className="font-mono text-slate-100">
              ${calculateMargin()}
            </span>
            </div>

            <Collapsible open={isAdvancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center text-[11px] text-purple-300">
                  {t("advancedOptionsShort") || "TP / SL"}
                  <ChevronDown
                      className={`ml-1 h-3 w-3 transition-transform ${
                          isAdvancedOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                      checked={takeProfitEnabled}
                      onCheckedChange={() => {
                        setTakeProfitEnabled(!takeProfitEnabled)
                        const last =
                            candlesBySymbol[candlesBySymbol.length - 1]
                        if (!takeProfitEnabled && last) {
                          setTakeProfit(
                              (last.close + last.close / 100).toString(),
                          )
                        }
                      }}
                  />
                  <span className="text-[11px]">{t("takeProfit")}</span>
                </div>
                {takeProfitEnabled && (
                    <Input
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        className="h-9 rounded-md border-slate-800 bg-slate-950 text-xs"
                    />
                )}

                <div className="flex items-center gap-2">
                  <Switch
                      checked={stopLossEnabled}
                      onCheckedChange={() => {
                        setStopLossEnabled(!stopLossEnabled)
                        const last =
                            candlesBySymbol[candlesBySymbol.length - 1]
                        if (!stopLossEnabled && last) {
                          setStopLoss(
                              (last.close - last.close / 100).toString(),
                          )
                        }
                      }}
                  />
                  <span className="text-[11px]">{t("stopLoss")}</span>
                </div>
                {stopLossEnabled && (
                    <Input
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="h-9 rounded-md border-slate-800 bg-slate-950 text-xs"
                    />
                )}
              </CollapsibleContent>
            </Collapsible>

            <Button
                onClick={handlePlaceOrder}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-xs font-semibold shadow-[0_0_25px_rgba(129,140,248,0.7)] hover:brightness-110"
            >
              {t("placeOrderCta").replace("{type}", orderType)}
            </Button>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{t("balance")}</span>
              <span className="font-mono text-slate-100 flex items-center">
                {isBalanceUpdating ? (
                  <>
                    <span className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-purple-500"></span>
                    Updating...
                  </>
                ) : (
                  `$${balance?.toFixed(2) ?? "0.00"}`
                )}
              </span>
            </div>
          </CardContent>
        </Card>
    )
  }

  const renderActiveTrades = () => (
      <Card className="rounded-2xl border-slate-800 bg-slate-950/90 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-slate-800/70">
          <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            {t("activeTrades")}
          </CardTitle>
          <span className="rounded-full bg-purple-900/30 px-2 py-0.5 text-[11px] text-purple-300 font-medium">
            {activeTrades.length || "0"}
          </span>
        </CardHeader>
        <CardContent className="custom-scrollbar max-h-72 overflow-y-auto px-3 pb-3 pt-2">
          {activeTrades.length ? (
              <div className="space-y-3">
                {activeTrades.map((trade) => {
                  const tickerData = tickers.find((d) => d.symbol === trade.ticker)
                  const currentPrice = tickerData?.bid ?? trade.openIn
                  const profit =
                      trade.type === "BUY"
                          ? (currentPrice - trade.openIn) *
                          trade.volume *
                          trade.leverage
                          : (trade.openIn - currentPrice) *
                          trade.volume *
                          trade.leverage
                  const isProfit = profit >= 0
                  const meta = tickerMetaMap.get(trade.ticker)
                  const showName = meta?.showName ?? trade.ticker
                  const categoryLabel = meta
                      ? tickerCategoryLabels[meta.category]
                      : "Other"

                  return (
                      <div
                          key={trade.id}
                          className="rounded-xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4 hover:border-slate-700/60 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <TickerAvatar
                                  symbol={trade.ticker}
                                  category={(meta?.category ?? "other") as TickerCategory}
                                  baseCurrency={meta?.baseCurrency}
                                  quoteCurrency={meta?.quoteCurrency}
                                  size={40}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-slate-100 truncate">
                                    {showName}
                                  </span>
                                  <Badge
                                      variant="outline"
                                      className={`border px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                          trade.type === "BUY"
                                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                              : "border-red-500/40 bg-red-500/10 text-red-300"
                                      }`}
                                  >
                                    {trade.type}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-400 mb-2 truncate">
                                  {trade.ticker} • {categoryLabel}
                                </p>
                                <div className="flex flex-wrap gap-3 text-[11px]">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">Vol:</span>
                                    <span className="font-medium text-slate-200">{trade.volume} lot</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">Leverage:</span>
                                    <span className="font-medium text-slate-200">x{trade.leverage}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <div className="text-[10px] text-slate-500 mb-0.5">Profit/Loss</div>
                              <div
                                  className={`text-sm font-bold text-right ${
                                      isProfit ? "text-emerald-400" : "text-red-400"
                                  }`}
                              >
                                {isProfit ? "+" : ""}${
                                  Math.abs(profit).toFixed(2)
                                }
                              </div>
                            </div>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-3 text-[11px] rounded-lg bg-red-900/30 hover:bg-red-900/50 border border-red-800/50"
                                onClick={() =>
                                    handleCloseTrade(trade.id, currentPrice || 0)
                                }
                            >
                              <X className="mr-1 h-3 w-3" />
                              {t("close")}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-800/50 flex justify-between text-[11px]">
                          <div className="flex flex-col">
                            <span className="text-slate-500 mb-1">Entry</span>
                            <span className="font-mono text-slate-200">
                              ${trade.openIn.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-slate-500 mb-1">Current</span>
                            <span className="font-mono text-slate-200">
                              ${currentPrice.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-slate-500 mb-1">TP/SL</span>
                            <div className="flex gap-1">
                              {trade.takeProfit ? (
                                  <span className="font-mono text-emerald-400 text-[10px]">
                                    TP: ${Number(trade.takeProfit).toFixed(4)}
                                  </span>
                              ) : (
                                  <span className="text-slate-600 text-[10px]">No TP</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {trade.stopLoss ? (
                                  <span className="font-mono text-red-400 text-[10px]">
                                    SL: ${Number(trade.stopLoss).toFixed(4)}
                                  </span>
                              ) : (
                                  <span className="text-slate-600 text-[10px]">No SL</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                  )
                })}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-full bg-slate-800/50 p-3">
                  <BarChart3 className="h-6 w-6 text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400">
                  {t("noOpenPositions")}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Your active trades will appear here
                </p>
              </div>
          )}
        </CardContent>
      </Card>
  )

  const renderCategorizedTickers = () => {
    if (isLoading) {
      return (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className="h-11 w-full animate-pulse rounded-xl border border-slate-800/70 bg-slate-900/80"
                />
            ))}
          </div>
      )
    }

    const isSearching = searchTerm.trim().length > 0

    if (isSearching) {
      return (
          <div className="space-y-2">
            {searchResults.length === 0 ? (
                <div className="px-3 py-4 text-center text-[12px] text-slate-500">
                  {t("noTickersFound")}
                </div>
            ) : (
                <VirtualizedTickerList
                    tickers={searchResults}
                    selectedSymbol={selectedTicker?.symbol}
                    onSelectTicker={handleSelectTicker}
                    formatPriceValue={formatPriceValue}
                    height={typeof window !== "undefined" ? window.innerHeight - 300 : 400}
                />
            )}
          </div>
      )
    }

    return (
        <div className="space-y-2">
          {orderedCategories.map((categoryKey) => {
            const catTickers = tickersByCategory[categoryKey] || []
            if (!catTickers.length) return null
            const isOpen = openCategory === categoryKey
            return (
                <div
                    key={categoryKey}
                    className="rounded-2xl border border-slate-800 bg-slate-950/80"
                >
                  <button
                      type="button"
                      onClick={() =>
                          setOpenCategory(isOpen ? null : categoryKey)
                      }
                      className="flex w-full items-center justify-between px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                  <span
                      className={`h-2 w-2 rounded-full bg-gradient-to-r ${categoryAccent[categoryKey]} shadow`}
                  />
                      <span className="text-xs font-semibold">
                    {tickerCategoryLabels[categoryKey]}
                  </span>
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {isOpen && (
                      <div className="border-t border-slate-800/80">
                        <VirtualizedTickerList
                            tickers={catTickers}
                            selectedSymbol={selectedTicker?.symbol}
                            onSelectTicker={handleSelectTicker}
                            formatPriceValue={formatPriceValue}
                            height={Math.min(420, catTickers.length * 64)}
                        />
                      </div>
                  )}
                </div>
            )
          })}
        </div>
    )
  }

  const renderTimeframeSelector = (layout: "desktop" | "mobile") => {
    const timeframes = [
      { value: "M1", label: "1m" },
      { value: "M5", label: "5m" },
      { value: "M15", label: "15m" },
      { value: "M30", label: "30m" },
      { value: "H1", label: "1h" },
      { value: "H4", label: "4h" },
      { value: "D1", label: "1d" },
    ]

    if (layout === "desktop") {
      return (
          <div className="flex items-center gap-1">
            {timeframes.map((tf) => (
                <Button
                    key={tf.value}
                    variant={timeframe === tf.value ? "default" : "outline"}
                    size="sm"
                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium ${
                        timeframe === tf.value
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-800"
                    }`}
                    onClick={() => setTimeframe(tf.value)}
                >
                  {tf.label}
                </Button>
            ))}
          </div>
      )
    }

    return (
        <Select value={timeframe} onValueChange={(val) => setTimeframe(val)}>
          <SelectTrigger className="h-8 w-24 rounded-full border-slate-800 bg-slate-950 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-slate-800 bg-slate-950 text-xs">
            {timeframes.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
    )
  }

  const renderChartHeader = (layout: "desktop" | "mobile") => {
    if (!selectedTicker) return null
    const compact = layout === "mobile"
    const liveLabel = t("live") || "LIVE"

    return (
        <div
            className={`rounded-2xl border border-slate-800 bg-slate-950/90 ${
                compact ? "px-3 py-3" : "px-5 py-4"
            }`}
        >
          <div
              className={`flex ${
                  compact
                      ? "flex-col gap-3"
                      : "items-center justify-between gap-4"
              }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <TickerAvatar
                  symbol={selectedTicker.symbol}
                  category={selectedTicker.category}
                  baseCurrency={selectedTicker.baseCurrency}
                  quoteCurrency={selectedTicker.quoteCurrency}
                  size={compact ? 38 : 48}
                  icon={selectedTicker.icon}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`${
                        compact ? "text-base" : "text-lg"
                    } font-semibold text-white`}
                >
                  {selectedTicker.showName}
                </span>
                  {/*<Badge*/}
                  {/*    variant="outline"*/}
                  {/*    className="border-slate-800 bg-slate-900/60 text-[10px] uppercase"*/}
                  {/*>*/}
                  {/*  {selectedTicker.symbol}*/}
                  {/*</Badge>*/}
                  {!compact && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        {liveLabel}
                  </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  {tickerCategoryLabels[selectedTicker.category]}
                </p>
              </div>
            </div>

            <div className={compact ? "" : "text-right"}>
              <div
                  className={`font-mono font-semibold text-white ${
                      compact ? "text-2xl" : "text-3xl"
                  }`}
              >
                {selectedPrice ? `$${selectedPrice}` : "—"}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {t("timeframe") || "Timeframe"}
            </span>
              {renderTimeframeSelector(layout)}
            </div>

            <div className="flex items-center gap-1">
              <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-slate-800 bg-slate-950 text-slate-200"
                  onClick={() => handleToolSelect("none")}
                  title="Select tool"
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                  variant={selectedTool === "line" ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 rounded-full border-slate-800 bg-slate-950 text-slate-200"
                  onClick={() => handleToolSelect("line")}
                  title="Line tool"
              >
                <LineChart className="h-4 w-4" />
              </Button>
              <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-slate-800 bg-slate-950 text-slate-200"
                  onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-slate-800 bg-slate-950 text-slate-200"
                  onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-slate-800 bg-slate-950 text-slate-200"
                  onClick={handleResetView}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-slate-800 bg-slate-950 text-slate-200"
                  onClick={handleClearDrawings}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Drawing mode indicator */}
          {selectedTool !== "none" && (
              <div className="mt-2 rounded bg-slate-900/90 px-2 py-1 text-[11px] text-slate-100 border border-slate-700 inline-block">
                Drawing: {selectedTool === "line" ? "Line" : selectedTool}
              </div>
          )}
        </div>
    )
  }

  const renderDesktopMain = () => (
      <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden flex-1 flex-col  gap-2 sm:flex"
      >
        {renderChartHeader("desktop")}
        <Card className="rounded-none min-h-[360px] max-h-[520px] flex-1 bg-slate-950/85">
          <CardContent className="h-full p-0 rounded-md">
            {selectedTicker &&
            !chartLoading &&
            candlesBySymbol &&
            candlesBySymbol.length > 0 ? (
                <AdvancedChartWithDrawings
                    ref={chartRef}
                    candles={candlesBySymbol}
                    liveTickers={convertToChartTickers()}
                    selectedSymbol={selectedTicker.symbol}
                    timeframeInSeconds={timeframeInSeconds}
                    isLoaded={!chartLoading}
                />
            ) : selectedTicker ? (
                <div className="flex h-full min-h-[260px] items-center justify-center  bg-slate-950">
                  <div className="text-center text-xs text-slate-400">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500" />
                    {t("loadingChartData")}
                  </div>
                </div>
            ) : (
                <div className="flex h-full min-h-[260px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                  <div className="max-w-xs text-center text-xs text-slate-400">
                    {t("selectTickerToStart")}
                  </div>
                </div>
            )}
          </CardContent>
        </Card>
        {renderActiveTrades()}
      </motion.main>
  )

  const renderMobileMain = () => {
    if (mobileView === "market") {
      return (
          <motion.main
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-1 flex-col gap-3 px-2 pb-3 pt-2 sm:hidden"
          >
            {/* Chart header is completely hidden in mobile market view */}
            <Card className="rounded-2xl border-slate-800 bg-slate-950/90">
              <CardHeader className="border-b border-slate-800/80 px-3 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <Input
                      placeholder={t("searchTickers")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 rounded-lg border-slate-800 bg-slate-950 pl-7 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="custom-scrollbar max-h-[70vh] space-y-2 overflow-y-auto p-3">
                {renderCategorizedTickers()}
              </CardContent>
            </Card>
            {renderActiveTrades()}
          </motion.main>
      )
    }

    return (
        <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-1 flex-col gap-3 px-2 pb-3 pt-2 sm:hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileView("market")}
                className="-ml-1 h-8 rounded-full border border-slate-800 px-3 text-[11px]"
            >
              ← {t("back") || "Back"}
            </Button>
            {selectedTicker && (
                <div className="ml-auto flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-100">
                      {selectedTicker.showName}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      {selectedTicker.fullName}
                    </div>
                  </div>
                  <TickerAvatar
                      symbol={selectedTicker.symbol}
                      category={selectedTicker.category}
                      baseCurrency={selectedTicker.baseCurrency}
                      quoteCurrency={selectedTicker.quoteCurrency}
                      size={32}
                  />
                </div>
            )}
          </div>

          {/* Only show chart header when a ticker is selected in mobile view */}
          {selectedTicker && renderChartHeader("mobile")}

          <Card className="min-h-[260px] rounded-2xl border border-slate-800 bg-slate-950/85">
            <CardContent className="h-full p-2.5">
              {selectedTicker &&
              !chartLoading &&
              candlesBySymbol &&
              candlesBySymbol.length > 0 ? (
                  <AdvancedChartWithDrawings
                      ref={chartRef}
                      candles={candlesBySymbol}
                      liveTickers={convertToChartTickers()}
                      selectedSymbol={selectedTicker.symbol}
                      timeframeInSeconds={timeframeInSeconds}
                      isLoaded={!chartLoading}
                      isMobile
                  />
              ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                    <div className="max-w-xs text-center text-xs text-slate-400">
                      {t("loadingChartData")}
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>

          {renderOrderPanel("mobile")}
          {renderActiveTrades()}
        </motion.main>
    )
  }

  const unreadNav = 0

  return (
      <>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative min-h-[calc(100vh-64px)] bg-gradient-to-br from-[#050012] via-[#050314] to-[#09051c] text-slate-50"
        >
          <div className="flex min-h-[calc(100vh-64px)] flex-col gap-4 px-3 pb-20 pt-3 lg:flex-row lg:pb-4">
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="hidden w-full flex-col rounded-2xl border border-slate-800/80 bg-slate-950/90 lg:flex lg:w-72"
            >
              <div className="border-b border-slate-800/80 px-3.5 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-semibold">Market</span>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <Input
                      placeholder={t("searchTickers")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 rounded-lg border-slate-800 bg-slate-950 pl-7 text-xs"
                  />
                </div>
              </div>
              <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
                {renderCategorizedTickers()}
              </div>
            </motion.aside>

            {isMobile ? renderMobileMain() : renderDesktopMain()}

            <aside className="hidden w-80 flex-col rounded-2xl border border-slate-800/80 bg-slate-950/90 lg:flex">
              <div className="p-3">{renderOrderPanel("desktop")}</div>
            </aside>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-900 bg-slate-950/95 px-1 py-1 lg:hidden">
            <div className="flex items-center justify-around">
              <Link href="/dashboard">
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center text-slate-400"
                >
                  <Home className="h-4 w-4" />
                  <span className="text-[10px]">{t("bottomDashboard")}</span>
                </Button>
              </Link>
              <Link href="/transactions">
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center text-slate-400"
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-[10px]">
                  {t("bottomTransactions")}
                </span>
                </Button>
              </Link>
              <Link href="/">
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center text-purple-400"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-[10px]">{t("bottomTrade")}</span>
                </Button>
              </Link>
              <Link href="/news">
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center text-slate-400"
                >
                  <Newspaper className="h-4 w-4" />
                  <span className="text-[10px]">{t("bottomNews")}</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center text-slate-400"
                >
                  <User className="h-4 w-4" />
                  <span className="text-[10px]">{t("bottomProfile")}</span>
                </Button>
              </Link>
              <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center text-slate-400"
                  onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-[10px]">{t("bottomLogout")}</span>
              </Button>
            </div>
          </div>

          <Dialog open={chartModalOpen} onOpenChange={setChartModalOpen}>
            <DialogContent className="h-[80vh] max-w-4xl border-slate-800 bg-slate-950">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {selectedTradeForChart?.ticker} -{" "}
                  {selectedTradeForChart?.type}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 p-4">
                <div ref={modalChartRef} className="h-full w-full" />
              </div>
            </DialogContent>
          </Dialog>

          <DepositModal
              open={depositModalOpen}
              onOpenChange={setDepositModalOpen}
              userId={user?.id ?? ""}
          />
        </motion.div>
      </>
  )
}