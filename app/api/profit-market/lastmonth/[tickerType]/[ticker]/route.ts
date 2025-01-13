import { NextRequest, NextResponse } from 'next/server';

const TIINGO_API_KEY = "5c5398add0e123606bb40277f4cb66352b386185";

export async function GET(req: NextRequest, { params }: { params: { tickerType:string, ticker: string,  } }) {
    const { tickerType, ticker } = params;
    // Create end date in UTC (yesterday)
    const now = new Date();

    // Get current UTC time
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const currentDate = now.getUTCDate();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    const end = new Date(Date.UTC(
        currentYear,
        currentMonth,
        currentDate - 1,
        currentHour,
        currentMinute
    ));
    let start = new Date(end);
    start.setUTCMonth(end.getUTCMonth() - 1);
    // Format dates
    const formatDate = (date: Date) => {
        const yyyy = date.getUTCFullYear();
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(date.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const start_date = formatDate(start);


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
