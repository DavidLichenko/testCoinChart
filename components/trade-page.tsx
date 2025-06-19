"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Newspaper,
  Home,
  User,
  X,
  Eye,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useBinanceWebSocket } from "@/hooks/use-binance-websocket"
import { useStockData } from "@/hooks/use-stock-data"
import { useCandlestickChart } from "@/hooks/use-candlestick-chart"
import { DepositModal } from "@/components/deposit-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

interface UserBalance {
  totalBalance: number
  usdBalance: number
  canWithdraw: boolean
  isVerified: boolean
}

interface ActiveTrade {
  id: string
  ticker: string
  type: "BUY" | "SELL"
  volume: number
  margin: number
  leverage: number
  openIn: number
  openInA: number
  profit: number | null
  status: string
  assetType: string
  createdAt: string
}

export default function TradePage() {
  const { user, logout } = useAuth()
  const [balance, setBalance] = useState<UserBalance | null>(null)
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([])
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [chartModalOpen, setChartModalOpen] = useState(false)
  const [selectedTradeForChart, setSelectedTradeForChart] = useState<ActiveTrade | null>(null)

  const { cryptoTickers } = useBinanceWebSocket()
  const { stockTickers } = useStockData()

  // Combine crypto and stock data
  const allTickers = [...cryptoTickers, ...stockTickers]

  const [selectedTicker, setSelectedTicker] = useState(
      allTickers[0] || {
        symbol: "BTC/USD",
        restsymbol:"BTCUSDT",
        open: 0,
        high: 0,
        low: 0,
        close:0,
        name: "Bitcoin",
        price: 0,
        change: 0,
        changePercent: 0,
        type: "crypto",
      },
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY")
  const [volume, setVolume] = useState("0.01")
  const [leverage, setLeverage] = useState("100")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(false)
  const [stopLossEnabled, setStopLossEnabled] = useState(false)
  const [takeProfit, setTakeProfit] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const modalChartRef = useRef<HTMLDivElement>(null)

  console.log(selectedTicker)
  // Initialize chart
  useCandlestickChart(chartContainerRef, selectedTicker)
  // useCandlestickChart(
  //     modalChartRef,
  //     selectedTradeForChart
  //         ? {
  //           symbol: selectedTradeForChart.ticker,
  //           restsymbol: selectedTradeForChart.ticker,
  //           time: selectedTicker.time,
  //           open:   selectedTicker.open,
  //           high:   selectedTicker.high,
  //           low:   selectedTicker.low,
  //           close:   selectedTicker.close,
  //           price: selectedTradeForChart.openInA,
  //           type: selectedTradeForChart.assetType === "Crypto" ? "crypto" : "stock",
  //         }
  //         : selectedTicker,
  // )

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch("/api/user/balance")
        if (response.ok) {
          const data = await response.json()
          setBalance(data.usdBalance)
        }
      } catch (error) {
        console.error("Error fetching balance:", error)
      }
    }
    fetchBalance()
  }, [])

  // Fetch active trades
  useEffect(() => {
    const fetchActiveTrades = async () => {
      try {
        const response = await fetch("/api/trades/active")
        if (response.ok) {
          const data = await response.json()
          setActiveTrades(data)
        }
      } catch (error) {
        console.error("Error fetching active trades:", error)
      }
    }
    fetchActiveTrades()
    const interval = setInterval(fetchActiveTrades, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Update selected ticker when real-time data comes in
  useEffect(() => {
    if (cryptoTickers.length > 0 && selectedTicker.type === "crypto") {
      const updatedTicker = cryptoTickers.find((t) => t.symbol === selectedTicker.symbol)
      if (updatedTicker) {
        setSelectedTicker(updatedTicker)
      }
    }
  }, [cryptoTickers, selectedTicker])

  useEffect(() => {
    if (stockTickers.length > 0 && selectedTicker.type === "stock") {
      const updatedTicker = stockTickers.find((t) => t.symbol === selectedTicker.symbol)
      if (updatedTicker) {
        setSelectedTicker(updatedTicker)
      }
    }
  }, [stockTickers, selectedTicker])

  const filteredTickers = allTickers.filter((ticker) => {
    const matchesSearch =
        ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticker.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || ticker.type === categoryFilter
    return matchesSearch && matchesCategory
  })

  const calculateMargin = () => {
    const price = selectedTicker.price || 0
    const vol = Number.parseFloat(volume) || 0
    const lev = Number.parseFloat(leverage) || 1
    return ((price * vol) / lev).toFixed(2)
  }

  const handleCloseTrade = async (tradeId: string) => {
    try {
      const currentPrice = selectedTicker.price
      const response = await fetch(`/api/trades/${tradeId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closePrice: currentPrice }),
      })

      if (response.ok) {
        // Refresh active trades and balance
        const tradesResponse = await fetch("/api/trades/active")
        if (tradesResponse.ok) {
          const data = await tradesResponse.json()
          setActiveTrades(data)
        }

        const balanceResponse = await fetch("/api/user/balance")
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          setBalance(balanceData.usdBalance)
        }
      }
    } catch (error) {
      console.error("Error closing trade:", error)
    }
  }

  const handleOpenChart = (trade: ActiveTrade) => {
    setSelectedTradeForChart(trade)
    setChartModalOpen(true)
  }

  const handlePlaceOrder = async () => {
    try {
      const orderData = {
        type: orderType,
        ticker: selectedTicker.symbol,
        volume: Number.parseFloat(volume),
        leverage: Number.parseInt(leverage),
        margin: Number.parseFloat(calculateMargin()),
        openIn: selectedTicker.price,
        takeProfit: takeProfitEnabled ? Number.parseFloat(takeProfit) : null,
        stopLoss: stopLossEnabled ? Number.parseFloat(stopLoss) : null,
        assetType: selectedTicker.type === "crypto" ? "Crypto" : "IEX",
      }

      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        // Refresh active trades
        const tradesResponse = await fetch("/api/trades/active")
        if (tradesResponse.ok) {
          const data = await tradesResponse.json()
          setActiveTrades(data)
        }

        // Reset form
        setVolume("0.01")
        setTakeProfit("")
        setStopLoss("")
        setTakeProfitEnabled(false)
        setStopLossEnabled(false)
      }
    } catch (error) {
      console.error("Error placing order:", error)
    }
  }

  return (
      <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-[100vh-100px] bg-gray-950 text-white"
      >

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col lg:flex-row h-[calc(100vh-160px)]"
        >
          {/* Left Sidebar - Ticker List - More compact */}
          <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-80 border-r border-gray-800 bg-gray-900"
          >
            <div className="p-3 border-b border-gray-800">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Search tickers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white h-9"
                />
              </div>
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800 h-8">
                  <TabsTrigger value="all" className="text-xs">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="text-xs">
                    Crypto
                  </TabsTrigger>
                  <TabsTrigger value="stock" className="text-xs">
                    Stocks
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="overflow-y-auto h-[calc(100%-100px)]">
              {filteredTickers.length > 0 ? (
                  filteredTickers.map((ticker) => (
                      <div
                          key={ticker.symbol}
                          onClick={() => setSelectedTicker(ticker)}
                          className={`p-2 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                              selectedTicker.symbol === ticker.symbol ? "bg-gray-800 border-l-4 border-l-purple-500" : ""
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-xs">{ticker.symbol}</div>
                            <div className="text-xs text-gray-400 truncate">{ticker.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono">
                              ${typeof ticker.price === "number" ? ticker.price.toLocaleString() : "0"}
                            </div>
                            <div
                                className={`text-xs flex items-center ${
                                    ticker.changePercent >= 0 ? "text-green-400" : "text-red-400"
                                }`}
                            >
                              {ticker.changePercent >= 0 ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {typeof ticker.changePercent === "number" ? ticker.changePercent.toFixed(2) : "0.00"}%
                            </div>
                          </div>
                        </div>
                      </div>
                  ))
              ) : (
                  <div className="p-4 text-center text-gray-400">
                    {categoryFilter === "crypto" && cryptoTickers.length === 0
                        ? "Loading crypto data..."
                        : categoryFilter === "stock" && stockTickers.length === 0
                            ? "Loading stock data..."
                            : "No tickers found"}
                  </div>
              )}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex-1 flex flex-col lg:flex-row"
          >
            {/* Chart Area (2/3 of main content) */}
            <div className="flex-1 lg:w-2/3 p-3">
              <div className="mb-3">
                <h2 className="text-xl font-bold mb-1">{selectedTicker.symbol}</h2>
              </div>

              <div ref={chartContainerRef} className="h-[calc(100%-100px)] mb-3" />
            </div>

            {/* Trading Panel (1/3 of main content) - More compact */}
            <div className="w-full lg:w-80 border-l border-gray-800 bg-gray-900 p-3 space-y-3">
              {/* Place Order Card */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex  items-center py-2 space-x-4">
                <span className="text-xl font-mono">
                  $ {typeof selectedTicker.price === "number" ? selectedTicker.price.toLocaleString() : "0"}
                </span>
                    <Badge
                        variant={selectedTicker.changePercent >= 0 ? "default" : "destructive"}
                        className={selectedTicker.changePercent >= 0 ? "bg-green-600" : "bg-red-600"}
                    >
                      {selectedTicker.changePercent >= 0 ? "+" : ""}
                      {typeof selectedTicker.changePercent === "number" ? selectedTicker.changePercent.toFixed(2) : "0.00"}%
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                        onClick={() => setOrderType("BUY")}
                        size="sm"
                        className={`flex-1 h-8 text-xs ${
                            orderType === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"
                        }`}
                    >
                      BUY
                    </Button>
                    <Button
                        onClick={() => setOrderType("SELL")}
                        size="sm"
                        className={`flex-1 h-8 text-xs ${
                            orderType === "SELL" ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
                        }`}
                    >
                      SELL
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">{orderType === "BUY" ? "Long" : "Short"} Position</span>
                      <span className="text-xs font-mono">
                      ${typeof selectedTicker.price === "number" ? selectedTicker.price.toLocaleString() : "0"}
                    </span>
                    </div>
                    <div className="text-xs text-gray-500">Current Price</div>
                  </div>

                  <div>
                    <Label htmlFor="volume" className="text-xs text-gray-300">
                      Volume
                    </Label>
                    <Input
                        id="volume"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-1 h-8"
                        placeholder="0.01"
                    />
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Est. margin</span>
                    <span className="font-mono">${calculateMargin()}</span>
                  </div>

                  <div>
                    <Label htmlFor="leverage" className="text-xs text-gray-300">
                      Leverage
                    </Label>
                    <Select value={leverage} onValueChange={setLeverage}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="1">1:1</SelectItem>
                        <SelectItem value="5">1:5</SelectItem>
                        <SelectItem value="10">1:10</SelectItem>
                        <SelectItem value="25">1:25</SelectItem>
                        <SelectItem value="50">1:50</SelectItem>
                        <SelectItem value="100">1:100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-gray-300 hover:text-white">
                      <span>Advanced Options</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="take-profit" className="text-xs text-gray-300">
                          Take Profit
                        </Label>
                        <Switch id="take-profit" checked={takeProfitEnabled} onCheckedChange={setTakeProfitEnabled} />
                      </div>
                      {takeProfitEnabled && (
                          <Input
                              value={takeProfit}
                              onChange={(e) => setTakeProfit(e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white h-8"
                              placeholder="Take profit price"
                          />
                      )}

                      <div className="flex items-center justify-between">
                        <Label htmlFor="stop-loss" className="text-xs text-gray-300">
                          Stop Loss
                        </Label>
                        <Switch id="stop-loss" checked={stopLossEnabled} onCheckedChange={setStopLossEnabled} />
                      </div>
                      {stopLossEnabled && (
                          <Input
                              value={stopLoss}
                              onChange={(e) => setStopLoss(e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white h-8"
                              placeholder="Stop loss price"
                          />
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  <Button
                      onClick={handlePlaceOrder}
                      className={`w-full h-9 ${
                          orderType === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                      }`}
                  >
                    Place {orderType === "BUY" ? "Buy" : "Sell"} Order
                  </Button>
                </CardContent>
              </Card>

              {/* Active Trades */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active Trades ({activeTrades.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {activeTrades.length > 0 ? (
                        activeTrades.map((trade) => (
                            <div key={trade.id} className="p-2 bg-gray-700 rounded-lg">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <div className="font-semibold text-xs">{trade.ticker}</div>
                                  <div className="text-xs text-gray-400">
                                    {trade.type} • {trade.volume} • x{trade.leverage}
                                  </div>
                                </div>
                                <div
                                    className={`text-xs font-semibold ${
                                        (trade.profit || 0) >= 0 ? "text-green-400" : "text-red-400"
                                    }`}
                                >
                                  ${(trade.profit || 0).toFixed(2)}
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>Entry: ${trade.openIn.toFixed(2)}</span>
                                <span>Current: ${trade.openInA.toFixed(2)}</span>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenChart(trade)}
                                    className="flex-1 text-xs h-6"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Chart
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCloseTrade(trade.id)}
                                    className="flex-1 text-xs h-6"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Close
                                </Button>
                              </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-400 py-3">
                          <div className="text-xs">No active trades</div>
                          <div className="text-xs text-gray-500 mt-1">Place your first order to get started</div>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>

        {/* Mobile Bottom Navigation with logout */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
          <div className="flex justify-around py-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                <Home className="w-5 h-5" />
                <span className="text-xs">Dashboard</span>
              </Button>
            </Link>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                <FileText className="w-5 h-5" />
                <span className="text-xs">Transactions</span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-purple-400">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Trade</span>
              </Button>
            </Link>
            <Link href="/news">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                <Newspaper className="w-5 h-5" />
                <span className="text-xs">News</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 text-gray-400">
                <User className="w-5 h-5" />
                <span className="text-xs">Profile</span>
              </Button>
            </Link>
            <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center space-y-1 text-gray-400"
                onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs">Logout</span>
            </Button>
          </div>
        </div>

        {/* Chart Modal */}
        <Dialog open={chartModalOpen} onOpenChange={setChartModalOpen}>
          <DialogContent className="max-w-4xl h-[80vh] bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedTradeForChart?.ticker} - {selectedTradeForChart?.type} Position
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-4">
              <div ref={modalChartRef} className="h-full w-full" />
            </div>
          </DialogContent>
        </Dialog>

        {/* Deposit Modal */}
        <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
      </motion.div>
  )
}
