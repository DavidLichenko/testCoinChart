"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, User, TrendingUp, X } from "lucide-react";
import {TickerMeta, tickerMetaMap } from "@/data/ticker-meta";
import { TickerAvatar } from "@/components/ticker-avatar";

interface OpenTradeAdminDialogProps {
    openTradeOpen: boolean;
    setOpenTradeOpen: (open: boolean) => void;
    users: any[];
    tickers: { symbol: string; bid: number; ask: number; tickerInfo?: TickerMeta; }[];
    onTradeAdded?: () => void;
}

// категории для автоподстановки assetType
const categories = {
    Forex: [
        "EURUSD",
        "GBPUSD",
        "USDCHF",
        "USDJPY",
        "USDCAD",
        "AUDUSD",
        "AUDNZD",
        "AUDCAD",
        "AUDCHF",
        "AUDJPY",
        "CHFJPY",
        "EURGBP",
        "EURAUD",
        "EURJPY",
        "EURCHF",
        "EURNZD",
        "EURCAD",
        "GBPCHF",
        "GBPJPY",
        "CADCHF",
        "CADJPY",
        "GBPAUD",
        "GBPCAD",
        "GBPNZD",
        "NZDCAD",
        "NZDCHF",
        "NZDJPY",
        "NZDUSD",
    ],
    Commodities: ["XAUUSD", "XAGUSD", "XTIUSD"],
    Indices: ["US500", "US30", "USTEC", "AUS200"],
    Crypto: ["BTCUSD", "ETHUSD", "XRPUSD", "XLMUSD"],
    Stocks: [
        "AAPL.NAS",
        "MSFT.NAS",
        "GOOG.NAS",
        "NVDA.NAS",
        "TSLA.NAS",
        "MVRS.NAS",
        "AMZN.NAS",
        "NFLX.NAS",
        "INTC.NAS",
        "ADBE.NAS",
        "PYPL.NAS",
        "JPM.NYSE",
        "GS.NYSE",
        "BAC.NYSE",
        "XOM.NYSE",
        "CVX.NYSE",
        "UNH.NYSE",
        "JNJ.NYSE",
        "PFE.NYSE",
        "KO.NYSE",
        "DIS.NYSE",
        "WMT.NYSE",
        "V.NYSE",
        "MA.NYSE",
        "ORCL.NYSE",
    ],
};

// Функция для оценки релевантности поиска
function getRelevanceScore(text: string, search: string): number {
    if (!search.trim()) return 0;

    const textLower = text.toLowerCase();
    const searchLower = search.toLowerCase();

    // Начинается с поискового запроса - высший приоритет
    if (textLower.startsWith(searchLower)) return 100;

    // Содержит поисковый запрос - средний приоритет
    if (textLower.includes(searchLower)) return 50;

    // Частичное совпадение - низкий приоритет
    const searchWords = searchLower.split(/\s+/);
    let score = 0;
    for (const word of searchWords) {
        if (textLower.includes(word)) {
            score += 10;
        }
    }

    return score;
}

const ITEMS_PER_PAGE = 20;

