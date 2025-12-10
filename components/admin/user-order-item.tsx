"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";

interface UserOrder {
  id: string;
  type: "DEPOSIT" | "WITHDRAW";
  status: string;
  amount: number;
  createdAt: string;
}

interface UserOrderItemProps {
  order: UserOrder;
  onEdit: (order: UserOrder) => void;
}

export function UserOrderItem({ order, onEdit }: UserOrderItemProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2.5 hover:bg-slate-900 transition-colors">
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