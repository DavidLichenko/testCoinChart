import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

type Range = "7d" | "14d" | "30d";

function parseRange(value: string | null): Range {
    if (value === "14d" || value === "30d") return value;
    return "7d";
}

export async function GET(request: Request) {
    try {
        const userId = await requireAuth();

        const url = new URL(request.url);
        const rangeParam = parseRange(url.searchParams.get("range"));

        const daysCount =
            rangeParam === "7d" ? 7 : rangeParam === "14d" ? 14 : 30;

        const now = new Date();
        const fromDate = new Date();
        fromDate.setDate(now.getDate() - (daysCount - 1));
        fromDate.setHours(0, 0, 0, 0);

        // Берём закрытые сделки за период
        const trades = await prisma.trade_Transaction.findMany({
            where: {
                userId,
                status: "CLOSE",
                OR: [
                    { endAt: { gte: fromDate } },
                    {
                        AND: [
                            { endAt: null },
                            { createdAt: { gte: fromDate } },
                        ],
                    },
                ],
            },
            select: {
                profit: true,
                endAt: true,
                createdAt: true,
            },
        });

        // Инициализируем карту "дата -> PnL" нулями,
        // чтобы график всегда имел полные 7/14/30 точек
        const dailyPnL = new Map<string, number>();

        for (let i = 0; i < daysCount; i++) {
            const d = new Date(fromDate);
            d.setDate(fromDate.getDate() + i);
            const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
            dailyPnL.set(key, 0);
        }

        // Накладываем профит по дням
        for (const trade of trades) {
            const dateObj = trade.endAt ?? trade.createdAt;
            if (!dateObj) continue;

            const key = dateObj.toISOString().slice(0, 10);
            const prev = dailyPnL.get(key) ?? 0;
            dailyPnL.set(key, prev + (trade.profit ?? 0));
        }

        // Формируем массив дней в хронологическом порядке
        const days = Array.from(dailyPnL.entries())
            .sort(([d1], [d2]) => d1.localeCompare(d2))
            .map(([date, pnl]) => ({ date, pnl }));

        // Сводка
        const total = days.reduce((sum, d) => sum + d.pnl, 0);
        const positiveDays = days.filter((d) => d.pnl > 0).length;
        const negativeDays = days.filter((d) => d.pnl < 0).length;
        const tradedDays = positiveDays + negativeDays;
        const winRate =
            tradedDays > 0 ? (positiveDays / tradedDays) * 100 : 0;

        const response = {
            range: rangeParam,
            days,
            summary: {
                total,
                positiveDays,
                negativeDays,
                winRate: Number(winRate.toFixed(2)),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching performance:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
