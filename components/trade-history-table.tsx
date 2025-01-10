'use client'

import { useState, useCallback } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { type Trade_Transaction } from '@prisma/client'
import { closeAllTransactions, closeTransaction } from '@/actions/closeTransactions'

interface TradeHistoryTableProps {
  data: Trade_Transaction[]
  refreshTransactions: () => Promise<void>
}

export function TradeHistoryTable({ data, refreshTransactions }: TradeHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Trade_Transaction | null>(null)
  const [columnFilters, setColumnFilters] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSE'>('OPEN')

  const handleCloseTransaction = useCallback(async (id: string) => {
    const result = await closeTransaction(id)
    if (result.success) {
      toast({
        title: "Transaction Closed",
        description: result.message,
      })
      await refreshTransactions()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }, [refreshTransactions])

  const columns: ColumnDef<Trade_Transaction>[] = [
    {
      accessorKey: 'ticker',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.getValue('ticker')}</div>,
    },
    {
      accessorKey: 'margin',
      header: 'Volume',
      cell: ({ row }) => <div className="text-right">${row.getValue('margin')}</div>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as Trade_Transaction['type']
        return (
            <Badge variant={type === 'BUY' ? 'default' : 'destructive'}>
              {type}
            </Badge>
        )
      },
    },
    {
      accessorKey: 'profit',
      header: 'Profit',
      cell: ({ row }) => {
        const profit = row.getValue('profit') as number
        return (
            <div className={`text-right ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${profit?.toFixed(2) ?? '0.00'}
            </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const transaction = row.original
        return (
            <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseTransaction(transaction.id)
                }}
                disabled={transaction.status === 'CLOSE'}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      globalFilter: statusFilter,
    },
    globalFilterFn: (row, _, filterValue) => {
      return row.original.status === filterValue
    },
  })

  const handleCloseAllTransactions = async () => {
    const result = await closeAllTransactions()
    if (result.success) {
      toast({
        title: "All Transactions Closed",
        description: result.message,
      })
      await refreshTransactions()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  return (
      <div className="space-y-4">
        <div className="flex justify-between items-start  mt-20">
          <div className="flex flex-col items-start justify-center  gap-4">

            <h1 className="text-2xl font-bold">Transactions</h1>

            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Filter
                    <ChevronDown className="ml-2 h-4 w-4"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => table.getColumn('type')?.setFilterValue('BUY')}>
                    Buy Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => table.getColumn('type')?.setFilterValue('SELL')}>
                    Sell Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem
                      onClick={() => table.getColumn('profit')?.setFilterValue((value: number) => value >= 0)}>
                    Profitable
                  </DropdownMenuItem>
                  <DropdownMenuItem
                      onClick={() => table.getColumn('profit')?.setFilterValue((value: number) => value < 0)}>
                    Loss
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Button onClick={handleCloseAllTransactions}>Close All Transactions</Button>
        </div>

        <Tabs defaultValue="OPEN" onValueChange={(value) => setStatusFilter(value as 'OPEN' | 'CLOSE')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="OPEN">Open</TabsTrigger>
            <TabsTrigger value="CLOSE">Closed</TabsTrigger>
          </TabsList>
          <TabsContent value="OPEN">
            <div className="rounded-md border mt-2">
              <TransactionTable table={table} setSelectedTransaction={setSelectedTransaction}/>
            </div>
          </TabsContent>
          <TabsContent value="CLOSE">
            <div className="rounded-md border mt-2">
              <TransactionTable table={table} setSelectedTransaction={setSelectedTransaction}/>
            </div>
          </TabsContent>
        </Tabs>


        <TransactionDetailsDialog
            selectedTransaction={selectedTransaction}
            setSelectedTransaction={setSelectedTransaction}
        />
      </div>
  )
}

function TransactionTable({
                            table,
                            setSelectedTransaction
                          }: {
  table: ReturnType<typeof useReactTable>,
  setSelectedTransaction: (transaction: Trade_Transaction) => void
}) {
  return (
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                          )}
                    </TableHead>
                ))}
              </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
              <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedTransaction(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                ))}
              </TableRow>
          ))}
        </TableBody>
      </Table>
  )
}

function TransactionDetailsDialog({
                                    selectedTransaction,
                                    setSelectedTransaction
                                  }: {
  selectedTransaction: Trade_Transaction | null,
  setSelectedTransaction: (transaction: Trade_Transaction | null) => void
}) {
  return (
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
              <div className="grid grid-cols-2  gap-4">
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <Badge variant={selectedTransaction.status === 'OPEN' ? 'default' : 'secondary'}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium">Type</div>
                  <Badge variant={selectedTransaction.type === 'BUY' ? 'default' : 'destructive'}>
                    {selectedTransaction.type}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium">Ticker</div>
                  <div>{selectedTransaction.ticker}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Volume</div>
                  <div>${selectedTransaction.volume}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Leverage</div>
                  <div>{selectedTransaction.leverage}x</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Profit</div>
                  <div className={selectedTransaction.profit && selectedTransaction.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                    ${selectedTransaction.profit?.toFixed(2) ?? '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Open Price</div>
                  <div>${selectedTransaction.openIn}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Close Price</div>
                  <div>${selectedTransaction.closeIn ?? 'Not closed'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Take Profit</div>
                  <div>${selectedTransaction.takeProfit ?? 'Not set'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Stop Loss</div>
                  <div>${selectedTransaction.stopLoss ?? 'Not set'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Created At</div>
                  <div>{new Date(selectedTransaction.createdAt).toLocaleString()}</div>
                </div>
                {selectedTransaction.endAt && (
                    <div>
                      <div className="text-sm font-medium">Closed At</div>
                      <div>{new Date(selectedTransaction.endAt).toLocaleString()}</div>
                    </div>
                )}
              </div>
          )}
        </DialogContent>
      </Dialog>
  )
}

