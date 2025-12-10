// "@/components/virtualized-ticker-list.tsx"
"use client"

import React, {
    memo,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react"
import type { MarketTicker } from "@/hooks/market-data"
import { TickerAvatar } from "@/components/ticker-avatar"
import { Star } from "lucide-react"

interface VirtualizedTickerListProps {
    tickers: MarketTicker[]
    selectedSymbol?: string
    onSelectTicker: (ticker: MarketTicker) => void
    formatPriceValue: (value?: number | null) => string | null
    height?: number
    favoriteSymbols: Set<string>
    onToggleFavorite: (symbol: string) => void
}

const ITEM_HEIGHT = 64
const BUFFER_SIZE = 5 // Number of items to render outside viewport

const TickerRow = memo<{
    ticker: MarketTicker
    isSelected: boolean
    onSelectTicker: (ticker: MarketTicker) => void
    formatPriceValue: (value?: number | null) => string | null
    favoriteSymbols: Set<string>
    onToggleFavorite: (symbol: string) => void
}>(
    ({
         ticker,
         isSelected,
         onSelectTicker,
         formatPriceValue,
         favoriteSymbols,
         onToggleFavorite,
     }) => {
        const priceValue = formatPriceValue(ticker.bid ?? ticker.price)
        const isFavorite = favoriteSymbols.has(ticker.symbol)
        return (
            <div className="px-2 py-1.5">
                {/* НЕ button, чтобы не вкладывать button в button */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectTicker(ticker)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            onSelectTicker(ticker)
                        }
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 cursor-pointer ${
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
                            size={24}
                            icon={ticker.icon}
                        />
                        <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-slate-100">
                                {ticker.showName}
                            </div>
                            <div className="text-[10px] uppercase text-slate-500">
                                {ticker.fullName}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        {priceValue ? (
                            <div className="font-mono text-xs text-slate-100">
                                ${priceValue}
                            </div>
                        ) : (
                            <span className="inline-flex h-3 w-10 animate-pulse rounded bg-slate-800" />
                        )}

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleFavorite(ticker.symbol)
                            }}
                            className="p-1"
                        >
                            <Star
                                className={`h-4 w-4 ${
                                    isFavorite
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-slate-500"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        )
    },
)

TickerRow.displayName = "TickerRow"

export const VirtualizedTickerList = memo<VirtualizedTickerListProps>(
    ({
         tickers,
         selectedSymbol,
         onSelectTicker,
         formatPriceValue,
         height = 420,
         favoriteSymbols,
         onToggleFavorite,
     }) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const [scrollTop, setScrollTop] = useState(0)

        const handleScroll = useCallback(
            (e: React.UIEvent<HTMLDivElement>) => {
                setScrollTop(e.currentTarget.scrollTop)
            },
            [],
        )

        const { visibleItems, paddingTop, paddingBottom } = useMemo(() => {
            const startIndex = Math.max(
                0,
                Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE,
            )
            const endIndex = Math.min(
                tickers.length,
                Math.ceil((scrollTop + height) / ITEM_HEIGHT) + BUFFER_SIZE,
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
                className="custom-scrollbar overflow-y-auto"
                style={{ height: `${height}px` }}
            >
                <div
                    style={{
                        paddingTop: `${paddingTop}px`,
                        paddingBottom: `${paddingBottom}px`,
                    }}
                >
                    {visibleItems.map((ticker) => (
                        <TickerRow
                            key={ticker.symbol}
                            ticker={ticker}
                            isSelected={selectedSymbol === ticker.symbol}
                            onSelectTicker={onSelectTicker}
                            formatPriceValue={formatPriceValue}
                            favoriteSymbols={favoriteSymbols}
                            onToggleFavorite={onToggleFavorite}
                        />
                    ))}
                </div>
            </div>
        )
    },
)

VirtualizedTickerList.displayName = "VirtualizedTickerList"
