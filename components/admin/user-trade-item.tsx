"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Plus, Minus, Check, X } from "lucide-react";
import { toast } from "@/components/toast";

interface UserTrade {
  id: string;
  ticker: string;
  type: "BUY" | "SELL";
  volume: number;
  leverage: number;
  openIn: number;
  closeIn: number | null;
  profit: number | null;
  status: string;
  createdAt: string;
  margin: number;
}

interface UserTradeItemProps {
  trade: UserTrade;
  onEdit: (trade: UserTrade) => void;
  onProfitUpdate?: (tradeId: string, newProfit: number, operation?: "add" | "subtract" | "set") => void;
  baseCurrency?: string;
}

export function UserTradeItem({ trade, onEdit, onProfitUpdate, baseCurrency = "USD" }: UserTradeItemProps) {
  const [isEditingProfit, setIsEditingProfit] = useState(false);
  const [profitValue, setProfitValue] = useState((trade.profit ?? 0).toString());
  const [profitOperation, setProfitOperation] = useState<"add" | "subtract" | "set">("set");
  const [saving, setSaving] = useState(false);
  
  const isProfit = (trade.profit ?? 0) >= 0;

  const handleSaveProfit = async () => {
    if (!onProfitUpdate) {
      setIsEditingProfit(false);
      return;
    }

    const numValue = parseFloat(profitValue);
    if (isNaN(numValue)) {
      toast({
        title: "Error",
        description: "Invalid profit value",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let finalProfit = numValue;
      if (profitOperation === "add") {
        finalProfit = (trade.profit ?? 0) + numValue;
      } else if (profitOperation === "subtract") {
        finalProfit = (trade.profit ?? 0) - numValue;
      }

      await onProfitUpdate(trade.id, finalProfit, profitOperation);
      setIsEditingProfit(false);
      toast({
        title: "Success",
        description: "Profit updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profit",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Get asset icon based on ticker
  const getAssetIcon = (ticker: string) => {
    const symbol = ticker.split(".")[0].toUpperCase();
    if (symbol.startsWith("BTC")) return "₿";
    if (symbol.startsWith("ETH")) return "Ξ";
    if (symbol.startsWith("USDT") || symbol.startsWith("USDC")) return "$";
    if (symbol.startsWith("EUR")) return "€";
    if (symbol.startsWith("GBP")) return "£";
    if (symbol.startsWith("JPY")) return "¥";
    return symbol.substring(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      whileHover={{ scale: 1.01 }}
      className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 hover:bg-slate-900 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-medium">
            {getAssetIcon(trade.ticker)}
          </div>
          <span className="font-mono text-xs font-semibold text-slate-100 sm:text-sm">
            {trade.ticker}
          </span>
          <Badge
            className={`rounded-full px-2 text-[10px] ${
              trade.type === "BUY"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {trade.type}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-slate-700 bg-slate-950/80 px-2 text-[10px] text-slate-300"
          >
            {trade.status}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
          <span>Vol: {trade.volume}</span>
          <span>Leverage: {trade.leverage}x</span>
          <span>Margin: ${trade.margin.toFixed(2)}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-slate-400">
          {new Date(trade.createdAt).toLocaleString()}
        </div>
      </div>
      <div className="ml-3 flex items-center gap-2">
        {isEditingProfit ? (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 border border-slate-700 rounded-lg bg-slate-900">
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 w-7 p-0 ${profitOperation === "subtract" ? "bg-rose-500/20 text-rose-400" : "text-slate-400"}`}
                onClick={() => setProfitOperation("subtract")}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={profitValue}
                onChange={(e) => setProfitValue(e.target.value)}
                className="h-7 w-20 border-0 bg-transparent text-xs text-center text-slate-100 focus-visible:ring-0"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 w-7 p-0 ${profitOperation === "add" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"}`}
                onClick={() => setProfitOperation("add")}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/20"
              onClick={handleSaveProfit}
              disabled={saving}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-800"
              onClick={() => {
                setIsEditingProfit(false);
                setProfitValue((trade.profit ?? 0).toString());
                setProfitOperation("set");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="text-right">
              <div
                className={`text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${
                  isProfit ? "text-emerald-400" : "text-rose-400"
                }`}
                onClick={() => {
                  if (onProfitUpdate) {
                    setIsEditingProfit(true);
                    setProfitValue((trade.profit ?? 0).toString());
                    setProfitOperation("set");
                  }
                }}
              >
                {(isProfit ? "+" : "")}
                {(trade.profit ?? 0).toFixed(2)} {baseCurrency}
              </div>
              <div className="text-[11px] text-slate-400">
                Open: {trade.openIn.toFixed(5)}
                {trade.closeIn && (
                  <span className="block">Close: {trade.closeIn.toFixed(5)}</span>
                )}
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              onClick={() => onEdit(trade)}
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}