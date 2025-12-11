"use client";

import React, {useEffect} from "react";
import {motion, useMotionValue, useSpring} from "framer-motion";
import {useWallet} from "./hooks/useWallet";
import {WalletModalsProvider} from "./hooks/useWalletModals";

import {DepositModal} from "./components/modals/DepositModal";
import {WithdrawModal} from "./components/modals/WithdrawModal";
import {TransferModal} from "./components/modals/TransferModal";
import {ExchangeModal} from "./components/modals/ExchangeModal";
import {StakeModal} from "./components/modals/StakeModal";
import {AddAssetModal} from "./components/modals/AddAssetModal";

type NeuralBackgroundProps = {
    clusters: number; // сколько “облаков связей” показывать
};

/** Background with neural-like lines + optimized parallax */
function NeuralBackground({ clusters }: NeuralBackgroundProps) {
    const baseX = useMotionValue(0);
    const baseY = useMotionValue(0);
    const glowMV = useMotionValue(0);

    const glow = useSpring(glowMV, { stiffness: 50, damping: 22, mass: 0.7 });

    // Simplified springs - no rotation for better performance
    const x = useSpring(baseX, { stiffness: 25, damping: 20, mass: 1.2 });
    const y = useSpring(baseY, { stiffness: 25, damping: 20, mass: 1.2 });

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window;
            const normX = e.clientX / innerWidth - 0.5;
            const normY = e.clientY / innerHeight - 0.5;

            // Reduced parallax strength for better performance
            const targetX = normX * 15; // Reduced from 26
            const targetY = normY * 12; // Reduced from 20

            baseX.set(targetX);
            baseY.set(targetY);
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });

        const onScrollEvent = (e: Event) => {
            const custom = e as CustomEvent<{ progress: number }>;
            const p = custom.detail?.progress ?? 0;

            // Reduced scroll effect
            const scrollTargetY = (p - 0.5) * 20; // Reduced from 36
            const scrollTargetX = (p - 0.5) * 14; // Reduced from 24

            baseX.set(scrollTargetX);
            baseY.set(scrollTargetY);
        };

        window.addEventListener("wallet-scroll", onScrollEvent as EventListener);

        const onGlow = () => {
            glowMV.set(1);
            setTimeout(() => glowMV.set(0), 600);
        };
        window.addEventListener("wallet-balance-glow", onGlow as EventListener);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("wallet-scroll", onScrollEvent as EventListener);
            window.removeEventListener("wallet-balance-glow", onGlow as EventListener);
        };
    }, [baseX, baseY, glowMV]);

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
        { type: "A", className: "absolute top-[40%] right-[32%] w-[260px] h-[260px] opacity-30" },
        { type: "B", className: "absolute bottom-[10%] left-[30%] w-[260px] h-[260px] opacity-28" },
        { type: "A", className: "absolute top-[18%] left-[2%] w-[260px] h-[260px] opacity-25" },
        { type: "B", className: "absolute bottom-[2%] right-[4%] w-[260px] h-[260px] opacity-25" },
    ];

    const maxClusters = clusterConfigs.length;
    const visibleCount = Math.max(2, Math.min(maxClusters, clusters));

    // Optimized springs - fewer calculations
    const localXs = clusterConfigs.map((_, idx) =>
        useSpring(x, {
            stiffness: 25,
            damping: 20,
            mass: 0.8 / Math.max(0.5, 1 - idx * 0.06),
        })
    );
    const localYs = clusterConfigs.map((_, idx) =>
        useSpring(y, {
            stiffness: 25,
            damping: 20,
            mass: 0.8 / Math.max(0.5, 1 - idx * 0.06),
        })
    );

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            {/* glow layer */}
            <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,#7E57C288,transparent_70%)]"
                style={{ opacity: glow }}
            />
            {/* base gradient */}
            <div className="absolute inset-0 bg-[#050510] bg-[radial-gradient(circle_at_top_left,#18234555,transparent_65%),radial-gradient(circle_at_bottom_right,#11182755,transparent_65%)]" />

            {clusterConfigs.map((cfg, idx) => {
                if (idx >= visibleCount) return null;

                const localX = localXs[idx];
                const localY = localYs[idx];

                return cfg.type === "A" ? (
                    <motion.svg
                        key={idx}
                        style={{ x: localX, y: localY }}
                        className={cfg.className}
                        viewBox="0 0 400 400"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id={`walletLinesA-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#4FC3F7" />
                                <stop offset="50%" stopColor="#7E57C2" />
                                <stop offset="100%" stopColor="#F48FB1" />
                            </linearGradient>
                            <radialGradient id={`walletNodesA-${idx}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="35%" stopColor="#90CAF9" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                        </defs>

                        <g stroke={`url(#walletLinesA-${idx})`} strokeWidth="1.2" opacity="0.92">
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

                        <g fill={`url(#walletNodesA-${idx})`} opacity="0.95">
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
                                    className="wallet-node-soft"
                                />
                            ))}
                        </g>
                    </motion.svg>
                ) : (
                    <motion.svg
                        key={idx}
                        style={{ x: localX, y: localY }}
                        className={cfg.className}
                        viewBox="0 0 400 400"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id={`walletLinesB-${idx}`} x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#26C6DA" />
                                <stop offset="100%" stopColor="#7E57C2" />
                            </linearGradient>
                        </defs>

                        <g stroke={`url(#walletLinesB-${idx})`} strokeWidth="1.0" opacity="0.8">
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
                                    className="wallet-node-soft"
                                />
                            ))}
                        </g>
                    </motion.svg>
                );
            })}

            <style jsx global>{`
        .wallet-node-soft {
          transform-box: fill-box;
          transform-origin: center;
          animation: walletNodeSoftPulse 9s ease-in-out infinite;
        }

        .wallet-node-soft:nth-child(3n) {
          animation-duration: 11s;
        }

        .wallet-node-soft:nth-child(4n) {
          animation-duration: 13s;
          animation-delay: 2s;
        }

        @keyframes walletNodeSoftPulse {
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

export default function WalletLayout({ children }: { children: React.ReactNode }) {
    const { summary } = useWallet();
    const total = summary?.totalBalance ?? 0;
    const extra = Math.min(8, Math.floor(total / 500));
    const clusters = 2 + extra;

    return (
        <WalletModalsProvider>
            <main className="relative flex-1 text-white overflow-hidden">
                <NeuralBackground clusters={clusters} />
                <div className="relative  h-full z-10 max-w-screen-2xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
                    {children}
                </div>
            </main>

            {/* Модалки доступны и на /wallet, и на /wallet/staking */}
            <DepositModal />
            <WithdrawModal />
            <TransferModal />
            <ExchangeModal />
            <StakeModal />
            <AddAssetModal />
        </WalletModalsProvider>
    );
}
