"use client"

import React, {
  useState,
  useEffect,
  useRef,
  MouseEvent,
  WheelEvent,
  useCallback,
  useMemo,
  TouchEvent,
} from "react"
import {AnimatePresence, motion} from "framer-motion";
import {
  MousePointer,
  Pencil,
  Minus,
  Square,
  Circle,
  Ruler,
  Trash2,
  Star,
  BarChart3,
  Home,
  FileText,
  Newspaper,
  User,
  Hand,
  Maximize2,
  Minimize2,
  Sparkles,
  Cpu,   // 👈 добавить
} from "lucide-react"
import { useTickers } from "@/hooks/market-data"
import { useI18n } from "@/components/i18n-provider"
import { useBalance } from "@/hooks/useBalance"
import { VirtualizedTickerList } from "@/components/virtualized-ticker-list"
import { TickerAvatar } from "@/components/ticker-avatar"
import {
  tickerCategoryLabels,
  orderedCategories,
  type TickerCategory,
} from "@/data/ticker-meta"
import { useIsMobile } from "@/hooks/use-mobile"
import { X } from "lucide-react"
import { AnimatedNumber } from "@/components/animated-number"

type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type DrawingType =
    | "select"
    | "pan"
    | "trendline"
    | "horizontal"
    | "vertical"
    | "rectangle"
    | "circle"
    | "fibonacci"

type DataPoint = {
  index: number
  price: number
}

type Drawing = {
  id: string | number
  type: Exclude<DrawingType, "select" | "pan">
  p1: DataPoint
  p2: DataPoint
  color?: string
}

type Layout = {
  padding: { top: number; right: number; bottom: number; left: number }
  width: number
  height: number
  chartWidth: number
  chartHeight: number
  maxPrice: number
  minPrice: number
  pricePadding: number
  priceScale: number
  startIndex: number
  endIndex: number
  candleWidth: number
  candleSpacing: number
  totalCandleWidth: number
}

const timeframeMap: Record<string, number> = {
  M1: 60,
  M5: 300,
  M15: 900,
  M30: 1800,
  H1: 3600,
  H4: 14400,
  D1: 86400,
}

const timeframes = [
  { value: "M1", label: "1m" },
  { value: "M5", label: "5m" },
  { value: "M15", label: "15m" },
  { value: "M30", label: "30m" },
  { value: "H1", label: "1h" },
  { value: "H4", label: "4h" },
  { value: "D1", label: "1d" },
]

const categoryAccent: Record<TickerCategory, string> = {
  forex: "from-blue-400 to-sky-500",
  stocks: "from-emerald-400 to-lime-500",
  crypto: "from-amber-400 to-orange-500",
  indices: "from-purple-400 to-pink-500",
  commodities: "from-rose-400 to-red-500",
  other: "from-slate-400 to-slate-600",
}

// формат подписи времени: зависит от таймфрейма
const formatTimeLabel = (timestampSec: number, timeframe: string) => {
  const d = new Date(timestampSec * 1000)
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const hours = d.getHours().toString().padStart(2, "0")
  const minutes = d.getMinutes().toString().padStart(2, "0")

  // Минутные и часовые ТФ — показываем только время
  if (
      timeframe === "M1" ||
      timeframe === "M5" ||
      timeframe === "M15" ||
      timeframe === "M30" ||
      timeframe === "H1" ||
      timeframe === "H4"
  ) {
    return `${hours}:${minutes}`
  }

  // D1 — только дата (чтобы не засорять)
  if (timeframe === "D1") {
    return `${day}.${month}`
  }

  // fallback
  return `${day}.${month}`
}

const TestChart: React.FC = () => {
  const { t } = useI18n()
  const isMobile = useIsMobile()
  // 🔹 баланс
  const { balance, refetchBalance } = useBalance()
  // 🔹 данные о себе, чтобы узнать aiTrading
  const [me, setMe] = useState<{
    id: string
    aiTrading?: boolean | null
  } | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  useEffect(() => {
    let cancelled = false

    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setMe(data.user)
      } catch (e) {
        console.error("Failed to load /api/auth/me", e)
      } finally {
        if (!cancelled) setMeLoading(false)
      }
    }

    loadMe()

    return () => {
      cancelled = true
    }
  }, [])

  const aiAvailable = !!me?.aiTrading

  // 🔹 AI-режим
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiAmount, setAiAmount] = useState<string>("50")
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalyzed, setAiAnalyzed] = useState(false)
  const [aiSuggested, setAiSuggested] = useState<{
    symbol: string
    type: "BUY" | "SELL"
    price: number
  } | null>(null)
  const {
    tickers,
    setSelectedTicker: setMarketTicker,
    selectedTicker,
    candlesBySymbol,
    timeframe,
    setTimeframe,
    isLoading,
    isCandlesLoading,
  } = useTickers("H1")

  const symbol = selectedTicker?.symbol || null

  const [mobileView, setMobileView] = useState<"market" | "trade">("market")

  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    bb: false,
    rsi: false,
    macd: false,
    volume: true,
  })
  const [drawMode, setDrawMode] = useState<DrawingType>("select")
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [selectedDrawing, setSelectedDrawing] = useState<
      string | number | null
  >(null)

  const [scale, setScale] = useState(1)
  const [panOffset, setPanOffset] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; offset: number } | null>(
      null,
  )

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const drawingRef = useRef<Drawing | null>(null)
  const layoutRef = useRef<Layout | null>(null)
// какой конец trend line тащим
  const [dragHandle, setDragHandle] = useState<"p1" | "p2" | null>(null)
  const [isMobileChartFullscreen, setIsMobileChartFullscreen] = useState(false)
  // плавная загрузка фуллскрина
  const [isFullscreenLoading, setIsFullscreenLoading] = useState(false)

// чтобы возвращать скролл туда, где был
  const fullscreenScrollYRef = useRef(0)
  const [dragDrawingId, setDragDrawingId] = useState<string | number | null>(
      null,
  )
  const dragStartRef = useRef<{
    mouse: DataPoint
    drawing: Drawing
  } | null>(null)

  const touchPanStartRef = useRef<{ x: number; offset: number } | null>(null)

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [openCategory, setOpenCategory] = useState<TickerCategory | null>("forex")
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all")
  const [favoriteSymbols, setFavoriteSymbols] = useState<Set<string>>(new Set())
  // Drawing persistence
  const [saveStatus, setSaveStatus] = useState<
      "idle" | "saving" | "saved" | "error"
  >("idle")

  // Order / balance
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY")
  const [volume, setVolume] = useState("0.01")
  const [leverage, setLeverage] = useState("100")
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false)
  const [stopLossEnabled, setStopLossEnabled] = useState(false)
  const [takeProfit, setTakeProfit] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [isBalanceUpdating, setIsBalanceUpdating] = useState(false)
  const [activeTrades, setActiveTrades] = useState<any[]>([])
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔹 Расчётная стоимость ордера (orderAmount) и маржа (margin)
  const orderAmount = useMemo(() => {
    if (!selectedTicker) return 0

    const price =
        selectedTicker.bid ||
        selectedTicker.price ||
        candles[candles.length - 1]?.close ||
        0

    const vol = Number.parseFloat(volume) || 0
    if (!price || !vol) return 0

    return price * vol // notional в валюте счёта
  }, [selectedTicker, candles, volume])

  const margin = useMemo(() => {
    const amt = orderAmount
    const lev = Number.parseFloat(leverage) || 0
    if (!amt || !lev) return 0
    return amt / lev
  }, [orderAmount, leverage])

  const timeframeSeconds = useMemo(
      () => timeframeMap[timeframe] ?? 60,
      [timeframe],
  )

  // --- candles gap fill ---
  const fillGapsWithBridgingCandles = useCallback(
      (data: Candle[], tfSec: number): Candle[] => {
        if (!data || data.length === 0 || !tfSec) return data

        const result: Candle[] = []
        result.push(data[0])

        for (let i = 1; i < data.length; i++) {
          const prev = result[result.length - 1]
          const curr = data[i]
          const diff = curr.time - prev.time

          if (diff > tfSec * 1.5) {
            const open = prev.close
            const close = curr.open ?? curr.close
            const high = Math.max(prev.high, curr.high, open, close)
            const low = Math.min(prev.low, curr.low, open, close)

            result.push({
              time: prev.time + tfSec,
              open,
              high,
              low,
              close,
              volume: 0,
            })
          }

          result.push(curr)
        }

        return result
      },
      [],
  )

  const formatPriceValue = useCallback((value?: number | null) => {
    if (value == null || Number.isNaN(value)) return null
    if (value >= 1000) return value.toFixed(2)
    if (value >= 1) return value.toFixed(3)
    if (value >= 0.1) return value.toFixed(4)
    return value.toPrecision(4)
  }, [])
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const res = await fetch("/api/trades/favorite-tickers")
        if (!res.ok) return
        const data: { symbols: string[] } = await res.json()
        setFavoriteSymbols(new Set(data.symbols))
      } catch (e) {
        console.error("Failed to load favorites", e)
      }
    }
    loadFavorites()
  }, [])
  const handleToggleFavorite = async (symbol: string) => {
    setFavoriteSymbols((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) {
        next.delete(symbol)
      } else {
        next.add(symbol)
      }
      return next
    })

    // ⚠️ Здесь используй тот же API, что и в админке
    try {
      const res = await fetch("/api/trades/favorite-tickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      })
      if (!res.ok) {
        console.error("Failed to toggle favorite")
      }
    } catch (e) {
      console.error("Failed to toggle favorite", e)
    }
  }
  // Active trades
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
    const interval = setInterval(fetchActiveTrades, 10000)
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    if (typeof window === "undefined") return

    const body = document.body

    if (isMobileChartFullscreen) {
      // запоминаем, где был скролл
      fullscreenScrollYRef.current = window.scrollY || window.pageYOffset || 0

      // лочим страницу
      body.style.position = "fixed"
      body.style.top = `-${fullscreenScrollYRef.current}px`
      body.style.left = "0"
      body.style.right = "0"
      body.style.width = "100%"
      body.style.overflow = "hidden"
    } else {
      // снимаем лок
      const y = fullscreenScrollYRef.current
      body.style.position = ""
      body.style.top = ""
      body.style.left = ""
      body.style.right = ""
      body.style.width = ""
      body.style.overflow = ""

      // возвращаем пользователя туда, где он был до фуллскрина
      if (y) {
        window.scrollTo(0, y)
      }
    }
  }, [isMobileChartFullscreen])

  const placeTrade = useCallback(
      async (payload: {
        type: "BUY" | "SELL"
        ticker: string
        volume: number
        leverage: number
        margin: number
        openIn: number
        takeProfit?: number | null
        stopLoss?: number | null
        assetType?: string
        aiEnabled?: boolean
      }) => {
        setError(null)

        if (!payload.openIn || payload.openIn <= 0) {
          setError("No valid price to open trade")
          return null
        }

        if (!balance || balance < payload.margin) {
          // balance + credit will be checked on backend, but FE can show msg too
          setError("Insufficient balance")
          return null
        }

        setIsPlacingOrder(true)

        const optimistic = {
          id: "temp-" + Date.now(),
          status: "OPEN",
          createdAt: new Date().toISOString(),
          ...payload,
        }

        setActiveTrades((p) => [...p, optimistic])

        try {
          const res = await fetch("/api/trades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload), // ← числа, не строки
          })

          const data = await res.json()

          if (!res.ok) throw new Error(data?.error || "Failed to place order")

          // replace optimistic with real trade
          setActiveTrades((p) =>
              p.map((t) => (t.id === optimistic.id ? data : t))
          )

          await refetchBalance()
          return data
        } catch (e: any) {
          console.error(e)
          // rollback optimistic
          setActiveTrades((p) => p.filter((t) => t.id !== optimistic.id))
          setError(e.message)
          return null
        } finally {
          setIsPlacingOrder(false)
        }
      },
      [balance, refetchBalance]
  )

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedTicker) return setError("No symbol selected")

    const vol = Number(volume)
    const lev = Number(leverage)

    if (!vol || !lev) return setError("Fill volume and leverage")

    const last = candles[candles.length - 1]
    const price = last?.close || last?.open

    if (!price) return setError("No price available")

    const payload = {
      type: orderType,
      ticker: selectedTicker.symbol,
      volume: vol,
      leverage: lev,
      margin: margin, // from useMemo
      openIn: price,
      takeProfit: takeProfitEnabled ? Number(takeProfit) : null,
      stopLoss: stopLossEnabled ? Number(stopLoss) : null,
      assetType: selectedTicker.category === "crypto" ? "Crypto" :  selectedTicker.category === "forex" ? "Forex" : "IEX",
      aiEnabled: false,
    }

    await placeTrade(payload)

  }, [orderType, selectedTicker, volume, leverage, margin, candles, takeProfitEnabled, stopLossEnabled])
  // 🔹 запуск "анализа" AI
  const handleStartAiAnalyze = useCallback(() => {
    if (!aiAvailable || !aiEnabled || aiAnalyzing) return

    setAiAnalyzing(true)
    setAiAnalyzed(false)
    setAiSuggested(null)
    setError(null)

    // имитация красивого анализа: через ~2.3 сек выдаём результат
    setTimeout(() => {
      if (!tickers.length) {
        setAiAnalyzing(false)
        setError("Not enough market data for AI analysis yet")
        return
      }

      const randomTicker =
          tickers[Math.floor(Math.random() * tickers.length)]
      const lastPrice =
          candles[candles.length - 1]?.close ??
          candles[candles.length - 1]?.open ??
          randomTicker.bid ??
          randomTicker.ask ??
          randomTicker.lastPrice ??
          1

      const direction: "BUY" | "SELL" =
          Math.random() > 0.5 ? "BUY" : "SELL"

      setAiSuggested({
        symbol: randomTicker.symbol,
        type: direction,
        price: lastPrice,
      })
      setAiAnalyzing(false)
      setAiAnalyzed(true)
    }, 2300)
  }, [aiAvailable, aiEnabled, aiAnalyzing, tickers, candles])

