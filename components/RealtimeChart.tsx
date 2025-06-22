'use client'
import React, { useEffect, useRef, useState } from "react";
import {
    createChart,
    ISeriesApi,
    UTCTimestamp,
    BarData,
} from "lightweight-charts";

type Props = {
    symbol: string;
    timeframe: string; // "M1", "M5", etc.
};

export default function RealtimeChart({ symbol, timeframe }: Props) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const lastCandleRef = useRef<BarData | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // Map timeframe string to seconds
    const timeframeSeconds = {
        M1: 60,
        M5: 300,
        M15: 900,
        H1: 3600,
    }[timeframe] || 60;

    useEffect(() => {
        if (!chartContainerRef.current) return;

        if (chartRef.current) {
            chartRef.current.remove();
        }

        chartRef.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
                background: "#ffffff",
                textColor: "#000",

            },
            grid: {
                vertLines: { color: "#eee" },
                horzLines: { color: "#eee" },

            },
            rightPriceScale: {
                borderColor: "#ccc",
                ticksVisible:true
            },
            timeScale: {

                borderColor: "#ccc",
                timeVisible: true,
                secondsVisible: false,
            },
        });

        candleSeriesRef.current = chartRef.current.addCandlestickSeries();

        return () => {
            chartRef.current?.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            lastCandleRef.current = null;
        };
    }, [symbol]);

    // Fetch historical candles
    useEffect(() => {
        if (!symbol) return;

        const fetchData = async () => {
            try {
                const response = await fetch(
                    `https://4592-2001-4bb8-2ae-e4ed-800d-675f-9cf3-901c.ngrok-free.app/candles?symbol=${symbol}&timeframe=${timeframe}&count=200`
                );
                const initialData = await response.json();

                if (candleSeriesRef.current && Array.isArray(initialData)) {
                    const bars: BarData[] = initialData.map((c: any) => ({
                        time: c.time,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                    }));
                    candleSeriesRef.current.setData(bars);
                    lastCandleRef.current = bars[bars.length - 1]; // Save last one
                }
            } catch (error) {
                console.error('Error fetching historical candles:', error);
            }
        };

        fetchData();
    }, [symbol, timeframe]);

    // Live update via WebSocket
    useEffect(() => {
        if (ws) ws.close();

        const socket = new WebSocket("wss://4592-2001-4bb8-2ae-e4ed-800d-675f-9cf3-901c.ngrok-free.app/ws");

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const tick = data.find((d: any) => d.symbol === symbol);
                if (!tick || !candleSeriesRef.current || !tick.time) return;

                const price = tick.bid;
                const tickTime = Math.floor(tick.time);  // seconds timestamp

                // Calculate candle start time based on timeframe in seconds
                const candleTime = Math.floor(tickTime / timeframeSeconds) * timeframeSeconds as UTCTimestamp;

                const last = lastCandleRef.current;

                if (!last) {
                    // No candle yet, create first one
                    const newCandle: BarData = {
                        time: candleTime,
                        open: price,
                        high: price,
                        low: price,
                        close: price,
                    };
                    candleSeriesRef.current.update(newCandle);
                    lastCandleRef.current = newCandle;
                    console.log('First candle created', newCandle);
                    return;
                }

                if (candleTime === last.time) {
                    // Tick falls within current candle timeframe — update candle
                    const updated: BarData = {
                        time: last.time,
                        open: last.open,
                        high: Math.max(last.high, price),
                        low: Math.min(last.low, price),
                        close: price,
                    };
                    candleSeriesRef.current.update(updated);
                    lastCandleRef.current = updated;
                    console.log('Candle updated', updated);
                } else if (candleTime > last.time) {
                    // Tick belongs to a new candle timeframe — create new candle
                    const newCandle: BarData = {
                        time: candleTime,
                        open: price,
                        high: price,
                        low: price,
                        close: price,
                    };
                    candleSeriesRef.current.update(newCandle);
                    lastCandleRef.current = newCandle;
                    console.log('New candle created', newCandle);
                } else {
                    // Older tick? Ignore or handle accordingly
                    console.warn('Received older tick ignored:', tickTime, 'last candle time:', last.time);
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };


        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, [symbol]);

    return (
        <div>
            <h2>
                {symbol} ({timeframe})
            </h2>
            <div
                ref={chartContainerRef}
                style={{ width: "100%", height: 400, userSelect: "none" }}
            />
        </div>
    );
}
