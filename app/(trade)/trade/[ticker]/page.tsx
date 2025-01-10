"use client"
import React, { useEffect, useRef, useState } from "react";
import ChartMobile from "@/components/ChartMobile";
import { useSearchParams } from 'next/navigation'
import {Button, Input, Select, SelectItem} from "@nextui-org/react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {Globe, UserCircleIcon, X} from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {AccordionHeader} from "@radix-ui/react-accordion";
import TradingCard from "@/components/trading-card";
import Wrapper from "@/components/Wrapper";
import {GetUserBalance} from "@/actions/form";
import {useBalance} from "@/context/BalanceContext";

export default  function Page({params}: { params: Promise<{ ticker: string }> }) {
    // @ts-ignore
    const ticker = (params).ticker
    const [volume, setVolume] = useState(0.01)
    const [leverage, setLeverage] = React.useState(100);
    const [TPPrice,setTPPrice] = useState(0)
    const [SLPrice,setSLPrice] = useState(0)
    const [livePrice,setLivePrice] = useState(0)
    const [userBalance,setUserBalance] = useState(0)
    const searchParams = useSearchParams()
    const [openSell, setOpenSell] = useState(false)
    const [openBuy, setOpenBuy] = useState(false)
    const { balance } = useBalance()
    const [transType,setTransType] = useState('')
    const getPrice = (price) => {
        setLivePrice(price)
    }

    const type = searchParams.get('type')
    return (
        <>

                <div>
                    <div className="h-screen w-full pt-20 pb-20 flex-1 flex flex-col justify-between items-center">
                        <div className="h-full w-full container bg-sidebar">
                            <ChartMobile ticker={ticker} type={type} addTPPriceLine={null} addSLPriceLine={null}
                                         currentPrice={getPrice}/>
                        </div>
                        <div className="flex gap-6 px-4 pt-4  w-full h-20 items-center justify-center">
                            <Sheet open={openBuy} onOpenChange={setOpenBuy}>
                                <SheetTrigger asChild>
                                <Button className={'bg-success-500 w-full font-bold'} onClick={()=>setTransType('BUY')}>Buy</Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="bottom"
                                    className="w-full h-5/6 p-0 bg-sidebar border-t-border"
                                >
                                    <SheetTitle className="hidden">
                                        <VisuallyHidden.Root>x</VisuallyHidden.Root>
                                    </SheetTitle>
                                    <SheetHeader className="p-4 border-b border-gray-800">
                                        <div className="flex justify-between items-center">
                                            <h3 className={'font-bold text-2xl'}>BUY</h3>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setOpenBuy(false)}
                                            >
                                                <X className="h-5 w-5"/>
                                            </Button>
                                        </div>
                                    </SheetHeader>
                                    <div className={'flex flex-col h-full items-center justify-between pt-2 mb-4 px-5 gap-6'}>
                                        <TradingCard livePrice={livePrice} type={"SELL"} assetType={type} ticker={ticker} userBalance={balance}/>
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <Sheet open={openSell} onOpenChange={setOpenSell}>
                                <SheetTrigger asChild>
                                    <Button className={'bg-danger w-full font-bold'} onClick={()=>setTransType('SELL')}>Sell</Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="bottom"
                                    className="w-full h-5/6 p-0 bg-sidebar border-t-border"
                                >
                                    <SheetTitle className="hidden">
                                        <VisuallyHidden.Root>x</VisuallyHidden.Root>
                                    </SheetTitle>
                                    <SheetHeader className="p-4 border-b border-gray-800">
                                        <div className="flex justify-between items-center">
                                            <h3 className={'font-bold text-2xl'}>SELL</h3>

                                            <Button
                                                variant="ghost"
                                                onClick={() => setOpenSell(false)}
                                            >
                                                <X className="h-5 w-5"/>
                                            </Button>

                                        </div>
                                    </SheetHeader>

                                    <TradingCard livePrice={livePrice} type={"SELL"} assetType={type} ticker={ticker} userBalance={balance}/>

                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                </div>

        </>
    )
        ;
};
