"use client"

import React, { memo, useMemo, useRef, useEffect, useState, useCallback } from "react"
import type { MarketTicker } from "@/hooks/market-data"
import { TickerAvatar } from "@/components/ticker-avatar"

interface VirtualizedTickerListProps {
  tickers: MarketTicker[]
  selectedSymbol?: string
  onSelectTicker: (ticker: MarketTicker) => void
  formatPriceValue: (value?: number | null) => string | null
  height?: number
}

const ITEM_HEIGHT = 64
const BUFFER_SIZE = 5 // Number of items to render outside viewport

const TickerRow = memo<{
  ticker: MarketTicker
  isSelected: boolean
  onSelectTicker: (ticker: MarketTicker) => void
  formatPriceValue: (value?: number | null) => string | null
}>(({ ticker, isSelected, onSelectTicker, formatPriceValue }) => {
  const priceValue = formatPriceValue(ticker.bid ?? ticker.price)

  return (
    <div className="px-2 py-1.5">
      <button
        onClick={() => onSelectTicker(ticker)}
        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 ${
          isSelected
            ? "border-purple-500/70 bg-purple-950/40"
            : "border-slate-800/70 bg-slate-900/70 hover:bg-slate-900"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <TickerAvatar
            symbol={ticker.symbol}
            category={ticker.category}
            baseCurrency={ticker.baseCurrency}
            quoteCurrency={ticker.quoteCurrency}
            size={32}
          />
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-slate-100">{ticker.showName}</div>
            <div className="text-[10px] uppercase text-slate-500">{ticker.fullName}</div>
          </div>
        </div>
        <div className="text-right">
          {priceValue ? (
            <div className="font-mono text-xs text-slate-100">${priceValue}</div>
          ) : (
            <span className="inline-flex h-3 w-10 animate-pulse rounded bg-slate-800" />
          )}
        </div>
      </button>
    </div>
  )
})

TickerRow.displayName = 'TickerRow'

export const VirtualizedTickerList = memo<VirtualizedTickerListProps>(
  ({ tickers, selectedSymbol, onSelectTicker, formatPriceValue, height = 420 }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollTop, setScrollTop] = useState(0)

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }, [])

    const { visibleItems, paddingTop, paddingBottom } = useMemo(() => {
      const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
      const endIndex = Math.min(
        tickers.length,
        Math.ceil((scrollTop + height) / ITEM_HEIGHT) + BUFFER_SIZE
      )

      const visibleItems = tickers.slice(startIndex, endIndex)
      const paddingTop = startIndex * ITEM_HEIGHT
      const paddingBottom = (tickers.length - endIndex) * ITEM_HEIGHT

      return { visibleItems, paddingTop, paddingBottom }
    }, [tickers, scrollTop, height])

    if (tickers.length === 0) {
      return (
        <div className="flex h-20 items-center justify-center text-xs text-slate-500">
          No tickers available
        </div>
      )
    }

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto custom-scrollbar"
        style={{ height: `${height}px` }}
      >
        <div style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}>
          {visibleItems.map((ticker) => (
            <TickerRow
              key={ticker.symbol}
              ticker={ticker}
              isSelected={selectedSymbol === ticker.symbol}
              onSelectTicker={onSelectTicker}
              formatPriceValue={formatPriceValue}
            />
          ))}
        </div>
      </div>
    )
  }
)

VirtualizedTickerList.displayName = 'VirtualizedTickerList'
