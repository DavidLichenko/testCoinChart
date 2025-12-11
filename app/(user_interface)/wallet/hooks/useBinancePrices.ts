"use client";

import { useEffect, useState } from "react";

export type BinanceTicker = {
  s: string; // символ, например "BTCUSDT"
  c: string; // last price
  P: string; // priceChangePercent
};

type PricesState = Record<string, BinanceTicker>; // key = "BTC", "ETH", ...

const QUOTE = "USDT";

export function useBinancePrices(symbols: string[]) {
  const [prices, setPrices] = useState<PricesState>({});

  useEffect(() => {
    const unique = Array.from(
      new Set(symbols.map((s) => s.toUpperCase()))
    ).filter(Boolean);

    // не подписываемся на USDTUSDT — такого рынка нет
    const toStream = unique.filter((sym) => sym !== "USDT");

    if (!toStream.length) return;

    const streams = toStream
      .map((sym) => `${sym.toLowerCase()}${QUOTE.toLowerCase()}@ticker`)
      .join("/");

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${streams}`
    );

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const data = msg.data as BinanceTicker;

        const full = data.s; // например "MATICUSDT"

        let base = full;
        // аккуратно отрезаем только суффикс "USDT" в конце
        if (full.endsWith(QUOTE)) {
          base = full.slice(0, -QUOTE.length); // "MATIC"
        }

        setPrices((prev) => ({
          ...prev,
          [base]: data,
        }));
      } catch (e) {
        console.error("Binance WS parse error", e);
      }
    };

    ws.onerror = (e) => {
      console.error("Binance WS error", e);
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  // ⚙️ отдельный эффект: выставляем статичный тикер для USDT, если он есть в списке
  useEffect(() => {
    const hasUsdt = symbols.some((s) => s.toUpperCase() === "USDT");
    if (!hasUsdt) return;

    setPrices((prev) => ({
      ...prev,
      USDT: {
        s: "USDTUSDT", // просто заглушка-строка
        c: "1.0000",   // 1$
        P: "0.00",     // 0% изменения
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  return prices;
}