// 🔹 открыть ордер по результатам AI
  const handlePlaceAiOrder = useCallback(async () => {
    if (!aiSuggested) return

    const parsedMargin = Number(aiAmount)
    if (!parsedMargin) return setError("Enter correct AI amount")

    const price = aiSuggested.price
    const leverageValue = 25

    let vol = (parsedMargin * leverageValue) / price
    if (vol < 0.01) vol = 0.01
    if (vol > 1000) vol = 1000

    await placeTrade({
      type: aiSuggested.type,
      ticker: aiSuggested.symbol,
      volume: vol,
      leverage: leverageValue,
      margin: parsedMargin,
      openIn: price,
      takeProfit: null,
      stopLoss: null,
      assetType: "Crypto",
      aiEnabled: true,
    })

    setAiSuggested(null)
  }, [aiSuggested, aiAmount])
  // --- candles from hook + gap fill ---
  useEffect(() => {
    if (candlesBySymbol && candlesBySymbol.length > 0) {
      const processed = fillGapsWithBridgingCandles(
          candlesBySymbol as Candle[],
          timeframeSeconds,
      )
      setCandles(processed)
      setLoading(false)
    } else if (!isCandlesLoading && symbol) {
      setCandles([])
      setLoading(false)
    }
  }, [
    candlesBySymbol,
    isCandlesLoading,
    timeframeSeconds,
    fillGapsWithBridgingCandles,
    symbol,
  ])

  // --- API: загрузка рисунков только по выбору тикера/таймфрейма ---
  const loadDrawingsFor = useCallback(
      async (sym: string, tf: string) => {
        try {
          const response = await fetch(
              `/api/chart-drawings?symbol=${sym}&timeframe=${tf}`,
          )
          if (response.ok) {
            const data = await response.json()
            if (data.drawings) {
              setDrawings(data.drawings)
            } else {
              setDrawings([])
            }
          }
        } catch (error) {
          console.error("Failed to load drawings:", error)
        }
      },
      [],
  )

  // API: сохранить рисунки только по кнопке
  const saveDrawings = useCallback(async () => {
    if (!symbol) return

    setSaveStatus("saving")
    try {
      const response = await fetch("/api/chart-drawings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          drawings,
        }),
      })

      if (response.ok) {
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    } catch (error) {
      console.error("Failed to save drawings:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }, [symbol, timeframe, drawings])

  // API: очистка рисунков только по кнопке
  const clearDrawingsOnServer = useCallback(
      async (sym: string, tf: string) => {
        try {
          await fetch("/api/chart-drawings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              symbol: sym,
              timeframe: tf,
              drawings: [],
            }),
          })
        } catch (error) {
          console.error("Failed to clear drawings on server:", error)
        }
      },
      [],
  )

  // выбор тикера
  const handleSelectTicker = useCallback(
      async (ticker: any) => {
        setLoading(true)
        setCandles([])
        setPanOffset(0)
        setScale(1)
        setSelectedDrawing(null)
        setDrawings([])

        setMarketTicker(ticker)

        if (isMobile) {
          setMobileView("trade")
        }

        if (ticker?.symbol) {
          await loadDrawingsFor(ticker.symbol, timeframe)
        }
      },
      [setMarketTicker, loadDrawingsFor, timeframe, isMobile],
  )
  const handleWheelNative = useCallback(
      (e: WheelEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // если хотел панорамирование по Shift
        if (e.shiftKey) {
          const delta = e.deltaY || e.deltaX
          setPanOffset((prev) =>
              Math.max(
                  0,
                  Math.min(prev + delta * 0.5, Math.max(0, candles.length - 50)),
              ),
          )
          return
        }

        // зум
        if (e.deltaY < 0) {
          setScale((s) => Math.min(s + 0.1, 3))
        } else {
          setScale((s) => Math.max(s - 0.1, 0.5))
        }
      },
      [candles.length],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const listener = (e: WheelEvent) => handleWheelNative(e)

    el.addEventListener("wheel", listener, { passive: false })
    return () => el.removeEventListener("wheel", listener)
  }, [handleWheelNative])
  // смена таймфрейма
  const handleTimeframeClick = useCallback(
      async (value: string) => {
        setTimeframe(value)
        if (selectedTicker?.symbol) {
          await loadDrawingsFor(selectedTicker.symbol, value)
        }
      },
      [setTimeframe, selectedTicker, loadDrawingsFor],
  )

  // --- индикаторы ---
  const calculateSMA = (data: Candle[], period: number) => {
    const sma: { index: number; value: number }[] = []
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1)
      const sum = slice.reduce((acc, c) => acc + c.close, 0)
      sma.push({ index: i, value: sum / period })
    }
    return sma
  }

  const calculateEMA = (data: Candle[], period: number) => {
    if (data.length < period) return []
    const ema: { index: number; value: number }[] = []
    const k = 2 / (period + 1)
    let prev =
        data.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period
    ema.push({ index: period - 1, value: prev })
    for (let i = period; i < data.length; i++) {
      const value = (data[i].close - prev) * k + prev
      ema.push({ index: i, value })
      prev = value
    }
    return ema
  }

  const calculateBollinger = (data: Candle[], period: number, stdDev: number) => {
    const sma = calculateSMA(data, period)
    return sma.map((p) => {
      const start = p.index - period + 1
      const slice = data.slice(start, start + period)
      const mean = p.value
      const variance =
          slice.reduce((sum, c) => sum + (c.close - mean) ** 2, 0) / period
      const sd = Math.sqrt(variance)
      return {
        index: p.index,
        upper: mean + stdDev * sd,
        middle: mean,
        lower: mean - stdDev * sd,
      }
    })
  }

  const calculateRSI = (data: Candle[], period: number) => {
    const rsi: { index: number; value: number }[] = []
    if (data.length <= period) return rsi
    for (let i = period; i < data.length; i++) {
      let gains = 0
      let losses = 0
      for (let j = i - period + 1; j <= i; j++) {
        const diff = data[j].close - data[j - 1].close
        if (diff > 0) gains += diff
        else losses -= diff
      }
      const avgGain = gains / period
      const avgLoss = losses / period || 1
      const rs = avgGain / avgLoss
      const v = 100 - 100 / (1 + rs)
      rsi.push({ index: i, value: v })
    }
    return rsi
  }

  const calculateMACD = (data: Candle[]) => {
    const ema12 = calculateEMA(data, 12)
    const ema26 = calculateEMA(data, 26)
    const macd: { index: number; macd: number }[] = []

    const len = Math.min(ema12.length, ema26.length)
    for (let i = 0; i < len; i++) {
      const i12 = ema12[i]
      const i26 = ema26.find((e) => e.index === i12.index)
      if (!i26) continue
      macd.push({ index: i12.index, macd: i12.value - i26.value })
    }

    const signal: { index: number; value: number }[] = []
    const period = 9
    if (macd.length >= period) {
      const startAvg =
          macd.slice(0, period).reduce((acc, m) => acc + m.macd, 0) / period
      let prev = startAvg
      const k = 2 / (period + 1)
      for (let i = period; i < macd.length; i++) {
        const v = (macd[i].macd - prev) * k + prev
        signal.push({ index: macd[i].index, value: v })
        prev = v
      }
    }
    return { macd, signal }
  }

  // --- data<->pixel ---
  const dataToPixel = (p: DataPoint, layout: Layout) => {
    if (
        !p ||
        typeof p.index !== "number" ||
        typeof p.price !== "number" ||
        !layout
    ) {
      return { x: 0, y: 0 }
    }
    const {
      padding,
      maxPrice,
      pricePadding,
      priceScale,
      startIndex,
      totalCandleWidth,
      candleSpacing,
    } = layout
    const x =
        padding.left + (p.index - startIndex) * totalCandleWidth + candleSpacing
    const y =
        padding.top + (maxPrice + pricePadding - p.price) * priceScale
    return { x, y }
  }

  const pixelToData = (x: number, y: number): DataPoint | null => {
    const layout = layoutRef.current
    if (!layout) return null
    const {
      padding,
      maxPrice,
      minPrice,
      pricePadding,
      priceScale,
      startIndex,
      totalCandleWidth,
      candleSpacing,
    } = layout

    const index =
        (x - padding.left - candleSpacing) / totalCandleWidth + startIndex
    const price =
        maxPrice + pricePadding - (y - padding.top) / (priceScale || 1)

    const maxP = maxPrice + pricePadding
    const minP = minPrice - pricePadding
    const clampedPrice = Math.max(minP, Math.min(maxP, price))

    return { index, price: clampedPrice }
  }

  const hitTestDrawing = (x: number, y: number): string | number | null => {
    const layout = layoutRef.current
    if (!layout) return null
    const threshold = 8

    for (let i = drawings.length - 1; i >= 0; i--) {
      const d = drawings[i]
      if (
          !d ||
          !d.p1 ||
          !d.p2 ||
          typeof d.p1.index !== "number" ||
          typeof d.p1.price !== "number" ||
          typeof d.p2.index !== "number" ||
          typeof d.p2.price !== "number"
      ) {
        continue
      }

      const p1 = dataToPixel(d.p1, layout)
      const p2 = dataToPixel(d.p2, layout)

      if (d.type === "trendline" || d.type === "fibonacci") {
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const len2 = dx * dx + dy * dy || 1
        const t = ((x - p1.x) * dx + (y - p1.y) * dy) / len2
        const tt = Math.max(0, Math.min(1, t))
        const projX = p1.x + tt * dx
        const projY = p1.y + tt * dy
        const dist = Math.hypot(x - projX, y - projY)
        if (dist <= threshold) return d.id
      } else if (d.type === "horizontal") {
        const dist = Math.abs(y - p1.y)
        if (dist <= threshold) return d.id
      } else if (d.type === "vertical") {
        const dist = Math.abs(x - p1.x)
        if (dist <= threshold) return d.id
      } else if (d.type === "rectangle") {
        const left = Math.min(p1.x, p2.x)
        const right = Math.max(p1.x, p2.x)
        const top = Math.min(p1.y, p2.y)
        const bottom = Math.max(p1.y, p2.y)
        const inside =
            x >= left && x <= right && y >= top && y <= bottom
        const nearBorder =
            Math.abs(x - left) <= threshold ||
            Math.abs(x - right) <= threshold ||
            Math.abs(y - top) <= threshold ||
            Math.abs(y - bottom) <= threshold
        if (inside && nearBorder) return d.id
      } else if (d.type === "circle") {
        const r = Math.hypot(p2.x - p1.x, p2.y - p1.y)
        const distCenter = Math.hypot(x - p1.x, y - p1.y)
        if (Math.abs(distCenter - r) <= threshold) return d.id
      }
    }

    return null
  }
  const hitTestTrendlineHandle = (
      x: number,
      y: number,
  ): { id: string | number; handle: "p1" | "p2" } | null => {
    const layout = layoutRef.current
    if (!layout) return null

    const handleRadius = 10 // px – зона клика вокруг ручки

    for (let i = drawings.length - 1; i >= 0; i--) {
      const d = drawings[i]
      if (d.type !== "trendline") continue

      const p1 = dataToPixel(d.p1, layout)
      const p2 = dataToPixel(d.p2, layout)

      const dist1 = Math.hypot(x - p1.x, y - p1.y)
      if (dist1 <= handleRadius) {
        return { id: d.id, handle: "p1" }
      }

      const dist2 = Math.hypot(x - p2.x, y - p2.y)
      if (dist2 <= handleRadius) {
        return { id: d.id, handle: "p2" }
      }
    }

    return null
  }
  // --- render canvas ---
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || candles.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const width = canvas.width
    const height = canvas.height

    const bottomPanelHeight =
        (indicators.rsi ? 100 : 0) +
        (indicators.macd ? 100 : 0) +
        (indicators.volume ? 80 : 0)

    const padding = {
      top: 30,
      right: isMobile ? 70 : 90,
      bottom: bottomPanelHeight + 24,
      left: isMobile ? 6 : 10,
    }

    const chartHeight = height - padding.top - padding.bottom
    const chartWidth = width - padding.left - padding.right

    ctx.fillStyle = "#0b0f1a"
    ctx.fillRect(0, 0, width, height)

    const candleWidth = 8 * scale
    const candleSpacing = 2 * scale
    const totalCandleWidth = candleWidth + candleSpacing
    const visibleCandles = Math.max(
        5,
        Math.floor(chartWidth / totalCandleWidth),
    )
    const startIndex = Math.max(
        0,
        candles.length - visibleCandles - panOffset,
    )
    const endIndex = Math.min(candles.length, startIndex + visibleCandles)
    const visibleData = candles.slice(startIndex, endIndex)

    if (visibleData.length === 0) return

    const prices = visibleData.flatMap((c) => [c.high, c.low])
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const priceRange = maxPrice - minPrice
    const pricePadding = priceRange * 0.1
    const priceScale =
        chartHeight / (priceRange + 2 * pricePadding || 1)

    const priceToY = (price: number) =>
        padding.top + (maxPrice + pricePadding - price) * priceScale
    const indexToX = (index: number) =>
        padding.left + (index - startIndex) * totalCandleWidth + candleSpacing

    layoutRef.current = {
      padding,
      width,
      height,
      chartWidth,
      chartHeight,
      maxPrice,
      minPrice,
      pricePadding,
      priceScale,
      startIndex,
      endIndex,
      candleWidth,
      candleSpacing,
      totalCandleWidth,
    }

    // Горизонтальная сетка
    const priceSteps = isMobile ? 5 : 10
    ctx.strokeStyle = "#161b2b"
    ctx.lineWidth = 1
    for (let i = 0; i <= priceSteps; i++) {
      const y = padding.top + (chartHeight / priceSteps) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // Вертикальная сетка + подписи времени
    const targetDivisions = isMobile ? 6 : 10
    const stepCandles = Math.max(
        1,
        Math.floor(visibleCandles / targetDivisions),
    )
    const timeLabelY = height - padding.bottom + (isMobile ? 10 : 14)

    ctx.font = isMobile
        ? "9px Inter, sans-serif"
        : "10px Inter, sans-serif"

    for (let i = 0; i < visibleData.length; i += stepCandles) {
      const x = indexToX(startIndex + i)

      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, height - padding.bottom)
      ctx.stroke()

      const candle = visibleData[i]
      if (candle) {
        const label = formatTimeLabel(candle.time, timeframe)
        ctx.fillStyle = "#9ca3af"
        ctx.textAlign = "center"
        ctx.fillText(label, x, timeLabelY)
      }
    }

    // Volume
    if (indicators.volume) {
      const volumeHeight = 80
      const volumeY = height - padding.bottom + 22
      const maxVolume = Math.max(...visibleData.map((c) => c.volume))

      ctx.globalAlpha = 0.3
      visibleData.forEach((candle, i) => {
        const x = indexToX(startIndex + i)
        const barHeight =
            (candle.volume / (maxVolume || 1)) * (volumeHeight - 20)
        const isGreen = candle.close >= candle.open
        ctx.fillStyle = isGreen ? "#26a69a" : "#ef5350"
        ctx.fillRect(
            x,
            volumeY + volumeHeight - barHeight - 20,
            candleWidth,
            barHeight,
        )
      })
      ctx.globalAlpha = 1

      ctx.fillStyle = "#6b7280"
      ctx.font = isMobile
          ? "10px Inter, sans-serif"
          : "11px Inter, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("Volume", padding.left + 5, volumeY + 5)
    }

    // Candles
    visibleData.forEach((candle, i) => {
      const idx = startIndex + i
      const x = indexToX(idx)
      const isGreen = candle.close >= candle.open
      ctx.fillStyle = isGreen ? "#26a69a" : "#ef5350"
      ctx.strokeStyle = ctx.fillStyle
      ctx.lineWidth = 1

      ctx.beginPath()
      ctx.moveTo(x + candleWidth / 2, priceToY(candle.high))
      ctx.lineTo(x + candleWidth / 2, priceToY(candle.low))
      ctx.stroke()

      const bodyTop = priceToY(Math.max(candle.open, candle.close))
      const bodyBottom = priceToY(Math.min(candle.open, candle.close))
      const bodyHeight = bodyBottom - bodyTop
      ctx.fillRect(x, bodyTop, candleWidth, Math.max(bodyHeight, 1))
    })

    const drawLine = <T,>(
        data: T[],
        getValue: (p: T) => number,
        color: string,
        lineWidth = 2,
        getIndex: (p: T) => number = (p: any) => p.index,
    ) => {
      if (data.length === 0) return
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.beginPath()
      let started = false
      data.forEach((p: any) => {
        const idx = getIndex(p)
        if (typeof idx !== "number") return
        if (idx < startIndex || idx >= endIndex) return
        const x = indexToX(idx) + candleWidth / 2
        const y = priceToY(getValue(p))
        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else {
          ctx.lineTo(x, y)
        }
      })
      if (started) ctx.stroke()
    }

    // SMA / EMA / BB
    if (indicators.sma) {
      const sma20 = calculateSMA(candles, 20)
      drawLine(sma20, (p) => p.value, "#3b82f6")
      ctx.fillStyle = "#3b82f6"
      ctx.font = isMobile
          ? "10px Inter, sans-serif"
          : "11px Inter, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("SMA(20)", padding.left + 5, padding.top + 15)
    }

    if (indicators.ema) {
      const ema12 = calculateEMA(candles, 12)
      drawLine(ema12, (p) => p.value, "#f59e0b")
      ctx.fillStyle = "#f59e0b"
      ctx.font = isMobile
          ? "10px Inter, sans-serif"
          : "11px Inter, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("EMA(12)", padding.left + 5, padding.top + 30)
    }

    if (indicators.bb) {
      const bb = calculateBollinger(candles, 20, 2)
      ctx.globalAlpha = 0.3
      drawLine(bb, (p) => p.upper, "#a855f7", 1.5)
      drawLine(bb, (p) => p.middle, "#a855f7", 1.5)
      drawLine(bb, (p) => p.lower, "#a855f7", 1.5)
      ctx.globalAlpha = 1
      ctx.fillStyle = "#a855f7"
      ctx.font = isMobile
          ? "10px Inter, sans-serif"
          : "11px Inter, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("BB(20,2)", padding.left + 5, padding.top + 45)
    }

    // RSI
    if (indicators.rsi) {
      const rsi = calculateRSI(candles, 14)
      const rsiHeight = 100
      const rsiY = height - padding.bottom + (indicators.volume ? 90 : 10)

      ctx.fillStyle = "#0f1419"
      ctx.fillRect(padding.left, rsiY, chartWidth, rsiHeight)

      ctx.strokeStyle = "#161b2b"
      ctx.lineWidth = 1
      ;[30, 50, 70].forEach((level) => {
        const y = rsiY + rsiHeight - (level / 100) * rsiHeight
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()

        ctx.fillStyle = "#6b7280"
        ctx.font = "10px Inter, sans-serif"
        ctx.textAlign = "right"
        ctx.fillText(level.toString(), width - padding.right + 18, y + 3)
      })

      ctx.strokeStyle = "#eab308"
      ctx.lineWidth = 2
      ctx.beginPath()
      let started = false
      rsi.forEach((p) => {
        if (p.index < startIndex || p.index >= endIndex) return
        const x = indexToX(p.index) + candleWidth / 2
        const y = rsiY + rsiHeight - (p.value / 100) * rsiHeight
        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else {
          ctx.lineTo(x, y)
        }
      })
      if (started) ctx.stroke()

      ctx.fillStyle = "#eab308"
      ctx.font = "11px Inter, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("RSI(14)", padding.left + 5, rsiY + 15)
    }

    // MACD
    if (indicators.macd) {
      const { macd, signal } = calculateMACD(candles)
      const macdHeight = 100
      const macdY =
          height -
          padding.bottom +
          (indicators.volume ? 90 : 10) +
          (indicators.rsi ? 110 : 0)

      ctx.fillStyle = "#0f1419"
      ctx.fillRect(padding.left, macdY, chartWidth, macdHeight)

      ctx.strokeStyle = "#161b2b"
      const zeroY = macdY + macdHeight / 2
      ctx.beginPath()
      ctx.moveTo(padding.left, zeroY)
      ctx.lineTo(width - padding.right, zeroY)
      ctx.stroke()

      const macdVals = macd.map((m) => Math.abs(m.macd))
      const maxMACD = macdVals.length ? Math.max(...macdVals, 1) : 1

      macd.forEach((p) => {
        if (p.index < startIndex || p.index >= endIndex) return
        const x = indexToX(p.index)
        const barHeight = (p.macd / maxMACD) * (macdHeight / 2 - 10)
        const barY = p.macd >= 0 ? zeroY - barHeight : zeroY
        ctx.fillStyle = p.macd >= 0 ? "#26a69a" : "#ef5350"
        ctx.globalAlpha = 0.6
        ctx.fillRect(x, barY, candleWidth, Math.abs(barHeight))
        ctx.globalAlpha = 1
      })

      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.beginPath()
      let mStarted = false
      macd.forEach((p) => {
        if (p.index < startIndex || p.index >= endIndex) return
        const x = indexToX(p.index) + candleWidth / 2
        const y = zeroY - (p.macd / maxMACD) * (macdHeight / 2 - 10)
        if (!mStarted) {
          ctx.moveTo(x, y)
          mStarted = true
        } else {
          ctx.lineTo(x, y)
        }
      })
      if (mStarted) ctx.stroke()

      ctx.strokeStyle = "#f59e0b"
      ctx.lineWidth = 2
      ctx.beginPath()
      let sStarted = false
      signal.forEach((p) => {
        if (p.index < startIndex || p.index >= endIndex) return
        const x = indexToX(p.index) + candleWidth / 2
        const y = zeroY - (p.value / maxMACD) * (macdHeight / 2 - 10)
        if (!sStarted) {
          ctx.moveTo(x, y)
          sStarted = true
        } else {
          ctx.lineTo(x, y)
        }
      })
      if (sStarted) ctx.stroke()

      ctx.fillStyle = "#6b7280"
      ctx.font = "11px Inter, sans-serif"
      ctx.textAlign = "left"
      ctx.fillText("MACD(12,26,9)", padding.left + 5, macdY + 15)
    }

    // Price axis
    ctx.fillStyle = "#9ca3af"
    ctx.font = isMobile
        ? "9px Inter, sans-serif"
        : "11px Inter, sans-serif"
    ctx.textAlign = "left"
    const stepPrice =
        (maxPrice + pricePadding - (minPrice - pricePadding)) / priceSteps
    for (let i = 0; i <= priceSteps; i++) {
      const price = maxPrice + pricePadding - stepPrice * i
      const y = padding.top + (chartHeight / priceSteps) * i
      const formatted = formatPriceValue(price)
      if (!formatted) continue
      ctx.fillText(formatted, width - padding.right + 4, y + 3)
    }

    // Current price line
    const last = visibleData[visibleData.length - 1]
    if (last) {
      const y = priceToY(last.close)
      ctx.strokeStyle = "#eab308"
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
      ctx.setLineDash([])

      const lastFormatted = formatPriceValue(last.close) ?? last.close.toFixed(5)

      ctx.fillStyle = "#eab308"
      ctx.fillRect(
          width - padding.right - 2,
          y - 10,
          padding.right + 2,
          20,
      )
      ctx.fillStyle = "#0b0f1a"
      ctx.font = "bold 12px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(lastFormatted, width - padding.right / 2, y + 4)
    }

    // Drawings
    drawings.forEach((d) => {
      const layout = layoutRef.current
      if (
          !layout ||
          !d ||
          !d.p1 ||
          !d.p2 ||
          typeof d.p1.index !== "number" ||
          typeof d.p1.price !== "number" ||
          typeof d.p2.index !== "number" ||
          typeof d.p2.price !== "number"
      ) {
        return
      }

      const p1 = dataToPixel(d.p1, layout)
      const p2 = dataToPixel(d.p2, layout)
      ctx.lineWidth = 2
      ctx.strokeStyle = d.color || "#fbbf24"

      if (d.type === "trendline") {
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()

        // --- ручки на концах линии ---
        const handleR = 5
        ctx.fillStyle = selectedDrawing === d.id ? "#3b82f6" : "#e5e7eb"

        ctx.beginPath()
        ctx.arc(p1.x, p1.y, handleR, 0, 2 * Math.PI)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p2.x, p2.y, handleR, 0, 2 * Math.PI)
        ctx.fill()
      } else if (d.type === "horizontal") {
        ctx.beginPath()
        ctx.moveTo(layout.padding.left, p1.y)
        ctx.lineTo(
            layout.width - layout.padding.right,
            p1.y,
        )
        ctx.stroke()
      } else if (d.type === "vertical") {
        ctx.beginPath()
        ctx.moveTo(p1.x, layout.padding.top)
        ctx.lineTo(
            p1.x,
            layout.height - layout.padding.bottom,
        )
        ctx.stroke()
      } else if (d.type === "rectangle") {
        ctx.strokeRect(
            Math.min(p1.x, p2.x),
            Math.min(p1.y, p2.y),
            Math.abs(p2.x - p1.x),
            Math.abs(p2.y - p1.y),
        )
      } else if (d.type === "circle") {
        const r = Math.hypot(p2.x - p1.x, p2.y - p1.y)
        ctx.beginPath()
        ctx.arc(p1.x, p1.y, r, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (d.type === "fibonacci") {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
        const colors = [
          "#ef4444",
          "#f59e0b",
          "#eab308",
          "#84cc16",
          "#22c55e",
          "#06b6d4",
          "#3b82f6",
        ]
        const h = p2.y - p1.y
        levels.forEach((lvl, i) => {
          const y = p1.y + h * lvl
          ctx.globalAlpha = 0.5
          ctx.strokeStyle = colors[i] || "#fbbf24"
          ctx.beginPath()
          ctx.moveTo(p1.x, y)
          ctx.lineTo(p2.x, y)
          ctx.stroke()
          ctx.fillStyle = ctx.strokeStyle
          ctx.font = "10px Inter, sans-serif"
          ctx.textAlign = "right"
          ctx.fillText(`${(lvl * 100).toFixed(1)}%`, p2.x - 5, y - 3)
        })
        ctx.globalAlpha = 1
      }

      if (selectedDrawing === d.id) {
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        if (d.type === "circle") {
          const r = Math.hypot(p2.x - p1.x, p2.y - p1.y)
          ctx.beginPath()
          ctx.arc(p1.x, p1.y, r + 5, 0, 2 * Math.PI)
          ctx.stroke()
        } else {
          ctx.strokeRect(
              Math.min(p1.x, p2.x) - 5,
              Math.min(p1.y, p2.y) - 5,
              Math.abs(p2.x - p1.x) + 10,
              Math.abs(p2.y - p1.y) + 10,
          )
        }
        ctx.setLineDash([])
      }
    })
    if (isMobile && isMobileChartFullscreen && isFullscreenLoading) {
      // небольшой defer, чтобы не дергалось
      requestAnimationFrame(() => {
        setIsFullscreenLoading(false)
      })
    }
  }, [
    candles,
    indicators,
    scale,
    panOffset,
    drawings,
    selectedDrawing,
    timeframe,
    isMobile,
    isMobileChartFullscreen,
    isFullscreenLoading,
    formatPriceValue,
  ])

  // --- Mouse / touch handlers ---
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // PAN
    if (drawMode === "pan") {
      setIsPanning(true)
      setPanStart({ x: e.clientX, offset: panOffset })
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing"
      }
      return
    }

    // SELECT: сперва пробуем попасть в ручку trend line, потом в само рисование
    if (drawMode === "select") {
      const handleHit = hitTestTrendlineHandle(x, y)
      if (handleHit) {
        setSelectedDrawing(handleHit.id)
        setDragDrawingId(handleHit.id)
        setDragHandle(handleHit.handle)

        const dataPoint = pixelToData(x, y)
        if (!dataPoint) return
        const drawing = drawings.find((d) => d.id === handleHit.id)
        if (!drawing) return

        dragStartRef.current = {
          mouse: dataPoint,
          drawing: JSON.parse(JSON.stringify(drawing)),
        }

        if (containerRef.current) {
          containerRef.current.style.cursor = "crosshair"
        }
        return
      }

      const hitId = hitTestDrawing(x, y)
      if (hitId != null) {
        setSelectedDrawing(hitId)
        setDragDrawingId(hitId)
        setDragHandle(null) // тащим всю фигуру целиком

        const dataPoint = pixelToData(x, y)
        if (!dataPoint) return
        const drawing = drawings.find((d) => d.id === hitId)
        if (!drawing) return

        dragStartRef.current = {
          mouse: dataPoint,
          drawing: JSON.parse(JSON.stringify(drawing)),
        }

        if (containerRef.current) {
          containerRef.current.style.cursor = "move"
        }
        return
      } else {
        setSelectedDrawing(null)
        setDragDrawingId(null)
        setDragHandle(null)
        dragStartRef.current = null
        if (containerRef.current) {
          containerRef.current.style.cursor = "default"
        }
        return
      }
    }

    // Начало рисования новой фигуры
    const dataPoint = pixelToData(x, y)
    if (!dataPoint) return
    if (drawMode === "select" || drawMode === "pan") return

    const initial: Drawing = {
      id: "temp",
      type: drawMode as Exclude<DrawingType, "select" | "pan">,
      p1: dataPoint,
      p2: dataPoint,
      color: "#fbbf24",
    }

    drawingRef.current = initial
    setDrawings((prev) => [...prev.filter((d) => d.id !== "temp"), initial])

    if (containerRef.current) {
      containerRef.current.style.cursor = "crosshair"
    }
  }

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // PAN
    if (isPanning && panStart) {
      const diff = e.clientX - panStart.x
      const sensitivity = 0.1
      const maxOffset = Math.max(0, candles.length - 50)
      const rawOffset = panStart.offset + diff * sensitivity
      const newOffset = Math.max(0, Math.min(rawOffset, maxOffset))
      setPanOffset(newOffset)
      return
    }

    // DRAG selected drawing / handle
    if (dragDrawingId != null && dragStartRef.current) {
      const currentData = pixelToData(x, y)
      if (!currentData) return

      const { mouse: startMouse, drawing: original } = dragStartRef.current
      const diffIndex = currentData.index - startMouse.index
      const diffPrice = currentData.price - startMouse.price

      setDrawings((prev) =>
          prev.map((d) => {
            if (d.id !== dragDrawingId) return d

            // тащим только ручку p1 или p2 (для trendline)
            if (dragHandle === "p1") {
              return {
                ...d,
                p1: {
                  index: original.p1.index + diffIndex,
                  price: original.p1.price + diffPrice,
                },
              }
            }
            if (dragHandle === "p2") {
              return {
                ...d,
                p2: {
                  index: original.p2.index + diffIndex,
                  price: original.p2.price + diffPrice,
                },
              }
            }

            // иначе двигаем всю фигуру
            return {
              ...d,
              p1: {
                index: original.p1.index + diffIndex,
                price: original.p1.price + diffPrice,
              },
              p2: {
                index: original.p2.index + diffIndex,
                price: original.p2.price + diffPrice,
              },
            }
          }),
      )
      return
    }

    // Рисуем новую фигуру
    if (!drawingRef.current) return
    const dataPoint = pixelToData(x, y)
    if (!dataPoint) return

    const updated: Drawing = {
      ...drawingRef.current,
      p2: dataPoint,
    }
    drawingRef.current = updated
    setDrawings((prev) => [
      ...prev.filter((d) => d.id !== "temp"),
      updated,
    ])
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      setPanStart(null)
      if (containerRef.current) {
        containerRef.current.style.cursor = "default"
      }
      return
    }

    if (dragDrawingId != null) {
      setDragDrawingId(null)
      setDragHandle(null)
      dragStartRef.current = null
      if (containerRef.current) {
        containerRef.current.style.cursor = "default"
      }
      return
    }

    if (drawingRef.current) {
      const finalDrawing: Drawing = {
        ...drawingRef.current,
        id: Date.now(),
      }
      setDrawings((prev) => [
        ...prev.filter((d) => d.id !== "temp"),
        finalDrawing,
      ])
      drawingRef.current = null
      setDrawMode("select")
      setSelectedDrawing(finalDrawing.id)
      if (containerRef.current) {
        containerRef.current.style.cursor = "default"
      }
    }
  }

  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (e.shiftKey) {
      const delta = e.deltaY || e.deltaX
      setPanOffset((prev) =>
          Math.max(
              0,
              Math.min(prev + delta * 0.5, Math.max(0, candles.length - 50)),
          ),
      )
      return
    }

    if (e.deltaY < 0) {
      setScale((s) => Math.min(s + 0.1, 3))
    } else {
      setScale((s) => Math.max(s - 0.1, 0.5))
    }
  }

  // TOUCH pan
  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    // чтобы не скроллился экран, пока рисуем / двигаем
    e.preventDefault()

    if (drawMode === "pan") {
      touchPanStartRef.current = { x: touch.clientX, offset: panOffset }
      setIsPanning(true)
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing"
      }
      return
    }

    if (drawMode === "select") {
      const handleHit = hitTestTrendlineHandle(x, y)
      if (handleHit) {
        setSelectedDrawing(handleHit.id)
        setDragDrawingId(handleHit.id)
        setDragHandle(handleHit.handle)

        const dataPoint = pixelToData(x, y)
        if (!dataPoint) return
        const drawing = drawings.find((d) => d.id === handleHit.id)
        if (!drawing) return

        dragStartRef.current = {
          mouse: dataPoint,
          drawing: JSON.parse(JSON.stringify(drawing)),
        }
        return
      }

      const hitId = hitTestDrawing(x, y)
      if (hitId != null) {
        setSelectedDrawing(hitId)
        setDragDrawingId(hitId)
        setDragHandle(null)

        const dataPoint = pixelToData(x, y)
        if (!dataPoint) return
        const drawing = drawings.find((d) => d.id === hitId)
        if (!drawing) return

        dragStartRef.current = {
          mouse: dataPoint,
          drawing: JSON.parse(JSON.stringify(drawing)),
        }
        return
      } else {
        setSelectedDrawing(null)
        setDragDrawingId(null)
        setDragHandle(null)
        dragStartRef.current = null
        return
      }
    }

    // старт нового рисования пальцем
    const dataPoint = pixelToData(x, y)
    if (!dataPoint) return

    const initial: Drawing = {
      id: "temp",
      type: drawMode as Exclude<DrawingType, "select" | "pan">,
      p1: dataPoint,
      p2: dataPoint,
      color: "#fbbf24",
    }

    drawingRef.current = initial
    setDrawings((prev) => [...prev.filter((d) => d.id !== "temp"), initial])
  }

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    e.preventDefault()

    if (isPanning && touchPanStartRef.current && drawMode === "pan") {
      const diff = touch.clientX - touchPanStartRef.current.x
      const sensitivity = 0.1
      const maxOffset = Math.max(0, candles.length - 50)
      const rawOffset = touchPanStartRef.current.offset + diff * sensitivity
      const newOffset = Math.max(0, Math.min(rawOffset, maxOffset))
      setPanOffset(newOffset)
      return
    }

    if (dragDrawingId != null && dragStartRef.current) {
      const currentData = pixelToData(x, y)
      if (!currentData) return

      const { mouse: startMouse, drawing: original } = dragStartRef.current
      const diffIndex = currentData.index - startMouse.index
      const diffPrice = currentData.price - startMouse.price

      setDrawings((prev) =>
          prev.map((d) => {
            if (d.id !== dragDrawingId) return d

            if (dragHandle === "p1") {
              return {
                ...d,
                p1: {
                  index: original.p1.index + diffIndex,
                  price: original.p1.price + diffPrice,
                },
              }
            }
            if (dragHandle === "p2") {
              return {
                ...d,
                p2: {
                  index: original.p2.index + diffIndex,
                  price: original.p2.price + diffPrice,
                },
              }
            }

            return {
              ...d,
              p1: {
                index: original.p1.index + diffIndex,
                price: original.p1.price + diffPrice,
              },
              p2: {
                index: original.p2.index + diffIndex,
                price: original.p2.price + diffPrice,
              },
            }
          }),
      )
      return
    }

    if (!drawingRef.current) return
    const dataPoint = pixelToData(x, y)
    if (!dataPoint) return

    const updated: Drawing = {
      ...drawingRef.current,
      p2: dataPoint,
    }
    drawingRef.current = updated
    setDrawings((prev) => [
      ...prev.filter((d) => d.id !== "temp"),
      updated,
    ])
  }

  const handleTouchEnd = () => {
    if (isPanning) {
      setIsPanning(false)
      touchPanStartRef.current = null
      if (containerRef.current) {
        containerRef.current.style.cursor = "default"
      }
      return
    }

    if (dragDrawingId != null) {
      setDragDrawingId(null)
      setDragHandle(null)
      dragStartRef.current = null
      return
    }

    if (drawingRef.current) {
      const finalDrawing: Drawing = {
        ...drawingRef.current,
        id: Date.now(),
      }
      setDrawings((prev) => [
        ...prev.filter((d) => d.id !== "temp"),
        finalDrawing,
      ])
      drawingRef.current = null
      setDrawMode("select")
      setSelectedDrawing(finalDrawing.id)
    }
  }

  const currentPrice =
      candles.length > 0 ? candles[candles.length - 1].close : 0
  const prevPrice =
      candles.length > 1 ? candles[candles.length - 2].close : currentPrice
  const priceChange = currentPrice - prevPrice
  const percentChange =
      prevPrice !== 0 ? (priceChange / prevPrice) * 100 : 0

  const drawingTools: {
    icon: React.ElementType
    name: DrawingType
    label: string
  }[] = [
    { icon: MousePointer, name: "select", label: "Select / Move" },
    { icon: Hand, name: "pan", label: "Pan" },
    { icon: Pencil, name: "trendline", label: "Trend Line" },
    { icon: Minus, name: "horizontal", label: "Horizontal Line" },
    { icon: Pencil, name: "vertical", label: "Vertical Line" },
    { icon: Square, name: "rectangle", label: "Rectangle" },
    { icon: Circle, name: "circle", label: "Circle" },
    { icon: Ruler, name: "fibonacci", label: "Fibonacci" },
  ]

  // Favorites
  const toggleFavorite = (symbol: string) => {
    setFavoriteSymbols((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }

  const filteredTickers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    let base = tickers

    if (activeTab === "favorites") {
      base = tickers.filter((ticker) => favoriteSymbols.has(ticker.symbol))
    }

    if (!term) return base

    return base.filter((ticker) => {
      return (
          ticker.symbol.toLowerCase().includes(term) ||
          ticker.showName.toLowerCase().includes(term) ||
          ticker.fullName.toLowerCase().includes(term)
      )
    })
  }, [tickers, searchTerm, favoriteSymbols, activeTab])

  const tickersByCategory = useMemo(() => {
    const map = orderedCategories.reduce(
        (acc, category) => {
          acc[category] = []
          return acc
        },
        {} as Record<TickerCategory, any[]>,
    )

    filteredTickers.forEach((ticker: any) => {
      const category = ticker.category as TickerCategory
      if (!map[category]) map[category] = []
      map[category].push(ticker)
    })

    Object.values(map).forEach((list) =>
        list.sort((a, b) => a.showName.localeCompare(b.showName)),
    )

    return map
  }, [filteredTickers])

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

    if (activeTab === "favorites") {
      const hasAnyFavoritesInView = filteredTickers.length > 0
      if (!hasAnyFavoritesInView) {
        return (
            <div className="flex h-24 items-center justify-center text-xs text-slate-500">
              {t("noFavoriteTickers") || "You have no favorite symbols yet."}
            </div>
        )
      }
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
                    <svg
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isOpen && (
                      <div className="border-t border-slate-800/80">
                        <VirtualizedTickerList
                            tickers={catTickers}
                            selectedSymbol={selectedTicker?.symbol}
                            onSelectTicker={handleSelectTicker}
                            formatPriceValue={formatPriceValue}
                            height={Math.min(420, catTickers.length * 64)}
                            favoriteSymbols={favoriteSymbols}   // 👈 один и тот же Set
                            onToggleFavorite={toggleFavorite}   // 👈 один и тот же хендлер
                        />
                      </div>
                  )}
                </div>
            )
          })}
        </div>
    )
  }



  // keyboard nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvasRef.current || document.activeElement !== canvasRef.current)
        return

      switch (e.key) {
        case "ArrowLeft":
          setPanOffset((prev) => Math.max(0, prev - 5))
          break
        case "ArrowRight":
          setPanOffset((prev) =>
              Math.min(prev + 5, Math.max(0, candles.length - 50)),
          )
          break
        case "+":
        case "=":
          setScale((s) => Math.min(s + 0.1, 3))
          break
        case "-":
          setScale((s) => Math.max(s - 0.1, 0.5))
          break
        case "0":
          setScale(1)
          break
        case "Escape":
          setSelectedDrawing(null)
          setDragDrawingId(null)
          dragStartRef.current = null
          if (containerRef.current) {
            containerRef.current.style.cursor = "default"
          }
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [candles.length])

  const indicatorControls = (
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-200">
        <label className="flex items-center gap-1">
          <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              checked={indicators.sma}
              onChange={(e) =>
                  setIndicators((prev) => ({ ...prev, sma: e.target.checked }))
              }
          />
          <span>SMA</span>
        </label>
        <label className="flex items-center gap-1">
          <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              checked={indicators.ema}
              onChange={(e) =>
                  setIndicators((prev) => ({ ...prev, ema: e.target.checked }))
              }
          />
          <span>EMA</span>
        </label>
        <label className="flex items-center gap-1">
          <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              checked={indicators.bb}
              onChange={(e) =>
                  setIndicators((prev) => ({ ...prev, bb: e.target.checked }))
              }
          />
          <span>BB</span>
        </label>
        <label className="flex items-center gap-1">
          <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              checked={indicators.rsi}
              onChange={(e) =>
                  setIndicators((prev) => ({ ...prev, rsi: e.target.checked }))
              }
          />
          <span>RSI</span>
        </label>
        <label className="flex items-center gap-1">
          <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              checked={indicators.macd}
              onChange={(e) =>
                  setIndicators((prev) => ({ ...prev, macd: e.target.checked }))
              }
          />
          <span>MACD</span>
        </label>
        <label className="flex items-center gap-1">
          <input
              type="checkbox"
              className="h-3 w-3 rounded border-slate-600 bg-slate-900"
              checked={indicators.volume}
              onChange={(e) =>
                  setIndicators((prev) => ({ ...prev, volume: e.target.checked }))
              }
          />
          <span>Volume</span>
        </label>
      </div>
  )
