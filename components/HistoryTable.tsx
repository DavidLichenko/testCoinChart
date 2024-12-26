'use client'
import React, {useEffect, useRef, useState} from 'react';
import {Selection} from '@nextui-org/react';
import {Skeleton} from "@/components/ui/skeleton";
import {Table, TableHeader,  TableBody, TableRow, TableCell} from "@/components/ui/table";
import {useAsyncList} from "@react-stately/data";
import {Spinner} from "@nextui-org/spinner";
import {GetTradeTransaction} from "@/actions/form";
import {ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, getSortedRowModel} from "@tanstack/react-table";
import Link from "next/link";
import {TableHead} from "@/components/ui/table";
import {Button} from "@/components/ui/button";

const HistoryTable = ({ticker,orderToParent, closeOrder, currentPrice, counter}) => {
    function calculateProfitLossBUY(volumeEUR, entryPrice, exitPrice) {
        const priceDifference = exitPrice - entryPrice;
        const profitLoss = (volumeEUR * priceDifference);
        return profitLoss.toFixed(2);

    }
    function calculateProfitLossSELL(volumeEUR, entryPrice, exitPrice) {
        const priceDifference =  entryPrice - exitPrice;
        const profitLoss = (volumeEUR * priceDifference) ;
        return profitLoss.toFixed(2);

    }
    const [data,setData] = useState([])
    const [isLoading, setIsLoading] = React.useState(true);
    const [prevTicker,setPrevTicker] = useState(ticker)
    const [selectedRow, setSelectedRow] = useState({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [sorting, setSorting] = React.useState([
        {
            id: "createdAt", // Must be equal to the accessorKey of the coulmn you want sorted by default
            desc: true,
        },
    ])
    const columns:  ColumnDef<Transactions>[] =[
        {
            accessorKey: "ticker",
            header: () => <div>Symbol</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("ticker")}</div>
            }
        },
        {
            accessorKey: "id",
            header: () => <div>Token</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("id")}</div>
            }
        },
        {
            accessorKey: "leverage",
            header: () => <div>Leverage</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("leverage")}</div>
            }
        },
        {
            accessorKey: "type",
            header: () => <div>Type</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("type")}</div>
            }
        },
        {
            accessorKey: "volume",
            header: () => <div>Volume</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("volume")}</div>
            }
        },
        {
            accessorKey: "openIn",
            header: () => <div>Open Price</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("openIn")}</div>
            }
        },
        {
            accessorKey: "createdAt",
            header: () => <div>Time</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{new Date(row.getValue("createdAt")).toLocaleString()}</div>
            }
        },
        {
            accessorKey: "stopLoss",
            header: () => <div>SL</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("stopLoss")}</div>
            }
        },
        {
            accessorKey: "takeProfit",
            header: () => <div>TP</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("takeProfit")}</div>
            }
        },
        {
            accessorKey: "profit",
            header: () => <div>Profit</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue('type') === 'BUY' ? calculateProfitLossBUY(parseFloat(row.getValue("volume")),parseFloat(row.getValue("openIn")),currentPrice) : calculateProfitLossSELL(parseFloat(row.getValue("volume")),parseFloat(row.getValue("openIn")),currentPrice)}</div>
            }
        },
        {
            accessorKey: "actions",
            header: () => <div>Actions</div>,
            cell: ({ row }) => {
                return <Button
                    variant={'outline'}
                    className="font-medium hover:bg-danger-300"
                    onClick={()=>{
                        closeOrder(table.getRow(row.id).original)

                    }}>Close Order</Button>
            }
        },
    ];
    type Transactions = {
        ticker: string
        id: string
        type: "OPEN"|"CLOSE"
        volume: number
        openIn: string
        createdAt: string
        stopLoss: string
        takeProfit: string
        currentPrice: string
        actions: string
    }
    useEffect(()=> {
        const getData = async() => {
            let res = await GetTradeTransaction(ticker);
            if(!res) {
                setData([])
                setIsLoading(false)
                return;
            }
            let json = await JSON.parse(JSON.stringify(res));

            const arr = []
            arr.push(json)
            if (Array.isArray(json)) {
                const datas:Transactions[] = json
                setData(datas)
                setIsLoading(false);
            } else {
                setData(arr)
                setIsLoading(false);
            }
        }
        getData()

        return ()=>  {
            setIsLoading(true);
            setData([])
        }

    },[ticker,counter])

    let count = 0;

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
        getPaginationRowModel: getPaginationRowModel(),
        enableSorting:true,
        sortDescFirst: true,
        getSortedRowModel: getSortedRowModel(),
        state:{
            sorting
        }
    })
    return (
        <div className="flex w-full h-[250px] pb-3">
            {isLoading ? (
                    <Skeleton className=' h-64 w-full'>
                    </Skeleton>
                ) :
            <Table>
                <TableHeader
                    //@ts-ignore
                    columns={columns}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}  className={'sticky top-0 z-50 bg-background'}>
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
                    {
                        table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (

                                <TableRow
                                    key={row.id}
                                    className={'h-[2px]'}
                                    onClick={(e) => {
                                        if (!row.getIsSelected()) {
                                            table.toggleAllRowsSelected(false); // deselect all.
                                            orderToParent(table.getRow(row.id).original)
                                            row.toggleSelected(true); // reverse selected status of current row.
                                        }
                                    }}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (

                                        <TableCell key={cell.id}>
                                            {isLoading ? (
                                                    <Skeleton className='min-h-60 w-full'>
                                                        <span className="h-full w-full opacity-0">0</span>
                                                    </Skeleton>
                                                ) :

                                                flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )
                                            }
                                        </TableCell>


                                    ))}
                                </TableRow>


                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-2 text-center"
                                >
                                    {isLoading ? (
                                            <Skeleton className='h-60 w-full'>
                                                <span className="h-full w-full opacity-0">0</span>
                                            </Skeleton>
                                        ) :
                                        <span>No results.</span>
                                    }

                                </TableCell>
                            </TableRow>
                        )}
                </TableBody>
            </Table>
                }
        </div>
    );
}

export default HistoryTable;
