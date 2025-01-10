'use client';
import { useEffect, useState } from 'react';
import { MarketsTable } from '@/components/markets-table';
import {Skeleton} from "@/components/ui/skeleton";
import {LoaderCircle} from "lucide-react";

const TickerTable = () => {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/market-search/');
                const data = await response.json();

                if (response.ok) {
                    setMarketData(data);
                } else {
                    console.error('Error fetching market data', data.error);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []); // The empty array ensures this effect runs once when the component mounts

    return (
        <div className="container h-full mx-auto pb-10 px-4 sm:px-6 lg:px-8">
            {loading ? (
                <Skeleton className={'w-full h-screen flex items-center justify-center'}><LoaderCircle className={'animate-spin'}></LoaderCircle></Skeleton>
            ) : (
                <MarketsTable data={marketData} />
            )}
        </div>
    );
};

export default TickerTable;
