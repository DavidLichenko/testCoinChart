
"use client"
import React, {useCallback, useEffect, useRef, useState} from 'react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import {Skeleton} from "@/components/ui/skeleton";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import Page from '@/app/page'
import {
    CreateTradeTransaction, GetCurrentUser,
    getSearchData,
    GetTradeTransaction, GetUserBalance, UpdateTradeTransaction, UpdateUserBalance
} from "@/actions/form";
import page from "@/app/page";
import useWebSocket from "socket.io-client";
import ChartElement from "@/components/chartElement";
import Graph from "@/components/chartElement";
import Logo from "@/components/Logo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import {Button, Input, Slider, Popover, PopoverTrigger, PopoverContent, Select, SelectItem} from "@nextui-org/react";
import { useRouter } from 'next/navigation'
import Image from "next/image";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

import NavContainer from "@/components/NavContainer";
import {Ping} from "@uiball/loaders";
import HistoryTable from "@/components/HistoryTable";
import {GearIcon} from "@radix-ui/react-icons";
import ModalAccount from "@/components/ModalAccount";
import Chart from "@/components/Chart";
import {IoMdCash} from "react-icons/io";
import {MdArrowDownward, MdArrowUpward} from "react-icons/md";
import {socket} from "@/app/socket";
import {Checkbox} from "@nextui-org/checkbox";
import {formSchemaType} from "@/schemas/form";
import {toast} from "@/components/ui/use-toast";
import {getServerSession} from "next-auth";
import { authOptions } from "@/lib/auth";

import { getSession } from 'next-auth/react'
import { UserSettingsModal } from '@/components/user-settings-modal';
import Link from "next/link";
import {BiSolidCabinet} from "react-icons/bi";


