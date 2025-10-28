"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react"; // иконка спиннера

interface OpenTradeAdminDialogProps {
  openTradeOpen: boolean;
  setOpenTradeOpen: (open: boolean) => void;
  users: any[];
  tickers: { symbol: string; bid: number; ask: number }[];
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
        margin: marginValue, // ✅ передаём margin
      }),
    });

    if (response.ok) {
      await response.json();
      setOpenTradeOpen(false);
      if (onTradeAdded) onTradeAdded();
    }
  } catch (error) {
    console.error("Error creating trade:", error);
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog open={openTradeOpen} onOpenChange={setOpenTradeOpen}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Open New Trade</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* User */}
          <div>
            <Label className="text-sm">User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-sm">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-sm">
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ticker */}
          <div>
            <Label className="text-sm">Ticker</Label>
            <Select value={ticker} onValueChange={setTicker}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-sm">
                <SelectValue placeholder="Select ticker" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {tickers.map((t) => (
                  <SelectItem key={t.symbol} value={t.symbol} className="text-sm">
                    {t.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div>
            <Label className="text-sm">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "BUY" | "SELL")}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY" className="text-sm">BUY</SelectItem>
                <SelectItem value="SELL" className="text-sm">SELL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Volume */}
          <div>
            <Label className="text-sm">Volume</Label>
            <Input
              type="number"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="bg-gray-700 border-gray-600 text-sm"
            />
          </div>

          {/* Leverage */}
          <div>
            <Label className="text-sm">Leverage</Label>
            <Select value={leverage} onValueChange={setLeverage}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          <div>
            <Label className="text-sm">Open Price</Label>
            <div className="text-gray-300 text-sm">${price.toFixed(2)}</div>
          </div>

          {/* Margin (авто) */}
          <div>
            <Label className="text-sm">Margin</Label>
            <div className="text-gray-300 text-sm">${calculateMargin()}</div>
          </div>

          {/* Asset Type */}
          <div>
            <Label className="text-sm">Asset Type</Label>
            <div className="text-gray-300 text-sm">{assetType}</div>
          </div>

          {/* Create Trade Button */}
          <Button
            onClick={handleCreateTrade}
            className="w-full text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "Create Trade"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
