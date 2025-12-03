"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {useI18n} from "@/components/i18n-provider";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type DayData = { date: string; pnl: number };

interface PerformanceResponse {
    range: "7d" | "14d" | "30d";
    days: DayData[];
    summary: {
        total: number;
        positiveDays: number;
        negativeDays: number;
        winRate: number;
    };
}

export function PerformanceWidget() {
    const [range, setRange] = useState<"7d" | "14d" | "30d">("7d");
    const [data, setData] = useState<PerformanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useI18n();
    const ranges: ("7d" | "14d" | "30d")[] = ["7d", "14d", "30d"];

    const fetchPerformance = async (r: "7d" | "14d" | "30d") => {
        setLoading(true);
        const res = await fetch(`/api/performance?range=${r}`);
        const json = await res.json();
        setData(json);
        setLoading(false);
    };

    useEffect(() => {
        fetchPerformance(range);
    }, [range]);

    const max = data?.days ? Math.max(...data.days.map((d) => d.pnl)) : 1;
    const min = data?.days ? Math.min(...data.days.map((d) => d.pnl)) : -1;

    const chartConfig = {
      pnl: {
        label: "PnL",
        color: "hsl(var(--chart-1))",
      },
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 p-5 backdrop-blur-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-purple-400"/>
                    <h2 className="text-lg font-semibold">{t("performance")}</h2>
                </div>

                <div className="flex items-center gap-1 bg-slate-800/60 rounded-full p-1">
                    {ranges.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={cn(
                                "px-3 py-1 text-xs rounded-full transition-all",
                                range === r
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow"
                                    : "text-slate-300 hover:text-white"
                            )}
                        >
                            {r.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary (with skeletons) */}
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
                {[1, 2, 3].map((_, i) => (
                    <div key={i}>
                        {loading ? (
                            <div className="animate-pulse flex flex-col gap-2">
                                <div className="h-4 bg-slate-700 rounded"></div>
                                <div className="h-3 bg-slate-800 rounded"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-slate-400">
                                    {i === 0 ? "Total PnL" : i === 1 ? "Win Rate" : "Pos / Neg"}
                                </p>

                                {i === 0 && (
                                    <p
                                        className={cn(
                                            "text-lg font-semibold",
                                            data!.summary.total >= 0
                                                ? "text-emerald-400"
                                                : "text-red-400"
                                        )}
                                    >
                                        {data!.summary.total >= 0 ? "+" : ""}
                                        {data!.summary.total.toFixed(2)}
                                    </p>
                                )}

                                {i === 1 && (
                                    <p className="text-lg font-semibold text-purple-300">
                                        {data!.summary.winRate}%
                                    </p>
                                )}

                                {i === 2 && (
                                    <p className="text-lg font-semibold text-slate-200">
                                        {data!.summary.positiveDays} / {data!.summary.negativeDays}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Sparkline chart */}
            <div className="h-32 w-full">
                {loading || !data ? (
                    <div className="animate-pulse h-full rounded-xl bg-slate-800/70"/>
                ) : (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <AreaChart
                            accessibilityLayer
                            data={data.days}
                            margin={{
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#4b5563" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value.slice(0, 5)}
                                className="text-xs"
                            />
                            <YAxis
                                domain={[min, max]}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                className="text-xs"
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="line" />}
                            />
                            <Area
                                dataKey="pnl"
                                type="monotone"
                                fill="url(#colorPnl)"
                                stroke="#a855f7"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: "#a855f7" }}
                            />
                            <defs>
                                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ChartContainer>
                )}
            </div>

            {/* Labels */}
            {!loading && (
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>{data!.days[0].date}</span>
                    <span>{data!.days[data!.days.length - 1].date}</span>
                </div>
            )}
        </motion.div>
    );
}
