"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel, flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Constants
const PAGE_SIZE = 15;

const TickerTable = () => {
    const [data, setData] = useState([]); // State to hold table data
    const [allData, setAllData] = useState([]); // All data for pagination
    const [searchTerm, setSearchTerm] = useState("");

    // Simulate data fetch (replace this with your actual fetch)
    useEffect(() => {
        // This is where you would fetch data and update state
        // Fetch all tickers from the API
        const fetchTickers = async () => {
            try {
                const response = await fetch("/api/market-search"); // Replace with your API endpoint
                const tickers = await response.json();

                if (!Array.isArray(tickers)) {
                    console.error("Expected tickers to be an array, but got:", tickers);
                    return;
                }

                // Store all data in the state
                setAllData(tickers);
                // Limit the number of rows on the client-side based on the PAGE_SIZE
                setData(tickers.slice(0, PAGE_SIZE)); // Show only the first PAGE_SIZE rows initially
            } catch (error) {
                console.error("Error fetching tickers:", error);
            }
        };
        fetchTickers()
        // After fetching, update the state

    }, []);

    // Handle Load More functionality
    const loadMore = () => {
        const nextData = allData.slice(data.length, data.length + PAGE_SIZE);
        setData((prevData) => [...prevData, ...nextData]);
    };

    // Define table columns
    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: "name",
            header: "Nombre",
            cell: ({ row }) => (
                <div className="relative text-sm gap-2 flex items-center font-medium">
                    <div className={`symbol_zoom_mobile symbol-${row.getValue("name").toUpperCase()}`}></div>
                    {row.getValue("name").toUpperCase()}
                </div>
            ),
        },
        {
            accessorKey: "price",
            header: "Precio",
            cell: ({ row }) => {
                const ticker = row.original;
                const isUp = ticker.price > (ticker.prevPrice || 0);
                const isDown = ticker.price < (ticker.prevPrice || 0);
                const color = isUp ? "text-green-500" : isDown ? "text-red-500" : "text-gray-500";

                return (
                    <span className={`font-bold ${color}`}>
                        {ticker.price.toFixed(2)}
                        {isUp && " ↑"}
                        {isDown && " ↓"}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Accion",
            cell: ({ row }) => (
                <Button
                    variant="default"
                    className="w-full bg-sidebar-accent sm:w-auto px-1.5 py-1"
                    onClick={() => {
                        window.location.href = `/trade/${row.original.name}`;
                    }}
                >
                    Trade
                </Button>
            ),
        },
    ], []);

    // Use React Table
    const table = useReactTable({
        data, // Pass updated `data` to the table
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Trigger table update when `data` changes (you can add other dependencies if needed)
    useEffect(() => {
        // This ensures that the table will update when data changes
        table.setOptions((prev) => ({
            ...prev,
            data, // Make sure `data` is the latest when setting table options
        }));
    }, [data, table]);

    return (
        <div className={"w-full mx-auto"}>
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                <Input
                    type="text"
                    placeholder="Search ticker..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-1/3"
                />
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
                <table className="table-auto w-full border-collapse">
                    <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} className="border p-2 text-sm sm:text-base">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>
                    <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-100">
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="border p-2 text-sm sm:text-base">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Load More Button */}
            <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={loadMore} disabled={data.length >= allData.length}>
                    See More
                </Button>
            </div>
        </div>
    );
};

export default TickerTable;
