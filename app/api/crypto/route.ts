// app/api/crypto/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price');
    const data = await response.json();
    return NextResponse.json(data);
}
