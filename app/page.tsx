"use client"

import { useCallback, useEffect, useState, memo } from "react"
import {AnimatePresence, motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { getSession } from "next-auth/react"
import { useMediaQuery } from "react-responsive"
import { toast } from "@/components/ui/use-toast"

// Your existing imports
import {
    CreateTradeTransaction,
    GetCurrentData,
    GetCurrentUser,
    GetTradeTransaction,
    GetUserBalance,
    UpdateTradeTransaction,
    UpdateUserBalance,
} from "@/actions/form"
import Logo from "@/components/Logo"
import ThemeSwitcher from "@/components/ThemeSwitcher"
import NavContainer from "@/components/NavContainer"
import HistoryTable from "@/components/HistoryTable"
import Chart from "@/components/Chart"
import CryptoDeposit from "@/components/crypto-deposit"
import { UserSettingsModal } from "@/components/user-settings-modal"
import DashboardPage from "@/components/MainDashboardMobile"
import { MdArrowDownward } from "react-icons/md"
import { BiSolidCabinet } from "react-icons/bi"
import {Activity, Wallet, CreditCard, TrendingUp, TrendingDown, DollarSign, Settings, ChevronDown} from "lucide-react"
import {TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import { Tabs } from "@/components/ui/tabs"
import {Badge} from "@/components/ui/badge";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {Separator} from "@/components/ui/separator";


const Trade = memo(function Trade() {
    // Keep ALL your original variables - no changes
    const [loading, setLoading] = useState(true)
    const [price, setPrice] = useState("")
    const [input, setInput] = useState("")
    const [searchData, setSearchData] = useState([])
    const [chartData, setChartData] = useState([])
    const [loadingData, setLoadingData] = useState(false)
    const [loadingChartData, setLoadingChartData] = useState(true)
    const [ticker, setTicker] = useState("btcusd")
    const [tickerName, setTickerName] = useState("Bitcoin")
    const [tickerType, setTickerType] = useState("Crypto")
    const [tickerData, setTickerData] = useState([])
    const [count, setCount] = useState(0)
    const [session, setSession] = useState(null)
    const [userImage, setUserImage] = useState<any>("")
    const [showAccountModal, setShowAccountModal] = useState<boolean>(false)
    const [sliderValue, setSliderValue] = useState(0)
    const [selectTicker, setSelectTicker] = useState(false)
    const [showDeposit, setShowDeposit] = useState(false)
    const [leverage, setLeverage] = useState(100)
    const [currentPrice, setCurrentPrice] = useState(0.0)
    const [volume, setVolume] = useState(0.01)
    const [userBalance, setUserBalance] = useState(null)
    const [margin, setMargin] = useState<number>(0.0)
    const [openIn, setOpenIn] = useState(0.0)
    const [closeIn, setCloseIn] = useState(0.0)
    const [profit, setProfit] = useState(0.0)
    const [TPPrice, setTPPrice] = useState(0)
    const [SLPrice, setSLPrice] = useState(0)
    const [typeTrade, setTypeTrade] = useState("BUY")
    const [selectOrderTable, setSelectOrderTable] = useState(0)
    const [counter, setCounter] = useState(0)
    const [orderClose, setOrderClose] = useState({})
    const [activeTab, setActiveTab] = useState("home")
    const [user, setUser] = useState(null)
    const [currentUser, setCurrentUser] = useState({})
    const [currentUserData, setCurrentUserData] = useState({})
    const [userRole, setUserRole] = useState("USER")
    const [chartHeight, setChartHeight] = useState(0)
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const isMobile = useMediaQuery({ maxWidth: 768 })

    const router = useRouter()

    const chartHeightDiv = useCallback((node) => {
        if (node !== null) {
            setChartHeight(node.getBoundingClientRect().height)
        }
    }, [])

    // Keep all your existing functions unchanged
    async function currentSeesion() {
        const session = await getSession()
        if (!user) {
            if (session === null) {
                router.push("/welcome")
                return
            }
            setUser(session.user)
            setSession(session)
            GetBalance()
            setCurrentUser(await GetCurrentUser())
            setCurrentUserData(await GetCurrentData())
            setLoading(true)
        }
        setLoading(false)
    }

    const GetBalance = async () => {
        try {
            const getBalance = await GetUserBalance()
            setUserBalance(getBalance.usd)
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong, please try again later",
                variant: "destructive",
            })
        }
    }

    const createTransBuy = async (type) => {
        let assetType = tickerType
        if (tickerType === "Stocks") {
            assetType = "IEX"
        }

        if (margin > userBalance) {
            toast({
                title: "Error",
                description: "Your balance is not enough to open an order! Lower the volume",
                variant: "destructive",
            })
            return
        }

        try {
            CreateTradeTransaction(
                "OPEN",
                type,
                TPPrice !== 0 ? TPPrice : null,
                null,
                margin,
                ticker,
                leverage,
                currentPrice,
                null,
                SLPrice !== 0 ? SLPrice : null,
                Number.parseFloat(String(volume)),
                assetType,
            )
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
                variant: "destructive",
            })
        }
    }

    const getTradeTrans = async () => {
        try {
            const trans = await GetTradeTransaction(ticker)
            setOpenIn(trans.openIn)
        } catch (error) {
            console.log(error)
        }
    }

    const dataFromChild = (ticker, isClick, tickerType, tickerName) => {
        setTickerName(tickerName)
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
                const profit = calculateProfitLossBUY(
                    Number.parseFloat(row.volume),
                    Number.parseFloat(row.openIn),
                    currentPrice,
                )
                await UpdateTradeTransaction(currentPrice, profit, row.id)
                await UpdateUserBalance(userBalance + Number.parseFloat(profit))
                setCounter(counter + 1)
            }
            if (row.type === "SELL") {
                const profit = calculateProfitLossSELL(
                    Number.parseFloat(row.volume),
                    Number.parseFloat(row.openIn),
                    currentPrice,
                )
                await UpdateTradeTransaction(currentPrice, profit, row.id)
                await UpdateUserBalance(userBalance + Number.parseFloat(profit))
                setCounter(counter + 1)
            }
        } catch (error) {
            console.log(error)
        }
    }

    function calculateMargin(volumeEUR, marketPrice, leverage) {
        const margin = (volumeEUR * marketPrice) / leverage
        setMargin(margin)
    }

    function calculateProfitLoss(volume, entryPrice, exitPrice) {
        const priceDifference = exitPrice - entryPrice
        const profitLoss = (volume * priceDifference) / leverage
        return profitLoss
    }

    function calculateProfitLossBUY(volumeEUR, entryPrice, exitPrice) {
        const priceDifference = exitPrice - entryPrice
        const profitLoss = volumeEUR * priceDifference
        return profitLoss.toFixed(2)
    }

    function calculateProfitLossSELL(volumeEUR, entryPrice, exitPrice) {
        const priceDifference = entryPrice - exitPrice
        const profitLoss = volumeEUR * priceDifference
        return profitLoss.toFixed(2)
    }

    const advancedOptionsVariants = {
        hidden: {
            opacity: 0,
            height: 0,
            marginTop: 0,
            transition: {
                duration: 0.2,
                ease: "easeInOut",
            },
        },
        visible: {
            opacity: 1,
            height: "auto",
            marginTop: 16,
            transition: {
                duration: 0.2,
                ease: "easeInOut",
            },
        },
    }

    const chevronVariants = {
        closed: { rotate: 0 },
        open: { rotate: 180 },
    }

    useEffect(()=>{
        currentSeesion()
    })

    useEffect(() => {
        setLoadingChartData(false)
        calculateMargin(volume, currentPrice, leverage)
        setProfit(calculateProfitLoss(volume, openIn, currentPrice))
        return
    }, [ticker, volume, currentPrice, openIn, leverage])

    return (
        <div className="w-full h-screen bg-background">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full">
                        <div className="flex items-center justify-center h-full">
                            <Activity className="w-8 h-8 animate-pulse" />
                        </div>
                    </Skeleton>
                </div>
            ) : (
                <>
                    {isMobile ? (
                        <div className="flex flex-col h-full w-full p-4">
                            <div className="flex flex-col w-full h-full justify-center items-center">
                                <div className="page-header container flex flex-col h-full items-center gap-4 justify-center">
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xl font-bold mb-4 py-2"
                                    >
                                        Hola, {currentUserData.name ? currentUserData.name : currentUserData.email?.split("@")[0]}
                                    </motion.p>
                                </div>
                                <DashboardPage />
                            </div>
                        </div>
                    ) : (
                        (
                            <div className="flex flex-col h-full">
                                {/* Top Navigation */}
                                <motion.nav
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-between items-center border-b h-16 px-6 bg-sidebar/50 backdrop-blur-sm"
                                >
                                    <div className="flex gap-4 items-center">
                                        <Logo />
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        {currentUser.role !== 'USER' && currentUser.role !== undefined && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href="/admin" className="flex items-center gap-2">
                                                    <BiSolidCabinet className="w-4 h-4" />
                                                    CRM
                                                </a>
                                            </Button>
                                        )}

                                        <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowDeposit(true)}
                                                className="flex items-center gap-2"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Deposit
                                            </Button>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Deposit Funds</DialogTitle>
                                                </DialogHeader>
                                                <CryptoDeposit />
                                            </DialogContent>
                                        </Dialog>

                                        <Card className="px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <Wallet className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-semibold">
                                                ${userBalance ? userBalance.toFixed(2) : '0.00'}
                                            </span>
                                                <MdArrowDownward className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </Card>

                                        <UserSettingsModal
                                            totalAmount={userBalance}
                                            totalDeposit={0}
                                            totalProfit={0}
                                            userData={currentUserData}
                                        />
                                        <ThemeSwitcher />
                                    </div>
                                </motion.nav>

                                {/* Main Content */}
                                <div className="flex flex-1 overflow-hidden">
                                    {/* Left Sidebar */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <NavContainer sendDataToParent={dataFromChild} />
                                    </motion.div>

                                    {/* Center Content */}
                                    <div className="flex-1 flex flex-col gap-3 p-3">
                                        <div className="flex gap-3 h-full">
                                            {/* Chart */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                                ref={chartHeightDiv}
                                                className="flex-1 h-[65vh]"
                                            >
                                                {!loadingChartData ? (
                                                    <Chart
                                                        ticker={ticker}
                                                        tickerType={tickerType[0]}
                                                        sendCurrentPrice={currentPriceFromChart}
                                                        OpenIn={openIn}
                                                        CloseIn={closeIn}
                                                        addTPPriceLine={TPPrice}
                                                        addSLPriceLine={SLPrice}
                                                        currentHeight={chartHeight}
                                                        tickerName={tickerName}
                                                    />
                                                ) : (
                                                    <Skeleton className="w-full h-full flex items-center justify-center">
                                                        <Activity className="w-8 h-8 animate-pulse" />
                                                    </Skeleton>
                                                )}
                                            </motion.div>

                                            {/* Trading Panel */}
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="w-[320px]"
                                            >
                                                <Tabs defaultValue="BUY" className="h-[60vh] flex flex-col basis-1/3 z-50">
                                                    <div className="p-4 pb-0">
                                                        <TabsList className="grid w-full grid-cols-2 h-12">
                                                            <TabsTrigger
                                                                value="BUY"
                                                                className="data-[state=active]:bg-green-500 data-[state=active]:text-white font-semibold"
                                                            >
                                                                <TrendingUp className="w-4 h-4 mr-2" />
                                                                BUY
                                                            </TabsTrigger>
                                                            <TabsTrigger
                                                                value="SELL"
                                                                className="data-[state=active]:bg-red-500 data-[state=active]:text-white font-semibold"
                                                            >
                                                                <TrendingDown className="w-4 h-4 mr-2" />
                                                                SELL
                                                            </TabsTrigger>
                                                        </TabsList>
                                                    </div>

                                                    <TabsContent value="BUY" className="flex-1 p-4 pt-2">
                                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                                            <Card className="border-green-200 dark:border-green-800">
                                                                <CardHeader className="pb-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <Badge variant="outline" className="text-green-600 border-green-600">
                                                                            Long Position
                                                                        </Badge>
                                                                        <div className="text-right">
                                                                            <div className="text-2xl font-bold">${currentPrice.toLocaleString()}</div>
                                                                            <div className="text-sm text-muted-foreground">Current Price</div>
                                                                        </div>
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="volume">Volume</Label>
                                                                        <div className="relative">
                                                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                                            <Input
                                                                                id="volume"
                                                                                type="number"
                                                                                placeholder="0.00"
                                                                                value={volume}
                                                                                onChange={(e) => setVolume(e.target.value)}
                                                                                className="pl-10 text-lg font-semibold"
                                                                            />
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-muted-foreground">Est. margin:</span>
                                                                            <span className="font-semibold">${Number.parseFloat(margin.toString()).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="leverage">Leverage 1:{leverage}</Label>
                                                                        <Select value={leverage.toString()} onValueChange={setLeverage}>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select leverage" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="10">1:10</SelectItem>
                                                                                <SelectItem value="20">1:20</SelectItem>
                                                                                <SelectItem value="30">1:30</SelectItem>
                                                                                <SelectItem value="100">1:100</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            className="w-full justify-between p-2 h-auto hover:bg-transparent"
                                                                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <Settings className="w-4 h-4 mr-2" />
                                                                                Advanced Options
                                                                            </div>
                                                                            <motion.div
                                                                                variants={chevronVariants}
                                                                                animate={isAdvancedOpen ? "open" : "closed"}
                                                                                transition={{ duration: 0.2 }}
                                                                            >
                                                                                <ChevronDown className="w-4 h-4" />
                                                                            </motion.div>
                                                                        </Button>

                                                                        <AnimatePresence>{isAdvancedOpen &&
                                                                            <motion.div
                                                                                variants={advancedOptionsVariants}
                                                                                initial="hidden"
                                                                                animate="visible"
                                                                                exit="hidden"
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <Separator className="mb-4"/>
                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor="tp-price-sell"
                                                                                               className="text-green-600">
                                                                                            Take Profit
                                                                                        </Label>
                                                                                        <Input
                                                                                            id="tp-price-sell"
                                                                                            type="number"
                                                                                            placeholder={TPPrice}
                                                                                            value={TPPrice}
                                                                                            onClick={() => {
                                                                                                setTPPrice((currentPrice - currentPrice / 1000))
                                                                                            }}
                                                                                            onChange={(e) => setTPPrice(e.target.value)}
                                                                                            className="border-green-200 focus:border-green-500"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor="sl-price-sell"
                                                                                               className="text-red-600">
                                                                                            Stop Loss
                                                                                        </Label>
                                                                                        <Input
                                                                                            id="sl-price-sell"
                                                                                            type="number"
                                                                                            placeholder={SLPrice}
                                                                                            value={SLPrice}
                                                                                            onClick={() => {
                                                                                                setSLPrice((currentPrice + currentPrice / 1000))
                                                                                            }}
                                                                                            onChange={(e) => setSLPrice(e.target.value)}
                                                                                            className="border-red-200 focus:border-red-500"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>

                                                                        }</AnimatePresence>
                                                                    </div>

                                                                    <motion.div whileHover={{scale: 1.02}}
                                                                                whileTap={{scale: 0.98}}>
                                                                        <Button
                                                                            onClick={() => createTransBuy("BUY")}
                                                                            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg"
                                                                            size="lg"
                                                                        >
                                                                            <TrendingUp className="w-5 h-5 mr-2"/>
                                                                            Place Buy Order
                                                                        </Button>
                                                                    </motion.div>
                                                                </CardContent>
                                                            </Card>
                                                        </motion.div>
                                                    </TabsContent>

                                                    <TabsContent value="SELL" className="flex-1 p-4 pt-2">
                                                        <motion.div initial={{opacity: 0, y: 20}}
                                                                    animate={{opacity: 1, y: 0}}
                                                                    transition={{duration: 0.4}}>
                                                            <Card className="border-red-200 dark:border-red-800">
                                                                <CardHeader className="pb-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <Badge variant="outline" className="text-red-600 border-red-600">
                                                                            Short Position
                                                                        </Badge>
                                                                        <div className="text-right">
                                                                            <div className="text-2xl font-bold">${currentPrice.toLocaleString()}</div>
                                                                            <div className="text-sm text-muted-foreground">Current Price</div>
                                                                        </div>
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="volume-sell">Volume</Label>
                                                                        <div className="relative">
                                                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                                            <Input
                                                                                id="volume-sell"
                                                                                type="number"
                                                                                placeholder="0.00"
                                                                                value={volume}
                                                                                onChange={(e) => setVolume(e.target.value)}
                                                                                className="pl-10 text-lg font-semibold"
                                                                            />
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-muted-foreground">Est. margin:</span>
                                                                            <span className="font-semibold">${Number.parseFloat(margin.toString()).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="leverage-sell">Leverage 1:{leverage}</Label>
                                                                        <Select value={leverage.toString()} onValueChange={setLeverage}>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Select leverage" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="10">1:10</SelectItem>
                                                                                <SelectItem value="20">1:20</SelectItem>
                                                                                <SelectItem value="30">1:30</SelectItem>
                                                                                <SelectItem value="100">1:100</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            className="w-full justify-between p-2 h-auto hover:bg-transparent"
                                                                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <Settings className="w-4 h-4 mr-2" />
                                                                                Advanced Options
                                                                            </div>
                                                                            <motion.div
                                                                                variants={chevronVariants}
                                                                                animate={isAdvancedOpen ? "open" : "closed"}
                                                                                transition={{ duration: 0.2 }}
                                                                            >
                                                                                <ChevronDown className="w-4 h-4" />
                                                                            </motion.div>
                                                                        </Button>

                                                                        <AnimatePresence>{isAdvancedOpen &&
                                                                            <motion.div
                                                                                variants={advancedOptionsVariants}
                                                                                initial="hidden"
                                                                                animate="visible"
                                                                                exit="hidden"
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <Separator className="mb-4"/>
                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor="tp-price-sell"
                                                                                               className="text-green-600">
                                                                                            Take Profit
                                                                                        </Label>
                                                                                        <Input
                                                                                            id="tp-price-sell"
                                                                                            type="number"
                                                                                            placeholder={TPPrice}
                                                                                            value={TPPrice}
                                                                                            onClick={() => {
                                                                                                setTPPrice((currentPrice - currentPrice / 1000))
                                                                                            }}
                                                                                            onChange={(e) => setTPPrice(e.target.value)}
                                                                                            className="border-green-200 focus:border-green-500"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor="sl-price-sell"
                                                                                               className="text-red-600">
                                                                                            Stop Loss
                                                                                        </Label>
                                                                                        <Input
                                                                                            id="sl-price-sell"
                                                                                            type="number"
                                                                                            placeholder={SLPrice}
                                                                                            value={SLPrice}
                                                                                            onClick={() => {
                                                                                                setSLPrice((currentPrice + currentPrice / 1000))
                                                                                            }}
                                                                                            onChange={(e) => setSLPrice(e.target.value)}
                                                                                            className="border-red-200 focus:border-red-500"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        }</AnimatePresence>
                                                                    </div>

                                                                    <motion.div whileHover={{scale: 1.02}}
                                                                                whileTap={{scale: 0.98}}>
                                                                        <Button
                                                                            onClick={() => createTransBuy("SELL")}
                                                                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg"
                                                                            size="lg"
                                                                        >
                                                                            <TrendingDown className="w-5 h-5 mr-2"/>
                                                                            Place Sell Order
                                                                        </Button>
                                                                    </motion.div>
                                                                </CardContent>
                                                            </Card>
                                                        </motion.div>
                                                    </TabsContent>
                                                </Tabs>
                                            </motion.div>
                                        </div>

                                        {/* History Table */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1,  y:0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <HistoryTable
                                                ticker={ticker}
                                                orderToParent={selectOrderFromTable}
                                                closeOrder={selectCloseOrderFromTable}
                                                currentPrice={currentPrice}
                                                counter={counter}
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    )
})

export default Trade
