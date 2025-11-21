"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {useI18n} from "@/components/i18n-provider";

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
            <div className="relative h-24 w-full">
                {loading || !data ? (
                    <div className="animate-pulse h-full rounded-xl bg-slate-800/70"/>
                ) : (
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 100 40"
                        preserveAspectRatio="none"
                        className="overflow-visible"
                    >
                        {(() => {
                            const height = 40;
                            const width = 100;
                            const paddingX = 3;
                            const paddingY = 6;

                            const n = data.days.length;
                            const xStep = n > 1 ? (width - paddingX * 2) / (n - 1) : 0;

                            // берём реальные max/min по дням
                            const rawMax = Math.max(...data.days.map((d) => d.pnl));
                            const rawMin = Math.min(...data.days.map((d) => d.pnl));

                            // чуть “разжимаем” диапазон, чтобы линия не была прижатой к нулю
                            const paddedMax = rawMax <= 0 ? 1 : rawMax * 1.1;
                            const paddedMin = rawMin >= 0 ? -1 : rawMin * 1.1;
                            const range = paddedMax - paddedMin || 1;

                            const innerHeight = height - paddingY * 2;

                            const getY = (v: number) => {
                                const norm = (v - paddedMin) / range; // 0..1
                                return height - paddingY - norm * innerHeight;
                            };

                            // линия “0 PnL”
                            const zeroNorm = (0 - paddedMin) / range;
                            const yZero = height - paddingY - zeroNorm * innerHeight;

                            const points = data.days
                                .map((d, i) => {
                                    const x = paddingX + i * xStep;
                                    const y = getY(d.pnl);
                                    return `${x},${y}`;
                                })
                                .join(" ");

                            return (
                                <>
                                    {/* baseline 0 PnL */}
                                    <line
                                        x1={paddingX}
                                        x2={width - paddingX}
                                        y1={yZero}
                                        y2={yZero}
                                        stroke="#4b5563"
                                        strokeWidth={0.35}
                                        strokeDasharray="2 2"
                                    />

                                    {/* мягкий glow (толще и прозрачнее) */}
                                    <motion.polyline
                                        fill="none"
                                        stroke="rgba(168, 85, 247, 0.35)"
                                        strokeWidth={2.6}
                                        strokeLinecap="round"
                                        initial={{pathLength: 0, opacity: 0}}
                                        animate={{pathLength: 1, opacity: 1}}
                                        transition={{duration: 0.9, ease: "easeOut"}}
                                        points={points}
                                    />

                                    {/* основная тонкая линия сверху */}
                                    <motion.polyline
                                        fill="none"
                                        stroke="#a855f7"
                                        strokeWidth={1.2}
                                        strokeLinecap="round"
                                        initial={{pathLength: 0, opacity: 0}}
                                        animate={{pathLength: 1, opacity: 1}}
                                        transition={{duration: 0.9, ease: "easeOut"}}
                                        points={points}
                                    />
                                </>
                            );
                        })()}
                    </svg>
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
