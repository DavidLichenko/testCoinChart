'use server'
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    // Extract symbol from the pathname: /api/ohlc/[symbol]
    const { pathname, searchParams } = req.nextUrl;
    const parts = pathname.split("/");
    const symbol = parts[parts.length - 1].toUpperCase();

    // Get interval and limit from query params or use defaults
    const interval = searchParams.get("interval") || "1m";
    const limit = searchParams.get("limit") || "100";

    // Binance API endpoint for klines/candlesticks
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: `Binance API returned status ${response.status}` }),
                { status: response.status }
            );
        }

        const data = await response.json();

        // Format response into OHLC object array
        const formatted = data.map((d: any[]) => ({
            time: Math.floor(d[0] / 1000), // convert ms to seconds timestamp
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5]),
        }));

        return new Response(JSON.stringify(formatted), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch OHLC data" }),
            { status: 500 }
        );
    }
}
