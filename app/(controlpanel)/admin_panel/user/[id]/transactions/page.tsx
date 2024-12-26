'use client'
import React, {useEffect, useRef, useState} from 'react';
import {Selection} from '@nextui-org/react';
import {Skeleton} from "@/components/ui/skeleton";
import {Table, TableHeader,  TableBody, TableRow, TableCell} from "@/components/ui/table";
import {useAsyncList} from "@react-stately/data";
import {Spinner} from "@nextui-org/spinner";
import {GetTradeTransaction, GetUserTransById} from "@/actions/form";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable
} from "@tanstack/react-table";
import Link from "next/link";
import {TableHead} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList, navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import {Input} from "@/components/ui/input";
const HistoryTable = ({
                          params,
                      }: {
    params: Promise<{ id: string }>
}) => {
    const [data,setData] = useState([])
    const [isLoading, setIsLoading] = React.useState(true);
    const [openIn,setOpenIn] = useState(0);
    const [volume,setVolume] = useState(0);
    const [sorting, setSorting] = React.useState([
        {
            id: "createdAt", // Must be equal to the accessorKey of the coulmn you want sorted by default
            desc: true,
        },
    ])
    const [currentVolume,setCurrentVolume] = useState();
    // @ts-ignore
    const id = (params).id
    const EditVolume = row => {
        const [volumeInput,setVolumeInput] = useState({ value: row.getValue("volume"), id:row.id })
        const handleChange = (e) => {
            // setVolumeInput(e.target.value)
            const currVal = e.target.value
            // setCurrentVolume(currVal);
            setVolumeInput(prev => ({
                value: currVal,
                id:prev.id
            }));
        }
        console.log(row)
        return (
            <Input
                key={'volume'}
                id={row.id}
                // defaultValue={row.getValue("volume")}
                onChange={(e)=>{handleChange(e)}}
                value={volumeInput.value}
            />
        )

    }
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
            accessorKey: "type",
            header: () => <div>Type</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("type")}</div>
            }
        },
        {
            accessorKey: "volume",
            header: () => <div>Volume</div>,
            cell: ({ row }) => <EditVolume {...row} />

        },
        {
            accessorKey: "openIn",
            header: () => <div>Open Price</div>,
            cell: ({ row }) => {
                return <Input className="font-medium" defaultValue={row.getValue("openIn")}/>
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
                // @ts-ignore
                return <div className="font-medium">{(row.getValue("stopLoss")).toFixed(2)}</div>
            }
        },
        {
            accessorKey: "takeProfit",
            header: () => <div>TP</div>,
            cell: ({ row }) => {
                // @ts-ignore
                return <div className="font-medium">{(row.getValue("takeProfit")).toFixed(2)}</div>
            }
        },
        {
            accessorKey: "profit",
            header: () => <div>Profit</div>,
            cell: ({ row }) => {
                return <div className="font-medium">{row.getValue("profit")}</div>
            }
        },
        {
            accessorKey: "actions",
            header: () => <div>Actions</div>,
            cell: ({ row }) => {
                return <Button
                    variant={'outline'}
                    className="font-medium hover:bg-success-300"
                    onClick={()=>{
                        // table.row
                        console.log(table.getRow(row.id).getValue('id'))
                        console.log(currentVolume)
                    }}>Change Order</Button>
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
            let res = await GetUserTransById(window.location.pathname.split("/")[window.location.pathname.split("/").length-2]);
            if(!res) {
                setData([])
                setIsLoading(false)
                return false
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
        console.log(window.location.pathname.split("/")[window.location.pathname.split("/").length-2])
        return ()=>  {
            setIsLoading(true);
            setData([])
        }

    },[])

    let count = 0;

    const table = useReactTable({
        data,
        columns,

        getCoreRowModel: getCoreRowModel(),
        enableSorting:true,
        sortDescFirst: true,
        getSortedRowModel: getSortedRowModel(),
        enableRowSelection: true,
        getPaginationRowModel: getPaginationRowModel(),
        state:{
            sorting
        }
    })
    const items = [
        {
            title: "User",
            url: '/',
            baseUrl:'/admin_panel/user/'

        },
        {
            title: "Transaction",
            url: '/transactions',
            baseUrl:'/admin_panel/user/'

        },
        {
            title: "Verification",
            url: "/verification",
            baseUrl:'/admin_panel/user/'

        },
        {
            title: "Live Chat",
            url: "/chat",
            baseUrl:'/admin_panel/user/'

        },
        {
            title: "Settings",
            url: "/admin_panel/settings",
            baseUrl:'/admin_panel/user/'

        }
    ]
    return (
        <div className="h-screen">
            <header className='flex w-[80%] mx-auto h-[15%] justify-center items-center'>
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem className='flex gap-12'>
                            {items.map((item, index) => (
                                <Link href={'' + item.baseUrl  + id + item.url} legacyBehavior passHref key={index}>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                        {item.title}
                                    </NavigationMenuLink>
                                </Link>
                            ))}

                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </header>
            <div className="flex w-full min-h-60 mb-3">
                {isLoading ? (
                        <Skeleton className='min-h-60 w-full'>
                        </Skeleton>
                    ) :
                    <Table className={'h-full w-[80%] mx-auto'}>
                        <TableHeader
                            // @ts-ignore
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
                                            className="h-24 text-center"
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
        </div>
    );
}

export default HistoryTable;
