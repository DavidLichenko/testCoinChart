'use client';

import React from 'react';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import type { LiveData } from '@/hooks/market-data';

interface TickerListProps {
    symbols: string[];
    liveData: LiveData[];
    selectedSymbol: string;
    onSelectSymbol: (symbol: string) => void;
}

export const TickerList: React.FC<TickerListProps> = ({
    symbols,
    liveData,
    selectedSymbol,
    onSelectSymbol,
}) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const liveDataMap = new Map(liveData.map(d => [d.symbol, d]));

    const filteredSymbols = symbols.filter(s =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Search symbols..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border"
                />
            </div>
            <div className="overflow-y-auto">
                {filteredSymbols.map(symbol => {
                    const data = liveDataMap.get(symbol);
                    return (
                        <div
                            key={symbol}
                            onClick={() => onSelectSymbol(symbol)}
                            className={`p-2 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                                selectedSymbol === symbol ? "bg-muted border-l-2 border-primary" : ""
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-xs">{symbol}</span>
                                <span className="text-xs font-mono">
                                    {data?.price ? data.price.toFixed(4) : '...'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TickerList;
