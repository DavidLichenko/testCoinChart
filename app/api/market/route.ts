// app/api/market/route.js
import { NextResponse } from 'next/server';
import xml2js from 'xml2js';

export async function GET() {
    try {
        // Fetch from external APIs
        const cryptoResponse = await fetch('https://api.binance.com/api/v3/ticker/price');
        const stockResponse = await fetch('https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=ppjksSRDuc_efvU8YBLKvoKKYTANL6JM');

        const [cryptoData,  stockData] = await Promise.all([
            cryptoResponse.json(),
            stockResponse.json(),
        ]);


        // Structure the data
        const marketData = {
            crypto: cryptoData,
            stocks: stockData,
        };

        return NextResponse.json(marketData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
