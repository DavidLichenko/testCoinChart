"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { createChart, IChartApi, ISeriesApi, CandlestickData, CrosshairMode } from "lightweight-charts"
import { useTheme } from 'next-themes'
import { Skeleton } from "@/components/ui/skeleton"
import { LoaderCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RectangleDrawingPlugin } from "../utils/rectangleDrawingPlugin"
import { getForexDateRange, isForexMarketOpen } from "../utils/dateUtils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

interface ChartMobileProps {
    ticker: string
    type: 'IEX' | 'Crypto' | 'Forex'
    onCurrentPriceChange?: (price: number) => void
}

const timeframes = {
    IEX: ['1min'],
    Crypto: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'],
    Forex: ['minute', 'hourly', 'daily']
}

const ChartMobile: React.FC<ChartMobileProps> = ({
                                                     ticker,
                                                     type,
                                                     onCurrentPriceChange,
                                                 }) => {
    const chartRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()
    const [chart, setChart] = useState<IChartApi | null>(null)
    const [candlestickSeries, setCandlestickSeries] = useState<ISeriesApi<"Candlestick"> | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeframe, setTimeframe] = useState(timeframes[type][0])
    const [rectangleDrawingPlugin, setRectangleDrawingPlugin] = useState<RectangleDrawingPlugin | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const updateCurrentPrice = useCallback((price: number) => {
        if (onCurrentPriceChange && typeof onCurrentPriceChange === 'function') {
            onCurrentPriceChange(price)
        }
    }, [onCurrentPriceChange])
    function connectCandles(data) {
        const connectedData = [];

        for (let i = 0; i < data.length; i++) {
            const current = { ...data[i] };

            // For the first candle, just push it as is
            if (i === 0) {
                const date = new Date(current.time);
                const timestamp = Math.floor(date.getTime() / 1000);
                connectedData.push({
                    time: timestamp, // Convert date to timestamp
                    open: current.open,
                    high: current.high,
                    low: current.low,
                    close: current.close
                });
                continue;
            }

            const previous = connectedData[connectedData.length - 1];

            // Adjust the open of the current candle to match the close of the previous candle
            current.open = previous.close;

            // Adjust high and low to ensure they're consistent with open and close
            current.high = Math.max(current.open, current.close, current.high);
            current.low = Math.min(current.open, current.close, current.low);
            const date = new Date(current.time);
            const timestamp = Math.floor(date.getTime() / 1000);
            connectedData.push({
                time: timestamp, // Convert date to timestamp
                open: current.open,
                high: current.high,
                low: current.low,
                close: current.close
            });
        }
        return connectedData;
    }
    const fetchAndSetData = useCallback(async () => {
        if (!candlestickSeries) return
        setError(null)
        setLoading(true)

        let data: CandlestickData[] = []

        try {
            switch (type) {
                case 'IEX':
                    const response = await fetch(`https://srv677099.hstgr.cloud/api/stocks/${ticker}/candlesticks/`, {
                        method:'GET',
                        headers: {
                            'Content-Type': 'application/json', // Specify the content type
                        },
                    });
                    const json = await response.json();
                    const filledCandles = connectCandles(json.data);
                    let jsonArr = filledCandles.sort((a, b) => a.time - b.time);
                    updateCurrentPrice(jsonArr[jsonArr.length - 1].close)
                    data = jsonArr
                    break

                case 'Crypto':
                    const cryptoResponse = await fetch(`https://api.binance.com/api/v3/klines?symbol=${ticker.toUpperCase()}&interval=${timeframe}&limit=1000`)
                    const cryptoJson = await cryptoResponse.json()
                    data = cryptoJson.map((d: any) => ({
                        time: d[0] / 1000,
                        open: parseFloat(d[1]),
                        high: parseFloat(d[2]),
                        low: parseFloat(d[3]),
                        close: parseFloat(d[4]),
                    }))
                    updateCurrentPrice(data[data.length - 1].close)
                    break

                case 'Forex':
                    if (type === 'Forex' && !isForexMarketOpen()) {
                        setError('Forex market is currently closed')
                        setLoading(false)
                        return
                    }

                    const { start_date, end_date } = getForexDateRange(timeframe)
                    const forexResponse = await fetch(
                        `https://marketdata.tradermade.com/api/v1/timeseries?currency=${ticker}&api_key=FvZ0U8fmsqsqsH95WU3b&start_date=${start_date}&end_date=${end_date}&format=records&interval=${timeframe}`
                    )
                    const forexJson = await forexResponse.json()

                    if (forexJson.message) {
                        throw new Error(forexJson.message)
                    }

                    data = forexJson.quotes.map((d: any) => ({
                        time: Date.parse(d.date) / 1000,
                        open: parseFloat(d.open),
                        high: parseFloat(d.high),
                        low: parseFloat(d.low),
                        close: parseFloat(d.close),
                    }))
                    updateCurrentPrice(data[data.length - 1].close)
                    break
            }

            if (data.length > 0) {
                candlestickSeries.setData(data)
                updateCurrentPrice(data[data.length - 1].close)
            } else {
                setError('No data available for the selected timeframe')
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            setError(error instanceof Error ? error.message : 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }, [candlestickSeries, ticker, type, updateCurrentPrice, timeframe])

    useEffect(() => {
        if (!chartRef.current) return

        const newChart = createChart(chartRef.current, {
            height: 400,
            layout: {
                textColor: theme === 'light' ? '#000' : '#666',
                background: { color: theme === 'light' ? '#ffffff' : 'hsl(240, 5%, 8%)' },
            },
            rightPriceScale: {
                borderVisible: false,
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            grid: {
                vertLines: {color: '#444'},
                horzLines: {color: '#444'},
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        })

        const newSeries = newChart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        })
        setChart(newChart)
        setCandlestickSeries(newSeries)

        const newRectangleDrawingPlugin = new RectangleDrawingPlugin(newChart)
        setRectangleDrawingPlugin(newRectangleDrawingPlugin)

        return () => {
            newChart.remove()
        }
    }, [theme])

    useEffect(() => {
        if (chart && candlestickSeries) {
            fetchAndSetData()

            if (type === 'Crypto') {
                const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${ticker.toLowerCase()}@kline_${timeframe}`)
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data)
                    const { t, o, h, l, c } = data.k
                    const updatedCandle = {
                        time: t / 1000,
                        open: parseFloat(o),
                        high: parseFloat(h),
                        low: parseFloat(l),
                        close: parseFloat(c),
                    }
                    candlestickSeries.update(updatedCandle)
                    updateCurrentPrice(parseFloat(c))
                }
                return () => ws.close()
            }
        }
    }, [chart, candlestickSeries, fetchAndSetData, ticker, type, updateCurrentPrice, timeframe])

    const handleTimeframeChange = (value: string) => {
        setTimeframe(value)
    }

    const toggleRectangleDrawing = () => {
        if (rectangleDrawingPlugin) {
            if (isDrawing) {
                rectangleDrawingPlugin.stopDrawingMode()
            } else {
                rectangleDrawingPlugin.startDrawingMode()
            }
            setIsDrawing(!isDrawing)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{ticker}</h2>
                <Select onValueChange={handleTimeframeChange} defaultValue={timeframe}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                        {timeframes[type].map((tf) => (
                            <SelectItem key={tf} value={tf}>
                                {tf}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div ref={chartRef} className='relative'>
                {loading && (
                    <Skeleton className='w-full h-[400px] flex items-center justify-center'>
                        <LoaderCircle className='animate-spin' />
                    </Skeleton>
                )}
            </div>
        </div>
    )
}

export default ChartMobile

