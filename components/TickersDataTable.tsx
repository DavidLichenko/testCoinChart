"use client";

import React, { useState, useMemo } from "react";
import {
    createColumnHelper,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    filterFns, flexRender,
} from "@tanstack/react-table";
import {Input} from "@nextui-org/input";
import {SearchIcon} from "lucide-react";
import Image from "next/image";

const data = [
    { market: "ATOMUSD", sell: 7.3150, buy: 7.5750 },
    { market: "AUDCAD", sell: 0.89463, buy: 0.89534 },
    { market: "AUDCHF", sell: 0.56449, buy: 0.56548 },
    { market: "AUDJPY", sell: 98.383, buy: 98.455 },
    { market: "AUDNZD", sell: 1.10635, buy: 1.10736 },
    { market: "AUDUSD", sell: 0.62434, buy: 0.62454 },
    { market: "BRENT-MAR25", sell: 76.21, buy: 76.26 },
];

function GlobalFilter({ globalFilter, setGlobalFilter }) {
    return (
        <Input
            type="text"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search markets..."
            className="py-2 bg-background w-full mb-4"
            variant={'bordered'}
            radius={'md'}
            endContent={<SearchIcon />}
        />
    );
}

const MarketTable = () => {
    const [globalFilter, setGlobalFilter] = useState("");

    const columnHelper = createColumnHelper();
    const columns = [
            columnHelper.accessor("market", {
                header: "Mercado",
                cell: (info) => (
                    <div className={'flex relative -left-5 items-center'}><Image className={'relative -left-2'} width={32} height={32} src={'https://axaforex.com/images/feature/eurusd.svg'} alt={''}/><p
                        className={'font-bold'}>{info.getValue()}</p></div>
                )

            }),
            columnHelper.accessor("sell", {
                header: "Vender",
                cell: (info) => info.getValue().toFixed(5),
            }),
            columnHelper.accessor("buy", {
                header: "Comprar",
                cell: (info) => info.getValue().toFixed(5),
            }),
    ]
    const table = useReactTable({
        data,
        columns,
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: filterFns.includesString, // Default "includes" filter function
    });


    return (
        <div className="min-w-full rounded-md text-white">
            <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
            <table className="w-full text-left border-collapse">
                <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="bg-gray-700">
                        {headerGroup.headers.map((header) => (
                            // @ts-ignore
                            <th key={header.id} className="p-2">
                                {header.isPlaceholder ? null : header.column.columnDef.header}
                            </th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-600">
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-4 w-full">
                                {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default MarketTable;