export default function OpenTradeAdminDialog({
                                                 openTradeOpen,
                                                 setOpenTradeOpen,
                                                 users,
                                                 tickers,
                                                 onTradeAdded,
                                             }: OpenTradeAdminDialogProps) {
    const [userId, setUserId] = useState("");
    const [ticker, setTicker] = useState("");
    const [type, setType] = useState<"BUY" | "SELL">("BUY");
    const [volume, setVolume] = useState("0.01");
    const [leverage, setLeverage] = useState("1");
    const [price, setPrice] = useState(0);
    const [assetType, setAssetType] = useState("IEX");
    const [loading, setLoading] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [tickerSearch, setTickerSearch] = useState("");
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [showTickerSearch, setShowTickerSearch] = useState(false);
    const userListRef = useRef<HTMLDivElement>(null);
    const tickerListRef = useRef<HTMLDivElement>(null);

    // Обновляем цену и assetType при выборе тикера
    useEffect(() => {
        if (!ticker) return;
        const t = tickers.find((t) => t.symbol === ticker);
        setPrice(t?.bid || t?.ask || 0);

        // Определяем assetType по категориям
        let typeFound: string = "IEX";
        for (const [key, list] of Object.entries(categories)) {
            if (list.includes(ticker)) {
                typeFound = key as string;
                break;
            }
        }
        setAssetType(typeFound);
    }, [ticker, tickers]);

    const calculateMargin = () => {
        if (!ticker) return "0.00";
        const t = tickers.find((t) => t.symbol === ticker);
        const currentPrice = t?.bid || t?.ask || 0;
        const vol = Number.parseFloat(volume) || 0;
        const lev = Number.parseFloat(leverage) || 1;
        return ((currentPrice * vol) / lev).toFixed(2);
    };

    const handleCreateTrade = async () => {
        if (!userId || !ticker) return;

        const marginValue = parseFloat(calculateMargin());

        setLoading(true);
        try {
            const response = await fetch("/api/admin/opentrade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    ticker,
                    type,
                    volume,
                    leverage,
                    openIn: price,
                    assetType,
                    margin: marginValue,
                }),
            });

            if (response.ok) {
                await response.json();
                setOpenTradeOpen(false);
                if (onTradeAdded) onTradeAdded();
                // Сброс полей
                setUserId("");
                setTicker("");
                setUserSearch("");
                setTickerSearch("");
                setVolume("0.01");
                setLeverage("1");
                setShowUserSearch(false);
                setShowTickerSearch(false);
            }
        } catch (error) {
            console.error("Error creating trade:", error);
        } finally {
            setLoading(false);
        }
    };

    // Фильтрация и сортировка пользователей по релевантности
    const filteredAndSortedUsers = useMemo(() => {
        if (!userSearch.trim()) return users;

        const searchLower = userSearch.toLowerCase();

        // Сначала фильтруем
        const filtered = users.filter(user =>
            user.email?.toLowerCase().includes(searchLower) ||
            user.name?.toLowerCase().includes(searchLower) ||
            user.id?.toLowerCase().includes(searchLower)
        );

        // Затем сортируем по релевантности
        return filtered
            .map(user => ({
                ...user,
                score: Math.max(
                    getRelevanceScore(user.email || '', userSearch),
                    getRelevanceScore(user.name || '', userSearch),
                    getRelevanceScore(user.id || '', userSearch)
                )
            }))
            .sort((a, b) => b.score - a.score);
    }, [users, userSearch]);

    // Фильтрация и сортировка тикеров по релевантности
    const filteredAndSortedTickers = useMemo(() => {
        if (!tickerSearch.trim()) return tickers;

        const searchLower = tickerSearch.toLowerCase();

        // Сначала фильтруем
        const filtered = tickers.filter(t => {
            const tickerInfo = tickerMetaMap.get(t.symbol);
            const displayName = tickerInfo?.showName || '';
            return (
                t.symbol.toLowerCase().includes(searchLower) ||
                displayName.toLowerCase().includes(searchLower)
            );
        });

        // Затем сортируем по релевантности
        return filtered
            .map(t => {
                const tickerInfo = tickerMetaMap.get(t.symbol);
                const displayName = tickerInfo?.showName || '';
                return {
                    ...t,
                    tickerInfo,
                    score: Math.max(
                        getRelevanceScore(t.symbol, tickerSearch),
                        getRelevanceScore(displayName, tickerSearch)
                    )
                };
            })
            .sort((a, b) => b.score - a.score);
    }, [tickers, tickerSearch]);

    // Получение информации о выбранном тикере для отображения
    const selectedTickerInfo = useMemo(() => {
        if (!ticker) return null;
        return tickerMetaMap.get(ticker);
    }, [ticker]);

    // Получение информации о выбранном пользователе для отображения
    const selectedUser = useMemo(() => {
        if (!userId) return null;
        return users.find(u => u.id === userId);
    }, [userId, users]);

    // Lazy load обработчики
    const handleUserScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

        if (isAtBottom) {
            // В реальном приложении здесь был бы вызов API для загрузки следующей страницы
            // Но так как у нас все данные уже загружены, просто имитируем lazy load
            console.log("Load more users...");
        }
    };

    const handleTickerScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

        if (isAtBottom) {
            console.log("Load more tickers...");
        }
    };

    return (
        <Dialog open={openTradeOpen} onOpenChange={setOpenTradeOpen}>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl text-slate-100">Open New Trade</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* User Selector */}
                    <div>
                        <Label className="text-sm text-slate-300">User</Label>
                        <Select
                            value={userId}
                            onValueChange={setUserId}
                            onOpenChange={(open) => {
                                if (open) {
                                    setShowUserSearch(true);
                                } else {
                                    setTimeout(() => setShowUserSearch(false), 100);
                                }
                            }}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-sm mt-1">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    {selectedUser ? (
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-100">{selectedUser.name || "No name"}</span>
                                            <span className="text-xs text-slate-400">{selectedUser.email}</span>
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Select user" />
                                    )}
                                </div>
                            </SelectTrigger>
                            <SelectContent
                                className="bg-slate-800 border-slate-700 p-0"
                                ref={userListRef}
                                onScroll={handleUserScroll}
                            >
                                {/* Search input inside dropdown */}
                                <div className="sticky top-0 z-10 bg-slate-800 p-2 border-b border-slate-700">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Search users..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="pl-9 bg-slate-900 border-slate-700 text-slate-100 text-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        {userSearch && (
                                            <button
                                                onClick={() => setUserSearch("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Users list */}
                                <div className="max-h-[200px] overflow-y-auto">
                                    {filteredAndSortedUsers.length === 0 ? (
                                        <div className="px-3 py-3 text-sm text-slate-400 text-center">
                                            {userSearch ? "No users found" : "No users available"}
                                        </div>
                                    ) : (
                                        filteredAndSortedUsers.map((u) => (
                                            <SelectItem
                                                key={u.id}
                                                value={u.id}
                                                className="text-sm hover:bg-slate-700 focus:bg-slate-700"
                                            >
                                                <div className="flex flex-col py-1">
                                                    <span className="font-medium text-slate-100">{u.name || "No name"}</span>
                                                    <span className="text-xs text-slate-400">{u.email}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ticker Selector */}
                    <div>
                        <Label className="text-sm text-slate-300">Ticker</Label>
                        <Select
                            value={ticker}
                            onValueChange={setTicker}
                            onOpenChange={(open) => {
                                if (open) {
                                    setShowTickerSearch(true);
                                } else {
                                    setTimeout(() => setShowTickerSearch(false), 100);
                                }
                            }}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-sm mt-1">
                                <div className="flex items-center gap-2">
                                    {selectedTickerInfo ? (
                                        <>
                                            <TickerAvatar
                                                symbol={selectedTickerInfo.symbol}
                                                category={selectedTickerInfo.category}
                                                baseCurrency={selectedTickerInfo.baseCurrency}
                                                quoteCurrency={selectedTickerInfo.quoteCurrency}
                                                icon={selectedTickerInfo.icon}
                                                size={20}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-100">{selectedTickerInfo.showName}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="h-4 w-4 text-slate-400" />
                                            <SelectValue placeholder="Select ticker" />
                                        </>
                                    )}
                                </div>
                            </SelectTrigger>
                            <SelectContent
                                className="bg-slate-800 border-slate-700 p-0"
                                ref={tickerListRef}
                                onScroll={handleTickerScroll}
                            >
                                {/* Search input inside dropdown */}
                                <div className="sticky top-0 z-10 bg-slate-800 p-2 border-b border-slate-700">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Search tickers..."
                                            value={tickerSearch}
                                            onChange={(e) => setTickerSearch(e.target.value)}
                                            className="pl-9 bg-slate-900 border-slate-700 text-slate-100 text-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        {tickerSearch && (
                                            <button
                                                onClick={() => setTickerSearch("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tickers list */}
                                <div className="max-h-[200px] overflow-y-auto">
                                    {filteredAndSortedTickers.length === 0 ? (
                                        <div className="px-3 py-3 text-sm text-slate-400 text-center">
                                            {tickerSearch ? "No tickers found" : "No tickers available"}
                                        </div>
                                    ) : (
                                        filteredAndSortedTickers.map((item) => {
                                            const tickerInfo = item.tickerInfo;
                                            return (
                                                <SelectItem
                                                    key={item.symbol}
                                                    value={item.symbol}
                                                    className="text-sm hover:bg-slate-700 focus:bg-slate-700"
                                                >
                                                    <div className="flex items-center gap-2 py-1">
                                                        {tickerInfo && (
                                                            <TickerAvatar
                                                                symbol={tickerInfo.symbol}
                                                                category={tickerInfo.category}
                                                                baseCurrency={tickerInfo.baseCurrency}
                                                                quoteCurrency={tickerInfo.quoteCurrency}
                                                                icon={tickerInfo.icon}
                                                                size={20}
                                                            />
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-100">
                                                                {tickerInfo?.showName || item.symbol}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })
                                    )}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type */}
                    <div>
                        <Label className="text-sm text-slate-300">Type</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as "BUY" | "SELL")}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-sm mt-1">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${type === "BUY" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="BUY" className="text-sm text-emerald-300">BUY</SelectItem>
                                <SelectItem value="SELL" className="text-sm text-rose-300">SELL</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Volume */}
                    <div>
                        <Label className="text-sm text-slate-300">Volume</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-slate-100 text-sm mt-1"
                        />
                    </div>

                    {/* Leverage */}
                    <div>
                        <Label className="text-sm text-slate-300">Leverage</Label>
                        <Select value={leverage} onValueChange={setLeverage}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-sm mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="1" className="text-sm">1:1</SelectItem>
                                <SelectItem value="5" className="text-sm">1:5</SelectItem>
                                <SelectItem value="10" className="text-sm">1:10</SelectItem>
                                <SelectItem value="25" className="text-sm">1:25</SelectItem>
                                <SelectItem value="50" className="text-sm">1:50</SelectItem>
                                <SelectItem value="100" className="text-sm">1:100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price (авто) */}
                    <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Open Price</span>
                            <span className="text-slate-100 font-semibold">${price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-slate-300">Margin</span>
                            <span className="text-slate-100 font-semibold">${calculateMargin()}</span>
                        </div>
                    </div>

                    {/* Create Trade Button */}
                    <Button
                        onClick={handleCreateTrade}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-slate-100 font-medium text-sm sm:text-base"
                        disabled={loading || !userId || !ticker}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Creating...
                            </>
                        ) : (
                            "Create Trade"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}