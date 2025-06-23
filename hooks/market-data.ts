'use client'
import { useEffect, useState } from "react"

type Ticker = {
    symbol: string
    name: string
    category: string
    price: number
    change: number
    changePercent: number
    restsymbol: string

}
type TickerData = {
    symbol: string;
    price: number;
    time: number;
    type: string;
    bid?: number;
};

type Candle = {
    time: number // UNIX timestamp in seconds
    open: number
    high: number
    low: number
    close: number
    volume: number
}

const categories = {
    Forex: [
        'EURUSD', 'GBPUSD', 'USDCHF', 'USDJPY', 'USDCAD',
        'AUDUSD', 'AUDNZD', 'AUDCAD', 'AUDCHF', 'AUDJPY',
        'CHFJPY', 'EURGBP', 'EURAUD', 'EURJPY', 'EURCHF', 'EURNZD',
        'EURCAD', 'GBPCHF', 'GBPJPY', 'CADCHF', 'CADJPY',
        'GBPAUD', 'GBPCAD', 'GBPNZD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD',
    ],
    Commodities: ['XAUUSD', 'XAGUSD', 'XTIUSD'],
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

// Convert symbol + category into full ticker object
function buildTicker(symbol: string, type: string): TickerData {
    return {
        symbol,
        type,
        price: 0,
        time:0
    }
}

export function useTickers(initialTimeframe = "M1") {
    const [tickers, setTickers] = useState<TickerData[]>([])
    const [candlesBySymbol, setCandlesBySymbol] = useState<Candle[]>([])
    const [selectedTicker, setSelectedTicker] = useState<TickerData | null>(null)
    const [timeframe, setTimeframe] = useState(initialTimeframe)
    const [isLoading, setIsLoading] = useState(true)

    // Step 1: Initialize ticker list from categories
    useEffect(() => {
        const all: TickerData[] = []
        Object.entries(categories).forEach(([category, symbols]) => {
            symbols.forEach((symbol) => all.push(buildTicker(symbol, category)))
        })
        setTickers(all)
        setIsLoading(false)
        // Don't auto-select first ticker - let user choose
        // setSelectedTicker(all[0] || null)
    }, [])

    // Step 2: Fetch historical candles for the selected ticker and timeframe
    useEffect(() => {
        if (!selectedTicker) return

        const url = `http://172.86.69.160/candles?symbol=${selectedTicker.symbol}&timeframe=${timeframe}&count=100`

        fetch(url)
            .then((res) => res.json())
            .then((data: Candle[]) => {
                setCandlesBySymbol(data)
            })
            .catch(() => {
                setCandlesBySymbol([])
            })
    }, [selectedTicker, timeframe])

    // Step 3: WebSocket for live updates (price + new candles)
    useEffect(() => {
        if (tickers.length === 0) return

        const ws = new WebSocket("ws://172.86.69.160/ws")

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    action: "subscribe",
                    symbols: tickers.map((t) => t.symbol),
                }),
            )
        }
        const validSymbols = new Set(
            Object.values(categories).flat()
        );
        ws.onmessage = async (event) => {
            try {
                const data: TickerData[] = JSON.parse(event.data);
                const filteredData = data.filter(tick => validSymbols.has(tick.symbol));

                const updatedTickers: TickerData[] = await Promise.all(
                    filteredData.map(async (tick) => {
                        const hasValidBid = typeof tick.bid === "number" && !isNaN(tick.bid);

                        if (!hasValidBid) {
                            try {
                                const response = await fetch(
                                    `http://172.86.69.160/candles?symbol=${tick.symbol}&timeframe=${timeframe}&count=1`
                                );
                                if (response.ok) {
                                    const candles = await response.json();
                                    const lastCandle = candles?.[0];
                                    if (lastCandle && typeof lastCandle.close === "number") {
                                        return {
                                            ...tick,
                                            bid: lastCandle.close, // fallback to candle close
                                        };
                                    }
                                } else {
                                    console.warn(`Failed to fetch historical for ${tick.symbol}:`, response.status);
                                }
                            } catch (err) {
                                console.error(`Error fetching historical for ${tick.symbol}:`, err);
                            }
                        }

                        return tick; // original tick if bid was valid or fallback failed
                    })
                );

                // Merge into ticker state
                setTickers((prev) => {
                    const map = new Map(prev.map(t => [t.symbol, t]));
                    for (const tick of updatedTickers) {
                        map.set(tick.symbol, tick);
                    }
                    return Array.from(map.values());
                });

            } catch (error) {
                console.error('Error parsing WebSocket tickers:', error);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error", err)
        }

        return () => {
            ws.close()
        }
    }, [tickers.length, timeframe])
    
    return {
        tickers,
        candlesBySymbol,
        selectedTicker,
        setSelectedTicker,
        timeframe,
        setTimeframe,
        isLoading,
    }
}
