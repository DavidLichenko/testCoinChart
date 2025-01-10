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

export default  function Page({params}: { params: Promise<{ ticker: string }> }) {
    // @ts-ignore
    const ticker = (params).ticker
    const [volume, setVolume] = useState(0.01)
    const [leverage, setLeverage] = React.useState(100);
    const [TPPrice,setTPPrice] = useState(0)
    const [SLPrice,setSLPrice] = useState(0)
    const [livePrice,setLivePrice] = useState(0)
    const searchParams = useSearchParams()
    const [open, setOpen] = useState(false)
    const [transType,setTransType] = useState('')
    const getPrice = (price) => {
        setLivePrice(price)
    }

    const type = searchParams.get('type')
    return (
        <>
            <div className={'h-screen'}>
                <div className="h-full w-full flex flex-col items-center">
                    <div className=" w-full container bg-sidebar">
                        <ChartMobile ticker={ticker} type={type} addTPPriceLine={null} addSLPriceLine={null} currentPrice={getPrice}/>
                    </div>
                    <div className="flex gap-6 px-4 pt-4  w-full h-20 items-center justify-center">
                        <Sheet open={open} onOpenChange={setOpen}>
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
                                        <h3 className={'font-bold text-2xl'}></h3>

                                        <Button
                                            variant="ghost"
                                            onClick={() => setOpen(false)}
                                        >
                                            <X className="h-5 w-5"/>
                                        </Button>

                                    </div>
                                </SheetHeader>
                                <div className={'flex flex-col h-full items-center justify-between pt-2 mb-4 px-5 gap-6'}>

                                {/*    <Input*/}
                                {/*        label="Volume"*/}
                                {/*        radius='none'*/}
                                {/*        variant='bordered'*/}
                                {/*        placeholder="0.00"*/}
                                {/*        // @ts-ignore*/}
                                {/*        value={volume}*/}
                                {/*        // @ts-ignore*/}
                                {/*        onValueChange={setVolume}*/}
                                {/*        startContent={*/}
                                {/*            <div className="pointer-events-none flex items-center">*/}
                                {/*                <span className="text-default-400 text-small">$</span>*/}
                                {/*            </div>*/}
                                {/*        }*/}
                                {/*    />*/}







                                {/*    <Select label={`Leverage 1:` + leverage}*/}
                                {/*            defaultSelectedKeys={['100']}*/}
                                {/*            value={100} variant={'bordered'} radius={'none'}*/}
                                {/*            onChange={(e) => {*/}
                                {/*                // @ts-ignore*/}
                                {/*                setLeverage((e.target.value).toString());*/}

                                {/*            }}*/}
                                {/*            popoverProps={{*/}
                                {/*                classNames: {*/}
                                {/*                    base: "before:bg-default-200 rounded-none",*/}
                                {/*                    content: "p-0 border-small rounded-none  border-divider bg-background",*/}
                                {/*                },*/}
                                {/*            }}*/}
                                {/*            listboxProps={{*/}
                                {/*                itemClasses: {*/}
                                {/*                    base: [*/}
                                {/*                        "rounded-none",*/}
                                {/*                        "text-default-500",*/}
                                {/*                        "transition-opacity",*/}
                                {/*                        "data-[hover=true]:text-foreground",*/}
                                {/*                        "data-[hover=true]:bg-default-100",*/}
                                {/*                        "dark:data-[hover=true]:bg-default-50",*/}
                                {/*                        "data-[selectable=true]:focus:bg-default-50",*/}
                                {/*                        "data-[pressed=true]:opacity-70",*/}
                                {/*                        "data-[focus-visible=true]:ring-default-500",*/}
                                {/*                    ],*/}
                                {/*                },*/}
                                {/*            }}*/}

                                {/*            size={'sm'} className={'mt-5 mb-2'}>*/}
                                {/*        <SelectItem key={'10'} value={10}>1:10</SelectItem>*/}
                                {/*        <SelectItem key={'20'} value={20}>1:20</SelectItem>*/}
                                {/*        <SelectItem key={'30'} value={30}>1:30</SelectItem>*/}
                                {/*        <SelectItem key={'100'} value={100}>1:100</SelectItem>*/}

                                {/*    </Select>*/}
                                {/*    <div className={'flex flex-col'}>*/}
                                {/*        <div className="flex gap-4 items-start justify-between">*/}
                                {/*            <Input variant={'bordered'}*/}
                                {/*                   radius={'none'}*/}
                                {/*                // color={'success'}*/}
                                {/*                // @ts-ignore*/}
                                {/*                   value={TPPrice}*/}
                                {/*                // @ts-ignore*/}
                                {/*                   placeholder={TPPrice}*/}
                                {/*                   onClick={() => {*/}
                                {/*                       setTPPrice(livePrice + (livePrice / 1000));*/}
                                {/*                   }}*/}
                                {/*                   onChange={(e) =>*/}
                                {/*                       // @ts-ignore*/}
                                {/*                       setTPPrice(e.target.value)}*/}
                                {/*                   title={'Take Profit'}*/}
                                {/*                   label="Take Profit"*/}
                                {/*                   content={'Take Profit'}*/}
                                {/*            />*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*    <div className={'flex flex-col'}>*/}
                                {/*        <div className="flex gap-4 items-start justify-between">*/}
                                {/*            <Input variant={'bordered'}*/}
                                {/*                   radius={'none'}*/}
                                {/*                // color={'danger'}*/}
                                {/*                // @ts-ignore*/}
                                {/*                   value={SLPrice}*/}
                                {/*                   onClick={() => {*/}
                                {/*                       setSLPrice(livePrice - (livePrice / 1000));*/}
                                {/*                   }}*/}
                                {/*                   onChange={(e) =>*/}
                                {/*                       // @ts-ignore*/}
                                {/*                       setSLPrice(e.target.value)}*/}
                                {/*                   placeholder={'98200.00'}*/}
                                {/*                   title={'Stop Loss'}*/}
                                {/*                   label={'Stop Loss'}*/}

                                {/*            />*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*</div>*/}
                                {/*<Button className={'bg-accent w-full font-bold mx-4 my-6'}>Place order</Button>*/}

                                    <TradingCard livePrice={livePrice} type={"BUY"}/>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button className={'bg-success-500 w-full font-bold'} onClick={()=>setTransType('SELL')}>Sell</Button>
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
                                        <h3 className={'font-bold text-2xl'}></h3>

                                        <Button
                                            variant="ghost"
                                            onClick={() => setOpen(false)}
                                        >
                                            <X className="h-5 w-5"/>
                                        </Button>

                                    </div>
                                </SheetHeader>

                                <TradingCard livePrice={livePrice} type={"SELL"}/>

                            </SheetContent>
                        </Sheet>
                        <Button className={'bg-danger w-full font-bold'}>Sell</Button>
                    </div>
                </div>

            </div>
        </>
    )
        ;
};
