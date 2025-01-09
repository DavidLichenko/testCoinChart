'use client';

import React, { useEffect, useState } from 'react';
import {
    useReactTable,
    ColumnDef,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table';

type MarketRow = {
    id: string;
    name: string;
    category: string;
    price: number;
    change: string; // "up", "down", or "neutral"
};

const MAIN_FOREX_TICKERS = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD',
    'USD/CHF', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
    'EUR/JPY', 'GBP/JPY'
];

const MarketTable = () => {
    const [marketData, setMarketData] = useState<MarketRow[]>([]);
    const [filteredData, setFilteredData] = useState<MarketRow[]>([]);
    const [filter, setFilter] = useState<string>('');
    const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});

    // Fetch data every 5 seconds
    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch('/api/market'); // Replace with your API endpoint
            const forexData = await fetch(`http://srv677099.hstgr.cloud/api/forex`)
            const jsonForex = await forexData.json();
            const data = await res.json();
            const allData = await {...data,
                forex:jsonForex.data,
            }
            console.log(allData)
            const processedData = processMarketData(allData);

            const updatedData = processedData.map((row) => {
                const prevPrice = prevPrices[row.id] ?? row.price;
                const change =
                    row.price > prevPrice ? 'up' :
                        row.price < prevPrice ? 'down' : 'neutral';

                return { ...row, change };
            });

            // Set filteredData to top 10 Forex tickers by default
            setMarketData(updatedData);
            setFilteredData(updatedData.filter(row => MAIN_FOREX_TICKERS.includes(row.name)));

            // Store current prices for the next comparison
            const newPrevPrices: Record<string, number> = {};
            updatedData.forEach((row) => {
                newPrevPrices[row.id] = row.price;
            });
            setPrevPrices(newPrevPrices);
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);

        return () => clearInterval(interval);
    }, []);

    // Handle search filter
    useEffect(() => {
        if (filter) {
            setFilteredData(
                marketData.filter((row) =>
                    row.name.toLowerCase().includes(filter.toLowerCase())
                )
            );
        } else {
            // Reset to Top 10 Forex tickers when filter is empty
            setFilteredData(marketData.filter(row => MAIN_FOREX_TICKERS.includes(row.name)));
        }
    }, [filter, marketData]);

    // Define table columns
    const columns: ColumnDef<MarketRow>[] = [
        {
            accessorKey: 'name',
            header: 'Instrument',
        },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: (info) => {
                const row = info.row.original;
                const color =
                    row.change === 'up' ? 'green' :
                        row.change === 'down' ? 'red' : 'gray';
                return <span style={{ color }}>{info.getValue().toFixed(5)}</span>;
            },
        },
        {
            accessorKey: 'change',
            header: 'Action',
            cell: (info) => {
                const row = info.row.original;
                return (
                    <button
                        onClick={() => handleTrade(row.name)}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Trade
                    </button>
                );
            },
        },
    ];

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    // Handle trade button click
    const handleTrade = (ticker: string) => {
        alert(`Redirecting to trade window for ${ticker}`);
        // Implement your trade window logic here
    };

    return (
        <div>
            <h2>Market Table</h2>

            {/* Filter input */}
            <div style={{ marginBottom: '16px' }}>
                <label htmlFor="filter">Filter by Instrument: </label>
                <input
                    id="filter"
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                    }}
                    placeholder="Search instrument (e.g., EUR/USD)"
                />
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <th
                                key={header.id}
                                style={{
                                    textAlign: 'left',
                                    padding: '8px',
                                    borderBottom: '2px solid #ccc',
                                }}
                            >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <td
                                key={cell.id}
                                style={{
                                    padding: '8px',
                                    borderBottom: '1px solid #eee',
                                }}
                            >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

// Helper function for processing data
const processMarketData = (data: any): MarketRow[] => {
    const rows: MarketRow[] = [];

    // Process Forex Data
    if (data.forex) {
        data.forex.forEach((forex: any) => {
            const [currency1, currency2] = forex.pair.split('/');
            rows.push({
                id: forex.pair,
                name: `${currency1}/${currency2}`,
                category: 'Forex',
                price: forex.rate,
                change: 'neutral',
            });
        });
    }

    // Process Crypto Data
    if (data.crypto) {
        data.crypto.forEach((crypto: any) => {
            rows.push({
                id: crypto.symbol,
                name: crypto.symbol,
                category: 'Crypto',
                price: parseFloat(crypto.price),
                change: 'neutral', // Crypto doesn't have movement data
            });
        });
    }

    // Process Stocks Data
    if (data.stocks?.results) {
        data.stocks.results.forEach((stock: any) => {
            rows.push({
                id: stock.T,
                name: stock.T,
                category: 'Stocks',
                price: stock.c, // Latest closing price
                change: 'neutral', // Add logic for stock movement if needed
            });
        });
    }

    return rows;
};

export default MarketTable;
