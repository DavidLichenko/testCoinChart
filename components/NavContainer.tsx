import React, {useState, useEffect, ReactNode} from 'react';
import {Tabs, Tab, Card, CardBody, Switch, Input, Button, Accordion, AccordionItem} from "@nextui-org/react";
import {
    MdAccountBalance,
    MdCloud,
    MdEditCalendar, MdEuroSymbol,
    MdHistory,
    MdImportExport,
    MdLocalMall,
    MdNewspaper,
    MdSearch,
    MdViewList, MdViewStream
} from "react-icons/md";
import {Skeleton} from "@/components/ui/skeleton";
import {Ping} from "@uiball/loaders";
import {marketWatchCrypto, marketWatchForex, marketWatchMetals, marketWatchStocks} from "@/components/marketWatch";
import {SearchIcon} from "lucide-react";
import {RiVipCrown2Line} from "react-icons/ri";

const NavContainer = ({sendDataToParent}) => {
    const [active,setActive] = useState<boolean>(false);
    const [expanded, setExpanded] = useState<boolean>(false);
    const [loadingData,setLoadingData] = useState(false)
    const [input,setInput] = useState("");
    const [price, setPrice] = useState('');
    const [searchData, setSearchData] = useState([])
    const [ticker, setTicker] = useState("");
    const [activeBtn, setActiveBtn] = useState<boolean>(true);
    const [loadingChartData, setLoadingChartData] = useState<boolean>(true)
    const [chartData, setChartData] = useState([])
    const [tradingNews,setTradingNews] = useState([])
    const [listsData,setListsData] = useState([])
    const [tickersData, setTickersData] = useState([])

    const selectedTicker = (ticker, tickerType) => {
        setTicker(ticker)
        sendDataToParent(ticker,true,tickerType[0])
        setInput('');
        setSearchData([]);
    }
    // const SearchResults = ({ results }) => {
    //     return (
    //         <>
    //             {results.map((item,index)=>{
    //                 return(
    //                     <li key={index} className={`bg-background border-border z-50 p-3 border text-primary text-md dark:hover:bg-gray-700 light:hover:bg-secondary-100 hover:cursor-pointer`} onClick={() => {
    //                         selectedTicker(item.symbol)
    //                     }}>
    //                         <span className={`symbol symbol-${item.symbol}`}></span>
    //                         {item.symbol}
    //                         <p className='text-muted-foreground text-sm'>{item.exchange}</p>
    //                     </li>
    //                 )
    //             })}
    //         </>
    //     )
    // }
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
        setLoadingChartData(true);
        postData({data: {
                ticker:ticker
            }})
            .then(json => {
                setLoadingChartData(false);
                setChartData(json.values)
            })
            .catch(e => console.log(e));
    }
    const getNewsData = async() =>{
        postData({data: {
                news:true
            }})
            .then(json => {
                setTradingNews(json)
            })
            .catch(e => console.log(e));
    }
    const getListData = async() => {
        postData({data: {
                lists:true
            }})
            .then(json => {
                setListsData(json)
            })
            .catch(e => console.log(e));
    }
    useEffect(()=> {
        // getNewsData()
        // getListData()
        // getTickersData()
        const intervalTicker = setInterval(()=>{
            getTickersDataBinance()
        },1000)
        // if (ticker) {
        //     updateTickerData(ticker)
        // }
        return () =>{
            clearInterval(intervalTicker);
        }
    },[ticker])

    const getTickersData = async () => {
        const response = await fetch('https://api.bitget.com/api/spot/v1/market/tickers')
        const {data} = await response.json();
        // setTickersData(data)
    }
    const getTickersDataBinance = async() => {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr')
        const data = await response.json();
        setTickersData(data)
    }
    const SearchUL = () => {
        return (
            <li>

            </li>
        )
    }

    return (
        <div className="flex h-full w-full flex-col ">
            <Tabs classNames={{
                tabList: 'bg-background p-0 w-[7vw] shadow-none',
                tabContent:'shadow-none',
                panel: 'pr-3 w-[25vw] pl-0 shadow-none',
                tab: 'h-full w-[5vw] p-0 shadow-none',

                wrapper: 'w-[30vw] h-full p-0 pb-3 shadow-none'
            }}
                  aria-label="Options" radius='none' color={'secondary'}  isVertical={true}>
                <Tab className='w-full h-full'  title={
                    <div
                        className="flex flex-col w-full h-full justify-center items-center outline-none  py-6 px-4 shadow-none  hover:cursor-pointer">
                        <MdViewList size={32}/>
                        <div className='text-center pt-2 uppercase text-pretty'>Market Watch</div>
                    </div>
                }>
                    <Card radius='none' className='bg-popover border-border h-full border-2 p-0 '>
                        <CardBody className='h-full py-3 px-0'>
                            <div className="search_list flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                <p className='text-xl font-bold text-center mx-auto w-full pb-6'>Market
                                    Watch</p>
                                <Input
                                    onInput={(el) => {
                                        setInput((el.target as HTMLInputElement).value)
                                    }}
                                    endContent={
                                        <SearchIcon size={20}/>
                                    }
                                    radius={'none'}
                                    value={input}
                                    variant='bordered'
                                    placeholder='Search'/>
                                {input && searchData.length > 0 ?
                                    loadingData ? <Skeleton className='h-full bg-background flex justify-center items-center w-full'>
                                            <span className="w-full flex items-center justify-center"><Ping speed={1.8} size={64} color={'gray'}/></span>
                                        </Skeleton> :
                                        <ul className='search_list mt-2 z-50 bg-background mr-2 h-[50%] w-full '>
                                            {/*<SearchResults results={searchData}/>*/}
                                        </ul>
                                    :
                                    ''
                                }

                                <Accordion className='mt-2' selectionMode="multiple" isCompact>
                                    <AccordionItem key="1" aria-label="Crypto" title="Crypto" startContent={<MdCloud/>} subtitle={marketWatchCrypto[0].length -3}>
                                        <ul className="flex flex-col w-full h-full">
                                            {/*    {marketWatchCrypto[1].map((item,index)=>(*/}
                                            {/*        <li key={index} className='w-full flex gap-4 px-6 py-2 justify-start items-center border-1 border-muted hover:bg-secondary hover:cursor-pointer'>*/}
                                            {/*            <div className={`symbol symbol-${item}`}>*/}

                                            {/*            </div>*/}
                                            {/*            <span className='text-sm'>*/}
                                            {/*    {marketWatchCrypto[0][index]}*/}
                                            {/*</span>*/}
                                            {/*        </li>*/}
                                            {/*    ))}*/}
                                            {/*    <CryptoList/>*/}
                                            {
                                                marketWatchCrypto[1].map((item,index)=>(
                                                    tickersData.map((ticker)=> (
                                                        ticker.symbol.toLowerCase() == item.toLowerCase() + "t" && ticker.lastId !== -1 &&

                                                        <li key={index} onClick={()=>{
                                                            selectedTicker(ticker.symbol.toLowerCase(),marketWatchCrypto[2])
                                                        }}
                                                            className='w-full flex gap-4 px-2 py-2 relative justify-start items-center border-1 border-muted hover:bg-secondary hover:cursor-pointer'>
                                                            <div className={`symbol symbol-${item}`}>


                                                            </div>
                                                            <span className={`text-small w-24 symbol-name-${marketWatchCrypto[0][index]}`}>
                                                                {marketWatchCrypto[0][index]}
                                                            </span>
                                                            <div className={'text-small flex gap-4 right-3 absolute'}>
                                                                <span className={`${100 * (ticker.priceChangePercent) <=0 ? 'text-danger' : 'text-success'}`}>
                                                                    {parseFloat(ticker.priceChangePercent).toFixed(2)}%
                                                                </span>
                                                                <span className={''}>{ticker.lastPrice}</span>
                                                            </div>
                                                        </li>
                                                    ))))}
                                        </ul>
                                    </AccordionItem>
                                    <AccordionItem key="2" aria-label="Stocks" title="Stocks" startContent={<MdAccountBalance/>}  subtitle={marketWatchStocks[0].length}>
                                        <ul className="flex flex-col w-full h-full">
                                            {marketWatchStocks[1].map((item, index) => (
                                                <li key={index} onClick={()=>{
                                                    selectedTicker(item,marketWatchStocks[2])
                                                }}
                                                    className='w-full flex gap-4 px-6 py-2 justify-start items-center border-1 border-muted hover:bg-secondary hover:cursor-pointer'>
                                                    <div className={`symbol symbol-${item}`}>

                                                    </div>
                                                    <span className={`text-sm symbol-name-${marketWatchStocks[0][index]}`}>
                                                    {marketWatchStocks[0][index]}
                                                </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionItem>
                                    <AccordionItem key="3" aria-label="Forex" title="Forex" startContent={<MdEuroSymbol/>} subtitle={marketWatchForex[0].length}>
                                        <ul className="flex flex-col w-full h-full">
                                            {marketWatchForex[1].map((item, index) => (
                                                <li key={index}  onClick={()=>{
                                                    selectedTicker(item,marketWatchForex[2])
                                                }}
                                                    className='w-full flex gap-4 px-6 py-2 justify-start items-center border-1 border-muted hover:bg-secondary hover:cursor-pointer'>
                                                    <div className={`symbol symbol-${item}`}>

                                                    </div>
                                                    <span className={`text-sm symbol-name-${marketWatchForex[0][index]}`}>
                                                    {marketWatchForex[0][index]}
                                                </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionItem>
                                    <AccordionItem key="4" aria-label="Metals" title="Metals" startContent={<MdViewStream/>}  subtitle={marketWatchMetals[0].length}>
                                        <ul className="flex flex-col w-full h-full">
                                            {marketWatchMetals[1].map((item, index) => (
                                                <li key={index}
                                                    className='w-full flex gap-4 px-6 py-2 justify-start items-center border-1 border-muted hover:bg-secondary hover:cursor-pointer'>
                                                    <div className={`symbol symbol-${item}`}>

                                                    </div>
                                                    <span className={`text-sm symbol-name-${marketWatchMetals[0][index]}`}>
                                                    {marketWatchMetals[0][index]}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionItem>
                                </Accordion>


                                {/*<h2 className='text-accent-foreground text-2xl leading-relaxed font-light'>*/}
                                {/*    {ticker ? ticker : ''}*/}
                                {/*    <h2 className='text-orange-400 text-medium font-bold'>*/}
                                {/*        {price ? price : ''}*/}
                                {/*    </h2>*/}
                                {/*</h2>*/}
                            </div>
                        </CardBody>
                    </Card>
                </Tab>
                <Tab className='w-full' title={
                    <div
                        className="flex flex-col w-full h-full justify-center items-center py-6 px-4 hover:cursor-pointer">
                        <MdLocalMall size={32}/>
                        <div className='text-center pt-2 uppercase text-pretty'>Active orders</div>
                    </div>
                }>
                    <Card radius='none'  className='bg-popover border-border h-full border-2'>
                        <CardBody className='h-full py-3 px-0'>
                            <div className="flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                <p className='text-xl font-bold text-center mx-auto w-full pb-6'>Active orders</p>
                                <div className="flex flex-row items-center justify-around w-full bg-secondary">
                                    <Button disableRipple={true} radius='none' fullWidth={true} color='default' variant='light' className={`p-5 bg-background ${activeBtn ? 'bg-secondary' : ''}`}
                                            onClick={()=>{setActiveBtn(true)}}
                                    >
                                        Active
                                    </Button>
                                    {/*<div className="border-r-2 border-border">|</div>*/}
                                    <Button radius='none' disableRipple={true} fullWidth={true} color='default' variant='light' className={`p-5 bg-background border-l-1 border-border ${activeBtn ? '' : 'bg-secondary'}`}
                                            onClick={()=>{setActiveBtn(false)}}>
                                        Pending
                                    </Button>
                                </div>
                                <div className="flex flex-col items-center justify-center h-full w-full">
                                    <MdImportExport size={64}/>
                                    <p className="text-muted-foreground text-xl w-[70%] flex text-center items-center justify-center text-mono mx-auto">You have no open position yet</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>
                <Tab className='w-full' title={
                    <div
                        className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                        <MdHistory size={32}/>
                        <div className='text-center pt-2 uppercase text-pretty'>Trading History</div>
                    </div>
                }>
                    <Card radius='none'  className='bg-popover border-border h-full border-2'>
                        <CardBody className='h-full py-3 px-0'>
                            <div
                                className="flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                <p className='text-xl font-bold text-center mx-auto w-full pb-6'>Trading History</p>
                                <div className="flex flex-col items-center justify-center h-full w-full">
                                    <MdHistory size={64}/>
                                    <p className="text-muted-foreground text-xl w-[70%] flex text-center items-center justify-center text-mono mx-auto">
                                        You don`t have any closed deals yet</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>
                <Tab className='w-full' title={
                    <div
                        className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                        <RiVipCrown2Line size={32}/>
                        <div className='text-center pt-2 uppercase text-pretty'>VIP</div>
                    </div>
                }>
                    <Card radius='none'  className='bg-popover border-border h-full border-2'>
                        <CardBody className='h-full py-3 px-0'>
                            <div
                                className="flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                <p className='text-xl font-bold text-center mx-auto w-full pb-6'>VIP Accounts</p>
                                <div className="flex flex-col items-center justify-center h-full w-full">
                                    <MdHistory size={64} className={'animate-bounce'}/>
                                    <p className="text-muted-foreground text-xl w-[70%] flex text-center items-center justify-center text-mono mx-auto">
                                        Processing</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>
                <Tab className='w-full h-full' title={
                    <div
                        className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                        <MdNewspaper size={32}/>
                        <div className='text-center pt-2 uppercase text-pretty'>INFO</div>
                    </div>
                }>
                    <Card radius='none' className='bg-popover border-border h-full border-2'>
                        <CardBody className='h-full py-3 px-0'>
                            <div className="flex flex-col h-[80vh] w-full items-start relative justify-start gap-2 pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                <p className='text-xl font-bold text-center mx-auto w-full pb-6'>INFO</p>
                                {tradingNews.length > 0 && tradingNews.map((item, index) => (
                                    <div key={index} className='bg-secondary p-3 m-3'>
                                        <h2 className="text-xl font-bold mb-3">{item.title}</h2>
                                        <span className="text-md text-muted-foreground ">{item.description}</span>
                                        {/* {item.title} */}
                                    </div>
                                ))}
                                {/* {
                                    tradingNews && 
                                    <div>
                                    
                                    <div/>
                                } */}
                            </div>
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
};

export default NavContainer;