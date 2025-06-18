"use client"

import { useEffect, useState, memo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    getSortedRowModel,
} from "@tanstack/react-table"
import { GetTradeTransaction } from "@/actions/form"
import { TrendingUp, TrendingDown, X, Activity } from "lucide-react"

const HistoryTable = memo(function HistoryTable({ ticker, orderToParent, closeOrder, currentPrice, counter }) {
    // Keep all your original variables
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [prevTicker, setPrevTicker] = useState(ticker)
    const [selectedRow, setSelectedRow] = useState({})
    const [rowSelection, setRowSelection] = useState({})
    const [sorting, setSorting] = useState([
        {
            id: "createdAt",
            desc: true,
        },
    ])

    // Your existing calculation functions
    function calculateProfitLossBUY(volumeEUR, entryPrice, exitPrice) {
        const priceDifference = exitPrice - entryPrice
        const profitLoss = volumeEUR * priceDifference
        return profitLoss.toFixed(2)
    }

    function calculateProfitLossSELL(volumeEUR, entryPrice, exitPrice) {
        const priceDifference = entryPrice - exitPrice
        const profitLoss = volumeEUR * priceDifference
        return profitLoss.toFixed(2)
    }

    type Transactions = {
        ticker: string
        id: string
        type: "OPEN" | "CLOSE"
        volume: number
        openIn: string
        createdAt: string
        stopLoss: string
        takeProfit: string
        currentPrice: string
        actions: string
    }

    const columns: ColumnDef<Transactions>[] = [
        {
            accessorKey: "ticker",
            header: () => <div className="font-semibold">Symbol</div>,
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2">
                        <div className={`symbol symbol-${row.getValue("ticker")} w-6 h-6 rounded-full bg-secondary`}></div>
                        <span className="font-medium">{row.getValue("ticker")}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "id",
            header: () => <div className="font-semibold">Token</div>,
            cell: ({ row }) => {
                return <div className="font-mono text-xs">{row.getValue("id")}</div>
            },
        },
        {
            accessorKey: "type",
            header: () => <div className="font-semibold">Type</div>,
            cell: ({ row }) => {
                const type = row.getValue("type")
                return (
                    <Badge variant={type === "BUY" ? "default" : "destructive"} className="font-medium">
                        {type === "BUY" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {type}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "volume",
            header: () => <div className="font-semibold">Volume</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("volume")}</div>
            },
        },
        {
            accessorKey: "leverage",
            header: () => <div className="font-semibold">Leverage</div>,
            cell: ({ row }) => {
                return <div className="font-medium">1:{row.getValue("leverage")}</div>
            },
        },
        {
            accessorKey: "openIn",
            header: () => <div className="font-semibold">Open Price</div>,
            cell: ({ row }) => {
                return <div className="font-medium">${row.getValue("openIn")}</div>
            },
        },
        {
            accessorKey: "createdAt",
            header: () => <div className="font-semibold">Time</div>,
            cell: ({ row }) => {
                return (
                    <div className="text-sm text-muted-foreground">{new Date(row.getValue("createdAt")).toLocaleString()}</div>
                )
            },
        },
        {
            accessorKey: "stopLoss",
            header: () => <div className="font-semibold text-red-600">SL</div>,
            cell: ({ row }) => {
                const sl = row.getValue("stopLoss")
                return sl ? (
                    <div className="font-medium text-red-600">${sl}</div>
                ) : (
                    <div className="text-muted-foreground">-</div>
                )
            },
        },
        {
            accessorKey: "takeProfit",
            header: () => <div className="font-semibold text-green-600">TP</div>,
            cell: ({ row }) => {
                const tp = row.getValue("takeProfit")
                return tp ? (
                    <div className="font-medium text-green-600">${tp}</div>
                ) : (
                    <div className="text-muted-foreground">-</div>
                )
            },
        },
        {
            accessorKey: "profit",
            header: () => <div className="font-semibold">P&L</div>,
            cell: ({ row }) => {
                const profit =
                    row.getValue("type") === "BUY"
                        ? calculateProfitLossBUY(
                            Number.parseFloat(row.getValue("volume")),
                            Number.parseFloat(row.getValue("openIn")),
                            currentPrice,
                        )
                        : calculateProfitLossSELL(
                            Number.parseFloat(row.getValue("volume")),
                            Number.parseFloat(row.getValue("openIn")),
                            currentPrice,
                        )

                const isProfit = Number.parseFloat(profit) >= 0

                return (
                    <div className={`font-medium ${isProfit ? "text-green-500" : "text-red-500"}`}>
                        {isProfit ? "+" : ""}${profit}
                    </div>
                )
            },
        },
        {
            accessorKey: "actions",
            header: () => <div className="font-semibold">Actions</div>,
            cell: ({ row }) => {
                return (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                            closeOrder(table.getRow(row.id).original)
                        }}
                    >
                        <X className="w-3 h-3 mr-1" />
                        Close
                    </Button>
                )
            },
        },
    ]

    const getData = useCallback(async () => {
        try {
            const res = await GetTradeTransaction(ticker)
            if (!res) {
                setData([])
                setIsLoading(false)
                return
            }
            const json = await JSON.parse(JSON.stringify(res))

            const arr = []
            arr.push(json)
            if (Array.isArray(json)) {
                const datas: Transactions[] = json
                setData(datas)
                setIsLoading(false)
            } else {
                setData(arr)
                setIsLoading(false)
            }
        } catch (error) {
            console.error("Error fetching transactions:", error)
            setData([])
            setIsLoading(false)
        }
    }, [ticker])

    useEffect(() => {
        getData()
        return () => {
            setIsLoading(true)
            setData([])
        }
    }, [ticker, counter, getData])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
        getPaginationRowModel: getPaginationRowModel(),
        enableSorting: true,
        sortDescFirst: true,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    })

    return (
        <Card className="w-full h-[300px] border-t">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Trading History
                    </CardTitle>
                    <Badge variant="outline">
                        {data.length} {data.length === 1 ? "Order" : "Orders"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-6">
                        <Skeleton className="h-[200px] w-full" />
                    </div>
                ) : (
                    <ScrollArea className="h-[220px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id} className="h-10">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <motion.tr
                                                key={row.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="border-b hover:bg-secondary/50 cursor-pointer transition-colors"
                                                onClick={(e) => {
                                                    if (!row.getIsSelected()) {
                                                        table.toggleAllRowsSelected(false)
                                                        orderToParent(table.getRow(row.id).original)
                                                        row.toggleSelected(true)
                                                    }
                                                }}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className="py-3">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <Activity className="w-8 h-8 text-muted-foreground mb-2" />
                                                    <span className="text-muted-foreground">No results.</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
})

export default HistoryTable
