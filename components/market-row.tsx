import { ArrowDown, ArrowUp, MoreVertical } from 'lucide-react'
import { MarketData } from "@/types/market"
import { formatNumber } from "@/utils/format-number"

interface MarketRowProps {
  data: MarketData
}

export function MarketRow({ data }: MarketRowProps) {
  const isPositive = data.change >= 0

  return (
    <div className="grid grid-cols-[2fr,1fr,1fr] gap-4 items-center p-4 hover:bg-gray-800/50 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-100">{data.ticker}</span>
      </div>
      <div
        className={`text-center px-3 py-1 rounded ${
          isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
        }`}
      >
        ${formatNumber(data.price, 2)}
        <span className="ml-2 text-xs">
          {isPositive ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />}
          {formatNumber(Math.abs(data.changePercent), 2)}%
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-100">${formatNumber(data.high, 2)}</span>
        <span className="text-sm text-gray-400">{data.volume.toLocaleString()}</span>
        <button className="text-gray-400 hover:text-gray-200">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

