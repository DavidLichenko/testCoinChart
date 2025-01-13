import { NextRequest, NextResponse } from 'next/server';

const TIINGO_API_KEY = "5c5398add0e123606bb40277f4cb66352b386185";

export async function GET(req: NextRequest, { params }: { params: { tickerType:string, ticker: string,  } }) {
    const { tickerType, ticker } = params;
    try {
        // Fetch data concurrently
        if(tickerType === 'IEX') {

        const response = await fetch(
            `https://api.tiingo.com/iex?tickers=${ticker}&token=5c5398add0e123606bb40277f4cb66352b386185`,
        );
        const data = await response.json();
        return NextResponse.json(data[0].last);
        }
        if (tickerType === 'Forex') {

            const response = await fetch(
                `https://api.tiingo.com/tiingo/fx/top?tickers=${ticker}&token=5c5398add0e123606bb40277f4cb66352b386185`,
            );
            const data = await response.json();
            return NextResponse.json(data[0].midPrice);
        }
        // Send the formatted data to the client
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
