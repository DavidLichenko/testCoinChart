'use client'

import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown } from 'lucide-react'
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
import { type Orders } from '@prisma/client'

interface OrderHistoryTableProps {
  data: Orders[]
  refreshOrders: () => Promise<void>
}

export function OrderHistoryTable({ data, refreshOrders }: OrderHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedOrder, setSelectedOrder] = useState<Orders | null>(null)
  const [columnFilters, setColumnFilters] = useState<any[]>([])
  const [orderTypeFilter, setOrderTypeFilter] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')
  console.log(data)
  const columns: ColumnDef<Orders>[] = [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ row }) => <div className="font-medium">{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <div className="text-right">${row.getValue('amount')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Orders['status']
        return (
          <Badge variant={
            status === 'PENDING' ? 'default' :
            status === 'SUCCESSFUL' ? 'success' :
            'destructive'
          }>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => <div>{new Date(row.getValue('createdAt')).toLocaleString()}</div>,
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
      globalFilter: orderTypeFilter,
    },
    globalFilterFn: (row, _, filterValue) => {
      return row.original.type === filterValue
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mt-20">
        <h1 className="text-2xl font-bold">Order History</h1>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Filter Status
                <ChevronDown className="ml-2 h-4 w-4"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('PENDING')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('SUCCESSFUL')}>
                Successful
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.getColumn('status')?.setFilterValue('CANCELLED')}>
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="DEPOSIT" onValueChange={(value) => setOrderTypeFilter(value as 'DEPOSIT' | 'WITHDRAW')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="DEPOSIT">
            <ArrowDownToLine className="mr-2 h-4 w-4"/>
            Deposit
          </TabsTrigger>
          <TabsTrigger value="WITHDRAW">
            <ArrowUpFromLine className="mr-2 h-4 w-4"/>
            Withdraw
          </TabsTrigger>
        </TabsList>
        <TabsContent value="DEPOSIT">
          <div className="rounded-md border mt-2">
            <OrderTable table={table} setSelectedOrder={setSelectedOrder}/>
          </div>
        </TabsContent>
        <TabsContent value="WITHDRAW">
          <div className="rounded-md border mt-2">
            <OrderTable table={table} setSelectedOrder={setSelectedOrder}/>
          </div>
        </TabsContent>
      </Tabs>


      <OrderDetailsDialog
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
      />
    </div>
  )
}

function OrderTable({
  table,
  setSelectedOrder
}: {
  table: ReturnType<typeof useReactTable>,
  setSelectedOrder: (order: Orders) => void
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
            onClick={() => setSelectedOrder(row.original)}
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

function OrderDetailsDialog({
  selectedOrder,
  setSelectedOrder
}: {
  selectedOrder: Orders | null,
  setSelectedOrder: (order: Orders | null) => void
}) {
  return (
    <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        {selectedOrder && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Order ID</div>
              <div>{selectedOrder.id}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Type</div>
              <Badge variant={selectedOrder.type === 'DEPOSIT' ? 'default' : 'secondary'}>
                {selectedOrder.type}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Status</div>
              <Badge variant={
                selectedOrder.status === 'PENDING' ? 'default' :
                selectedOrder.status === 'SUCCESSFUL' ? 'success' :
                'destructive'
              }>
                {selectedOrder.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Amount</div>
              <div>${selectedOrder.amount}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Created At</div>
              <div>{new Date(selectedOrder.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Updated At</div>
              <div>{new Date(selectedOrder.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

