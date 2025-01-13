'use client'

import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { CreateOrderDialog } from './create-order-dialog'
import { EditOrderDialog } from './edit-order-dialog'
import { Badge } from '@/components/ui/badge'

interface Order {
  id: string
  status: 'PENDING' | 'SUCCESSFUL' | 'CANCELLED'
  type: 'DEPOSIT' | 'WITHDRAW'
  amount: number
  userId: string
  createdAt: string
  updatedAt: string
  User: {
    email: string
  }
  depositFrom?: string
  withdrawMethod?: string
  bankName?: string
  cryptoAddress?: string
  cryptoNetwork?: string
  cardNumber?: string
}

interface OrdersTableProps {
  initialOrders: Order[]
}

export function OrdersTable({ initialOrders }: OrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const { toast } = useToast()

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'id',
      header: 'Order ID',
    },
    {
      accessorKey: 'User.email',
      header: 'User',
      cell: ({ row }) => row.original.User.email,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
          <Badge variant={row.original.type === 'DEPOSIT' ? 'default' : 'secondary'}>
            {row.original.type}
          </Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
    },
    {
      accessorKey: 'withdrawMethod',
      header: 'Method',
      cell: ({ row }) => {
        if (row.original.type === 'DEPOSIT') {
          return row.original.depositFrom || '-'
        }
        return row.original.withdrawMethod || '-'
      },
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const order = row.original
        if (order.type === 'WITHDRAW') {
          switch (order.withdrawMethod) {
            case 'Bank':
              return order.bankName || '-'
            case 'Crypto':
              return `${order.cryptoAddress?.slice(0, 6)}...${order.cryptoAddress?.slice(-4)} (${order.cryptoNetwork})`
            case 'Card':
              return `Card ending in ${order.cardNumber?.slice(-4)}`
            default:
              return '-'
          }
        }
        return '-'
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
          <Badge variant={
            row.original.status === 'PENDING' ? 'default' :
                row.original.status === 'SUCCESSFUL' ? 'success' : 'destructive'
          }>
            {row.original.status}
          </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
          <Button variant="ghost" onClick={() => setEditingOrder(row.original)}>
            Edit
          </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Input
              placeholder="Filter orders..."
              value={(table.getColumn('User.email')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                  table.getColumn('User.email')?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
          />
          <Button onClick={() => setIsCreateOpen(true)}>Create Order</Button>
        </div>

        <div className="rounded-md border">
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
              {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                      <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                      </TableRow>
                  ))
              ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>

        <CreateOrderDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSuccess={(newOrder) => {
              setOrders(prevOrders => [newOrder, ...prevOrders])
              toast({
                title: 'Success',
                description: 'Order created successfully',
              })
            }}
        />

        <EditOrderDialog
            order={editingOrder}
            open={!!editingOrder}
            onOpenChange={(open) => !open && setEditingOrder(null)}
            onSuccess={(updatedOrder) => {
              setOrders(prevOrders => prevOrders.map(order =>
                  order.id === updatedOrder.id ? updatedOrder : order
              ))
              toast({
                title: 'Success',
                description: 'Order updated successfully',
              })
            }}
        />
      </div>
  )
}

