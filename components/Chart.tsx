import React, { useEffect, useRef, useState } from "react";
import { createChart, WatermarkOptions } from "lightweight-charts";
import {socket} from "@/app/socket";
import {GetStockData, GetWebSocketStockData} from "@/actions/form";
import {Ping} from "@uiball/loaders";
import { useTheme } from 'next-themes'
import {Skeleton} from "@/components/ui/skeleton";

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
    const [OpenInLinePrice,setOpenInLinePrice] = useState(0)
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
    const sockets = [];

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
    function handler(params,chart) {
        const line = params.customPriceLine;
        console.log('CLICK')
        console.log(line)
    }
    // console.log(ref.current.parentElement)
    const prepareChart = (chart, ws) => {
        const series = chart.addLineSeries({
            color: '#2962FF',
            lineWidth: 2,

        });
        chart.subscribeClick(handler)
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
        if (!ticker.includes("USD")) {
            fetch(
                `https://api.binance.com/api/v3/klines?symbol=${ticker.toUpperCase()}&interval=1m&limit=1000`
            )
                .then((res) => res.json())
                .then((data) => {
                    const cdata = data.map((d) => {
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
        if (tickerType == 'Stocks') {
            StocksChart()
            TickerStock()
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
                textColor: theme === 'light' ? 'black' : 'white',
                background: { color: theme === 'light' ? '#ffffff' : '#fff'},
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });


        // setCurrentChart(chart)
        chart.timeScale().fitContent()

        if (!ticker.includes("USD")) {
            prepareChart(chart, ws);
            chart.applyOptions({
                layout: {
                    textColor: theme === 'light' ? '#000' : 'white',
                    background: { color: theme === 'light' ? '#ffffff' : 'hsl(224 71.4% 4.1%)'},
                },
            })
        } else {
            prepareChart(chart, socket);
            chart.applyOptions({
                layout: {
                    textColor: theme === 'light' ? 'black' : 'white',
                    background: { color: theme === 'light' ? '#ffffff' : '#fff'},
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
            socket.close()
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
