"use client"

import { useState, useEffect } from "react"

interface StockTicker {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  type: "stock"
}

interface CandlestickData {
  time: string
  open: number
  high: number
  low: number
  close: number
}

interface StockResponse {
  status: string
  data: CandlestickData[]
}

const STOCK_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "CRM", name: "Salesforce" },
]

// Mock stock data as fallback
const mockStockData: StockTicker[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 196.45, change: 2.34, changePercent: 1.21, type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.87, change: -1.23, changePercent: -0.85, type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.92, change: 5.67, changePercent: 2.33, type: "stock" },
  { symbol: "MSFT", name: "Microsoft", price: 378.12, change: 3.45, changePercent: 0.92, type: "stock" },
  { symbol: "NVDA", name: "NVIDIA", price: 875.43, change: 12.34, changePercent: 1.43, type: "stock" },
  { symbol: "AMZN", name: "Amazon", price: 156.78, change: -2.11, changePercent: -1.33, type: "stock" },
  { symbol: "META", name: "Meta Platforms", price: 334.56, change: 4.23, changePercent: 1.28, type: "stock" },
  { symbol: "NFLX", name: "Netflix", price: 487.91, change: -3.45, changePercent: -0.7, type: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 142.33, change: 1.87, changePercent: 1.33, type: "stock" },
  { symbol: "CRM", name: "Salesforce", price: 267.89, change: 2.45, changePercent: 0.92, type: "stock" },
]

export function useStockData() {
  const [stockTickers, setStockTickers] = useState<StockTicker[]>([])
  const [stockCandlestickData, setStockCandlestickData] = useState<Record<string, CandlestickData[]>>({})

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        // // Use mock data immediately for better UX
        // setStockTickers(mockStockData)

        // Try to fetch real data in background
        const tickersData: StockTicker[] = []

        for (const stock of STOCK_SYMBOLS) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

            const response = await fetch(
              `https://web-production-2d590.up.railway.app/api/stocks/${stock.symbol}/candlesticks/`,
              {
                signal: controller.signal,
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              },
            )

            clearTimeout(timeoutId)

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data: StockResponse = await response.json()

            if (data.status === "success" && data.data && data.data.length > 0) {
              const latestData = data.data[data.data.length - 1]
              const previousClose = data.data.length > 1 ? data.data[data.data.length - 2].close : latestData.open
              const change = latestData.close - previousClose
              const changePercent = (change / previousClose) * 100

              const ticker: StockTicker = {
                symbol: stock.symbol,
                name: stock.name,
                price: latestData.close,
                change,
                changePercent,
                type: "stock",
              }

              tickersData.push(ticker)

              setStockCandlestickData((prev) => ({
                ...prev,
                [stock.symbol]: data.data,
              }))
            }
          } catch (error) {
            console.warn(`Failed to fetch data for ${stock.symbol}:`, error)
            // Keep using mock data for this symbol
          }
        }

        // Only update if we got real data
        if (tickersData.length > 0) {
          setStockTickers(tickersData)
        }
      } catch (error) {
        console.error("Error in fetchStockData:", error)
        // Fallback to mock data
        setStockTickers(mockStockData)
      }
    }

    fetchStockData()
    const interval = setInterval(fetchStockData, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return { stockTickers, stockCandlestickData }
}
