"use client"
import React, { useEffect, useRef, useState } from "react";
import { createChart, WatermarkOptions } from "lightweight-charts";
import { useTheme } from 'next-themes'

const ChartMobile = ({ticker, type,addTPPriceLine,addSLPriceLine, currentPrice}) => {
    const ref = useRef();
    const { theme, setTheme } = useTheme()
    const [currentChart,setCurrentChart] = useState(0)
    const [TPLine,setTPLine] = useState(false)
    const [SLLine,setSLLine] = useState(false)
    const [SLLinePrice,setSLLinePrice] = useState(0)
    const [TPLinePrice,setTPLinePrice] = useState(0)
    const [OpenInLine,setOpenInLine] = useState(false)
    const [OpenInLinePrice,setOpenInLinePrice] = useState(0)


    const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${ticker}@kline_1m`
    );









    const prepareChart = (chart, ws) => {
        const series = chart.addLineSeries({
            color: '#2962FF',
            lineWidth: 2,

        });
        // chart.subscribeClick(handler)
        setCurrentChart(series);

        const candlestickSeries = chart.addCandlestickSeries();
        chart.applyOptions({
            watermark: {
                visible: false,
            },
            layout: {
                background: {color: 'hsl(240, 5%, 8%)'},
                textColor: '#DDD',
            },
            grid: {
                vertLines: {color: '#444'},
                horzLines: {color: '#444'},
            },
        });

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


        if (type === "IEX") {
            const fetchTest = async () => {
                try {
                    const response = await fetch(`https://srv677099.hstgr.cloud/api/stocks/${ticker}/candlesticks/`, {
                        method:'GET',
                        headers: {
                            'Content-Type': 'application/json', // Specify the content type
                        },
                    });
                    const json = await response.json();
                    const filledCandles = connectCandles(json.data);
                    let jsonArr = filledCandles.sort((a, b) => a.time - b.time);
                    // console.log(jsonArr)
                    jsonArr.forEach((item)=>{
                        currentPrice(item.close)
                    })
                    candlestickSeries.setData(jsonArr);
                } catch (error) {
                    console.error("Error fetching todos:", error);
                }
            }
            fetchTest()
        }
        if (type == 'Crypto') {
            fetch(
                `https://api.binance.com/api/v3/klines?symbol=${ticker.toUpperCase()}&interval=1m&limit=1000`
            )
                .then((res) => res.json())
                .then((data) => {
                    const cdata = data.map((d) => {
                        currentPrice(parseFloat(d[4]))
                        return {
                            time: d[0] / 1000,
                            open: parseFloat(d[1]),
                            high: parseFloat(d[2]),
                            low: parseFloat(d[3]),
                            close: parseFloat(d[4]),
                        };
                    });
                    candlestickSeries.setData(cdata);
                    series.setData(cdata)
                })
                .catch((err) => console.log(err));
            ws.onmessage = (event) => {
                const responseObject = JSON.parse(event.data);
                // console.log(chartData)
                const {t, o, h, l, c} = responseObject.k;

                const kData = {
                    time: t,
                    open: parseFloat(o),
                    high: parseFloat(h),
                    low: parseFloat(l),
                    close: parseFloat(c),
                };
                currentPrice(parseFloat(c))
                candlestickSeries.update(kData);
            };
        }
        if (type == 'Forex') {
            const candlestickSeries = chart.addCandlestickSeries();
            fetch(
                `https://marketdata.tradermade.com/api/v1/timeseries?currency=${ticker}&api_key=FvZ0U8fmsqsqsH95WU3b&start_date=2024-4-10&format=records`
            )
                .then((res) => res.json())
                .then((data) => {
                    // const timestamp = data.date_time.split('-')[0]
                    // console.log(data)
                    const cdata = data.quotes.map((d) => {
                        return {
                            time: Date.parse(d.date) / 1000,
                            open: parseFloat(d.open),
                            high: parseFloat(d.high),
                            low: parseFloat(d.low),
                            close: parseFloat(d.close),
                        };
                    });

                    currentPrice(parseFloat(cdata[cdata.length-1].close))

                    candlestickSeries.setData(cdata);
                })
                .catch((err) => console.log(err));
        }

    }

    if(addTPPriceLine) {
        if (currentChart) {
            // console.log(TPLinePrice)
            if(!TPLine) {
                // @ts-ignore
                const TPPriceLine = currentChart.createPriceLine({
                    price: addTPPriceLine,
                    color: 'rgb(147,232,142)',
                    lineWidth: 2,
                    draggable:true
                });
                setTPLine(true)
                setTPLinePrice(TPPriceLine)
            }
            if(TPLinePrice !== 0) {
                // @ts-ignore
                TPLinePrice.applyOptions({
                    price: addTPPriceLine,
                })
            }
            // console.log(currentChart)
        }
    }
    if(addSLPriceLine) {
        if (currentChart) {

            if(!SLLine) {
                // @ts-ignore
                const SLPriceLine = currentChart.createPriceLine({
                    price: addSLPriceLine,
                    color: 'rgb(211,151,67)',
                    lineWidth: 2,
                    draggable:true
                });
                setSLLine(true)
                setSLLinePrice(SLPriceLine)
            }
            if(SLLinePrice !== 0) {
                // @ts-ignore
                SLLinePrice.applyOptions({
                    price: addSLPriceLine,
                })
            }
        }
    }

    useEffect(() => {
        const chart = createChart(ref.current, {
            height: 440,
            layout: {
                textColor: theme === 'light' ? '#000' : 'white',
                background: { color: theme === 'light' ? '#ffffff' : 'hsl(240, 5%, 8%)'},
            },
            rightPriceScale: {
                minimumWidth: 45,
                borderVisible: false
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                shiftVisibleRangeOnNewBar: true,
                barSpacing:10,
                allowShiftVisibleRangeOnWhitespaceReplacement:true,
                uniformDistribution:true
            },
        });
        chart.timeScale().fitContent()
        prepareChart(chart, ws);
    }, [ticker,theme]);




    return (
        <div className="h-full w-full">
            <div
                className='sticky w-full capitalize top-16 px-4 py-1.5 rounded-lg border-border border-1 left-6 z-[30] bg-sidebar text-muted-foreground font-bold'>
                {ticker} ~ {type} ~ 1 ~ AragonTrade
            </div>
            <div ref={ref} className='relative'>

            </div>

        </div>
    );
};

export default ChartMobile;