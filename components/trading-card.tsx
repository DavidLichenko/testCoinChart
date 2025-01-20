"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {useEffect, useState} from "react";
import {toast} from "@/components/ui/use-toast";
import {CreateTradeTransaction} from "@/actions/form";

const formSchema = z.object({
    volume: z.coerce.number().min(0.0001, "Volume must be at least 0.0001"),
    stopLoss: z.coerce.number().min(0, "Stop loss must be positive"),
    takeProfit: z.coerce.number().min(0, "Take profit must be positive"),
    leverage: z.string().default("1:20"),
})

export default function TradingCard({livePrice, type, assetType, userBalance,ticker}) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            volume: 0.01,
            stopLoss: 0,
            takeProfit: 0,
            leverage: "1:20",
        },
    })
    const [margin, setMargin] = useState(0)
    const [volume, setVolume] = useState(0.01)
    const [leverage,setLeverage] = useState(20)
    const [counter,setCounter] = useState(20)
    function onSubmit(values: z.infer<typeof formSchema>) {
        createTransBuy(values.takeProfit,values.stopLoss,parseInt(values.leverage.split(":")[1]),values.volume)
    }

    function calculateMargin(volumeEUR, marketPrice, leverage) {
        const margin = (volumeEUR * marketPrice) / leverage;
        setMargin(margin)
        // return margin;
    }

    const createTransBuy = async(TPPrice,SLPrice,leverage,volume) => {
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
            CreateTradeTransaction('OPEN',type,TPPrice !== 0 ? TPPrice : null, null,margin, ticker, leverage, livePrice,null,SLPrice !== 0 ? SLPrice : null, parseFloat(String(volume)), assetType)
            setCounter(counter + 1)
            toast({
                title: "Success",
                description: "Order has been placed!",
                variant: 'default'
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong, please try again later",
                variant: "destructive"
            })
        }
    }
    useEffect(() => {
        calculateMargin(volume,livePrice,leverage)
    }, [leverage, volume]);
    return (
        <Card className="w-full p-2 pt-4 bg-background">
            <CardContent className={'h-full '}>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="volume"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className={'pt-4 '}>Volume</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                pattern="[0-9]*\.?[0-9]*"
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9.]/g, '');
                                                    field.onChange(value);
                                                    setVolume(value)
                                                    calculateMargin(value, livePrice, leverage)
                                                    // console.log(form.getValues())
                                                }}
                                            />
                                        </FormControl>
                                        <p className="text-sm text-muted-foreground">Est. Margin: {parseFloat(margin)} USD</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="leverage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Leverage</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select leverage" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1:10">1:10</SelectItem>
                                            <SelectItem value="1:20">1:20</SelectItem>
                                            <SelectItem value="1:30">1:30</SelectItem>
                                            <SelectItem value="1:40">1:40</SelectItem>
                                            <SelectItem value="1:50">1:50</SelectItem>
                                            <SelectItem value="1:100">1:100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="stopLoss"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stop Loss</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            pattern="[0-9]*\.?[0-9]*"
                                            {...field}
                                            onClick={()=>{
                                                const value = livePrice - (livePrice / 1000);
                                                field.onChange(value);
                                            }}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9.]/g, '');
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="takeProfit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Take Profit</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            pattern="[0-9]*\.?[0-9]*"
                                            {...field}
                                            onClick={()=>{
                                                const value = livePrice + (livePrice / 1000);
                                                field.onChange(value);
                                            }}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9.]/g, '');
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>

                <Button className="w-full mt-4 bg-sidebar-accent" type="submit" onClick={form.handleSubmit(onSubmit)}>
                    Place Order
                </Button>
            </CardContent>


        </Card>
    )
}

