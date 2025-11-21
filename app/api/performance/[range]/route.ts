import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { range: string } }
) {
    const { range } = params;

    const days = range === "14d" ? 14 : range === "30d" ? 30 : 7;

    // generate mock values
    const generateSeries = (len: number, base = 100) => {
        let v = base;
        return Array.from({ length: len }, () => {
            v += (Math.random() - 0.4) * 15;
            return Number(v.toFixed(2));
        });
    };

    const balance = generateSeries(days, 1000);
    const pnl = generateSeries(days, 0).map((v) => v - 1000);
    const activity = generateSeries(days, 3).map((v) => Math.abs(Math.round(v)));
    const overall = balance.map((v, i) => v + pnl[i] * 3);

    // summarize
    const summary = {
        balance: balance[balance.length - 1],
        pnl: pnl.reduce((a, b) => a + b, 0),
        activity: activity[activity.length - 1],
    };

    return NextResponse.json({
        range,
        series: {
            balance,
            pnl,
            activity,
            overall,
        },
        summary,
    });
}
