// lib/binanceSocket.ts
export function subscribeToBinanceCandles(symbol: string, interval: string, onMessage: (data: any) => void) {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;

        const candle = {
            time: Math.floor(kline.t / 1000), // seconds
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            isFinal: kline.x, // true if candle is closed
        };

        onMessage(candle);
    };

    return () => {
        ws.close();
    };
}
