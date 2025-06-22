// app/page.tsx or app/testpage/page.tsx
'use client'

import { useState } from 'react';
import TickerList from '@/components/TickerList';
import RealtimeChart from '@/components/RealtimeChart';
import dynamic from "next/dynamic";

const PlotlyCandlestickWithTools = dynamic(
    () => import("@/components/testChart"),
    { ssr: false } // disable SSR for Plotly
);
export default function HomePage() {
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    return (
        <div className="flex h-screen">
            <PlotlyCandlestickWithTools/>
            {/*<TickerList*/}
            {/*    onSelect={(symbol) => {*/}
            {/*        setSelectedSymbol(symbol);*/}
            {/*    }}*/}
            {/*/>*/}

            {/*<div className="flex-1 p-4">*/}
            {/*    {selectedSymbol ? (*/}
            {/*        <<RealtimeChart symbol={selectedSymbol} timeframe="M1" />>*/}
            {/*    ) : (*/}
            {/*        <div className="text-gray-500 text-center mt-40 text-xl">*/}
            {/*            Select a ticker to view its chart.*/}
            {/*        </div>*/}
            {/*    )}*/}
            {/*</div>*/}
        </div>
    );
}
