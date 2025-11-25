"use client"

"use client"

import Image from "next/image"
import { useMemo, useState } from "react"

import { type TickerCategory } from "@/data/ticker-meta"

interface TickerAvatarProps {
  symbol: string
  category: TickerCategory
  baseCurrency?: string
  quoteCurrency?: string
  size?: number
}

const forexIconPath = (currency: string) => `/icons/forex_icons/${currency}.png`
const cryptoIconPath = (base: string) => `/icons/crypto_icons/${base}.png`
const stockIconPath = (symbol: string) => `/icons/ticker_icons/${symbol}.png`

const normalize = (value?: string) => value?.replace(/[^A-Z]/g, "").toUpperCase() || undefined

export function TickerAvatar({ symbol, category, baseCurrency, quoteCurrency, size = 28 }: TickerAvatarProps) {
  const [fallback, setFallback] = useState(false)
  const [forexErrors, setForexErrors] = useState<{ base: boolean; quote: boolean }>({ base: false, quote: false })

  const normalizedBase = normalize(baseCurrency) || normalize(symbol.slice(0, 3))
  const normalizedQuote = normalize(quoteCurrency) || normalize(symbol.slice(-3))
  const stockTicker = useMemo(() => symbol.split(".")[0].toUpperCase(), [symbol])

  if (category === "forex" && normalizedBase && normalizedQuote) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div
          className="absolute -left-2 rounded-full border-2 border-slate-950 bg-slate-900 shadow-sm overflow-hidden z-10"
          style={{ width: size * 0.72, height: size * 0.72 }}
        >
          {!forexErrors.base ? (
            <Image
              src={forexIconPath(normalizedBase)}
              alt={normalizedBase}
              width={Math.round(size * 0.72)}
              height={Math.round(size * 0.72)}
              className="h-full w-full object-cover"
              unoptimized
              onError={() => setForexErrors((prev) => ({ ...prev, base: true }))}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-200">
              {normalizedBase}
            </span>
          )}
        </div>
        <div
          className="absolute right-0 rounded-full border-2 border-slate-950 bg-slate-900 shadow-sm overflow-hidden"
          style={{ width: size * 0.72, height: size * 0.72 }}
        >
          {!forexErrors.quote ? (
            <Image
              src={forexIconPath(normalizedQuote)}
              alt={normalizedQuote}
              width={Math.round(size * 0.72)}
              height={Math.round(size * 0.72)}
              className="h-full w-full object-cover"
              unoptimized
              onError={() => setForexErrors((prev) => ({ ...prev, quote: true }))}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-200">
              {normalizedQuote}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (category === "crypto") {
    const coin = normalizedBase || stockTicker
    return (
      <div
        className="flex items-center justify-center rounded-full border border-slate-800 bg-slate-900"
        style={{ width: size, height: size }}
      >
        {!fallback ? (
          <Image
            src={cryptoIconPath(coin)}
            alt={coin}
            width={size}
            height={size}
            className="h-full w-full object-cover"
            unoptimized
            onError={() => setFallback(true)}
          />
        ) : (
          <span className="text-xs font-semibold text-amber-300">{coin.slice(0, 2)}</span>
        )}
      </div>
    )
  }

  if (category === "stocks") {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-slate-800 bg-slate-900"
        style={{ width: size, height: size }}
      >
        {!fallback ? (
          <Image
            src={stockIconPath(stockTicker)}
            alt={stockTicker}
            width={size}
            height={size}
            className="h-full w-full object-cover"
            unoptimized
            onError={() => setFallback(true)}
          />
        ) : (
          <span className="text-xs font-semibold text-slate-200">{stockTicker.slice(0, 2)}</span>
        )}
      </div>
    )
  }

  const initials = stockTicker.slice(0, 2)

  return (
    <div
      className="flex items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-200"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}

