"use client"
import { useEffect, useState } from "react"

import {
    tickerMeta,
    tickerMetaMap,
    tickerOrderMap,
    tickerSymbolSet,
    type TickerMeta,
} from "@/data/ticker-meta"

type TickerData = {
    symbol: string
    price?: number
    time?: number
    bid?: number
    ask?: number
}

type Candle = {
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export type MarketTicker = TickerMeta & {
    price: number
    time: number
    bid?: number
    ask?: number
}

const initialTickers: MarketTicker[] = tickerMeta.map((meta) => ({
    ...meta,
    price: 0,
    time: 0,
}))

export function useTickers(initialTimeframe = "H1") {
    const [tickers, setTickers] = useState<MarketTicker[]>(initialTickers)
    const [candlesBySymbol, setCandlesBySymbol] = useState<Candle[]>([])
    const [isCandlesLoading, setIsCandlesLoading] = useState(false)
    const [selectedTicker, setSelectedTicker] = useState<MarketTicker | null>(null)
    const [timeframe, setTimeframe] = useState(initialTimeframe)
    const [isLoading] = useState(false)

    useEffect(() => {
        if (!selectedTicker?.symbol) {
            setIsCandlesLoading(false)
            return
        }

        setIsCandlesLoading(true)
        setCandlesBySymbol([])

        const controller = new AbortController()
        const url = `https://api.aragon-trade.com/candles?symbol=${selectedTicker.symbol}&timeframe=${timeframe}&count=365`

        fetch(url, { signal: controller.signal })
            .then((res) => res.json())
            .then((data: Candle[]) => {
                setCandlesBySymbol(data)
                setIsCandlesLoading(false)
            })
            .catch(() => {
                setCandlesBySymbol([])
                setIsCandlesLoading(false)
            })

        return () => {
            controller.abort()
        }
    }, [selectedTicker?.symbol, timeframe])

    useEffect(() => {
        if (!selectedTicker) return
        const refreshed = tickers.find((ticker) => ticker.symbol === selectedTicker.symbol)
        if (refreshed && refreshed !== selectedTicker) {
            setSelectedTicker(refreshed)
        }
    }, [tickers, selectedTicker])

    useEffect(() => {
        const ws = new WebSocket("wss://api.aragon-trade.com/ws")
        
        // Batch updates to reduce re-renders
        let updateQueue: TickerData[] = []
        let updateTimer: NodeJS.Timeout | null = null
        let isPaused = false
        
        const processUpdates = () => {
            if (updateQueue.length === 0) return
            
            const data = [...updateQueue]
            updateQueue = []
            
            setTickers((prev) => {
                const map = new Map(prev.map((t) => [t.symbol, t]))
                for (const tick of data) {
                    const meta = tickerMetaMap.get(tick.symbol)
                    if (!meta) continue
                    const existing = map.get(tick.symbol) || { ...meta, price: 0, time: 0 }
                    const price =
                        typeof tick.bid === "number"
                            ? tick.bid
                            : typeof tick.price === "number"
                                ? tick.price
                                : existing.price

                    map.set(tick.symbol, {
                        ...existing,
                        ...meta,
                        bid: typeof tick.bid === "number" ? tick.bid : existing.bid,
                        ask: typeof tick.ask === "number" ? tick.ask : existing.ask,
                        price,
                        time: tick.time ?? existing.time,
                    })
                }

                return Array.from(map.values()).sort(
                    (a, b) =>
                        (tickerOrderMap.get(a.symbol) ?? 0) -
                        (tickerOrderMap.get(b.symbol) ?? 0),
                )
            })
        }

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    action: "subscribe",
                    symbols: tickerMeta.map((t) => t.symbol),
                }),
            )
        }

        ws.onmessage = async (event) => {
            try {
                // Skip updates if tab is hidden
                if (isPaused) return
                
                const data: TickerData[] = JSON.parse(event.data)
                const filteredData = data.filter((tick) => tickerSymbolSet.has(tick.symbol))
                
                // Add to queue instead of processing immediately
                updateQueue.push(...filteredData)
                
                // Process updates in batches every 100ms
                if (!updateTimer) {
                    updateTimer = setTimeout(() => {
                        processUpdates()
                        updateTimer = null
                    }, 100)
                }
            } catch (error) {
                console.error("Error parsing WebSocket tickers:", error)
            }
        }

        ws.onerror = (err) => {
            console.error("WebSocket error", err)
        }
        
        // Pause updates when tab is hidden (Performance optimization)
        const handleVisibilityChange = () => {
            isPaused = document.hidden
            if (!isPaused && updateQueue.length > 0) {
                // Process queued updates when tab becomes visible
                processUpdates()
            }
        }
        
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            ws.close()
            if (updateTimer) clearTimeout(updateTimer)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, []) // Remove timeframe dependency - WS doesn't need to reconnect

    return {
        tickers,
        candlesBySymbol,
        selectedTicker,
        setSelectedTicker,
        timeframe,
        setTimeframe,
        isLoading,
        isCandlesLoading,
    }
}
