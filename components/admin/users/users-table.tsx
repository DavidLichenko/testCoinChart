'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, MoreHorizontal, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { AddUserDialog } from '@/components/admin/users/add-user-dialog'
import { EditUserDialog } from './edit-user-dialog'
import { updateBulkUsers } from '@/app/(controlpanel)/admin/users/actions'
import React from 'react';
import { AssignToDialog } from './assign-to-dialog'

enum UserStatus {
  WRONGNUMBER = "WRONGNUMBER",
  WRONGINFO = "WRONGINFO",
  CALLBACK = "CALLBACK",
  LOWPOTENTIAL = "LOWPOTENTIAL",
  HIGHPOTENTIAL = "HIGHPOTENTIAL",
  NOTINTERESTED = "NOTINTERESTED",
  DEPOSIT = "DEPOSIT",
  TRASH = "TRASH",
  DROP = "DROP",
  NEW = "NEW",
  RESIGN = "RESIGN",
  COMPLETED = "COMPLETED"
}

interface User {
  id: string
  name: string | null
  email: string
  number: string
  role: string
  status: UserStatus
  balance: { usd: number }[]
  TotalBalance: number | null
}

interface UsersTableProps {
  initialUsers: User[]
  userRole: string
  userId: string
}

export function UsersTable({ initialUsers, userRole, userId }: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }) => (
          <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
          />
      ),
      cell: ({ row }) => (
          <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
          />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.getValue('name') || 'N/A',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'number',
      header: 'Phone Number',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as UserStatus
        return (
            <Badge
                variant={
                  status === UserStatus.NEW ? 'default' :
                      status === UserStatus.DEPOSIT ? 'success' :
                          status === UserStatus.HIGHPOTENTIAL ? 'warning' :
                              status === UserStatus.TRASH || status === UserStatus.DROP ? 'destructive' :
                                  'secondary'
                }
            >
              {status.toLowerCase()}
            </Badge>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        return (
            <Badge variant="outline">
              {role.toLowerCase()}
            </Badge>
        )
      },
    },
    {
      accessorKey: 'balance',
      header: 'Balance (USD)',
      cell: ({ row }) => {
        const balanceAmount = row.original.balance?.[0]?.usd ?? row.original.TotalBalance ?? 0
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(balanceAmount)
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original

        return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                  Show Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/users/${user.id}`, {
                          method: 'DELETE',
                        })

                        if (!response.ok) {
                          throw new Error('Failed to delete user')
                        }

                        setUsers(users.filter(u => u.id !== user.id))
                        toast({
                          title: 'Success',
                          description: 'User deleted successfully.',
                        })
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description: 'Failed to delete user.',
                          variant: 'destructive',
                        })
                      }
                    }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        )
      },
    },
  ]

  const memoizedData = React.useMemo(() => users, [users])

  const table = useReactTable({
    data: memoizedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(user =>
        user.id === updatedUser.id ? updatedUser : user
    ))
  }

  const handleBulkUpdate = async (updateType: 'role' | 'status', value: string) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedIds = selectedRows.map(row => row.original.id)

    if (selectedIds.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to update.',
        variant: 'destructive',
      })
      return
    }

    // Optimistically update the UI
    setUsers(prevUsers => prevUsers.map(user =>
        selectedIds.includes(user.id) ? { ...user, [updateType]: value } : user
    ))

    try {
      const result = await updateBulkUsers(selectedIds, { [updateType]: value })
      if (!result.success) {
        throw new Error(result.error)
      }
      toast({
        title: 'Success',
        description: `Updated ${selectedIds.length} users.`,
      })
    } catch (error) {
      // Revert the changes if the API call fails
      setUsers(prevUsers => [...prevUsers])
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update users',
        variant: 'destructive',
      })
    }

    // Clear selection after update
    table.toggleAllPageRowsSelected(false)
  }

  return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
              placeholder="Filter users..."
              value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                  table.getColumn('email')?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                View <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                            }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                    )
                  })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>

        {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Change Role <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkUpdate('role', 'USER')}>User</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUpdate('role', 'WORKER')}>Worker</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUpdate('role', 'ADMIN')}>Admin</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUpdate('role', 'OWNER')}>Owner</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Change Status <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.values(UserStatus).map(status => (
                      <DropdownMenuItem key={status} onClick={() => handleBulkUpdate('status', status)}>
                        {status.toLowerCase()}
                      </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(true)}
              >
                Assign To Worker
              </Button>
            </div>
        )}

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
                              {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                              )}
                            </TableCell>
                        ))}
                      </TableRow>
                  ))
              ) : (
                  <TableRow>
                    <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2">
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

        <AddUserDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            onSuccess={(newUser) => {
              setUsers([newUser, ...users])
              setIsAddOpen(false)
            }}
        />

        <EditUserDialog
            user={editingUser}
            open={!!editingUser}
            onOpenChange={(open) => {
              if (!open) setEditingUser(null)
            }}
            onSuccess={handleUserUpdate}
        />
        <AssignToDialog
            open={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
            selectedUsers={table.getFilteredSelectedRowModel().rows.map(row => row.original)}
            onSuccess={() => {
              table.toggleAllPageRowsSelected(false)
              router.refresh()
            }}
        />
      </div>
  )
}

