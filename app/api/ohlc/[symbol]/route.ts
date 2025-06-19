// app/api/ohlc/[symbol]/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { symbol: string } }) {
    const symbol = params.symbol.toUpperCase();
    const interval = req.nextUrl.searchParams.get("interval") || "1m";
    const limit = req.nextUrl.searchParams.get("limit") || "100";

    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const formatted = data.map((d: any[]) => ({
            time: Math.floor(d[0] / 1000), // seconds
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5]),
        }));

        return new Response(JSON.stringify(formatted), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch OHLC data" }), { status: 500 });
    }
}
