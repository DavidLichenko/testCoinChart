// app/api/stocks/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    const response = await fetch('https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apiKey=ppjksSRDuc_efvU8YBLKvoKKYTANL6JM');
    const data = await response.json();
    return NextResponse.json(data);
}
