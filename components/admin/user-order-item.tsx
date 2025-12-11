"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Copy } from "lucide-react";
import { toast } from "@/components/toast";

interface UserOrder {
  id: string;
  type: "DEPOSIT" | "WITHDRAW";
  status: string;
  amount: number;
  createdAt: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  cryptoAsset?: string;
}

interface UserOrderItemProps {
  order: UserOrder;
  onEdit: (order: UserOrder) => void;
}

export function UserOrderItem({ order, onEdit }: UserOrderItemProps) {
  const isCryptoWithdraw = order.type === "WITHDRAW" && order.cryptoAddress;

  const handleCopyAddress = () => {
    if (order.cryptoAddress) {
      navigator.clipboard.writeText(order.cryptoAddress);
      toast({ 
        title: "Copied!", 
        description: "Crypto address copied to clipboard" 
      });
    }
  };

  return (
    <div
      className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 hover:bg-slate-900 transition-colors cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge
            className={`rounded-full px-2 text-[10px] ${
              order.type === "DEPOSIT"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-sky-500/15 text-sky-300"
            }`}
          >
            {order.type}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-slate-700 bg-slate-950/80 px-2 text-[10px] text-slate-300"
          >
            {order.status}
          </Badge>
        </div>
        <div className="mt-0.5 text-[11px] text-slate-400">
          {new Date(order.createdAt).toLocaleString()}
        </div>
        {isCryptoWithdraw && (
          <div className="mt-1 text-[10px] text-slate-500 space-y-0.5">
            {order.cryptoAsset && (
              <div>Asset: <span className="text-slate-400">{order.cryptoAsset}</span></div>
            )}
            {order.cryptoNetwork && (
              <div>Network: <span className="text-slate-400">{order.cryptoNetwork}</span></div>
            )}
            {order.cryptoAddress && (
              <div className="flex items-center gap-1">
                <span>Address:</span>
                <span className="text-slate-400 font-mono truncate max-w-[120px]">
                  {order.cryptoAddress}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyAddress();
                  }}
                  className="p-0.5 hover:bg-slate-800 rounded transition-colors"
                >
                  <Copy className="h-2.5 w-2.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="ml-3 flex items-center gap-2">
        <div className="text-right">
          <div className="text-xs font-semibold text-slate-100">
            ${order.amount.toFixed(2)}
          </div>
        </div>
        <Button 
          size="sm" 
          variant="ghost"
          className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          onClick={() => onEdit(order)}
        >
          <Edit3 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}