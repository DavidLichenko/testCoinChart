"use client";

import React, {useEffect} from "react";
import {motion, useMotionValue, useSpring} from "framer-motion";

type NewsBackgroundProps = {
    clusters: number;
};

/** Background with neural-like lines + parallax for News */
function NewsBackground({ clusters }: NewsBackgroundProps) {
    const baseX = useMotionValue(0);
    const baseY = useMotionValue(0);
    const rotMV = useMotionValue(0);

    const x = useSpring(baseX, { stiffness: 35, damping: 22, mass: 1 });
    const y = useSpring(baseY, { stiffness: 35, damping: 22, mass: 1 });
    const rot = useSpring(rotMV, { stiffness: 30, damping: 20, mass: 0.8 });

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            const normX = e.clientX / innerWidth - 0.5;
            const normY = e.clientY / innerHeight - 0.5;

            const targetX = normX * 26;
            const targetY = normY * 20;

            const currentX = baseX.get();
            const currentY = baseY.get();
            baseX.set(currentX + (targetX - currentX) * 0.25);
            baseY.set(currentY + (targetY - currentY) * 0.25);

            const targetRot = (normX + normY) * 3;
            const currentRot = rotMV.get();
            rotMV.set(currentRot + (targetRot - currentRot) * 0.25);
        };

        window.addEventListener("mousemove", onMouseMove);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, [baseX, baseY, rotMV]);

    const clusterConfigs: {
        type: "A" | "B";
        className: string;
    }[] = [
        { type: "A", className: "absolute top-[8%] right-[6%] w-[560px] h-[560px] opacity-90" },
        { type: "B", className: "absolute bottom-[4%] left-[5%] w-[420px] h-[420px] opacity-60" },
        { type: "A", className: "absolute top-[26%] left-[12%] w-[360px] h-[360px] opacity-45" },
        { type: "B", className: "absolute top-[55%] right-[12%] w-[340px] h-[340px] opacity-40" },
        { type: "A", className: "absolute top-[10%] left-[32%] w-[300px] h-[300px] opacity-35" },
        { type: "B", className: "absolute bottom-[18%] right-[26%] w-[320px] h-[320px] opacity-35" },
    ];

    const maxClusters = clusterConfigs.length;
    const visibleCount = Math.max(2, Math.min(maxClusters, clusters));

    const localXs = clusterConfigs.map((_, idx) =>
        useSpring(x, {
            stiffness: 30,
            damping: 18,
            mass: 0.6 / Math.max(0.4, 1 - idx * 0.08),
        })
    );
    const localYs = clusterConfigs.map((_, idx) =>
        useSpring(y, {
            stiffness: 30,
            damping: 18,
            mass: 0.6 / Math.max(0.4, 1 - idx * 0.08),
        })
    );

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            {/* base gradient */}
            <div className="absolute inset-0 bg-[#050510] bg-[radial-gradient(circle_at_top_left,#18234555,transparent_65%),radial-gradient(circle_at_bottom_right,#11182755,transparent_65%)]" />

            {clusterConfigs.map((cfg, idx) => {
                if (idx >= visibleCount) return null;

                const localX = localXs[idx];
                const localY = localYs[idx];

                return cfg.type === "A" ? (
                    <motion.svg
                        key={idx}
                        style={{ x: localX, y: localY, rotate: rot }}
                        className={cfg.className}
                        viewBox="0 0 400 400"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id={`newsLinesA-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#4FC3F7" />
                                <stop offset="50%" stopColor="#7E57C2" />
                                <stop offset="100%" stopColor="#F48FB1" />
                            </linearGradient>
                            <radialGradient id={`newsNodesA-${idx}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="35%" stopColor="#90CAF9" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                        </defs>

                        <g stroke={`url(#newsLinesA-${idx})`} strokeWidth="1.2" opacity="0.92">
                            <line x1="40" y1="80" x2="120" y2="40" />
                            <line x1="120" y1="40" x2="210" y2="70" />
                            <line x1="210" y1="70" x2="280" y2="40" />
                            <line x1="210" y1="70" x2="260" y2="120" />
                            <line x1="260" y1="120" x2="330" y2="80" />
                            <line x1="120" y1="40" x2="80" y2="140" />
                            <line x1="80" y1="140" x2="160" y2="160" />
                            <line x1="160" y1="160" x2="240" y2="150" />
                            <line x1="240" y1="150" x2="310" y2="170" />
                            <line x1="160" y1="160" x2="150" y2="230" />
                            <line x1="150" y1="230" x2="230" y2="250" />
                            <line x1="230" y1="250" x2="300" y2="230" />
                        </g>

                        <g fill={`url(#newsNodesA-${idx})`} opacity="0.95">
                            {[
                                [40, 80, 4.2],
                                [120, 40, 3.8],
                                [210, 70, 3.6],
                                [280, 40, 3.5],
                                [260, 120, 3.6],
                                [330, 80, 3.5],
                                [80, 140, 3.5],
                                [160, 160, 3.9],
                                [240, 150, 3.4],
                                [310, 170, 3.6],
                                [150, 230, 3.3],
                                [230, 250, 3.6],
                                [300, 230, 3.4],
                            ].map(([cx, cy, r], i) => (
                                <circle
                                    key={i}
                                    cx={cx as number}
                                    cy={cy as number}
                                    r={(r as number) * 1.35}
                                    className="news-node-soft"
                                />
                            ))}
                        </g>
                    </motion.svg>
                ) : (
                    <motion.svg
                        key={idx}
                        style={{ x: localX, y: localY, rotate: rot }}
                        className={cfg.className}
                        viewBox="0 0 400 400"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id={`newsLinesB-${idx}`} x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#26C6DA" />
                                <stop offset="100%" stopColor="#7E57C2" />
                            </linearGradient>
                        </defs>

                        <g stroke={`url(#newsLinesB-${idx})`} strokeWidth="1.0" opacity="0.8">
                            <line x1="60" y1="260" x2="130" y2="220" />
                            <line x1="130" y1="220" x2="200" y2="250" />
                            <line x1="200" y1="250" x2="270" y2="220" />
                            <line x1="130" y1="220" x2="110" y2="160" />
                            <line x1="110" y1="160" x2="180" y2="150" />
                            <line x1="180" y1="150" x2="240" y2="180" />
                            <line x1="240" y1="180" x2="300" y2="160" />
                        </g>

                        <g fill="#90CAF9" opacity="0.98">
                            {[
                                [60, 260],
                                [130, 220],
                                [200, 250],
                                [270, 220],
                                [110, 160],
                                [180, 150],
                                [240, 180],
                                [300, 160],
                            ].map(([cx, cy], i) => (
                                <circle
                                    key={i}
                                    cx={cx as number}
                                    cy={cy as number}
                                    r={4.2}
                                    className="news-node-soft"
                                />
                            ))}
                        </g>
                    </motion.svg>
                );
            })}

            <style jsx global>{`
        .news-node-soft {
          transform-box: fill-box;
          transform-origin: center;
          animation: newsNodeSoftPulse 9s ease-in-out infinite;
        }

        .news-node-soft:nth-child(3n) {
          animation-duration: 11s;
        }

        .news-node-soft:nth-child(4n) {
          animation-duration: 13s;
          animation-delay: 2s;
        }

        @keyframes newsNodeSoftPulse {
          0%,
          100% {
            transform: scale(0.96);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
    const clusters = 4;

    return (
        <main className="relative flex-1 text-white overflow-hidden">
            <NewsBackground clusters={clusters} />
            <div className="relative h-full z-10 max-w-screen-2xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
                {children}
            </div>
        </main>
    );
}
