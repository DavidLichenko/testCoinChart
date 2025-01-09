"use client"
import React, {useRef, useState, useEffect} from 'react';
import AdminSidebar from "@/components/AdminSidebar";

import {MdHdrPlus, MdPlusOne, MdSearch} from "react-icons/md";
import {  Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow} from "@/components/ui/table";
import {Input} from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"
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
} from "@tanstack/react-table"
import {
    ArrowUpCircle, ArrowUpDown,
    CheckCircle2, ChevronDown,
    Circle,
    HelpCircle,
    LucideIcon, MoreHorizontal, PlusCircleIcon,
    XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {PlusCircledIcon} from "@radix-ui/react-icons";
import {
    DropdownMenu, DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {GetAllUsers, GetCurrentUser} from "@/actions/form";

type Status = {
    value: string
    label: string
    icon: LucideIcon
}

const statuses: Status[] = [
    {
        value: "Wrong Number",
        label: "Wrong Number",
        icon: HelpCircle,
    },
    {
        value: "Wrong Info",
        label: "Wrong Info",
        icon: Circle,
    },
    {
        value: "Call Backs",
        label: "Call Back",
        icon: ArrowUpCircle,
    },
    {
        value: "Low Potential",
        label: "Low Potential",
        icon: CheckCircle2,
    },
    {
        value: "High Potential",
        label: "High Potential",
        icon: XCircle,
    },
    {
        value: "Not Interested",
        label: "Not Interested",
        icon: XCircle,
    },
    {
        value: "Deposit",
        label: "Deposit",
        icon: XCircle,
    },
    {
        value: "Trash",
        label: "Trash",
        icon: XCircle,
    },
    {
        value: "Drop",
        label: "Drop",
        icon: XCircle,
    },
    {
        value: "New",
        label: "New",
        icon: XCircle,
    },
    {
        value: "Resign",
        label: "Resign",
        icon: XCircle,
    },
    {
        value: "Completed",
        label: "Completed",
        icon: XCircle,
    },
]


export type Users = {
    //
    // id: string
    // fullname: string
    // email: string
    // status: "WrongNumber" | "WrongInfo" | "CallBack" | "LowPotential" | "HighPotential" | "NotInterested" | "Deposit" | "Trash" | "Drop" | "New" | "Resign" | "Completed"
    id: string;
    name: string;
    role: "USER"|"ADMIN"|"WORKER"|"TEAMLEAD";
    status:"WrongNumber" | "WrongInfo" | "CallBack" | "LowPotential" | "HighPotential" | "NotInterested" | "Deposit" | "Trash" | "Drop" | "New" | "Resign" | "Completed";
    email: string;
    password: string;
    imageUrl: string;
    provider: string;
    providerId: string;
    createdAt: Date;
    updatedAt: Date;
    isVerif: boolean;
    TotalBalance: number;
}


const columns: ColumnDef<Users>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                // @ts-ignore
                checked={
                    table?.getIsAllPageRowsSelected() ||
                    (table?.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => {row.toggleSelected(!!value)}}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: () => <div>ID</div>,
        cell: ({ row }) => {
            return <Link key={row.id} href={'/admin_panel/user/' + row.getValue("id")}>{row.getValue("id")}</Link>
        }
    },
    {
        accessorKey: "name",
        header: () => <div>FullName</div>,
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue("name")}</div>
        },
    },

    {
        accessorKey: "email",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Email
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("status")}</div>
        ),
    }
]

function DataTableDemo() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [data,setData] = useState([])
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState<any>({})

    const [globalFilter, setGlobalFilter] = useState<any>([]);
    useEffect(()=>{
        const getUsers = async() =>{
            const users = await GetAllUsers()
            // @ts-ignore
            const datas:Users[] = users
            const currentUser = await GetCurrentUser()
            console.log(currentUser)
            setData(datas)
            console.log(users)
        }
        getUsers()
    },[])
    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange:setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            globalFilter,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                {/*<Input*/}
                {/*    placeholder="Filter emails..."*/}
                {/*    value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}*/}
                {/*    onChange={(event) =>*/}
                {/*        table.getColumn("email")?.setFilterValue(event.target.value)*/}
                {/*    }*/}
                {/*    className="max-w-sm"*/}
                {/*/>*/}
                <div>
                    <Input
                        className='flex w-48 h-9'
                        // value={(table.getAllColumns().values())}
                        value={globalFilter ?? ''}
                        onChange={(e) => table.setGlobalFilter(String(e.target.value))
                        }
                        placeholder={'Search Leads...'}/>
                </div>
                {/*<div className={'flex ml-6'}>*/}
                {/*    <ComboboxPopover rowSelection={Object.keys(rowSelection).length}/>*/}
                {/*</div>*/}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown/>
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
            </div>
            <div className="rounded-md border max-h-[80vh]">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}  className={'sticky top-0 z-50'}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="overflow-y-scroll">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (

                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}

                                >
                                    {row.getVisibleCells().map((cell) => (

                                        <TableCell key={cell.id} className={'py-5'}>
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
        </div>
    )
}

const Page = () => {
    const [checkboxes,setCheckboxes] = useState([])
    const table = useRef();
    console.log(table)
    return (
        <AdminSidebar>
            <div className="w-[80%] h-screen mx-auto">
                <div className="flex justify-between items-center gap-12">
                    <div className={'flex justify-center items-center mt-12 mb-6'}>
                        {/*<div>*/}
                        {/*    <Input*/}
                        {/*        className='flex w-48 h-9'*/}
                        {/*        placeholder={'Search Leads...'}/>*/}
                        {/*</div>*/}
                        {/*<div className={'flex ml-6'}>*/}
                        {/*    <ComboboxPopover/>*/}
                        {/*</div>*/}
                    </div>
                    {/*<span className={'font-mono'}>Total leads: {data.length}</span>*/}
                </div>
                <div className="flex-col gap-12">
                    <div className="mx-2 py-2">Leads</div>
                    <DataTableDemo/>
                    {/*<Table title={'Leads'} ref={table} >*/}
                    {/*    <TableHeader>*/}
                    {/*        <TableRow>*/}
                    {/*            <TableHead><Checkbox  /></TableHead>*/}
                    {/*            <TableHead>ID</TableHead>*/}
                    {/*            <TableHead>Full Name</TableHead>*/}
                    {/*            <TableHead>Email</TableHead>*/}
                    {/*            <TableHead>Status</TableHead>*/}
                    {/*        </TableRow>*/}
                    {/*    </TableHeader>*/}
                    {/*    <TableBody>*/}
                    {/*        {leads.map((lead,index) => (*/}
                    {/*            <TableRow  key={index}>*/}
                    {/*                <TableCell className="font-medium"><Checkbox id="terms" /></TableCell>*/}
                    {/*                <TableCell className="font-medium">{index}</TableCell>*/}
                    {/*                <TableCell height={'80px'}>{lead.fullname}</TableCell>*/}
                    {/*                <TableCell>{lead.email}</TableCell>*/}
                    {/*                <TableCell>{lead.status}</TableCell>*/}
                    {/*            </TableRow>*/}
                    {/*        ))}*/}
                    {/*    </TableBody>*/}
                    {/*</Table>*/}
                </div>
            </div>
        </AdminSidebar>
    );
};

export default Page;