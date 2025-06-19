"use client"

import { useState, useEffect, useRef } from "react"

interface BinanceTicker {
  symbol: string
  restsymbol: string
  name: string
  open:number
  high:number
  low:number
  close:number
  price: number
  change: number
  changePercent: number
  type: "crypto"
  time: number
}

const CRYPTO_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "SOLUSDT",
  "DOGEUSDT", "TRXUSDT", "LINKUSDT", "MATICUSDT", "AVAXUSDT", "DOTUSDT",
  "SHIBUSDT", "LTCUSDT", "UNIUSDT", "ATOMUSDT", "ETCUSDT", "XLMUSDT",
  "NEARUSDT", "ALGOUSDT", "VETUSDT", "ICPUSDT", "FILUSDT", "HBARUSDT",
  "APTUSDT", "QNTUSDT", "LDOUSDT", "STXUSDT", "INJUSDT", "TIAUSDT",
]

const SYMBOL_NAMES: Record<string, string> = {
  BTCUSDT: "Bitcoin", ETHUSDT: "Ethereum", BNBUSDT: "BNB", XRPUSDT: "XRP",
  ADAUSDT: "Cardano", SOLUSDT: "Solana", DOGEUSDT: "Dogecoin", TRXUSDT: "TRON",
  LINKUSDT: "Chainlink", MATICUSDT: "Polygon", AVAXUSDT: "Avalanche", DOTUSDT: "Polkadot",
  SHIBUSDT: "Shiba Inu", LTCUSDT: "Litecoin", UNIUSDT: "Uniswap", ATOMUSDT: "Cosmos",
  ETCUSDT: "Ethereum Classic", XLMUSDT: "Stellar", NEARUSDT: "NEAR Protocol", ALGOUSDT: "Algorand",
  VETUSDT: "VeChain", ICPUSDT: "Internet Computer", FILUSDT: "Filecoin", HBARUSDT: "Hedera",
  APTUSDT: "Aptos", QNTUSDT: "Quant", LDOUSDT: "Lido DAO", STXUSDT: "Stacks",
  INJUSDT: "Injective", TIAUSDT: "Celestia",
}

export function useBinanceWebSocket() {
  const [cryptoTickers, setCryptoTickers] = useState<BinanceTicker[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      const streams = CRYPTO_SYMBOLS.map((symbol) => `${symbol.toLowerCase()}@ticker`).join("/")
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log("✅ Binance WebSocket connected")
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          const tickerData = message.data
          if (!tickerData || !tickerData.s) return

          const symbol = tickerData.s // e.g., BTCUSDT
          const displaySymbol = symbol.replace("USDT", "/USD")

          const ticker: BinanceTicker = {
            symbol: displaySymbol,
            restsymbol:symbol,
            name: SYMBOL_NAMES[symbol] || symbol,
            open:Number(tickerData.o),
            high:Number(tickerData.h),
            low:Number(tickerData.l),
            close:Number(tickerData.c),
            price: Number(tickerData.c),
            change: Number(tickerData.p),
            changePercent: Number(tickerData.P),
            type: "crypto",
            time: Math.floor(tickerData.E / 1000), // <-- eventTime from Binance, in seconds
          }

          setCryptoTickers((prev) => {
            const index = prev.findIndex((t) => t.symbol === displaySymbol)
            if (index >= 0) {
              const updated = [...prev]
              updated[index] = ticker
              return updated
            } else {
              return [...prev, ticker]
            }
          })
        } catch (error) {
          console.error("❌ Error parsing WebSocket data:", error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("❌ WebSocket error:", error)
      }

      wsRef.current.onclose = () => {
        console.warn("⚠️ WebSocket closed. Reconnecting in 3s...")
        setTimeout(connectWebSocket, 3000)
      }
    }

    connectWebSocket()

    return () => {
      wsRef.current?.close()
    }
  }, [])
  return { cryptoTickers }
}
