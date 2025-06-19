'use client'

import React, { useEffect, useRef } from 'react'
import {
    createChart,
    type CandlestickData,
    type ISeriesApi,
} from 'lightweight-charts'

export default function HomePage() {
    const chartRef = useRef<HTMLDivElement>(null)
    const candleSeries = useRef<ISeriesApi<'Candlestick'> | null>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const currentCandle = useRef<CandlestickData | null>(null)

    useEffect(() => {
        if (!chartRef.current) return

        // Create chart with explicit width and height
        const chart = createChart(chartRef.current, {
            width: chartRef.current.clientWidth,
            height: 400,
            layout: {
                backgroundColor: '#ffffff',
                textColor: '#000',
            },
            rightPriceScale: {
                scaleMargins: {
                    top: 0.3,
                    bottom: 0.25,
                },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        })

        // Add candlestick series
        candleSeries.current = chart.addCandlestickSeries()

        // Fetch historical OHLC data (make sure your backend returns correctly formatted data)
        fetch('http://localhost:8000/api/ohlc')
            .then((res) => res.json())
            .then((data: CandlestickData[]) => {
                candleSeries.current?.setData(data)
            })
            .catch((err) => console.error('Failed to load OHLC:', err))

        // Setup WebSocket for live updates
        wsRef.current = new WebSocket('ws://localhost:8000/ws')

        wsRef.current.onmessage = (event) => {
            try {
                const messages = JSON.parse(event.data)
                const trade = messages.find((m: any) => m.T === 't')
                if (!trade) return

                const price = trade.p
                const ts = Math.floor(new Date(trade.t).getTime() / 1000)
                const candleTime = ts - (ts % 60)

                if (!currentCandle.current || currentCandle.current.time !== candleTime) {
                    // Push previous candle update to the chart before moving to new candle
                    if (currentCandle.current) {
                        candleSeries.current?.update(currentCandle.current)
                    }
                    currentCandle.current = {
                        time: candleTime,
                        open: price,
                        high: price,
                        low: price,
                        close: price,
                    }
                } else {
                    // Update the existing candle
                    currentCandle.current.high = Math.max(currentCandle.current.high, price)
                    currentCandle.current.low = Math.min(currentCandle.current.low, price)
                    currentCandle.current.close = price
                    candleSeries.current?.update(currentCandle.current)
                }
            } catch (err) {
                console.error('WS message parsing error:', err)
            }
        }

        // Resize chart on window resize
        const handleResize = () => {
            if (chartRef.current) {
                chart.applyOptions({ width: chartRef.current.clientWidth })
            }
        }
        window.addEventListener('resize', handleResize)

        return () => {
            wsRef.current?.close()
            window.removeEventListener('resize', handleResize)
            chart.remove()
        }
    }, [])

    return (
        <div
            ref={chartRef}
            style={{
                width: '100%',
                height: '500px',
            }}
        />
    )
}
