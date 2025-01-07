// app/api/forex/route.js
import { NextResponse } from 'next/server';
import xml2js from 'xml2js';

export async function GET() {
    const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
    const text = await response.text();

    const parser = new xml2js.Parser();
    const data = await parser.parseStringPromise(text);

    // Extract and format rates
    const rates = data['gesmes:Envelope'].Cube[0].Cube[0].Cube.map((rate) => ({
        currency: rate.$.currency,
        rate: rate.$.rate,
    }));

    return NextResponse.json({ base: 'EUR', rates });
}
