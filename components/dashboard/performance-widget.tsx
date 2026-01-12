"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { LineChart } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type Range = "7d" | "14d" | "30d";
type DayData = { date: string; pnl: number };

interface PerformanceResponse {
    range: Range;
    days: DayData[];
    summary: {
        total: number;
        positiveDays: number;
        negativeDays: number;
        winRate: number;
    };
}

type Status = "idle" | "loading" | "success" | "error";

const RANGES: Range[] = ["7d", "14d", "30d"];

function isPerformanceResponse(x: any): x is PerformanceResponse {
    return (
        x &&
        (x.range === "7d" || x.range === "14d" || x.range === "30d") &&
        Array.isArray(x.days) &&
        x.summary &&
        typeof x.summary.total === "number" &&
        typeof x.summary.winRate === "number"
    );
}

export function PerformanceWidget() {
    const { t } = useI18n();

    const [range, setRange] = useState<Range>("7d");
    const [data, setData] = useState<PerformanceResponse | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // чтобы не обновлять стейт устаревшим ответом при быстрых переключениях
    const requestSeq = useRef(0);

    const fetchPerformance = useCallback(async (r: Range) => {
        const seq = ++requestSeq.current;
        const controller = new AbortController();

        setStatus("loading");
        setErrorMsg(null);

        try {
            const res = await fetch(`/api/performance?range=${r}`, {
                method: "GET",
                signal: controller.signal,
                cache: "no-store",
                headers: { "Accept": "application/json" },
            });

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            const json = await res.json();

            if (!isPerformanceResponse(json)) {
                throw new Error("Invalid response shape from /api/performance");
            }

            // если уже был новый запрос — этот игнорируем
            if (seq !== requestSeq.current) return;

            setData(json);
            setStatus("success");
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            if (seq !== requestSeq.current) return;

            setStatus("error");
            setErrorMsg(err?.message ?? "Failed to load performance");
            setData(null);
        }

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const seq = ++requestSeq.current;

        (async () => {
            setStatus("loading");
            setErrorMsg(null);

            try {
                const res = await fetch(`/api/performance?range=${range}`, {
                    method: "GET",
                    signal: controller.signal,
                    cache: "no-store",
                    headers: { "Accept": "application/json" },
                });

                if (!res.ok) throw new Error(`Request failed: ${res.status}`);

                const json = await res.json();
                if (!isPerformanceResponse(json)) throw new Error("Invalid response shape from /api/performance");
                if (seq !== requestSeq.current) return;

                setData(json);
                setStatus("success");
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                if (seq !== requestSeq.current) return;

                setStatus("error");
                setErrorMsg(err?.message ?? "Failed to load performance");
                setData(null);
            }
        })();

        return () => controller.abort();
    }, [range]);

    const loading = status === "loading";
    const ready = status === "success" && data;

    const { min, max } = useMemo(() => {
        if (!data?.days?.length) return { min: -1, max: 1 };
        let mn = data.days[0].pnl;
        let mx = data.days[0].pnl;
        for (const d of data.days) {
            if (d.pnl < mn) mn = d.pnl;
            if (d.pnl > mx) mx = d.pnl;
        }
        // чтобы график не был плоским при одинаковых значениях
        if (mn === mx) {
            const pad = Math.max(1, Math.abs(mx) * 0.05);
            return { min: mn - pad, max: mx + pad };
        }
        return { min: mn, max: mx };
    }, [data]);

    const chartConfig = useMemo(
        () => ({
            pnl: { label: "PnL", color: "hsl(var(--chart-1))" },
        }),
        []
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl bg-slate-900/70 border border-slate-800 p-5 backdrop-blur-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold">{t("performance")}</h2>
                </div>

                <div className="flex items-center gap-1 bg-slate-800/60 rounded-full p-1">
                    {RANGES.map((r) => (
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

            {/* Error banner */}
            {status === "error" && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {errorMsg ?? "Failed to load performance."}{" "}
                    <button
                        className="underline text-red-100 hover:text-white"
                        onClick={() => {
                            // ретрай текущего range
                            setRange((x) => x);
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
                {["Total PnL", "Win Rate", "Pos / Neg"].map((label, i) => (
                    <div key={label}>
                        {loading || !ready ? (
                            <div className="animate-pulse flex flex-col gap-2">
                                <div className="h-4 bg-slate-700 rounded" />
                                <div className="h-3 bg-slate-800 rounded" />
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-slate-400">{label}</p>

                                {i === 0 && (
                                    <p
                                        className={cn(
                                            "text-lg font-semibold",
                                            ready.summary.total >= 0 ? "text-emerald-400" : "text-red-400"
                                        )}
                                    >
                                        {ready.summary.total >= 0 ? "+" : ""}
                                        {ready.summary.total.toFixed(2)}
                                    </p>
                                )}

                                {i === 1 && (
                                    <p className="text-lg font-semibold text-purple-300">
                                        {ready.summary.winRate}%
                                    </p>
                                )}

                                {i === 2 && (
                                    <p className="text-lg font-semibold text-slate-200">
                                        {ready.summary.positiveDays} / {ready.summary.negativeDays}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="h-32 w-full">
                {loading || !ready ? (
                    <div className="animate-pulse h-full rounded-xl bg-slate-800/70" />
                ) : (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <AreaChart
                            accessibilityLayer
                            data={ready.days}
                            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#4b5563" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => String(value).slice(0, 5)}
                                className="text-xs"
                            />
                            <YAxis
                                domain={[min, max]}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                className="text-xs"
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
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
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                        </AreaChart>
                    </ChartContainer>
                )}
            </div>

            {/* Labels */}
            {ready && (
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>{ready.days[0]?.date ?? ""}</span>
                    <span>{ready.days[ready.days.length - 1]?.date ?? ""}</span>
                </div>
            )}
        </motion.div>
    );
}
