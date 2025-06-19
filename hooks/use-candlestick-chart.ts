"use client"

import type React from "react"
import { createChart, UTCTimestamp, BarData } from "lightweight-charts"
import { useEffect, useRef } from "react"

interface Ticker {
  symbol: string
  price: number
  open: number
  high: number
  low: number
  close: number
  restsymbol: string
  time: number
  type: string
}
type BinanceKline = [
  number, string, string, string, string, string,
  number, string, number, string, string, string
]

export function useCandlestickChart(containerRef: React.RefObject<HTMLDivElement>, ticker: Ticker) {
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let chart: any
    let candlestickSeries: any
    let ws: WebSocket

    const initChart = async () => {
      // Remove existing chart
      if (chartRef.current) {
        chartRef.current.remove()
      }

      chart = createChart(containerRef.current!, {
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight,
        layout: {
          background: { color: "hsl(260, 20%, 10%)" },
          textColor: "#9CA3AF",
        },
        grid: {
          vertLines: { color: "#374151" },
          horzLines: { color: "#374151" },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: "#374151" },
        timeScale: {
          borderColor: "#374151",
          timeVisible: true,
          secondsVisible: false,
        },
      })

      candlestickSeries = chart.addCandlestickSeries({
        upColor: "#10B981",
        downColor: "#EF4444",
        borderDownColor: "#EF4444",
        borderUpColor: "#10B981",
        wickDownColor: "#EF4444",
        wickUpColor: "#10B981",
      })

      chartRef.current = chart
      seriesRef.current = candlestickSeries

      try {
        if (ticker.type === "stock") {
          const response = await fetch(
              `https://web-production-2d590.up.railway.app/api/stocks/${ticker.symbol}/candlesticks/`
          )
          const data = await response.json()

          if (data.status === "success" && data.data.length > 0) {
            const formattedData = data.data.map((item: any) => ({
              time: Math.floor(new Date(item.time).getTime() / 1000),
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
            }))
            candlestickSeries.setData(formattedData)
            chart.timeScale().fitContent()
            chart.applyOptions({
              timeScale: {
                rightOffset: 0,
                fixLeftEdge: true,
                lockVisibleTimeRangeOnResize: true,
              },
            })
          }
        } else {
          const response = await fetch(
              `https://api.binance.com/api/v3/klines?symbol=${ticker.restsymbol}&interval=1m&limit=100`
          )
          const data: BinanceKline[] = await response.json()

          const formatted: BarData[] = data.map((kline) => ({
            time: (kline[0] / 1000) as UTCTimestamp,
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
          }))
          candlestickSeries.setData(formatted)
          chart.timeScale().fitContent()
          chart.applyOptions({
            timeScale: {
              rightOffset: 0,
              fixLeftEdge: true,
              lockVisibleTimeRangeOnResize: true,
            },
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        const fallback = generateMockData(ticker.price || 100)
        candlestickSeries.setData(fallback)
        chart.timeScale().fitContent()
        chart.applyOptions({
          timeScale: {
            rightOffset: 0,
            fixLeftEdge: true,
            lockVisibleTimeRangeOnResize: true,
          },
        })
      }

      // WebSocket for crypto
      if (ticker.type !== "stock" && ticker.restsymbol) {
        try {
          const symbol = ticker.restsymbol.toLowerCase()
          ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_1m`)

          ws.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            if (msg.k) {
              const k = msg.k
              const newCandle = {
                time: Math.floor(k.t / 1000),
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
              }
              candlestickSeries.update(newCandle)
            }
          }

          ws.onerror = (err) => {
            console.error("WebSocket error:", err)
          }
        } catch (err) {
          console.error("Failed to open WebSocket:", err)
        }
      }
    }

    initChart()

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          timeScale: {
            rightOffset: 0,     // no right padding
            barSpacing: 6,      // adjust to control candle width
            fixLeftEdge: true,  // prevent empty space on left
            lockVisibleTimeRangeOnResize: true,
          },
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      if (ws) ws.close()
      seriesRef.current = null
    }
  }, [ticker.symbol, ticker.restsymbol, ticker.type])
}

// ✅ Helper to generate fallback candles
function generateMockData(basePrice: number) {
  const data = []
  const now = new Date()

  for (let i = 100; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000)
    const timestamp = Math.floor(time.getTime() / 1000)

    const variation = (Math.random() - 0.5) * basePrice * 0.02
    const open = basePrice + variation
    const close = open + (Math.random() - 0.5) * basePrice * 0.01
    const high = Math.max(open, close) + Math.random() * basePrice * 0.005
    const low = Math.min(open, close) - Math.random() * basePrice * 0.005

    data.push({
      time: timestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    })

    basePrice = close
  }

  return data
}
