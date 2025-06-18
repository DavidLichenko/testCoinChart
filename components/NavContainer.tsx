"use client"

import { useState, useEffect, memo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Search,
    ChevronDown,
    Bitcoin,
    Building2,
    DollarSign,
    Coins,
    Activity,
    ShoppingBag,
    History,
} from "lucide-react"
import { marketWatchCrypto, marketWatchForex, marketWatchMetals, marketWatchStocks } from "@/components/marketWatch"
import { GetUserActiveTrans } from "@/actions/form"

// Move CategorySection OUTSIDE the main component and memoize it
const CategorySection = memo(function CategorySection({
                                                          title,
                                                          icon: Icon,
                                                          data,
                                                          categoryType,
                                                          count,
                                                          tickersData,
                                                          selectedTicker,
                                                      }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {count}
                        </Badge>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-4 h-4" />
                        </motion.div>
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1 mt-2">
                    {data[1].map((item, index) => {
                        const cryptoPrice =
                            title === "Crypto"
                                ? tickersData.find((ticker) => ticker.symbol.toLowerCase() === item.toLowerCase() + "t")
                                : null

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-between p-3 hover:bg-secondary/30 rounded-lg cursor-pointer transition-colors"
                                onClick={() => selectedTicker(item, categoryType, data[0][index])}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`symbol symbol-${item} w-6 h-6 rounded-full bg-secondary`}></div>
                                    <div>
                                        <div className="font-medium text-sm">{data[0][index]}</div>
                                        <div className="text-xs text-muted-foreground">{item}</div>
                                    </div>
                                </div>
                                {cryptoPrice && (
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{cryptoPrice.lastPrice}</div>
                                        <div
                                            className={`text-xs ${
                                                Number.parseFloat(cryptoPrice.priceChangePercent) >= 0 ? "text-green-500" : "text-red-500"
                                            }`}
                                        >
                                            {Number.parseFloat(cryptoPrice.priceChangePercent).toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </motion.div>
            </CollapsibleContent>
        </Collapsible>
    )
})

const NavContainer = memo(function NavContainer({ sendDataToParent }) {
    // Keep all your original variables
    const [active, setActive] = useState<boolean>(false)
    const [expanded, setExpanded] = useState<boolean>(false)
    const [loadingData, setLoadingData] = useState(false)
    const [input, setInput] = useState("")
    const [price, setPrice] = useState("")
    const [searchData, setSearchData] = useState([])
    const [ticker, setTicker] = useState("")
    const [activeBtn, setActiveBtn] = useState<boolean>(true)
    const [loadingChartData, setLoadingChartData] = useState<boolean>(true)
    const [chartData, setChartData] = useState([])
    const [tradingNews, setTradingNews] = useState([])
    const [listsData, setListsData] = useState([])
    const [activeOrders, setActiveOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [tickersData, setTickersData] = useState([])
    const [currentPrice, setCurrentPrice] = useState(0)
    const [marketData, setMarketData] = useState(null)
    const [filteredResults, setFilteredResults] = useState([])
    const [activeTab, setActiveTab] = useState("market")

    const selectedTicker = useCallback(
        (ticker, tickerType, tickerName) => {
            setTicker(ticker)
            sendDataToParent(ticker, true, tickerType[0], tickerName)
            setInput("")
            setSearchData([])
        },
        [sendDataToParent],
    )

    const handleSearch = useCallback((searchTerm) => {
        if (!searchTerm.trim()) {
            setFilteredResults([])
            return
        }

        const results = []

        // Search through Crypto
        marketWatchCrypto[0].forEach((name, index) => {
            const ticker = marketWatchCrypto[1][index]
            if (
                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticker.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                results.push({
                    name,
                    ticker,
                    category: "Crypto",
                    categoryType: marketWatchCrypto[2],
                    icon: "Bitcoin",
                })
            }
        })

        // Search through Stocks
        marketWatchStocks[0].forEach((name, index) => {
            const ticker = marketWatchStocks[1][index]
            if (
                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticker.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                results.push({
                    name,
                    ticker,
                    category: "Stocks",
                    categoryType: marketWatchStocks[2],
                    icon: "Building2",
                })
            }
        })

        // Search through Forex
        marketWatchForex[0].forEach((name, index) => {
            const ticker = marketWatchForex[1][index]
            if (
                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticker.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                results.push({
                    name,
                    ticker,
                    category: "Forex",
                    categoryType: marketWatchForex[2],
                    icon: "DollarSign",
                })
            }
        })

        // Search through Metals
        marketWatchMetals[0].forEach((name, index) => {
            const ticker = marketWatchMetals[1][index]
            if (
                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticker.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                results.push({
                    name,
                    ticker,
                    category: "Metals",
                    categoryType: marketWatchMetals[2],
                    icon: "Coins",
                })
            }
        })

        setFilteredResults(results)
    }, [])

    // Your existing functions
    const calculateProfitLossBUY = useCallback((volumeEUR, entryPrice, exitPrice) => {
        const priceDifference = exitPrice - entryPrice
        const profitLoss = volumeEUR * priceDifference
        return profitLoss.toFixed(2)
    }, [])

    const calculateProfitLossSELL = useCallback((volumeEUR, entryPrice, exitPrice) => {
        const priceDifference = entryPrice - exitPrice
        const profitLoss = volumeEUR * priceDifference
        return profitLoss.toFixed(2)
    }, [])

    const postData = useCallback((data) => {
        return fetch("http://localhost:8080/trade", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }).then((response) => response.json())
    }, [])

    const getTickersDataBinance = useCallback(async () => {
        try {
            const response = await fetch("https://api.binance.com/api/v3/ticker/24hr")
            const data = await response.json()
            setTickersData(data)
        } catch (error) {
            console.error("Error fetching ticker data:", error)
        }
    }, [])

    const getListOrders = useCallback(async () => {
        try {
            const getTransactions = await GetUserActiveTrans()
            setActiveOrders(getTransactions)
        } catch (error) {
            console.error("Error fetching orders:", error)
        }
    }, [])

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const response = await fetch("/api/market")
                if (!response.ok) {
                    throw new Error("Failed to fetch market data")
                }
                const data = await response.json()
                setMarketData(data)
            } catch (error) {
                console.error("Error fetching market data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMarketData()
        getListOrders()

        const intervalTicker = setInterval(() => {
            getTickersDataBinance()
        }, 1000)

        return () => {
            clearInterval(intervalTicker)
        }
    }, [ticker, getTickersDataBinance, getListOrders])

    return (
        <div className="w-[320px] h-full border-r bg-sidebar">
            <div className="flex flex-col h-full">
                {/* Tab Navigation */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab("market")}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 transition-colors ${
                            activeTab === "market" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"
                        }`}
                    >
                        <Activity className="w-5 h-5" />
                        <span className="text-xs font-medium">MARKET WATCH</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 transition-colors ${
                            activeTab === "orders" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"
                        }`}
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-xs font-medium">ACTIVE ORDERS</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 transition-colors ${
                            activeTab === "history" ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50"
                        }`}
                    >
                        <History className="w-5 h-5" />
                        <span className="text-xs font-medium">HISTORY</span>
                    </button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4">
                        <AnimatePresence mode="wait">
                            {activeTab === "market" && (
                                <motion.div
                                    key="market"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <h2 className="text-lg font-semibold mb-3">Market Watch</h2>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input
                                                placeholder="Search tickers and categories..."
                                                value={input}
                                                onChange={(e) => {
                                                    setInput(e.target.value)
                                                    handleSearch(e.target.value)
                                                }}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {input && filteredResults.length > 0 && (
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm">Search Results ({filteredResults.length})</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {filteredResults.map((result, index) => (
                                                    <motion.div
                                                        key={index}
                                                        whileHover={{ scale: 1.02 }}
                                                        className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded cursor-pointer"
                                                        onClick={() => selectedTicker(result.ticker, result.categoryType, result.name)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`symbol symbol-${result.ticker} w-6 h-6 rounded-full bg-secondary`}></div>
                                                            <div>
                                                                <div className="font-medium text-sm">{result.name}</div>
                                                                <div className="text-xs text-muted-foreground">{result.category}</div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="space-y-2">
                                        <CategorySection
                                            title="Crypto"
                                            icon={Bitcoin}
                                            data={marketWatchCrypto}
                                            categoryType={marketWatchCrypto[2]}
                                            count={marketWatchCrypto[0].length}
                                            tickersData={tickersData}
                                            selectedTicker={selectedTicker}
                                        />
                                        <CategorySection
                                            title="Stocks"
                                            icon={Building2}
                                            data={marketWatchStocks}
                                            categoryType={marketWatchStocks[2]}
                                            count={marketWatchStocks[0].length}
                                            tickersData={tickersData}
                                            selectedTicker={selectedTicker}
                                        />
                                        <CategorySection
                                            title="Forex"
                                            icon={DollarSign}
                                            data={marketWatchForex}
                                            categoryType={marketWatchForex[2]}
                                            count={marketWatchForex[0].length}
                                            tickersData={tickersData}
                                            selectedTicker={selectedTicker}
                                        />
                                        <CategorySection
                                            title="Metals"
                                            icon={Coins}
                                            data={marketWatchMetals}
                                            categoryType={marketWatchMetals[2]}
                                            count={marketWatchMetals[0].length}
                                            tickersData={tickersData}
                                            selectedTicker={selectedTicker}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "orders" && (
                                <motion.div
                                    key="orders"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <h2 className="text-lg font-semibold">Active Orders</h2>
                                    {activeOrders.length > 0 ? (
                                        <div className="space-y-3">
                                            {activeOrders.map((item, index) => (
                                                <Card key={index}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={item.type === "BUY" ? "default" : "destructive"}>{item.type}</Badge>
                                                                <span className="font-medium">{item.ticker}</span>
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">${item.openIn}</span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            P&L:{" "}
                                                            {item.type === "SELL"
                                                                ? calculateProfitLossSELL(
                                                                    Number.parseFloat(item.volume),
                                                                    Number.parseFloat(item.openIn),
                                                                    currentPrice,
                                                                )
                                                                : calculateProfitLossBUY(
                                                                    Number.parseFloat(item.volume),
                                                                    Number.parseFloat(item.openIn),
                                                                    currentPrice,
                                                                )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">You have no open positions yet</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "history" && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <h2 className="text-lg font-semibold">Trading History</h2>
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <History className="w-12 h-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">You dont have any closed deals yet</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
})

export default NavContainer
