import React, { useEffect, useRef, useState } from "react";
import { createChart, WatermarkOptions } from "lightweight-charts";
import {socket} from "@/app/socket";
import {GetStockData, GetWebSocketStockData} from "@/actions/form";
import {Ping} from "@uiball/loaders";
import { useTheme } from 'next-themes'
import {Skeleton} from "@/components/ui/skeleton";
import $ from 'jquery';
import yahooFinance from 'yahoo-finance2';
import axios  from "axios";

const Chart = ({ticker,tickerType,sendCurrentPrice,OpenIn,CloseIn,addTPPriceLine,addSLPriceLine, currentHeight}) => {
    const ref = useRef();
    const [chartHeight, setChartHeight] = useState(0);
    const [currentPrice,setCurrentPrice] = useState(0.000)
    const [currentChart,setCurrentChart] = useState(0)
    const { theme, setTheme } = useTheme()
    const [TPLine,setTPLine] = useState(false)
    const [SLLine,setSLLine] = useState(false)
    const [SLLinePrice,setSLLinePrice] = useState(0)
    const [TPLinePrice,setTPLinePrice] = useState(0)
    const [OpenInLine,setOpenInLine] = useState(false)
    const [candlesticks, setCandlesticks] = useState([]);
    const [OpenInLinePrice,setOpenInLinePrice] = useState(0)
    const [eventSource,setEventSource] = useState<EventSource>();
    const chartProperties = {
        height: currentHeight,
        autosize:true,
        layout: {
            textColor: theme === 'light' ? 'black' : 'white',
            background: { color: theme === 'light' ? '#ffffff' : '#fff'},
        },

        backgroundColor:'white',
        disabled_features: ['widget_logo'],
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
    };

    const [prevTicket, setPrevTicket] = useState('');
    // const [chartData, setChartData] = useState([]);
    const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${ticker}@kline_1m`
    );


    // const wSocket = new WebSocket(`ws://127.0.0.1:8000/api/stocks/${ticker}/ws`);


    const postData = data => {
        return fetch('http://localhost:8080/stocks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json()) // parses JSON response into native JavaScript objects
    }

    const sockets = [];
    async function ForexCh({chart}) {
        const candlestickSeries = chart.addCandlestickSeries();
        fetch(
            `https://marketdata.tradermade.com/api/v1/timeseries?currency=EURUSD&api_key=FvZ0U8fmsqsqsH95WU3b&start_date=2024-4-10&format=records`
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


                candlestickSeries.setData(cdata);
            })
            .catch((err) => console.log(err));
    }
    async function ForexChart({chart}) {
        const candlestickSeries = chart.addCandlestickSeries();
        fetch(
            `https://marketdata.tradermade.com/api/v1/timeseries?currency=EURUSD&api_key=FvZ0U8fmsqsqsH95WU3b&start_date=2024-4-10&format=records`
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


                candlestickSeries.setData(cdata);
            })
            .catch((err) => console.log(err));
        socket.on('channel2', (foo) => {
            // console.log(JSON.parse(foo))
            const forexArr = foo
            const datArr = []
            datArr.push(forexArr)
            const interval = 60; // 1 minute interval
            let ohlcData = {
                timestamp: undefined,
                low: undefined,
                high: undefined,
                close: undefined
            };
            const ohlcArr = []
            for (const data of datArr) {
                // const dataToObj = JSON.parse(data)
                const timestamp = Date.parse(data[2]) / 1000;
                const roundedTimestamp = Math.floor((timestamp + (5 * 3600) + (30 * 60)) / interval) * interval;
                if (ohlcArr[roundedTimestamp] == ohlcData.timestamp) {
                    ohlcArr[roundedTimestamp] = {
                        timestamp: roundedTimestamp + (5 * 3600) + (30 * 60), // Corrected timestamp
                        low: data[4],
                        high: data[4],
                        open: data[4],
                        close: data[4]
                    }
                } else {
                    ohlcData.timestamp = ohlcArr[roundedTimestamp].timestamp
                    ohlcData.low = Math.min(ohlcArr[roundedTimestamp].low, data[4]);
                    ohlcData.high = Math.max(ohlcArr[roundedTimestamp].high, data[4]);
                    ohlcData.close = data[4];
                }
            }

            return ohlcArr
        });
    }
    // function handler(params,chart) {
    //     const line = params.customPriceLine;
    // }
    // console.log(ref.current.parentElement)
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
                background: {color: '#030712'},
                textColor: '#DDD',
            },
            grid: {
                vertLines: {color: '#444'},
                horzLines: {color: '#444'},
            },
        });
        const StocksChart = async() => {
            const result = await GetStockData(ticker)
            // console.log(result)
            const cdata = result.quotes.map((item) => {
                return {
                    time: Date.parse(item.date) / 1000,
                    open: parseFloat(item.open),
                    high: parseFloat(item.high),
                    low: parseFloat(item.low),
                    close: parseFloat(item.close),
                }
            })
            candlestickSeries.setData(cdata);
        }
        const TickerStock = async() => {
            const result = await GetWebSocketStockData(ticker)
            console.log(result)
        }
        function smoothCandles(data) {
            const smoothedData = [];
            const oneDay = 24 * 60 * 60; // Seconds in a day

            for (let i = 0; i < data.length; i++) {
                const current = data[i];
                const currentTimestamp = Date.parse(current.date) / 1000;
                smoothedData.push({
                    ...current,
                    time: currentTimestamp, // Convert date to timestamp
                });

                if (i < data.length - 1) {
                    const next = data[i + 1];
                    const nextTimestamp = Date.parse(next.date) / 1000;
                    const daysGap = (nextTimestamp - currentTimestamp) / oneDay;

                    // If there's a gap, smooth it
                    if (daysGap > 1) {
                        for (let j = 1; j < daysGap; j++) {
                            const factor = j / daysGap; // Interpolation factor (0 < factor < 1)

                            smoothedData.push({
                                time: currentTimestamp + j * oneDay,
                                open: current.close + factor * (next.open - current.close),
                                close: current.close + factor * (next.close - current.close),
                                high: Math.max(
                                    current.high,
                                    current.close + factor * (next.high - current.close)
                                ),
                                low: Math.min(
                                    current.low,
                                    current.close + factor * (next.low - current.close)
                                ),
                                volume: Math.round(current.volume * (1 - factor) + next.volume * factor),
                            });
                        }
                    }
                }
            }

            return smoothedData;
        }
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

