import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // адаптируй путь, если другой

// Range mapping to days
const RANGE_MAP = {
    "7d": 7,
    "14d": 14,
    "30d": 30
} as const;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const range = (searchParams.get("range") || "7d") as keyof typeof RANGE_MAP;

        const days = RANGE_MAP[range] ?? 7;

        const now = new Date();
        const fromDate = new Date();
        fromDate.setDate(now.getDate() - days);

        // Fetch closed trades only
        const closedTrades = await prisma.trade_Transaction.findMany({
            where: {
                status: "CLOSE",
                endAt: { gte: fromDate }
            },
            select: {
                profit: true,
                endAt: true
            }
        });

        // Prepare day buckets
        const buckets: Record<string, number> = {};

        for (let i = 0; i < days; i++) {
            const d = new Date(fromDate);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split("T")[0];
            buckets[key] = 0;
        }

        // Fill with real PnL
        for (const t of closedTrades) {
            if (!t.profit || !t.endAt) continue;

            const key = t.endAt.toISOString().split("T")[0];
            if (key in buckets) {
                buckets[key] += t.profit;
            }
        }

        // Convert to array
        const result = Object.entries(buckets).map(([date, pnl]) => ({
            date,
            pnl: Number(pnl.toFixed(2))
        }));

        // Summary calculations (super lightweight)
        const total = result.reduce((a, b) => a + b.pnl, 0);
        const positiveDays = result.filter((d) => d.pnl > 0).length;
        const negativeDays = result.filter((d) => d.pnl < 0).length;

        const winRate = result.length
            ? (positiveDays / result.length) * 100
            : 0;

        return NextResponse.json({
            range,
            days: result,
            summary: {
                total: Number(total.toFixed(2)),
                positiveDays,
                negativeDays,
                winRate: Number(winRate.toFixed(2))
            }
        });
    } catch (error) {
        console.error("Performance API error:", error);
        return NextResponse.json(
            { error: "Failed to load performance data" },
            { status: 500 }
        );
    }
}
