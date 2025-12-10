"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";

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
}

export function UserTradeItem({ trade, onEdit }: UserTradeItemProps) {
  const isProfit = (trade.profit ?? 0) >= 0;
  
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
    <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 hover:bg-slate-900 transition-colors">
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
        <div className="text-right">
          <div
            className={`text-xs font-semibold ${
              isProfit ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {(isProfit ? "+" : "")}$
            {(trade.profit ?? 0).toFixed(2)}
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
      </div>
    </div>
  );
}