function Trade () {

    const [loading,setLoading] = useState(false);
    // const [isConnected, setIsConnected] = useState(socket.connected);
    const [price, setPrice] = useState('');
    const [input,setInput] = useState("");
    const [searchData, setSearchData] = useState([])
    const [chartData, setChartData] = useState([])
    const [loadingData,setLoadingData] = useState(false)
    const [loadingChartData,setLoadingChartData] = useState(true)
    const [ticker, setTicker] = useState("btcusdt");
    const [tickerType, setTickerType] = useState("Crypto");
    const [tickerData,setTickerData] = useState([])
    const [count,setCount] = useState(0);
    const [session,setSession] = useState(null)
    const [userImage,setUserImage] = useState<any>('')
    const [showAccountModal, setShowAccountModal] = useState<boolean>(false)
    const [sliderValue,setSliderValue] = useState(0)
    const [selectTicker,setSelectTicker] = useState(false)
    const [leverage, setLeverage] = React.useState(100);
    const [currentPrice,setCurrentPrice] = useState(0.000)
    const [volume, setVolume] = useState(0.01)
    const [userBalance,setUserBalance] = useState(0.000)
    const [margin,setMargin] = useState<number>(0.00)
    const [openIn,setOpenIn] = useState(0.000)
    const [closeIn,setCloseIn] = useState(0.000)
    const [profit,setProfit] = useState(0.000)
    const [TPPrice,setTPPrice] = useState(0)
    const [SLPrice,setSLPrice] = useState(0)
    const [typeTrade,setTypeTrade] = useState("BUY")
    const [selectOrderTable,setSelectOrderTable] = useState(0)
    const [counter,setCounter] = useState(0)
    const [orderClose,setOrderClose] = useState({})
    const [user,setUser] = useState(null)
    const [currentUser,setCurrentUser] = useState({})
    const [userRole,setUserRole] = useState('USER')
    const [chartHeight,setChartHeight] = useState(0)
    // const chartHeightDiv = useRef(null)
    const chartHeightDiv = useCallback(node => {
        if (node !== null) {
            setChartHeight(node.getBoundingClientRect().height);
        }
    }, []);
    async function currentSeesion() {
        const session = await getSession()
        if(!user) {
            setUser(session.user)
            setSession(session)
            setCurrentUser(await GetCurrentUser())
            setLoading(true)
        }
        setLoading(false)
    }

    const postData = data => {
        return fetch('http://localhost:8080/trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json()) // parses JSON response into native JavaScript objects
    }


    const router = useRouter()
    useEffect(() => {
        currentSeesion()
        if(session) {
            setLoading(false)
        }
        if (!currentUser) {
            router.push('/welcome')
        }
        GetBalance()
        setLoadingChartData(false);
        calculateMargin(volume,currentPrice,leverage)

        if (ticker) {
            updateTickerData(ticker)
        }

        setProfit(calculateProfitLoss(volume,openIn,currentPrice))

        return;
    },[ticker,volume,currentPrice,openIn,leverage])


    const selectedTicker = (ticker) => {
        setTicker(ticker)
        setInput('');
        setSearchData([]);
    }

    const AccountImage = ({width,height}) => {
        return (
            <>
                {
                    userImage !== ''
                        ? <Image src={userImage} alt='user' className='rounded-full' width={width} height={height}/>
                        : <div className="flex items-center justify-center rounded-full w-[32px] h-[32px] text-md bg-secondary border-1 border-border">{''}</div>
                }

            </>
        )
    }

    const SearchResults = ({ results }) => {
        return (
            <>
                {results.map((item,index)=>{
                    return(
                        <li key={index} className={`bg-secondary text-primary text-md dark:hover:bg-gray-700 light:hover:bg-secondary-100 hover:cursor-pointer`} onClick={() => {
                            selectedTicker(item.symbol)
                        }}>
                            {item.symbol}
                            <p className='text-muted-foreground text-sm'>{item.exchange}</p>
                        </li>
                    )
                })}
            </>
        )
    }
    const ref = useRef<HTMLDivElement | null>(null);
    const trySearchServer = (input) => {
        setLoadingData(true);
        postData({data: {
                input:input
            }})
            .then(json => {
                setSearchData(json.data)
                setLoadingData(false);
            })
            .catch(e => console.log(e));
    }

    const updateTickerData = async(ticker) => {
        // setLoadingChartData(true);
        postData({data: {
                ticker:ticker
            }})
            .then(json => {
                // setLoadingChartData(false);
                // setChartData(json.values)
                // console.log(json)
            })
            .catch(e => console.log(e));

    }
    const GetBalance = async() => {

        try {
            const getBalance = await GetUserBalance()
            // console.log(getBalance)
            setUserBalance(getBalance.usd)
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong, please try again later",
                variant: "destructive"
            })
        }
    }
    const createTransBuy = async(type) => {
        if (margin > userBalance) {
            toast({
                title: "Error",
                description: "Your balance is not enough to open an order!" +
                    "Lower the volume",
                variant: "destructive"
            })
            return
        }
        try {
            CreateTradeTransaction('OPEN',type,TPPrice !== 0 ? TPPrice : null, null, ticker, leverage, currentPrice,null,SLPrice !== 0 ? SLPrice : null, parseFloat(String(volume)))
            await getTradeTrans()
            setCounter(counter + 1)
            toast({
                title: "Success",
                description: "Order has been placed!",

            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong, please try again later",
                variant: "destructive"
            })
        }
    }
    const getTradeTrans = async() => {
        try {
            const trans = await GetTradeTransaction(ticker)
            //@ts-ignore
            setOpenIn(trans.openIn)

        } catch (error) {
            console.log(error)
        }
    }

    const dataFromChild = (ticker,isClick,tickerType) => {
        setTicker(ticker)
        setTickerType(tickerType)
        setSelectTicker(isClick)
    }
    const currentPriceFromChart = (currentPrice) => {
        setCurrentPrice(currentPrice)
    }
    const selectOrderFromTable = (row) => {
        setSelectOrderTable(row)
        setOpenIn(row.openIn)
        setTPPrice(row.takeProfit)
        setSLPrice(row.stopLoss)
    }
    const selectCloseOrderFromTable = async (row) => {

        try {
            if (row.type === "BUY") {
                const profit = calculateProfitLossBUY(parseFloat(row.volume),parseFloat(row.openIn),currentPrice)
                await UpdateTradeTransaction(currentPrice, profit, row.id)
                await UpdateUserBalance(userBalance + parseFloat(profit))
                setCounter(counter + 1)
            }
            if (row.type === "SELL") {
                const profit = calculateProfitLossSELL(parseFloat(row.volume),parseFloat(row.openIn),currentPrice)
                await UpdateTradeTransaction(currentPrice, profit, row.id)
                await UpdateUserBalance(userBalance + parseFloat(profit))
                setCounter(counter + 1)

            }
        } catch (error) {
            console.log(error)
        }
        // setOrderClose(row)
    }
    // console.log(orderClose)
    const volumeChange = (event) => {
        var rgx = /^[0-9]*\.?[0-9]*$/;
        if(event.target.value.match(rgx)) {
            if(event.target.value.charAt(event.target.value.length-1) !== '.') {
                setMargin(volume * currentPrice)
            }
        }
    }
    function calculateMargin(volumeEUR, marketPrice, leverage) {
        const margin = (volumeEUR * marketPrice) / leverage;
        setMargin(margin)
        // return margin;
    }
    function calculateProfitLoss(volume, entryPrice, exitPrice) {
        const priceDifference = exitPrice - entryPrice;
        const profitLoss = (volume * priceDifference) / leverage ;
        return profitLoss;
    }
    function calculateProfitLossBUY(volumeEUR, entryPrice, exitPrice) {
        const priceDifference = exitPrice - entryPrice;
        const profitLoss = (volumeEUR * priceDifference);
        return profitLoss.toFixed(2);

    }
    function calculateProfitLossSELL(volumeEUR, entryPrice, exitPrice) {
        const priceDifference =  entryPrice - exitPrice;
        const profitLoss = (volumeEUR * priceDifference) ;
        return profitLoss.toFixed(2);

    }
    // @ts-ignore

    return (

        <div className="w-full h-screen">
            {loading && (
                <Skeleton className='h-screen w-full'>
                    <span className="h-screen w-full opacity-0">0</span>
                </Skeleton>
            )}
            {!loading &&

                <div className="w-full  flex flex-col gap-4 h-full">

                    <div className="flex flex-col h-full w-full gap-4">
                        <nav
                            className="flex justify-between items-center border-b border-border h-16 z-20 bg-background px-8 py-2">
                            <div className="flex gap-4 items-center ">
                                <Logo/>

                            </div>
                            <div className="flex gap-4 items-center">
                                {
                                    //@ts-ignore
                                    currentUser.role !== 'USER' ?
                                        //@ts-ignore
                                        currentUser.role  !== undefined && <div>
                                    <Button disableRipple={true} variant={'bordered'} title={'Deposit'} radius={'none'}
                                            size={'md'} startContent={<BiSolidCabinet/>}
                                            className='text-lg font-bold px-6'> <Link href={'/admin_panel'}>Admin
                                        Panel</Link></Button>
                                    </div> : ''
                                }

                                <div>
                                    <Button disableRipple={true} variant={'bordered'} title={'Deposit'} radius={'none'}
                                            size={'md'} startContent={<IoMdCash/>}
                                            className='text-lg font-bold px-6'>Deposit</Button>
                                </div>
                                <div>
                                    <Button disableRipple={true} variant={'bordered'} radius={'none'} content={'asdasd'} size={'md'} className='text-lg font-bold pl-6 pr-3'>
                                        <div className='flex flex-col'>
                                            <div className='flex flex-row items-center justify-between w-full'>
                                                {userBalance ?
                                                    <span className={'text-md mr-8'}>$ {userBalance}</span>  :
                                                    <span className={'text-md mr-8'}>$0.00</span>
                                                }
                                                <MdArrowDownward/>
                                            </div>
                                        </div>
                                    </Button>
                                </div>
                                {/*<div>*/}
                                {/*    <AccountImage width={32} height={32} />*/}
                                {/*</div>*/}

                                <UserSettingsModal />

                                <ThemeSwitcher/>
                            </div>

                        </nav>
                        <div className="w-full h-full mx-auto relative flex items-stretch justify-center">
                            {/*<ModalAccount show={showAccountModal} accountImg={<AccountImage width={64} height={64}/>}/>*/}
                            <div className="nav">
                                <div className='flex flex-col gap-y-1 w-full h-full justify-center items-center'>
                                    <NavContainer sendDataToParent={dataFromChild}/>
                                </div>
                            </div>
                            <div className='flex flex-col gap-3 mr-3  w-full h-full items-center justify-center'>
                                <div className="flex flex-rowborder-border gap-4 w-full h-full items-center justify-center">
                                    {!loadingChartData
                                        ?
                                        // <ChartElement chartData={chartData} ticker={ticker}/>
                                        <div ref={chartHeightDiv} className="basis-full h-[70vh] bg-secondary z-50" id={'Chart'}>
                                            <Chart ticker={ticker} tickerType={tickerType[0]} sendCurrentPrice={currentPriceFromChart} OpenIn={openIn} CloseIn={closeIn} addTPPriceLine={TPPrice} addSLPriceLine={SLPrice} currentHeight={chartHeight}/>
                                        </div>
                                        : <Skeleton
                                            className='w-full h-[750px]  border-2  bg-background flex items-center justify-center basis-full grow'>
                                            <span className=''><Ping speed={1.8} size={64} color={'gray'}/></span>
                                        </Skeleton>
                                    }
                                    {/*<span className="my-5">{currentPrice}</span>*/}
                                    <Tabs  defaultValue="BUY" className="h-full flex flex-col p-6 basis-1/4">
                                        <TabsList  className="grid w-full grid-cols-2 mb-5" >
                                            <TabsTrigger className={'data-[state=active]:bg-green-400 dark:data-[state=active]:bg-green-700 '} value="BUY">BUY</TabsTrigger>
                                            <TabsTrigger  className={'data-[state=active]:bg-orange-400 dark:data-[state=active]:bg-orange-700'} value="SELL">SELL</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value={'BUY'} className={"active:bg-red"}>
                                            <div
                                                className="flex p-6  flex-col  border-2 relative items-center h-full justify-start">
                                                <Input
                                                    label="Volume"
                                                    radius='none'
                                                    variant='bordered'
                                                    placeholder="0.00"
                                                    // @ts-ignore
                                                    value={volume}
                                                    // @ts-ignore
                                                    onValueChange={setVolume}
                                                    startContent={
                                                        <div className="pointer-events-none flex items-center">
                                                            <span className="text-default-400 text-small">$</span>
                                                        </div>
                                                    }
                                                />
                                                <div className="float-right text-small">Est. margin:
                                                    ${
                                                        // @ts-ignore
                                                    (parseFloat(margin)).toFixed(2)}</div>
                                                {/*<Slider*/}
                                                {/*    onWheel={(el) => {*/}
                                                {/*        if (el.nativeEvent.wheelDeltaY > 0 && sliderValue !== 100) {*/}
                                                {/*            setSliderValue(sliderValue + 5)*/}
                                                {/*        }*/}
                                                {/*        if (el.nativeEvent.wheelDeltaY < 0 && sliderValue !== 0) {*/}
                                                {/*            setSliderValue(sliderValue - 5)*/}
                                                {/*        }*/}

                                                {/*    }}*/}
                                                {/*    onChange={setSliderValue}*/}
                                                {/*    color="foreground"*/}
                                                {/*    size="sm"*/}
                                                {/*    step={5}*/}
                                                {/*    value={sliderValue}*/}
                                                {/*    marks={[*/}
                                                {/*        {*/}
                                                {/*            value: 20,*/}
                                                {/*            label: "20%",*/}
                                                {/*        },*/}
                                                {/*        {*/}
                                                {/*            value: 50,*/}
                                                {/*            label: "50%",*/}
                                                {/*        },*/}
                                                {/*        {*/}
                                                {/*            value: 80,*/}
                                                {/*            label: "80%",*/}
                                                {/*        },*/}
                                                {/*    ]}*/}
                                                {/*    defaultValue={0}*/}
                                                {/*    showTooltip={true}*/}
                                                {/*    className="max-w-md mt-5"*/}
                                                {/*/>*/}
                                                <Select label={`Leverage 1:` + leverage} defaultSelectedKeys={['100']}
                                                        value={100}  variant={'bordered'} radius={'none'}
                                                        onChange={(e) => {
                                                            // @ts-ignore
                                                            setLeverage((e.target.value).toString());

                                                        }}
                                                        popoverProps={{
                                                            classNames: {
                                                                base: "before:bg-default-200 rounded-none",
                                                                content: "p-0 border-small rounded-none  border-divider bg-background",
                                                            },
                                                        }}
                                                        listboxProps={{
                                                            itemClasses: {
                                                                base: [
                                                                    "rounded-none",
                                                                    "text-default-500",
                                                                    "transition-opacity",
                                                                    "data-[hover=true]:text-foreground",
                                                                    "data-[hover=true]:bg-default-100",
                                                                    "dark:data-[hover=true]:bg-default-50",
                                                                    "data-[selectable=true]:focus:bg-default-50",
                                                                    "data-[pressed=true]:opacity-70",
                                                                    "data-[focus-visible=true]:ring-default-500",
                                                                ],
                                                            },
                                                        }}

                                                        size={'sm'} className={'mt-5 mb-2'}>
                                                    <SelectItem key={'10'} value={10}>1:10</SelectItem>
                                                    <SelectItem key={'20'} value={20}>1:20</SelectItem>
                                                    <SelectItem key={'30'} value={30}>1:30</SelectItem>
                                                    <SelectItem key={'100'} value={100}>1:100</SelectItem>

                                                </Select>

                                                <Accordion type="single" collapsible className="w-full px-2 my-2">
                                                    <AccordionItem value="item-1">
                                                        <AccordionTrigger>Advanced options</AccordionTrigger>
                                                        <AccordionContent>
                                                            <div
                                                                className="flex flex-col mx-auto align-start text-small text-default-700 font-light mt-5 justify-start items-center w-full border-border border-2 gap-2 p-4">
                                                                <div className={'flex flex-col'}>
                                                                    <div className="flex gap-4 items-start justify-between">
                                                                        <Input variant={'bordered'}
                                                                               radius={'none'}
                                                                            // color={'success'}
                                                                            // @ts-ignore
                                                                               value={TPPrice}
                                                                            // @ts-ignore
                                                                               placeholder={TPPrice}
                                                                               onClick={() => {
                                                                                   setTPPrice(currentPrice + (currentPrice / 1000) );
                                                                               }}
                                                                               onChange={(e) =>
                                                                                   // @ts-ignore
                                                                                   setTPPrice(e.target.value)}
                                                                               title={'Take Profit'}
                                                                               label="Take Profit"
                                                                               content={'Take Profit'}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className={'flex flex-col'}>
                                                                    <div className="flex gap-4 items-start justify-between">
                                                                        <Input variant={'bordered'}
                                                                               radius={'none'}
                                                                            // color={'danger'}
                                                                            // @ts-ignore
                                                                               value={SLPrice}
                                                                               onClick={() => {
                                                                                   setSLPrice(currentPrice - (currentPrice / 1000));
                                                                               }}
                                                                               onChange={(e) =>
                                                                                   // @ts-ignore
                                                                                   setSLPrice(e.target.value)}
                                                                               placeholder={'98200.00'}
                                                                               title={'Stop Loss'}
                                                                               label={'Stop Loss'}

                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                                <div className="flex flex-row w-full gap-1.5 pt-5">
                                                    {/*<Button*/}
                                                    {/*    onClick={() => {*/}
                                                    {/*        // CreateTestUser()*/}
                                                    {/*        // status,type,takeProfit,profit,ticker,leverage,openIn,closeIn,stopLoss,volume*/}
                                                    {/*        createTransBuy()*/}

                                                    {/*        // calculateProfitLoss*/}

                                                    {/*    }}*/}
                                                    {/*    disableRipple={true} radius='none' fullWidth={true}*/}
                                                    {/*    color='success' variant='solid'*/}
                                                    {/*    className={`py-5 text-xl text-bold px-10 bg-green-600 text-primary font-bold`}>*/}
                                                    {/*    Buy*/}
                                                    {/*</Button>*/}
                                                    {/*<Button disableRipple={true} onClick={() => {*/}
                                                    {/*    CreateTradeTransaction('OPEN', "SELL", null, null, ticker, leverage, currentPrice, null, null, volume)*/}
                                                    {/*    toast({*/}
                                                    {/*        title: "Success",*/}
                                                    {/*        description: "Order has been placed!",*/}

                                                    {/*    })*/}
                                                    {/*}} radius='none' fullWidth={true} color='danger' variant='solid'*/}
                                                    {/*        className={`py-5 text-xl text-bold px-10 bg-orange-600 text-primary font-bold`}>*/}
                                                    {/*    Sell*/}
                                                    {/*</Button>*/}
                                                    <Button disableRipple={true}

                                                            onClick={()=>{
                                                                createTransBuy('BUY')
                                                            }}
                                                            radius={'none'} variant={'ghost'} className={'text-md uppercase mx-auto'}>Place Buy Order</Button>

                                                </div>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value={'SELL'}>
                                            <div
                                                className="flex p-6  flex-col  border-2 relative items-center h-full justify-start">
                                                <Input
                                                    label="Volume"
                                                    radius='none'
                                                    variant='bordered'
                                                    placeholder="0.00"
                                                    // @ts-ignore
                                                    value={volume}
                                                    // @ts-ignore
                                                    onValueChange={setVolume}
                                                    startContent={
                                                        <div className="pointer-events-none flex items-center">
                                                            <span className="text-default-400 text-small">$</span>
                                                        </div>
                                                    }
                                                />
                                                <div className="float-right text-small">Est. margin:
                                                    ${

                                                        // @ts-ignore
                                                    (parseFloat(margin)).toFixed(2)}</div>
                                                {/*<Slider*/}
                                                {/*    onWheel={(el) => {*/}
                                                {/*        // @ts-ignore*/}
                                                {/*        if (el.nativeEvent.wheelDeltaY > 0 && sliderValue !== 100) {*/}
                                                {/*            setSliderValue(sliderValue + 5)*/}
                                                {/*        }*/}
                                                {/*        // @ts-ignore*/}
                                                {/*        if (el.nativeEvent.wheelDeltaY < 0 && sliderValue !== 0) {*/}
                                                {/*            setSliderValue(sliderValue - 5)*/}
                                                {/*        }*/}

                                                {/*    }}*/}
                                                {/*    onChange={setSliderValue}*/}
                                                {/*    color="foreground"*/}
                                                {/*    size="sm"*/}
                                                {/*    step={5}*/}
                                                {/*    value={sliderValue}*/}
                                                {/*    marks={[*/}
                                                {/*        {*/}
                                                {/*            value: 20,*/}
                                                {/*            label: "20%",*/}
                                                {/*        },*/}
                                                {/*        {*/}
                                                {/*            value: 50,*/}
                                                {/*            label: "50%",*/}
                                                {/*        },*/}
                                                {/*        {*/}
                                                {/*            value: 80,*/}
                                                {/*            label: "80%",*/}
                                                {/*        },*/}
                                                {/*    ]}*/}
                                                {/*    defaultValue={0}*/}
                                                {/*    showTooltip={true}*/}
                                                {/*    className="max-w-md mt-5"*/}
                                                {/*/>*/}
                                                <Select label={`Leverage 1:` + leverage} defaultSelectedKeys={['100']}
                                                        value={100} variant={'bordered'} radius={'none'}
                                                        onChange={(e) => {
                                                            // @ts-ignore
                                                            setLeverage((e.target.value).toString());

                                                        }}
                                                        popoverProps={{
                                                            classNames: {
                                                                base: "before:bg-default-200 rounded-none",
                                                                content: "p-0 border-small rounded-none  border-divider bg-background",
                                                            },
                                                        }}
                                                        listboxProps={{
                                                            itemClasses: {
                                                                base: [
                                                                    "rounded-none",
                                                                    "text-default-500",
                                                                    "transition-opacity",
                                                                    "data-[hover=true]:text-foreground",
                                                                    "data-[hover=true]:bg-default-100",
                                                                    "dark:data-[hover=true]:bg-default-50",
                                                                    "data-[selectable=true]:focus:bg-default-50",
                                                                    "data-[pressed=true]:opacity-70",
                                                                    "data-[focus-visible=true]:ring-default-500",
                                                                ],
                                                            },
                                                        }}

                                                        size={'sm'} className={'mt-5 mb-2'}>
                                                    <SelectItem key={'10'} value={10}>1:10</SelectItem>
                                                    <SelectItem key={'20'} value={20}>1:20</SelectItem>
                                                    <SelectItem key={'30'} value={30}>1:30</SelectItem>
                                                    <SelectItem key={'100'} value={100}>1:100</SelectItem>

                                                </Select>

                                                <Accordion  type="single" collapsible  className="w-full px-2 my-2">
                                                    <AccordionItem  value="item-1">
                                                        <AccordionTrigger>Advanced options</AccordionTrigger>
                                                        <AccordionContent>


                                                            <div
                                                                className="flex flex-col mx-auto align-start text-small text-default-700 font-light mt-5 justify-start items-center w-full border-border border-2 gap-2 p-4">
                                                                <div className={'flex flex-col'}>
                                                                    <div className="flex gap-4 items-start justify-between">
                                                                        <Input variant={'bordered'}
                                                                               radius={'none'}
                                                                            // color={'success'}
                                                                            // @ts-ignore
                                                                               value={TPPrice}
                                                                            // @ts-ignore
                                                                               placeholder={TPPrice}
                                                                               onClick={() => {
                                                                                   setTPPrice(currentPrice - (currentPrice / 1000));
                                                                               }}
                                                                               onChange={(e) =>
                                                                                   // @ts-ignore
                                                                                   setTPPrice(e.target.value)}
                                                                               title={'Take Profit'}
                                                                               label="Take Profit"
                                                                        />
                                                                    </div>

                                                                </div>
                                                                <div className={'flex flex-col'}>
                                                                    <div className="flex gap-4 items-start justify-between">
                                                                        <Input variant={'bordered'}
                                                                               radius={'none'}
                                                                            // @ts-ignore
                                                                               value={SLPrice}
                                                                               onClick={() => {
                                                                                   setSLPrice(currentPrice + (currentPrice / 1000));
                                                                               }}
                                                                               onChange={(e) =>
                                                                                   // @ts-ignore
                                                                                   setSLPrice(e.target.value)}
                                                                            // @ts-ignore
                                                                               placeholder={SLPrice}
                                                                               title={'Stop Loss'}
                                                                               label={'Stop Loss'}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>

                                                </Accordion>
                                                <div className="flex flex-row w-full gap-1.5 pt-5">
                                                    {/*<Button*/}
                                                    {/*    onClick={() => {*/}
                                                    {/*        // CreateTestUser()*/}
                                                    {/*        // status,type,takeProfit,profit,ticker,leverage,openIn,closeIn,stopLoss,volume*/}
                                                    {/*        createTransBuy()*/}

                                                    {/*        // calculateProfitLoss*/}

                                                    {/*    }}*/}
                                                    {/*    disableRipple={true} radius='none' fullWidth={true}*/}
                                                    {/*    color='success' variant='solid'*/}
                                                    {/*    className={`py-5 text-xl text-bold px-10 bg-green-600 text-primary font-bold`}>*/}
                                                    {/*    Buy*/}
                                                    {/*</Button>*/}
                                                    {/*<Button disableRipple={true} onClick={() => {*/}
                                                    {/*    CreateTradeTransaction('OPEN', "SELL", null, null, ticker, leverage, currentPrice, null, null, volume)*/}
                                                    {/*    toast({*/}
                                                    {/*        title: "Success",*/}
                                                    {/*        description: "Order has been placed!",*/}

                                                    {/*    })*/}
                                                    {/*}} radius='none' fullWidth={true} color='danger' variant='solid'*/}
                                                    {/*        className={`py-5 text-xl text-bold px-10 bg-orange-600 text-primary font-bold`}>*/}
                                                    {/*    Sell*/}
                                                    {/*</Button>*/}

                                                    <Button disableRipple={true} onClick={()=>{
                                                        createTransBuy('SELL')
                                                    }} radius={'none'} variant={'ghost'} className={'text-md uppercase mx-auto'}>Place Sell Order</Button>
                                                </div>

                                            </div>
                                        </TabsContent>
                                    </Tabs>

                                </div>
                                {/*<div className={'flex h-max'}>*/}
                                <HistoryTable ticker={ticker} orderToParent={selectOrderFromTable} closeOrder={selectCloseOrderFromTable} currentPrice={currentPrice} counter={counter}/>
                                {/*</div>*/}
                            </div>

                        </div>

                    </div>
                </div>

            }
        </div>
    )


}

export default Trade;


