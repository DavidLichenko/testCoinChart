import React from 'react';
import Chart from "@/components/Chart";
import {Skeleton} from "@/components/ui/skeleton";
import {Ping} from "@uiball/loaders";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Button, Input, Select, SelectItem} from "@nextui-org/react";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";

const Page = () => {
    return (
        <div>
            <div className={'w-[95%]'}>
                {!loadingChartData
                    ?
                    // <ChartElement chartData={chartData} ticker={ticker}/>
                    <div ref={chartHeightDiv} className="basis-full w-full h-[45vh] bg-secondary z-[9000]"
                         id={'Chart'}>
                        <Chart ticker={ticker} tickerType={tickerType[0]}
                               sendCurrentPrice={currentPriceFromChart} OpenIn={openIn}
                               CloseIn={closeIn} addTPPriceLine={TPPrice}
                               addSLPriceLine={SLPrice} currentHeight={chartHeight} tickerName={tickerName}/>
                    </div>
                    : <Skeleton
                        className='w-full  h-[80vh]  bg-background flex items-center justify-center basis-full grow'>
                        <span className=''><Ping speed={1.8} size={64} color={'gray'}/></span>
                    </Skeleton>
                }
            </div>
            <Tabs defaultValue="BUY" className="h-full flex flex-col px-12 py-9 w-full">
                <TabsList className="grid w-full grid-cols-2 mb-5">
                    <TabsTrigger
                        className={'data-[state=active]:bg-green-400 dark:data-[state=active]:bg-green-700 '}
                        value="BUY">BUY</TabsTrigger>
                    <TabsTrigger
                        className={'data-[state=active]:bg-orange-400 dark:data-[state=active]:bg-orange-700'}
                        value="SELL">SELL</TabsTrigger>
                </TabsList>
                <TabsContent value={'BUY'} className={"active:bg-red"}>
                    <div
                        className="flex p-6 flex-col  border-2 rounded-lg relative items-center h-full justify-start">
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
                        <Select label={`Leverage 1:` + leverage}
                                defaultSelectedKeys={['100']}
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

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Advanced options</AccordionTrigger>
                                <AccordionContent>
                                    <div
                                        className="flex flex-col mx-auto align-start text-small text-default-700 font-light mt-5 justify-start items-center w-full  gap-2">
                                        <div className={'flex flex-col'}>
                                            <div
                                                className="flex gap-4 items-start justify-between">
                                                <Input variant={'bordered'}
                                                       radius={'none'}
                                                    // color={'success'}
                                                    // @ts-ignore
                                                       value={TPPrice}
                                                    // @ts-ignore
                                                       placeholder={TPPrice}
                                                       onClick={() => {
                                                           setTPPrice(currentPrice + (currentPrice / 1000));
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
                                            <div
                                                className="flex gap-4 items-start justify-between">
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

                                    onClick={() => {
                                        createTransBuy('BUY')
                                    }}
                                    radius={'none'} variant={'ghost'}
                                    className={'text-md uppercase mx-auto'}>Place Buy
                                Order</Button>

                        </div>
                    </div>
                </TabsContent>
                <TabsContent value={'SELL'}>
                    <div
                        className="flex p-6  flex-col  border-2 rounded-lg relative items-center h-full justify-start">
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
                        <Select label={`Leverage 1:` + leverage}
                                defaultSelectedKeys={['100']}
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

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Advanced options</AccordionTrigger>
                                <AccordionContent>


                                    <div
                                        className="flex flex-col mx-auto align-start text-small text-default-700 font-light mt-5 justify-start items-center w-full gap-2">
                                        <div className={'flex flex-col'}>
                                            <div
                                                className="flex gap-4 items-start justify-between">
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
                                            <div
                                                className="flex gap-4 items-start justify-between">
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

                            <Button disableRipple={true} onClick={() => {
                                createTransBuy('SELL')
                            }} radius={'none'} variant={'ghost'}
                                    className={'text-md uppercase mx-auto'}>Place Sell
                                Order</Button>
                        </div>

                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Page;