// Example usage

        if (tickerType === "S") {
            const getStockData = async() => {
                postData({data: {
                        ticker:ticker
                    }})
                    .then(json => {
                        const filledCandles = connectCandles(json.quotes);
                        candlestickSeries.setData(filledCandles);
                    })
                    .catch(e => console.log(e));
            }
            // getStockData()
            const fetchTodos = async () => {
                try {
                    const response = await fetch(`http://195.200.15.182:8000/candlesticks`);
                    const todos = await response.json();
                    console.log(todos)
                    const filledCandles = connectCandles(todos);
                    candlestickSeries.setData(filledCandles);
                } catch (error) {
                    console.error("Error fetching todos:", error);
                }
            }
            // fetchTodos()
            const fetchTest = async () => {
                try {
                    const response = await axios.get(`http://195.200.15.182:8000/api/stocks/${ticker}/candlesticks`).then(json => {
                    const filledCandles = connectCandles(json);
                    candlestickSeries.setData(filledCandles);
                    });
                } catch (error) {
                    console.error("Error fetching todos:", error);
                }
            }
            fetchTest()
            const fetchRealTimeCandle = async (symbol) => {
                const response = await fetch(
                    `http://195.200.15.182:8000/api/stocks/${symbol}/latest-candle`
                );
                const jsonO = await response.json();
                console.log('RES')
                return jsonO;
            };
            //
            // const interval = setInterval(async () => {
            //     console.log('INTERVAL')
            //     try {
            //         const realTimeCandle = await fetchRealTimeCandle(ticker);
            //         setCandlesticks((prev) => {
            //             if (!prev.length) return [realTimeCandle];
            //             const lastCandle = prev[prev.length - 1];
            //
            //             // Check if the new candle is part of the same timeframe
            //             if (new Date(realTimeCandle.time) > new Date(lastCandle.time)) {
            //                 return [...prev, realTimeCandle]; // Add new candle
            //             } else {
            //                 // Update the last candle
            //                 const updatedCandles = [...prev];
            //                 updatedCandles[updatedCandles.length - 1] = realTimeCandle;
            //                 return updatedCandles;
            //             }
            //         });
            //         candlestickSeries.update(candlesticks)
            //     } catch (error) {
            //         console.error("Error fetching real-time candle:", error);
            //         clearInterval(interval);
            //     }
            // }, 5000); // Poll every 5 seconds
            // var prevTicker = ticker;
            //
            // if (ticker !== prevTicker) {
            //     clearInterval(interval);
            //     prevTicker = ticker;
            // }


        }
        if (tickerType == 'C') {
            fetch(
                `https://api.binance.com/api/v3/klines?symbol=${ticker.toUpperCase()}&interval=1m&limit=1000`
            )
                .then((res) => res.json())
                .then((data) => {
                    const cdata = data.map((d) => {
                        setCurrentPrice(parseFloat(d[4]))
                        sendCurrentPrice(parseFloat(d[4]))
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
                setPrevTicket(responseObject.s)
                const {t, o, h, l, c} = responseObject.k;
                setCurrentPrice(parseFloat(c))
                sendCurrentPrice(parseFloat(c))
                const kData = {
                    time: t,
                    open: parseFloat(o),
                    high: parseFloat(h),
                    low: parseFloat(l),
                    close: parseFloat(c),
                };

                candlestickSeries.update(kData);
            };
        }
        if (tickerType == 'F') {
            const candlestickSeries = chart.addCandlestickSeries();
            fetch(
                `https://marketdata.tradermade.com/api/v1/timeseries?currency=${ticker}&api_key=FvZ0U8fmsqsqsH95WU3b&start_date=2024-4-10&format=records`
            )
                .then((res) => res.json())
                .then((data) => {
                    // const timestamp = data.date_time.split('-')[0]
                    // console.log(data)
                    const cdata = data.quotes.map((d) => {
                        setCurrentPrice(parseFloat(d.close))
                        sendCurrentPrice(parseFloat(d.close))
                        return {
                            time: Date.parse(d.date) / 1000,
                            open: parseFloat(d.open),
                            high: parseFloat(d.high),
                            low: parseFloat(d.low),
                            close: parseFloat(d.close),
                        };
                    });


                    candlestickSeries.setData(cdata);
                })
                .catch((err) => console.log(err));
            socket.on('channel2', (foo) => {
                const responseObject = foo;
                const {TIME, OPEN, HIGH, LOW, CLOSE} = responseObject.OHLC[0];
                setCurrentPrice(parseFloat(CLOSE))
                sendCurrentPrice(parseFloat(CLOSE))
                const kData = {
                    time: Date.parse(TIME),
                    open:  parseFloat(OPEN),
                    high: parseFloat(HIGH),
                    low: parseFloat(LOW),
                    close: parseFloat(CLOSE),
                };
                candlestickSeries.update(kData);

            });

            // StocksChart()
            // TickerStock()

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
            // console.log(TPLinePrice)
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
            // console.log(currentChart)
        }
    }
    if(OpenIn) {
        if(!OpenInLine) {
            // @ts-ignore
            const priceLine = currentChart.createPriceLine({price:parseFloat(OpenIn), color:'rgb(64,99,211)'})
            setOpenInLine(true)
            setOpenInLinePrice(priceLine)
        }
        if(OpenInLinePrice !== 0) {
            // @ts-ignore
            OpenInLinePrice.applyOptions({
                price: OpenIn,
            })
        }
    }
    useEffect(() => {
        if(!currentHeight) {
            return;
        }
        if(prevTicket !== ticker.toUpperCase()) {
            setPrevTicket(ticker)
        }
        // if (ref.current) {
        //     setChartHeight(ref.current.parentElement.offsetHeight);
        // }
        const chart = createChart(ref.current, {
            height: currentHeight,
            layout: {
                textColor: theme === 'light' ? '#000' : 'white',
                background: { color: theme === 'light' ? '#ffffff' : 'hsl(224 71.4% 4.1%)'},
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


        // setCurrentChart(chart)
        chart.timeScale().fitContent()

        if (tickerType === 'C') {
            prepareChart(chart, ws);
            chart.applyOptions({
                layout: {
                    textColor: theme === 'light' ? '#000' : 'white',
                    background: { color: theme === 'light' ? '#ffffff' : 'hsl(224 71.4% 4.1%)'},
                },
            })
        }
        if(tickerType === 'Forex' || tickerType === 'F') {
            prepareChart(chart, socket);
            chart.applyOptions({
                layout: {
                    textColor: theme === 'light' ? '#000' : 'white',
                    background: { color: theme === 'light' ? '#ffffff' : 'hsl(224 71.4% 4.1%)'},
                },
            })
        }
        if(tickerType === 'Stocks' || tickerType === 'S') {
            prepareChart(chart, ws);
            chart.applyOptions({
                layout: {
                    textColor: theme === 'light' ? '#000' : 'white',
                    background: { color: theme === 'light' ? '#ffffff' : 'hsl(224 71.4% 4.1%)'},
                },
            })
        }

        if (ticker) {
            // @ts-ignore
            if (ref.current.children.length > 1) {
                // @ts-ignore
                ref.current.removeChild(ref.current.children[0])
            }
        }

        return ()=>{
            socket.disconnect()
            ws.close()
        }
    }, [ticker,currentHeight,theme]);

    return (
        <>
            {currentHeight ?
                <div ref={ref} className='relative'>
                    <div
                        className='absolute capitalize top-5 pl-6 pr-12 py-1.5 border-border border-1 left-6 z-50 text-muted-foreground font-bold'>
                        {ticker} ~ 1 ~ AragonTrade
                    </div>
                </div>
                :
                <Skeleton
                    className='w-full h-[750px]  border-2  bg-background flex items-center justify-center basis-full grow'>
                    <span className=''><Ping speed={1.8} size={64} color={'gray'}/></span>
                </Skeleton>
            }
        </>
    );
};

export default Chart;
