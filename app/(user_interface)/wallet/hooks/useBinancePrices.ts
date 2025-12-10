"use client";

import {useEffect, useState} from "react";

export type BinanceTicker = {
    s: string; // символ, например "BTCUSDT"
    c: string; // last price
    P: string; // priceChangePercent
};

type PricesState = Record<string, BinanceTicker>; // key = "BTC", "ETH", ...

export function useBinancePrices(symbols: string[]) {
    const [prices, setPrices] = useState<PricesState>({});

    useEffect(() => {
        const unique = Array.from(
            new Set(symbols.map((s) => s.toUpperCase()))
        ).filter(Boolean);

        if (!unique.length) return;

        const streams = unique
            .map((sym) => `${sym.toLowerCase()}usdt@ticker`)
            .join("/");

        const ws = new WebSocket(
            `wss://stream.binance.com:9443/stream?streams=${streams}`
        );

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                const data = msg.data as BinanceTicker;
                const full = data.s; // BTCUSDT
                const base = full.replace("USDT", "");
                setPrices((prev) => ({ ...prev, [base]: data }));
            } catch (e) {
                console.error("Binance WS parse error", e);
            }
        };

        return () => {
            ws.close();
        };
    }, [symbols.join(",")]);

    return prices;
}
