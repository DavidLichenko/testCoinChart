"use client";

import {useMemo, useState} from "react";
import {WalletSidebar} from "../components/WalletSidebar";
import {useWallet} from "../hooks/useWallet";
import {useStaking} from "../hooks/useStaking";
import {useWalletModals} from "../hooks/useWalletModals";
import {useI18n} from "@/components/i18n-provider";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils";

export default function StakingPage() {
    const { t } = useI18n("wallet.staking");
    const { assets, summary, refreshAll } = useWallet();
    const { openStake } = useWalletModals();

    const {
        plans,
        positions,
        activePositions,
        totalStakedAll,
        loading,
        mutating,
        errorCode,
        closeStake,
    } = useStaking();

    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

    const stakableAssetSymbols = useMemo(
        () => Array.from(new Set(plans.map((p) => p.assetSymbol))),
        [plans]
    );

    const stakableAssets = useMemo(
        () =>
            (assets || []).filter((a) =>
                stakableAssetSymbols.includes(a.symbol)
            ),
        [assets, stakableAssetSymbols]
    );

    const effectiveSelected = useMemo(() => {
        if (selectedAsset) return selectedAsset;
        if (stakableAssets.length > 0) return stakableAssets[0].symbol;
        return null;
    }, [selectedAsset, stakableAssets]);

    const selectedPlans = useMemo(
        () =>
            plans.filter(
                (p) =>
                    (!effectiveSelected || p.assetSymbol === effectiveSelected) &&
                    p.isActive
            ),
        [plans, effectiveSelected]
    );

    const positionsForSelected = useMemo(
        () =>
            positions.filter(
                (p) =>
                    !effectiveSelected || p.assetSymbol === effectiveSelected
            ),
        [positions, effectiveSelected]
    );

    const hasAnyPlans = plans.length > 0;
    const hasAnyPositions = positions.length > 0;

    const handleOpenStake = (assetSymbol: string) => {
        openStake(assetSymbol); // откроет StakeModal с этим активом
    };

    const handleClosePosition = async (positionId: string) => {
        await closeStake(positionId);
        await refreshAll();
    };

    const errorMessage =
        errorCode && errorCode !== "UNAUTHORIZED"
            ? t(`errors.${errorCode}` as any) ?? t("errors.generic")
            : null;

    return (
        <>
            <header className="mb-2">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {t("title")}
                </h1>
                <p className="text-sm text-white/60 mt-1">{t("subtitle")}</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
                {/* слева тот же сайдбар */}
                <WalletSidebar selectedSymbol={null} />

                {/* справа — стейкинг */}
                <section className="space-y-5">
                    {errorMessage && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                            {errorMessage}
                        </div>
                    )}

                    {/* Планы */}
                    <div className="bg-[#0b0b16]/80 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="text-sm font-semibold">{t("plans.title")}</h2>
                                <p className="text-[11px] text-white/50">
                                    {effectiveSelected
                                        ? t("plans.subtitleForAsset", {
                                            asset: effectiveSelected,
                                        } as any)
                                        : t("plans.subtitleGeneric")}
                                </p>
                            </div>
                            {loading && (
                                <span className="text-[10px] text-white/40">
                  {t("loading")}
                </span>
                            )}
                        </div>

                        {!hasAnyPlans && (
                            <div className="text-[11px] text-white/45 py-4">
                                {t("plans.noPlansGlobal")}
                            </div>
                        )}

                        {hasAnyPlans && selectedPlans.length === 0 && (
                            <div className="text-[11px] text-white/45 py-4">
                                {t("plans.noPlansForAsset")}
                            </div>
                        )}

                        {selectedPlans.length > 0 && (
                            <div className="grid gap-3 md:grid-cols-2">
                                {selectedPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 flex flex-col gap-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-semibold">
                                                    {plan.name}
                                                </div>
                                                <div className="text-[10px] text-white/45">
                                                    {plan.duration}d • {plan.apr}% APR
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-400/30 text-[10px] rounded-full px-2 py-0">
                                                {t("plans.badge")}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-white/60">
                      <span>
                        {t("plans.minAmount")} {plan.minAmount}
                      </span>
                                            <span className="text-white">
                        {plan.assetSymbol}
                      </span>
                                        </div>

                                        <Button
                                            size="sm"
                                            className="mt-1 h-8 text-[11px] bg-gradient-to-r from-[#2BFFDA] to-[#a94dff] text-[#050510] rounded-lg"
                                            disabled={mutating}
                                            onClick={() => handleOpenStake(plan.assetSymbol)}
                                        >
                                            {t("plans.cta")}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Позиции */}
                    <div className="bg-[#0b0b16]/80 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="text-sm font-semibold">
                                    {t("positions.title")}
                                </h2>
                                <p className="text-[11px] text-white/50">
                                    {t("positions.subtitle")}
                                </p>
                            </div>
                        </div>

                        {!hasAnyPositions && (
                            <div className="text-[11px] text-white/45 py-4">
                                {t("positions.empty")}
                            </div>
                        )}

                        {hasAnyPositions && (
                            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                                {positionsForSelected.map((pos) => {
                                    const started = new Date(pos.startedAt);
                                    const ends = pos.endsAt ? new Date(pos.endsAt) : null;

                                    return (
                                        <div
                                            key={pos.id}
                                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-[11px]"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {pos.assetSymbol}
                          </span>
                                                    <span className="text-white/50">
                            {pos.amount.toFixed(6)}
                          </span>
                                                    <Badge
                                                        className={cn(
                                                            "border text-[9px] px-1.5 py-0 rounded-full",
                                                            pos.status === "ACTIVE"
                                                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/40"
                                                                : "bg-white/5 text-white/60 border-white/20"
                                                        )}
                                                    >
                                                        {pos.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-[10px] text-white/50">
                                                    {t("positions.planLabel")}: {pos.plan.name} •{" "}
                                                    {pos.plan.duration}d • {pos.rewardRate}% APR
                                                </div>
                                                <div className="text-[10px] text-white/35">
                                                    {t("positions.startedAt")}:{" "}
                                                    {started.toLocaleDateString()}{" "}
                                                    {ends && (
                                                        <>
                                                            {" • "}
                                                            {t("positions.endsAt")}:{" "}
                                                            {ends.toLocaleDateString()}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-[10px] border-white/20 bg-white/5 hover:bg-white/10"
                                                    disabled={pos.status !== "ACTIVE" || mutating}
                                                    onClick={() => handleClosePosition(pos.id)}
                                                >
                                                    {t("positions.closeCta")}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}
