'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { Market, MarketType } from '@/types/market'
import { formatNumber, getChangeColor } from '@/lib/market_utils'
import { useDebounce } from '@/hooks/use-debounce'

interface MarketsTableProps {
  data: Market[]
}

export function MarketsTable({ data: initialData }: MarketsTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<MarketType | 'All'>('All')
  const [currentShowed, setCurrentShowed] = useState(10)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const filteredData = useMemo(() => {
    return initialData.filter(market => {
      const matchesSearch = market.symbol.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesType = selectedType === 'All' || market.type === selectedType
      return matchesSearch && matchesType
    })
  }, [initialData, debouncedSearchTerm, selectedType])

  const displayData = filteredData.slice(0, currentShowed)
  console.log(displayData)

  return (
      <div className="w-full h-full">
        <div className="flex flex-col sm:flex-row h-full items-center py-4 gap-4">
          <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
          />
          <Select
              value={selectedType}
              onValueChange={(value: MarketType | 'All') => setSelectedType(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Todo</SelectItem>
              <SelectItem value="Forex">Forex</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
              <SelectItem value="IEX">Stocks</SelectItem>
              <SelectItem value="Metal">Metals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>24h</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((market) => (
                    <TableRow key={market.symbol}>
                      <TableCell className="font-medium">
                        {market.symbol}
                      </TableCell>
                      <TableCell>{formatNumber(market.price)}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${getChangeColor(market.change)}`}>
                          {market.change > 0 ? (
                              <ArrowUpIcon className="w-4 h-4" />
                          ) : (
                              <ArrowDownIcon className="w-4 h-4" />
                          )}
                          {Math.abs(market.change).toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                            variant="secondary"
                            onClick={() => {
                              router.push(`/trade/${market.symbol}?type=${market.type === 'Metal' ? 'Forex' : market.type}`)
                            }
                        }
                        >
                          Trade
                        </Button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentShowed(prev => Math.min(prev + 10, filteredData.length))}
              disabled={currentShowed >= filteredData.length}
          >
            {currentShowed >= filteredData.length ? "Final!" : "Ver mas"}
          </Button>
        </div>
      </div>
  )
}

