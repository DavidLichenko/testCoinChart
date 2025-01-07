// app/api/market/route.js
import { NextResponse } from 'next/server';
import xml2js from 'xml2js';

export async function GET() {
    try {
        // Fetch from external APIs
        const cryptoResponse = await fetch('https://api.binance.com/api/v3/ticker/price');
        const forexResponse = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
        const stockResponse = await fetch('https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=ppjksSRDuc_efvU8YBLKvoKKYTANL6JM');

        const [cryptoData, forexXML, stockData] = await Promise.all([
            cryptoResponse.json(),
            forexResponse.text(),
            stockResponse.json(),
        ]);

        // Parse XML to JSON for forex rates
        const parser = new xml2js.Parser();
        const forexData = await parser.parseStringPromise(forexXML);

        // Structure the data
        const marketData = {
            crypto: cryptoData,
            forex: forexData,
            stocks: stockData,
        };

        return NextResponse.json(marketData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}
