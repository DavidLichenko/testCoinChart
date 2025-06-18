"use client"
import React, { useEffect, useRef, useState } from "react";
import { createChart, WatermarkOptions } from "lightweight-charts";
import {GetStockData, GetWebSocketStockData} from "@/actions/form";
import {Ping} from "@uiball/loaders";
import { useTheme } from 'next-themes'
import {Skeleton} from "@/components/ui/skeleton";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";


const Chart = ({ticker,tickerType,sendCurrentPrice,OpenIn,CloseIn,addTPPriceLine,addSLPriceLine, currentHeight, tickerName}) => {
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
        `wss://stream.binance.com:9443/ws/${ticker}T@kline_1m`
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

//https://web-production-2d590.up.railway.app
        if (tickerType === "S") {
            const fetchTest = async () => {
                try {
                    const response = await fetch(`https://web-production-2d590.up.railway.app/api/stocks/${ticker}/candlesticks/`, {
                        method:'GET',
                        headers: {
                            'Content-Type': 'application/json', // Specify the content type
                        },
                    });
                    const json = await response.json();
                    const filledCandles = connectCandles(json.data);
                    let jsonArr = filledCandles.sort((a, b) => a.time - b.time);
                    sendCurrentPrice(jsonArr[jsonArr.length - 1].close)
                    // console.log(jsonArr)
                    candlestickSeries.setData(jsonArr);
                } catch (error) {
                    console.error("Error fetching todos:", error);
                }
            }
            fetchTest()
        }
        if (tickerType == 'C') {
            fetch(
                `https://api.binance.com/api/v3/klines?symbol=${ticker.toUpperCase()}T&interval=1m&limit=1000`
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
                        return {
                            time: Date.parse(d.date) / 1000,
                            open: parseFloat(d.open),
                            high: parseFloat(d.high),
                            low: parseFloat(d.low),
                            close: parseFloat(d.close),
                        };
                    });

                    sendCurrentPrice(parseFloat(cdata[cdata.length-1].close))
                    setCurrentPrice(parseFloat(cdata[cdata.length-1].close))
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
            prepareChart(chart, ws);
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
            ws.close()
        }
    }, [ticker,currentHeight,theme]);

    return (
        <>
            {currentHeight ?
                <>
                    <Card className="h-full border-0 rounded-none">
                        <CardHeader className="pb-2 px-4 py-2 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-lg capitalize">{tickerName}</h3>
                                    <Badge variant="outline" className="text-xs">
                                        AragonTrade
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">${currentPrice.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 h-full">
                            <div ref={ref} className="h-full w-full" />
                        </CardContent>
                    </Card>

                </>
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
