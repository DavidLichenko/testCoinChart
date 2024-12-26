'use client'

import React, { useState, useEffect } from "react";
import Highcharts from 'highcharts/highstock'
import HighchartsExporting from 'highcharts/modules/exporting'
import HighchartsReact from 'highcharts-react-official'
import Indicators from "highcharts/indicators/indicators-all.js";
import DragPanes from "highcharts/modules/drag-panes.js";
import AnnotationsAdvanced from "highcharts/modules/annotations-advanced.js";
import PriceIndicator from "highcharts/modules/price-indicator.js";
import FullScreen from "highcharts/modules/full-screen.js";
import BrandDark from 'highcharts/themes/brand-dark';
import StockTools from "highcharts/modules/stock-tools.js";
import "./index.css";
import {Skeleton} from "@/components/ui/skeleton";
import {socket} from "@/app/socket";


if (typeof Highcharts === 'object') {
    HighchartsExporting(Highcharts)
}
Indicators(Highcharts);
DragPanes(Highcharts);
AnnotationsAdvanced(Highcharts);
PriceIndicator(Highcharts);
FullScreen(Highcharts);
StockTools(Highcharts);
BrandDark(Highcharts);


const ChartElement = ({chartData, ticker}) => {
    const [appState, setAppState] = useState({
        loading: true,
        data: chartData,
    });
    // const [data,setData] = useState([]);
    const [fetchPoint,setFetchPoint] = useState([])
    useEffect(() => {
        var data1 = []
        chartData.map((item)=>{
                data1.push([Date.parse(item.datetime), parseFloat(item.open), parseFloat(item.high), parseFloat(item.low), parseFloat(item.close)]);
                // setData(data.push([Date.parse(item.datetime), parseFloat(item.open), parseFloat(item.high), parseFloat(item.low), parseFloat(item.close)]))
            })

            setAppState({loading: false, data: data1.reverse()})
        // setData(data1.reverse())
        if(!socket.active) {
            // socket.connect()
        }
        // socket.on('channel2', (foo) => {
            // setFetchPoint(foo)
            // series.setData(...data.reverse(), foo)
            // appState.data.push(...appState.data,foo)
            // setAppState({loading:false,data:[...data1.reverse(),foo]})
        // });


        return;
    }, [setAppState,chartData]);

    // console.log(fetchPoint)

    const options = {
        chart: {
            theme:'dark',
            backgroundColor:'',
            animation: true,
            height:'60%',
        },
        title: {
            text: `${ticker}`
        },
        xAxis: {
            overscroll: 500000,
            range: 4 * 200000,

            minorTickInterval: 1,
            gridLineWidth: 1
        },
        plotOptions: {
            candlestick: {
                color: 'pink',
                lineColor: 'red',
                upColor: 'lightgreen',
                upLineColor: 'green',
            }
        },
        rangeSelector: {
            buttons: [{
                type: 'minute',
                count: 15,
                text: '15m'
            }, {
                type: 'hour',
                count: 1,
                text: '1h'
            }, {
                type: 'all',
                count: 1,
                text: 'All'
            }],
            selected: 1,
            inputEnabled: false
        },
        series: [
            {
                type: "candlestick",
                name: `${ticker}`,
                data: appState.data,
            }
        ]
    };
    // const RenderChart = () => {
    //     return (
    //
    //     )
    // }

    return (
        <div className='w-full h-full basis-full grow'>
            <HighchartsReact
                highcharts={Highcharts}
                constructorType={"stockChart"}
                options={options}
                updateArgs={[true]}
            />
        </div>
    );
};

export default ChartElement;