// Когда мы вошли в фуллскрин и график уже готов — выключаем лоадер
  useEffect(() => {
    if (!isMobileChartFullscreen) return

    // ждём пока свечи подгрузятся
    if (loading || isCandlesLoading) return

    // ждём один animation frame, чтобы canvas успел отрисоваться
    const t = requestAnimationFrame(() => {
      setIsFullscreenLoading(false)
    })

    return () => cancelAnimationFrame(t)
  }, [isMobileChartFullscreen, loading, isCandlesLoading, candles])

  const handleCloseTrade = useCallback(
      async (trade: any) => {
        setError(null)

        // Берём лайв-цену для тикера из массива tickers
        const tickerData = tickers.find((t) => t.symbol === trade.ticker)

        const livePrice =
            tickerData?.bid ??
            tickerData?.ask ??
            tickerData?.lastPrice ??
            trade.openIn

        if (!livePrice || !Number.isFinite(livePrice) || livePrice <= 0) {
          setError("No current price to close order")
          return
        }

        // Optimistic: помечаем как CLOSING
        setActiveTrades((prev) =>
            prev.map((t) =>
                t.id === trade.id ? { ...t, status: "CLOSING" } : t
            )
        )

        try {
          const res = await fetch(`/api/trades/${trade.id}/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPrice: livePrice }),
          })

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data?.error || "Failed to close order")
          }

          // Обновляем сделку данными с бэкенда (CLOSED, profit, closeIn)
          setActiveTrades((prev) =>
              prev.map((t) => (t.id === trade.id ? data : t))
          )

          await refetchBalance()
        } catch (e: any) {
          console.error("close error", e)
          setError(e?.message || "Failed to close order")

          // откатываем статус назад
          setActiveTrades((prev) =>
              prev.map((t) =>
                  t.id === trade.id && t.status === "CLOSING"
                      ? { ...t, status: "OPEN" }
                      : t
              )
          )
        }
      },
      [tickers, refetchBalance]
  )
  const openTrades = useMemo(
      () => activeTrades.filter((tr) => tr.status === "OPEN" || tr.status === "CLOSING"),
      [activeTrades]
  )
  // ---------------- MOBILE LAYOUT ----------------
  if (isMobile) {
    // красивый текст в шапке селектора индикаторов
    const activeIndicators: string[] = []
    if (indicators.sma) activeIndicators.push("SMA")
    if (indicators.ema) activeIndicators.push("EMA")
    if (indicators.bb) activeIndicators.push("BB")
    if (indicators.rsi) activeIndicators.push("RSI")
    if (indicators.macd) activeIndicators.push("MACD")
    if (indicators.volume) activeIndicators.push("Vol")

    const indicatorsLabel =
        activeIndicators.length === 0
            ? (t("indicatorsNone") || "None")
            : activeIndicators.length <= 2
                ? activeIndicators.join(", ")
                : `${activeIndicators.slice(0, 2).join(", ")} +${
                    activeIndicators.length - 2
                }`



    return (
        <div className="flex min-h-screen flex-col bg-[#050012] text-white">
          {/* MOBILE HEADER */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f1419] px-3 py-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold">
              {mobileView === "market"
                  ? t("market") || "Market"
                  : t("bottomTrade") || "Trade"}
            </span>
            </div>
            <div className="text-xs text-slate-400">
              {balance != null && (
                  <span className="font-mono">${balance.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* MOBILE CONTENT */}
          {mobileView === "market" ? (
              /* ---------- MARKET VIEW ---------- */
              <div className="flex-1 space-y-3 px-3 pb-16 pt-2">
                {/* SEARCH */}
                <div className="relative">
                  <svg
                      className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                      type="text"
                      placeholder={t("searchTickers")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 pl-7 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* TICKER LIST */}
                <div className="custom-scrollbar max-h-[calc(100vh-200px)] overflow-y-auto pb-2">
                  {renderCategorizedTickers()}
                </div>
              </div>
          ) : (
              /* ---------- TRADE VIEW ---------- */
              <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-20 pt-2">
                {/* BACK */}
                <div className="flex items-center justify-between">
                  <button
                      onClick={() => setMobileView("market")}
                      className="flex items-center rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-200"
                  >
                    ← {t("back") || "Back"}
                  </button>
                </div>

                {/* TICKER HEADER + CONTROLS */}
                {selectedTicker && (
                    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/90 px-3 py-3">
                      {/* 1) Название + цена + аватар */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">
                        {selectedTicker.showName}
                      </span>
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                        {selectedTicker.symbol}
                      </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {tickerCategoryLabels[selectedTicker.category]}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-mono text-lg font-semibold leading-none text-white">
                              {candles.length > 0
                                  ? `$${formatPriceValue(currentPrice) ??
                                  currentPrice.toFixed(5)}`
                                  : "--"}
                            </div>
                            <div className="mt-1 text-[10px]">
                              {candles.length > 1 ? (
                                  <span
                                      className={
                                        priceChange >= 0
                                            ? "text-emerald-400"
                                            : "text-red-400"
                                      }
                                  >
                            {priceChange >= 0 ? "+" : ""}
                                    {formatPriceValue(priceChange) ??
                                        priceChange.toFixed(5)}{" "}
                                    ({percentChange >= 0 ? "+" : ""}
                                    {percentChange.toFixed(2)}%)
                          </span>
                              ) : (
                                  <span className="text-slate-500">-- (0.00%)</span>
                              )}
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
                      </div>

                      {/* 2) TIMEFRAME + INDICATORS + FULLSCREEN BTN */}
                      <div className="mt-1 flex w-full flex-row justify-between gap-2">
                        {/* TIMEFRAME */}
                        <div className="flex w-1/2 flex-col gap-1">
                    <span className="text-[10px] text-slate-500">
                      {t("timeframe") || "Timeframe"}
                    </span>
                          <div className="relative">
                            <select
                                value={timeframe}
                                onChange={(e) => handleTimeframeClick(e.target.value)}
                                className="h-8 w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-3 pr-7 text-[11px] font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              {timeframes.map((tf) => (
                                  <option key={tf.value} value={tf.value}>
                                    {tf.label}
                                  </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                        ▼
                      </span>
                          </div>
                        </div>

                        {/* INDICATORS SELECT */}
                        <div className="flex w-1/2 flex-col gap-1">
                    <span className="text-[10px] text-slate-500">
                      {t("indicators") || "Indicators"}
                    </span>

                          <details className="relative">
                            <summary className="flex h-8 cursor-pointer list-none items-center justify-between rounded-xl border border-slate-700 bg-slate-900/90 px-3 text-[11px] font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
                              <span className="truncate">{indicatorsLabel}</span>
                              <span className="ml-2 text-[10px] text-slate-500">
                          ▼
                        </span>
                            </summary>

                            <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-slate-800 bg-slate-900/95 p-1 text-[11px] shadow-xl">
                              {/* SMA */}
                              <button
                                  type="button"
                                  onClick={() =>
                                      setIndicators((prev) => ({
                                        ...prev,
                                        sma: !prev.sma,
                                      }))
                                  }
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                              >
                                <span>SMA</span>
                                {indicators.sma && (
                                    <span className="text-emerald-400">●</span>
                                )}
                              </button>

                              {/* EMA */}
                              <button
                                  type="button"
                                  onClick={() =>
                                      setIndicators((prev) => ({
                                        ...prev,
                                        ema: !prev.ema,
                                      }))
                                  }
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                              >
                                <span>EMA</span>
                                {indicators.ema && (
                                    <span className="text-emerald-400">●</span>
                                )}
                              </button>

                              {/* BB */}
                              <button
                                  type="button"
                                  onClick={() =>
                                      setIndicators((prev) => ({
                                        ...prev,
                                        bb: !prev.bb,
                                      }))
                                  }
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                              >
                                <span>BB</span>
                                {indicators.bb && (
                                    <span className="text-emerald-400">●</span>
                                )}
                              </button>

                              {/* RSI */}
                              <button
                                  type="button"
                                  onClick={() =>
                                      setIndicators((prev) => ({
                                        ...prev,
                                        rsi: !prev.rsi,
                                      }))
                                  }
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                              >
                                <span>RSI</span>
                                {indicators.rsi && (
                                    <span className="text-emerald-400">●</span>
                                )}
                              </button>

                              {/* MACD */}
                              <button
                                  type="button"
                                  onClick={() =>
                                      setIndicators((prev) => ({
                                        ...prev,
                                        macd: !prev.macd,
                                      }))
                                  }
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                              >
                                <span>MACD</span>
                                {indicators.macd && (
                                    <span className="text-emerald-400">●</span>
                                )}
                              </button>

                              {/* Volume */}
                              <button
                                  type="button"
                                  onClick={() =>
                                      setIndicators((prev) => ({
                                        ...prev,
                                        volume: !prev.volume,
                                      }))
                                  }
                                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                              >
                                <span>Volume</span>
                                {indicators.volume && (
                                    <span className="text-emerald-400">●</span>
                                )}
                              </button>
                            </div>
                          </details>
                        </div>

                        {/* FULLSCREEN BUTTON */}
                        <div className="flex items-end justify-center rounded-sm">
                          <button
                              type="button"
                              onClick={() => {
                                setIsFullscreenLoading(true)
                                setIsMobileChartFullscreen(true)
                              }}
                              className="flex items-end gap-1 rounded-sm border border-slate-700 bg-slate-900/80 px-2.5 py-2.5 text-[5px] text-slate-200"
                          >
                            <Maximize2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* 3) DRAWING TOOLS */}
                      <div className="mt-2 -mx-1 flex gap-1 overflow-x-auto pb-1">
                        {drawingTools.map((tool) => {
                          const Icon = tool.icon
                          const active = drawMode === tool.name
                          return (
                              <button
                                  key={tool.name}
                                  onClick={() => setDrawMode(tool.name)}
                                  aria-label={tool.label}
                                  className={`flex h-8 w-9 shrink-0 items-center justify-center rounded-lg text-xs ${
                                      active
                                          ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)]"
                                          : "bg-slate-900 text-slate-200"
                                  }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </button>
                          )
                        })}
                      </div>
                    </div>
                )}

                {/* CHART */}
                {!isMobileChartFullscreen && (
                    <div className="rounded-2xl border border-slate-800 bg-[#050314]">
                      <div
                          ref={containerRef}
                          className="relative h-[360px] w-full overflow-hidden rounded-2xl sm:h-[400px]"
                      >
                        {(loading || isCandlesLoading) && symbol && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050314]/80 backdrop-blur-sm">
                              <div className="flex items-center space-x-2 text-xs text-slate-400">
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-purple-500" />
                                <span>
                          {t("updatingChart") || "Updating chart data"}...
                        </span>
                              </div>
                            </div>
                        )}

                        {!symbol ? (
                            <div className="flex h-full flex-col items-center justify-center p-6 text-xs text-slate-400">
                              {t("selectTickerTitle") || "Select a symbol to start"}
                            </div>
                        ) : loading && candles.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                              <div className="text-center text-xs text-slate-400">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500" />
                                {symbol
                                    ? `${
                                        t("loadingChartData") ||
                                        "Loading chart data for"
                                    } ${symbol}...`
                                    : "Loading candles..."}
                              </div>
                            </div>
                        ) : (
                            <canvas
                                ref={canvasRef}
                                className={`h-full w-full touch-none ${
                                    drawMode === "pan" ? "cursor-grab" : "cursor-crosshair"
                                }`}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onWheel={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleWheel(e) // если надо – внутри handleWheel используй e.deltaY и т.д.
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleTouchStart(e)
                                }}
                                onTouchMove={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleTouchMove(e)
                                }}
                                onTouchEnd={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleTouchEnd(e)
                                }}
                            />
                        )}
                      </div>
                    </div>
                )}

                {/* ORDER FORM + ACTIVE TRADES */}
                <div className="space-y-4 pb-2">
                  {/* ORDER CARD (mobile) */}
                  <motion.div
                      layout
                      initial={false}
                      animate={
                        aiAvailable && aiEnabled
                            ? {
                              borderColor: "rgba(34,211,238,0.8)",
                              boxShadow:
                                  "0 0 30px rgba(34,211,238,0.35), 0 0 60px rgba(147,51,234,0.25)",
                            }
                            : {
                              borderColor: "rgba(30,64,175,0.7)",
                              boxShadow:
                                  "0 0 18px rgba(88,28,135,0.35), 0 0 30px rgba(15,23,42,0.9)",
                            }
                      }
                      className="space-y-3 rounded-2xl border bg-slate-950/90 p-3"
                  >
                    {/* AI toggle, только если у юзера aiTrading = true */}
                    {aiAvailable && (
                        <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400/40 via-violet-500/40 to-fuchsia-500/40 text-cyan-200">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-50">
                          AI Trading
                        </span>
                              <span className="text-[10px] text-slate-400">
                          {aiEnabled
                              ? "Neural engine will pick symbol & direction"
                              : "Manual trading mode"}
                        </span>
                            </div>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={aiEnabled}
                                onChange={() => {
                                  setAiEnabled((v) => !v)
                                  setAiAnalyzed(false)
                                  setAiSuggested(null)
                                }}
                                className="peer sr-only"
                            />
                            <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                          </label>
                        </div>
                    )}

                    <AnimatePresence mode="wait" initial={false}>
                      {/* ==== AI MODE ==== */}
                      {aiAvailable && aiEnabled ? (
                          <motion.div
                              key="ai-mode-mobile"
                              initial={{ opacity: 0, scale: 0.97, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.97, y: -8 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="space-y-3"
                          >
                            {/* amount */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-slate-300">
                                <span>AI amount</span>
                                <span className="text-[10px] text-slate-500">
                            Used as margin in base currency
                          </span>
                              </div>
                              <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={aiAmount}
                                  onChange={(e) => setAiAmount(e.target.value)}
                                  className="h-9 w-full rounded-md border border-cyan-500/40 bg-slate-950 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                                  placeholder="$100.00"
                              />
                            </div>

                            {/* analyze + result */}
                            <div className="space-y-2">
                              <button
                                  type="button"
                                  onClick={handleStartAiAnalyze}
                                  disabled={aiAnalyzing}
                                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 py-2.5 text-xs font-semibold text-white shadow-[0_0_25px_rgba(34,211,238,0.55)] transition-all hover:brightness-110 disabled:opacity-60"
                              >
                                <Cpu className="h-4 w-4" />
                                {aiAnalyzing ? "Analyzing market..." : "Start analyze"}
                              </button>

                              <div className="min-h-[70px] rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-violet-500/5 to-slate-950 px-3 py-2 text-[11px] text-slate-100">
                                {aiAnalyzing && (
                                    <div className="space-y-2">
                                      <motion.div
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/80"
                                      >
                                        <motion.div
                                            className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"
                                            animate={{ x: ["-50%", "150%"] }}
                                            transition={{
                                              repeat: Infinity,
                                              duration: 1.4,
                                              ease: "easeInOut",
                                            }}
                                        />
                                      </motion.div>
                                      <motion.p
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          className="text-[10px] text-cyan-200"
                                      >
                                        Scanning volatility clusters, liquidity zones and
                                        trend strength...
                                      </motion.p>
                                    </div>
                                )}

                                {!aiAnalyzing && aiSuggested && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="flex items-center gap-1">
                                    <span className="text-xs font-semibold">
                                      {aiSuggested.symbol}
                                    </span>
                                            <span
                                                className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                                                    aiSuggested.type === "BUY"
                                                        ? "bg-emerald-500/20 text-emerald-300"
                                                        : "bg-red-500/20 text-red-300"
                                                }`}
                                            >
                                      {aiSuggested.type}
                                    </span>
                                          </div>
                                          <div className="text-[10px] text-slate-400">
                                            Entry ≈ {aiSuggested.price.toFixed(5)}
                                          </div>
                                        </div>
                                        <div className="text-[10px] text-cyan-300">
                                          Ready to place AI order
                                        </div>
                                      </div>

                                      {/* для красоты показываем расчёт из aiAmount */}
                                      <div className="mt-2 rounded-xl border border-slate-800/80 bg-slate-950/90 px-3 py-2 text-xs text-slate-300">
                                        <div className="mt-1 flex items-center justify-between">
                                  <span>
                                    {t("requiredMargin") || "Required margin"}:
                                  </span>
                                          <span className="font-semibold text-amber-300">
                                    {Number.parseFloat(aiAmount || "0").toFixed(2)}
                                  </span>
                                        </div>
                                      </div>

                                      <button
                                          type="button"
                                          onClick={handlePlaceAiOrder}
                                          className="w-full rounded-xl bg-cyan-500/90 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:bg-cyan-400"
                                      >
                                        Place AI order
                                      </button>
                                    </div>
                                )}

                                {!aiAnalyzing && !aiSuggested && !aiAnalyzed && (
                                    <p className="text-[10px] text-slate-400">
                                      Hit{" "}
                                      <span className="text-cyan-300">
                                Start analyze
                              </span>{" "}
                                      to let AI choose the best symbol and direction for
                                      you.
                                    </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                      ) : (
                          /* ==== MANUAL MODE ==== */
                          <motion.div
                              key="manual-mode-mobile"
                              initial={{ opacity: 0, scale: 0.97, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.97, y: -8 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                          >
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-4 py-3 text-xs shadow-[0_0_30px_rgba(88,28,135,0.35)]">
                              <div className="mb-3 flex rounded-full bg-slate-900/80 p-1">
                                <button
                                    onClick={() => setOrderType("BUY")}
                                    className={`flex-1 rounded-full py-2 text-[11px] font-semibold ${
                                        orderType === "BUY"
                                            ? "bg-emerald-500 text-white"
                                            : "text-slate-300"
                                    }`}
                                >
                                  {t("buyUpper")}
                                </button>
                                <button
                                    onClick={() => setOrderType("SELL")}
                                    className={`flex-1 rounded-full py-2 text-[11px] font-semibold ${
                                        orderType === "SELL"
                                            ? "bg-red-500 text-white"
                                            : "text-slate-300"
                                    }`}
                                >
                                  {t("sellUpper")}
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-[11px] text-slate-300">
                                    {t("volume")}
                                  </label>
                                  <input
                                      type="text"
                                      value={volume}
                                      onChange={(e) => setVolume(e.target.value)}
                                      placeholder="0.01"
                                      className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-[11px] text-slate-300">
                                    {t("leverage")}
                                  </label>
                                  <select
                                      value={leverage}
                                      onChange={(e) => setLeverage(e.target.value)}
                                      className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  >
                                    <option value="1">1:1</option>
                                    <option value="5">1:5</option>
                                    <option value="10">1:10</option>
                                    <option value="25">1:25</option>
                                    <option value="50">1:50</option>
                                    <option value="100">1:100</option>
                                  </select>
                                </div>

                                {/* orderAmount + margin */}
                                <div className="mt-1 rounded-xl border border-slate-800/80 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-300">
                                  <div className="mt-1 flex items-center justify-between">
                                    <span>{t("marginRequired")}</span>
                                    <span className="font-mono text-amber-300">
                                ${margin.toFixed(2)}
                              </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {/* TP */}
                                  <div className="flex items-center justify-between">
                              <span className="text-[11px] text-slate-300">
                                {t("takeProfit")}
                              </span>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                      <input
                                          type="checkbox"
                                          checked={takeProfitEnabled}
                                          onChange={() =>
                                              setTakeProfitEnabled(!takeProfitEnabled)
                                          }
                                          className="peer sr-only"
                                      />
                                      <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                    </label>
                                  </div>
                                  {takeProfitEnabled && (
                                      <input
                                          type="text"
                                          value={takeProfit}
                                          onChange={(e) =>
                                              setTakeProfit(e.target.value)
                                          }
                                          placeholder={t("enterTpPrice")}
                                          className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      />
                                  )}

                                  {/* SL */}
                                  <div className="flex items-center justify-between">
                              <span className="text-[11px] text-slate-300">
                                {t("stopLoss")}
                              </span>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                      <input
                                          type="checkbox"
                                          checked={stopLossEnabled}
                                          onChange={() =>
                                              setStopLossEnabled(!stopLossEnabled)
                                          }
                                          className="peer sr-only"
                                      />
                                      <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                    </label>
                                  </div>
                                  {stopLossEnabled && (
                                      <input
                                          type="text"
                                          value={stopLoss}
                                          onChange={(e) => setStopLoss(e.target.value)}
                                          placeholder={t("enterSlPrice")}
                                          className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      />
                                  )}
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 py-2.5 text-xs font-semibold text-white shadow-[0_0_25px_rgba(129,140,248,0.7)] transition-all hover:brightness-110"
                                >
                                  {t("placeOrderCta").replace("{type}", orderType)}
                                </button>

                                <div className="flex items-center justify-between border-t border-slate-800/70 pt-2 text-[11px] text-slate-400">
                                  <span>{t("balance")}</span>
                                  <span className="flex items-center font-mono text-slate-100">
                              {isBalanceUpdating ? (
                                  <>
                                    <span className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-purple-500" />
                                    {t("processing")}...
                                  </>
                              ) : (
                                  `$${balance?.toFixed(2) ?? "0.00"}`
                              )}
                            </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                      )}
                    </AnimatePresence>

                    {/* общая ошибка (если есть) */}
                    {error && (
                        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-[10px] text-rose-100">
                          {error}
                        </div>
                    )}
                  </motion.div>

                  {/* ACTIVE TRADES (mobile) */}
                  {/* ACTIVE TRADES (mobile) */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/90 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <BarChart3 className="h-4 w-4 text-purple-400" />
                        {t("activeTrades")}
                      </h3>
                      <span className="rounded-full bg-purple-900/30 px-2 py-0.5 text-[11px] font-medium text-purple-300">
      {openTrades.length || "0"}
    </span>
                    </div>
                    <div className="custom-scrollbar max-h-64 space-y-3 overflow-y-auto px-3 pb-3 pt-2 text-[11px]">
                      {openTrades.length > 0 ? (
                          openTrades.map((trade) => {
                            const tickerData = tickers.find((d) => d.symbol === trade.ticker)
                            const livePrice =
                                tickerData?.bid ??
                                tickerData?.ask ??
                                tickerData?.lastPrice ??
                                trade.openIn

                            const isClosed = trade.status === "CLOSED"

                            const profitRaw = isClosed
                                ? trade.profit ?? 0
                                : trade.type === "BUY"
                                    ? (livePrice - trade.openIn) * trade.volume * trade.leverage
                                    : (trade.openIn - livePrice) * trade.volume * trade.leverage

                            const profit = Number.isFinite(profitRaw) ? profitRaw : 0
                            const isProfit = profit >= 0

                            const absProfit = Math.abs(profit)

                            return (
                                <div
                                    key={trade.id}
                                    className="rounded-xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-3"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-slate-100">
                    {trade.ticker}
                  </span>
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                                trade.type === "BUY"
                                                    ? "bg-emerald-500/20 text-emerald-300"
                                                    : "bg-red-500/20 text-red-300"
                                            }`}
                                        >
                    {trade.type}
                  </span>
                                        {trade.status === "CLOSING" && (
                                            <span className="text-[9px] text-amber-300">
                      {t("closing") || "Closing..."}
                    </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                                        <span>Vol: {trade.volume}</span>
                                        <span>x{trade.leverage}</span>
                                        <span>
                    {t("openPrice") || "Open"}:{" "}
                                          {trade.openIn.toFixed(5)}
                  </span>
                                        {!isClosed && (
                                            <span>
                      {t("currentPrice") || "Current"}:{" "}
                                              {livePrice.toFixed(5)}
                    </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="text-[10px] text-slate-500">P/L</div>
                                      <AnimatedNumber
                                          value={absProfit}
                                          prefix={isProfit ? "+$" : "-$"}
                                          maximumFractionDigits={2}
                                          className={`text-xs font-bold ${
                                              isProfit ? "text-emerald-400" : "text-red-400"
                                          }`}
                                      />
                                      {/* Кнопка закрытия */}
                                      {trade.status === "OPEN" && (
                                          <button
                                              type="button"
                                              onClick={() => handleCloseTrade(trade)}
                                              className="mt-1 inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                                          >
                                            <X className="mr-1 h-3 w-3" />
                                            {t("close") || "Close"}
                                          </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                            )
                          })
                      ) : (
                          <div className="py-4 text-center text-[11px] text-slate-500">
                            {t("noOpenPositions")}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* FULLSCREEN CHART OVERLAY (mobile) */}
          {isMobileChartFullscreen && (
              <div className="fixed inset-x-0 inset-y-0 top-12 z-40 flex flex-col bg-[#050012]">
                {isFullscreenLoading ? (
                    <div className="flex flex-1 flex-col items-center justify-center">
                      <div className="mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-purple-500" />
                      <div className="text-xs text-slate-400">
                        {t("loadingFullscreenChart") ||
                            "Preparing full screen chart..."}
                      </div>
                    </div>
                ) : (
                    <>
                      {/* top bar */}
                      <div className="mt-4 flex items-center justify-between border-b border-slate-800 bg-[#0f1419] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-semibold">
                      {selectedTicker?.showName ?? "--"}
                    </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                              setIsFullscreenLoading(false)
                              setIsMobileChartFullscreen(false)
                            }}
                            className="flex items-center gap-1 rounded-sm border border-slate-700 bg-slate-900/80 px-2.5 py-2 text-[10px] text-slate-200"
                        >
                          <Minimize2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* controls */}
                      <div className="mt-4 space-y-2 px-3 pb-1 pt-2">
                        <div className="flex w-full flex-row justify-between gap-2">
                          {/* timeframe */}
                          <div className="flex w-1/2 flex-col gap-1">
                      <span className="text-[10px] text-slate-500">
                        {t("timeframe") || "Timeframe"}
                      </span>
                            <div className="relative">
                              <select
                                  value={timeframe}
                                  onChange={(e) =>
                                      handleTimeframeClick(e.target.value)
                                  }
                                  className="h-8 w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-3 pr-7 text-[11px] font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              >
                                {timeframes.map((tf) => (
                                    <option key={tf.value} value={tf.value}>
                                      {tf.label}
                                    </option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                          ▼
                        </span>
                            </div>
                          </div>

                          {/* indicators */}
                          <div className="flex w-1/2 flex-col gap-1">
                      <span className="text-[10px] text-slate-500">
                        {t("indicators") || "Indicators"}
                      </span>

                            <details className="relative">
                              <summary className="flex h-8 cursor-pointer list-none items-center justify-between rounded-xl border border-slate-700 bg-slate-900/90 px-3 text-[11px] font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <span className="truncate">{indicatorsLabel}</span>
                                <span className="ml-2 text-[10px] text-slate-500">
                            ▼
                          </span>
                              </summary>
                              <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-slate-800 bg-slate-900/95 p-1 text-[11px] shadow-xl">
                                {/* same buttons as above */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIndicators((prev) => ({
                                          ...prev,
                                          sma: !prev.sma,
                                        }))
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                                >
                                  <span>SMA</span>
                                  {indicators.sma && (
                                      <span className="text-emerald-400">●</span>
                                  )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIndicators((prev) => ({
                                          ...prev,
                                          ema: !prev.ema,
                                        }))
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                                >
                                  <span>EMA</span>
                                  {indicators.ema && (
                                      <span className="text-emerald-400">●</span>
                                  )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIndicators((prev) => ({
                                          ...prev,
                                          bb: !prev.bb,
                                        }))
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                                >
                                  <span>BB</span>
                                  {indicators.bb && (
                                      <span className="text-emerald-400">●</span>
                                  )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIndicators((prev) => ({
                                          ...prev,
                                          rsi: !prev.rsi,
                                        }))
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                                >
                                  <span>RSI</span>
                                  {indicators.rsi && (
                                      <span className="text-emerald-400">●</span>
                                  )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIndicators((prev) => ({
                                          ...prev,
                                          macd: !prev.macd,
                                        }))
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                                >
                                  <span>MACD</span>
                                  {indicators.macd && (
                                      <span className="text-emerald-400">●</span>
                                  )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIndicators((prev) => ({
                                          ...prev,
                                          volume: !prev.volume,
                                        }))
                                    }
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-100 hover:bg-slate-800"
                                >
                                  <span>Volume</span>
                                  {indicators.volume && (
                                      <span className="text-emerald-400">●</span>
                                  )}
                                </button>
                              </div>
                            </details>
                          </div>
                        </div>

                        {/* tools */}
                        <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
                          {drawingTools.map((tool) => {
                            const Icon = tool.icon
                            const active = drawMode === tool.name
                            return (
                                <button
                                    key={tool.name}
                                    onClick={() => setDrawMode(tool.name)}
                                    aria-label={tool.label}
                                    className={`flex h-8 w-9 shrink-0 items-center justify-center rounded-lg text-xs ${
                                        active
                                            ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)]"
                                            : "bg-slate-900 text-slate-200"
                                    }`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* fullscreen canvas */}
                      <div className="relative flex-1 bg-[#050314]">
                        <div
                            ref={containerRef}
                            className="relative h-full w-full overflow-hidden"
                        >
                          {(loading || isCandlesLoading) && symbol && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050314]/80 backdrop-blur-sm">
                                <div className="flex items-center space-x-2 text-xs text-slate-400">
                                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-purple-500" />
                                  <span>
                            {t("updatingChart") || "Updating chart data"}...
                          </span>
                                </div>
                              </div>
                          )}

                          {!symbol ? (
                              <div className="flex h-full flex-col items-center justify-center p-6 text-xs text-slate-400">
                                {t("selectTickerTitle") || "Select a symbol to start"}
                              </div>
                          ) : loading && candles.length === 0 ? (
                              <div className="flex h-full items-center justify-center">
                                <div className="text-center text-xs text-slate-400">
                                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500" />
                                  {symbol
                                      ? `${
                                          t("loadingChartData") ||
                                          "Loading chart data for"
                                      } ${symbol}...`
                                      : "Loading candles..."}
                                </div>
                              </div>
                          ) : (
                              <canvas
                                  ref={canvasRef}
                                  className={`h-full w-full touch-none ${
                                      drawMode === "pan" ? "cursor-grab" : "cursor-crosshair"
                                  }`}
                                  onMouseDown={handleMouseDown}
                                  onMouseMove={handleMouseMove}
                                  onMouseUp={handleMouseUp}
                                  onMouseLeave={handleMouseUp}
                                  onWheel={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleWheel(e) // если надо – внутри handleWheel используй e.deltaY и т.д.
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleTouchStart(e)
                                  }}
                                  onTouchMove={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleTouchMove(e)
                                  }}
                                  onTouchEnd={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleTouchEnd(e)
                                  }}
                              />
                          )}
                        </div>
                      </div>
                    </>
                )}
              </div>
          )}

          {/* BOTTOM NAV */}
          {!isMobileChartFullscreen && (
              <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-900 bg-slate-950/95 px-1 py-1">
                <div className="flex items-center justify-around">
                  <button className="flex flex-col items-center p-2 text-slate-400">
                    <Home className="h-4 w-4"/>
                    <span className="text-[10px]">{t("bottomDashboard")}</span>
                  </button>
                  <button className="flex flex-col items-center p-2 text-slate-400">
                    <FileText className="h-4 w-4" />
                    <span className="text-[10px]">{t("bottomTransactions")}</span>
                  </button>
                  <button className="flex flex-col items-center p-2 text-purple-400">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-[10px]">{t("bottomTrade")}</span>
                  </button>
                  <button className="flex flex-col items-center p-2 text-slate-400">
                    <Newspaper className="h-4 w-4" />
                    <span className="text-[10px]">{t("bottomNews")}</span>
                  </button>
                  <button className="flex flex-col items-center p-2 text-slate-400">
                    <User className="h-4 w-4" />
                    <span className="text-[10px]">{t("bottomProfile")}</span>
                  </button>
                </div>
              </div>
          )}
        </div>
    )
  }
  // ---------------- MOBILE LAYOUT ----------------





  // ---------------- DESKTOP LAYOUT ----------------
// ---------------- DESKTOP LAYOUT ----------------
  return (
      <div className="flex h-[calc(100vh-65px)] flex-col overflow-y-hidden bg-[#050012] text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f1419] px-4 py-2">
          <div className="flex items-center gap-3">
            {selectedTicker && (
                <TickerAvatar
                    symbol={selectedTicker.symbol}
                    category={selectedTicker.category}
                    baseCurrency={selectedTicker.baseCurrency}
                    quoteCurrency={selectedTicker.quoteCurrency}
                    size={32}
                />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">
                  {selectedTicker
                      ? selectedTicker.showName
                      : t("selectTickerTitle") || "Select a symbol"}
                </h1>
                {selectedTicker && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                LIVE
              </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {selectedTicker
                    ? `${selectedTicker.symbol} • Realtime with drawings`
                    : t("selectTickerDescription") ||
                    "Choose a symbol from the list to display the chart."}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="font-mono text-xl font-semibold">
                {selectedTicker && candles.length > 0
                    ? formatPriceValue(currentPrice) ?? currentPrice.toFixed(5)
                    : "--"}
              </div>
              {selectedTicker && candles.length > 1 ? (
                  <div
                      className={`text-xs ${
                          priceChange >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                  >
                    {priceChange >= 0 ? "+" : ""}
                    {(formatPriceValue(priceChange) ?? priceChange.toFixed(5))} (
                    {percentChange >= 0 ? "+" : ""}
                    {percentChange.toFixed(2)}%)
                  </div>
              ) : (
                  <div className="text-xs text-slate-500">-- (0.00%)</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {timeframes.map((tf) => (
                  <button
                      key={tf.value}
                      onClick={() => handleTimeframeClick(tf.value)}
                      className={`rounded-full px-2 py-1 text-xs ${
                          timeframe === tf.value
                              ? "bg-purple-600 text-white"
                              : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                      }`}
                  >
                    {tf.label}
                  </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="flex flex-1 border-b border-slate-800 bg-[#050314]">
          {/* LEFT: tickers */}
          <div className="w-80 border-r border-slate-800 bg-slate-950/90 p-3">
            <div className="mb-3 flex gap-2">
              <button
                  onClick={() => setActiveTab("all")}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${
                      activeTab === "all"
                          ? "bg-purple-600 text-white"
                          : "bg-slate-800 text-slate-300"
                  }`}
              >
                {t("all")}
              </button>
              <button
                  onClick={() => setActiveTab("favorites")}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium ${
                      activeTab === "favorites"
                          ? "bg-purple-600 text-white"
                          : "bg-slate-800 text-slate-300"
                  }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3" />
                  {t("favorites")}
                </div>
              </button>
            </div>

            <div className="relative mb-3">
              <svg
                  className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                  type="text"
                  placeholder={t("searchTickers")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="custom-scrollbar max-h-[calc(100vh-200px)] overflow-y-auto">
              {renderCategorizedTickers()}
            </div>
          </div>

          {/* CENTER: chart */}
          <div className="flex flex-1">
            <div className="flex flex-1 flex-col">
              <div className="flex-1 bg-[#050314]">
                <div
                    ref={containerRef}
                    className="relative h-full w-full overflow-hidden"
                >
                  {(loading || isCandlesLoading) && symbol && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#050314]/80 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-purple-500" />
                          <span>
                      {t("updatingChart") || "Updating chart data"}...
                    </span>
                        </div>
                      </div>
                  )}

                  {/* LEFT TOOLBAR */}
                  <div className="pointer-events-none absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
                    {drawingTools.map((tool) => {
                      const Icon = tool.icon
                      const active = drawMode === tool.name
                      return (
                          <button
                              key={tool.name}
                              onClick={() => setDrawMode(tool.name)}
                              className={`pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border text-xs ${
                                  active
                                      ? "border-purple-500 bg-purple-600 text-white shadow-lg"
                                      : "border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800"
                              }`}
                              title={tool.label}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                      )
                    })}
                  </div>

                  {/* INDICATORS CHIP */}
                  <div className="pointer-events-none absolute left-14 top-3 z-20">
                    <div className="pointer-events-auto rounded-full border border-slate-700/70 bg-slate-900/90 px-3 py-1 shadow-lg">
                      {indicatorControls}
                    </div>
                  </div>

                  {/* SAVE / CLEAR */}
                  <div className="pointer-events-none absolute right-3 top-3 z-20 flex gap-2">
                    <button
                        className="pointer-events-auto flex items-center gap-1 rounded-md bg-blue-900/40 px-2 py-1 text-[11px] text-blue-300 hover:bg-blue-900/60"
                        onClick={saveDrawings}
                        disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-blue-300" />
                            Saving...
                          </>
                      ) : saveStatus === "saved" ? (
                          <>
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Saved
                          </>
                      ) : saveStatus === "error" ? (
                          <>
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Error
                          </>
                      ) : (
                          <>
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                              />
                            </svg>
                            Save
                          </>
                      )}
                    </button>

                    <button
                        className="pointer-events-auto flex items-center gap-1 rounded-md bg-red-900/40 px-2 py-1 text-[11px] text-red-300 hover:bg-red-900/60"
                        onClick={() => {
                          setDrawings([])
                          setSelectedDrawing(null)
                          if (symbol) {
                            clearDrawingsOnServer(symbol, timeframe)
                          }
                        }}
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>

                  {/* CHART / PLACEHOLDER */}
                  {!symbol ? (
                      <div className="flex h-full flex-col items-center justify-center p-6">
                        <div className="mb-6 flex flex-col items-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                            <BarChart3 className="h-8 w-8 text-slate-600" />
                          </div>
                          <h3 className="mb-2 text-lg font-semibold text-slate-200">
                            {t("selectTickerTitle") || "Select a symbol to start"}
                          </h3>
                          <p className="mb-6 max-w-md text-center text-sm text-slate-400">
                            {t("selectTickerDescription") ||
                                "Pick a symbol from the left panel to load a realtime chart with drawings."}
                          </p>
                        </div>
                      </div>
                  ) : loading && candles.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center text-xs text-slate-400">
                          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500" />
                          {symbol
                              ? `${
                                  t("loadingChartData") || "Loading chart data for"
                              } ${symbol}...`
                              : "Loading candles..."}
                        </div>
                      </div>
                  ) : (
                      <div
                          ref={containerRef}
                          className="relative h-full w-full overflow-hidden rounded-2xl sm:h-full touch-none"
                          style={{touchAction: "none"}} // чтобы тач не скроллил страницу
                      >
                        <canvas
                            ref={canvasRef}
                            className={`h-full w-full touch-none ${
                                drawMode === "pan" ? "cursor-grab" : "cursor-crosshair"
                            }`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            // onWheel УБРАТЬ
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        />
                      </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: trading panel (desktop) */}
            <motion.div
                layout
                initial={false}
                animate={
                  aiAvailable && aiEnabled
                      ? {
                        borderColor: "rgba(34,211,238,0.8)",
                        boxShadow:
                            "0 0 40px rgba(34,211,238,0.35), 0 0 80px rgba(147,51,234,0.25)",
                      }
                      : {
                        borderColor: "rgba(30,64,175,0.8)",
                        boxShadow:
                            "0 0 35px rgba(88,28,135,0.35), 0 0 60px rgba(15,23,42,1)",
                      }
                }
                className="w-80 border-l border-slate-800 bg-slate-950/90 p-4"
            >
              <div className="rounded-2xl border border-slate-800 bg-slate-950/95 shadow-[0_0_40px_rgba(88,28,135,0.35)]">
                <div className="space-y-4 px-5 py-4 text-xs">
                  {/* AI toggle */}
                  {aiAvailable && (
                      <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400/40 via-violet-500/40 to-fuchsia-500/40 text-cyan-200">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-50">
                        AI Trading
                      </span>
                            <span className="text-[10px] text-slate-400">
                        {aiEnabled
                            ? "Neural engine mode is enabled"
                            : "Manual trading mode"}
                      </span>
                          </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                              type="checkbox"
                              checked={aiEnabled}
                              onChange={() => {
                                setAiEnabled((v) => !v)
                                setAiAnalyzed(false)
                                setAiSuggested(null)
                              }}
                              className="peer sr-only"
                          />
                          <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                        </label>
                      </div>
                  )}

                  <AnimatePresence mode="wait" initial={false}>
                    {/* AI MODE DESKTOP */}
                    {aiAvailable && aiEnabled ? (
                        <motion.div
                            key="ai-mode-desktop"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.97 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="space-y-4 pt-2"
                        >
                          <div>
                            <label className="mb-1 block text-[11px] text-slate-300">
                              AI amount
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={aiAmount}
                                onChange={(e) => setAiAmount(e.target.value)}
                                className="h-9 w-full rounded-md border border-cyan-500/40 bg-slate-950 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                                placeholder="$100.00"
                            />
                            <div className="mt-1 text-[10px] text-slate-500">
                              Used as margin in your base currency.
                            </div>
                          </div>

                          <button
                              type="button"
                              onClick={handleStartAiAnalyze}
                              disabled={aiAnalyzing}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 py-2.5 text-xs font-semibold text-white shadow-[0_0_25px_rgba(34,211,238,0.55)] transition-all hover:brightness-110 disabled:opacity-60"
                          >
                            <Cpu className="h-4 w-4" />
                            {aiAnalyzing ? "Analyzing market..." : "Start analyze"}
                          </button>

                          <div className="min-h-[90px] rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-violet-500/5 to-slate-950 px-3 py-2 text-[11px] text-slate-100">
                            {aiAnalyzing && (
                                <div className="space-y-2">
                                  <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/80"
                                  >
                                    <motion.div
                                        className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"
                                        animate={{ x: ["-50%", "150%"] }}
                                        transition={{
                                          repeat: Infinity,
                                          duration: 1.4,
                                          ease: "easeInOut",
                                        }}
                                    />
                                  </motion.div>
                                  <motion.p
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="text-[10px] text-cyan-200"
                                  >
                                    Mapping liquidity, volatility regimes and trend
                                    structures...
                                  </motion.p>
                                </div>
                            )}

                            {!aiAnalyzing && aiSuggested && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold">
                                  {aiSuggested.symbol}
                                </span>
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                                                aiSuggested.type === "BUY"
                                                    ? "bg-emerald-500/20 text-emerald-300"
                                                    : "bg-red-500/20 text-red-300"
                                            }`}
                                        >
                                  {aiSuggested.type}
                                </span>
                                      </div>
                                      <div className="text-[10px] text-slate-300">
                                        Entry ≈ {aiSuggested.price.toFixed(5)}
                                      </div>
                                    </div>
                                    <div className="text-[10px] text-cyan-300">
                                      Signal ready
                                    </div>
                                  </div>

                                  <div className="mt-2 rounded-xl border border-slate-800/80 bg-slate-950/90 px-3 py-2 text-xs text-slate-300">
                                    <div className="mt-1 flex items-center justify-between">
                              <span>
                                {t("requiredMargin") || "Required margin"}:
                              </span>
                                      <span className="font-mono text-amber-300">
                                {Number.parseFloat(aiAmount || "0").toFixed(2)}
                              </span>
                                    </div>
                                  </div>

                                  <button
                                      type="button"
                                      onClick={handlePlaceAiOrder}
                                      className="w-full rounded-xl bg-cyan-500/90 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:bg-cyan-400"
                                  >
                                    Place AI order
                                  </button>
                                </div>
                            )}

                            {!aiAnalyzing && !aiSuggested && !aiAnalyzed && (
                                <p className="text-[10px] text-slate-300">
                                  Launch AI scan to let the engine select a symbol, side
                                  and entry zone based on current market structure.
                                </p>
                            )}
                          </div>
                        </motion.div>
                    ) : (
                        /* MANUAL MODE DESKTOP */
                        <motion.div
                            key="manual-mode-desktop"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.97 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="space-y-4 pt-2"
                        >
                          <div className="flex rounded-full bg-slate-900/80 p-1">
                            <button
                                onClick={() => setOrderType("BUY")}
                                className={`flex-1 rounded-full py-2 text-[11px] font-semibold ${
                                    orderType === "BUY"
                                        ? "bg-emerald-500 text-white"
                                        : "text-slate-300"
                                }`}
                            >
                              {t("buyUpper")}
                            </button>
                            <button
                                onClick={() => setOrderType("SELL")}
                                className={`flex-1 rounded-full py-2 text-[11px] font-semibold ${
                                    orderType === "SELL"
                                        ? "bg-red-500 text-white"
                                        : "text-slate-300"
                                }`}
                            >
                              {t("sellUpper")}
                            </button>
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] text-slate-300">
                              {t("volume")}
                            </label>
                            <input
                                type="text"
                                value={volume}
                                onChange={(e) => setVolume(e.target.value)}
                                placeholder="0.01"
                                className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] text-slate-300">
                              {t("leverage")}
                            </label>
                            <select
                                value={leverage}
                                onChange={(e) => setLeverage(e.target.value)}
                                className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="1">1:1</option>
                              <option value="5">1:5</option>
                              <option value="10">1:10</option>
                              <option value="25">1:25</option>
                              <option value="50">1:50</option>
                              <option value="100">1:100</option>
                            </select>
                          </div>

                          {/* orderAmount + margin */}
                          <div className="rounded-xl border border-slate-800/80 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-300">
                            <div className="mt-1 flex items-center justify-between">
                              <span>{t("marginRequired")}</span>
                              <span className="font-mono text-amber-300">
                          ${margin.toFixed(2)}
                        </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300">
                          {t("takeProfit")}
                        </span>
                              <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={takeProfitEnabled}
                                    onChange={() =>
                                        setTakeProfitEnabled(!takeProfitEnabled)
                                    }
                                    className="peer sr-only"
                                />
                                <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                              </label>
                            </div>
                            {takeProfitEnabled && (
                                <input
                                    type="text"
                                    value={takeProfit}
                                    onChange={(e) => setTakeProfit(e.target.value)}
                                    placeholder={t("enterTpPrice")}
                                    className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            )}

                            <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300">
                          {t("stopLoss")}
                        </span>
                              <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={stopLossEnabled}
                                    onChange={() =>
                                        setStopLossEnabled(!stopLossEnabled)
                                    }
                                    className="peer sr-only"
                                />
                                <div className="h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                              </label>
                            </div>
                            {stopLossEnabled && (
                                <input
                                    type="text"
                                    value={stopLoss}
                                    onChange={(e) => setStopLoss(e.target.value)}
                                    placeholder={t("enterSlPrice")}
                                    className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            )}
                          </div>

                          <button
                              onClick={handlePlaceOrder}
                              className="w-full rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 py-2.5 text-xs font-semibold text-white shadow-[0_0_25px_rgba(129,140,248,0.7)] transition-all hover:brightness-110"
                          >
                            {t("placeOrderCta").replace("{type}", orderType)}
                          </button>

                          <div className="flex items-center justify-between border-t border-slate-800/70 pt-2 text-[11px] text-slate-400">
                            <span>{t("balance")}</span>
                            <span className="flex items-center font-mono text-slate-100">
                        {isBalanceUpdating ? (
                            <>
                              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-purple-500" />
                              {t("processing")}...
                            </>
                        ) : (
                            `$${balance?.toFixed(2) ?? "0.00"}`
                        )}
                      </span>
                          </div>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                      <div className="mt-2 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-[10px] text-rose-100">
                        {error}
                      </div>
                  )}
                </div>

                {/* ACTIVE TRADES (desktop) */}
                {/* ACTIVE TRADES (desktop) */}
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/90 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                  <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <BarChart3 className="h-4 w-4 text-purple-400" />
                      {t("activeTrades")}
                    </h3>
                    <span className="rounded-full bg-purple-900/30 px-2 py-0.5 text-[11px] font-medium text-purple-300">
      {openTrades.length || "0"}
    </span>
                  </div>
                  <div className="custom-scrollbar max-h-64 space-y-3 overflow-y-auto px-3 pb-3 pt-2 text-[11px]">
                    {openTrades.length > 0 ? (
                        openTrades.map((trade) => {
                          const tickerData = tickers.find(
                              (d) => d.symbol === trade.ticker
                          )
                          const livePrice =
                              tickerData?.bid ??
                              tickerData?.ask ??
                              tickerData?.lastPrice ??
                              trade.openIn

                          const isClosed = trade.status === "CLOSED"

                          const profitRaw = isClosed
                              ? trade.profit ?? 0
                              : trade.type === "BUY"
                                  ? (livePrice - trade.openIn) * trade.volume * trade.leverage
                                  : (trade.openIn - livePrice) * trade.volume * trade.leverage

                          const profit = Number.isFinite(profitRaw) ? profitRaw : 0
                          const isProfit = profit >= 0
                          const absProfit = Math.abs(profit)

                          return (
                              <div
                                  key={trade.id}
                                  className="rounded-xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                  <span className="truncate text-xs font-semibold text-slate-100">
                    {trade.ticker}
                  </span>
                                      <span
                                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                              trade.type === "BUY"
                                                  ? "bg-emerald-500/20 text-emerald-300"
                                                  : "bg-red-500/20 text-red-300"
                                          }`}
                                      >
                    {trade.type}
                  </span>
                                      {trade.status === "CLOSING" && (
                                          <span className="text-[9px] text-amber-300">
                      {t("closing") || "Closing..."}
                    </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                                      <span>Vol: {trade.volume}</span>
                                      <span>x{trade.leverage}</span>
                                      <span>
                    {t("openPrice") || "Open"}:{" "}
                                        {trade.openIn.toFixed(5)}
                  </span>
                                      {!isClosed && (
                                          <span>
                      {t("currentPrice") || "Current"}:{" "}
                                            {livePrice.toFixed(5)}
                    </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="text-[10px] text-slate-500">P/L</div>
                                    <AnimatedNumber
                                        value={absProfit}
                                        prefix={isProfit ? "+$" : "-$"}
                                        maximumFractionDigits={2}
                                        className={`text-xs font-bold ${
                                            isProfit ? "text-emerald-400" : "text-red-400"
                                        }`}
                                    />
                                    {trade.status === "OPEN" && (
                                        <button
                                            type="button"
                                            onClick={() => handleCloseTrade(trade)}
                                            className="mt-1 inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-800"
                                        >
                                          <X className="mr-1 h-3 w-3" />
                                          {t("close") || "Close"}
                                        </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                          )
                        })
                    ) : (
                        <div className="py-4 text-center text-[11px] text-slate-500">
                          {t("noOpenPositions")}
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
  )

}

export default TestChart
