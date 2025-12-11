"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Plus, Minus, Check, X, Cpu } from "lucide-react";
import { toast } from "@/components/toast";
import { TickerAvatar } from "@/components/ticker-avatar";

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
  aiEnabled?: boolean;
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

  return (
    <div className="px-2 py-1.5">
      <div
        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
          trade.aiEnabled 
            ? "border-purple-500/40 bg-purple-950/20" 
            : "border-slate-800/60 bg-slate-900/40"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5 flex-1">
          <TickerAvatar 
            symbol={trade.ticker}
            category="stocks"
            size={28}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold text-slate-100">
                {trade.ticker}
              </span>
              {trade.aiEnabled && (
                <Badge className="rounded-full px-1.5 py-0 text-[9px] bg-purple-500/20 text-purple-300 border-0">
                  AI
                </Badge>
              )}
              <Badge
                className={`rounded-full px-1.5 py-0 text-[9px] border-0 ${
                  trade.type === "BUY"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {trade.type}
              </Badge>
              <Badge className="rounded-full px-1.5 py-0 text-[9px] bg-slate-800/50 text-slate-400 border-0">
                {trade.status}
              </Badge>
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">
              Vol: {trade.volume} • Leverage: {trade.leverage}x
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingProfit ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 border border-slate-700 rounded-lg bg-slate-900">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-6 w-6 p-0 ${profitOperation === "subtract" ? "bg-rose-500/20 text-rose-400" : "text-slate-400"}`}
                  onClick={() => setProfitOperation("subtract")}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={profitValue}
                  onChange={(e) => setProfitValue(e.target.value)}
                  className="h-6 w-16 border-0 bg-transparent text-xs text-center text-slate-100 focus-visible:ring-0"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-6 w-6 p-0 ${profitOperation === "add" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"}`}
                  onClick={() => setProfitOperation("add")}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-emerald-400 hover:bg-emerald-500/20"
                onClick={handleSaveProfit}
                disabled={saving}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-400 hover:bg-slate-800"
                onClick={() => {
                  setIsEditingProfit(false);
                  setProfitValue((trade.profit ?? 0).toString());
                  setProfitOperation("set");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <div className="text-right">
                <div
                  className={`font-mono text-sm font-semibold cursor-pointer hover:opacity-80 ${
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
                  {(isProfit ? "+" : "")}{(trade.profit ?? 0).toFixed(2)} {baseCurrency}
                </div>
                <div className="text-[10px] text-slate-500">
                  Margin: ${trade.margin.toFixed(2)}
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-400 hover:bg-slate-800"
                onClick={() => onEdit(trade)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}