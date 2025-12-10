"use client";

import {useEffect, useMemo, useState} from "react";
import {useWallet} from "../../hooks/useWallet";
import {useWalletModals} from "../../hooks/useWalletModals";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useI18n} from "@/components/i18n-provider";
import {useStaking} from "../../hooks/useStaking"; // ⬅️ НОВОЕ

export function StakeModal() {
    const { stakeOpen, closeAll, activeAssetSymbol } = useWalletModals();
    const { assets, refreshAll } = useWallet();
    const { t } = useI18n("wallet.modals.stake");

    const [assetSymbol, setAssetSymbol] = useState<string | undefined>();
    const [planId, setPlanId] = useState<string | undefined>();
    const [amount, setAmount] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    // 🎯 Хук стейкинга, завязанный на выбранный актив
    const {
        plans,
        openStake,
        mutating,
        errorCode,
        loading: stakingLoading,
    } = useStaking({ assetSymbol: assetSymbol ?? null });

    // когда модалка открывается и есть актив из контекста — выбираем его
    useEffect(() => {
        if (activeAssetSymbol) {
            setAssetSymbol(activeAssetSymbol);
        } else if (assets && assets.length > 0) {
            setAssetSymbol(assets[0].symbol);
        }
    }, [activeAssetSymbol, assets]);

    // планы для текущего актива
    const plansForAsset = useMemo(
        () =>
            plans.filter((p) => p.assetSymbol === assetSymbol && p.isActive),
        [plans, assetSymbol]
    );

    // авто-выбор первого плана
    useEffect(() => {
        if (plansForAsset.length > 0) {
            setPlanId(plansForAsset[0].id);
        } else {
            setPlanId(undefined);
        }
    }, [plansForAsset]);

    const handleClose = () => {
        closeAll();
        setAmount("");
        setLocalError(null);
    };

    const onSubmit = async () => {
        setLocalError(null);

        if (!assetSymbol || !planId || !amount) return;

        const numAmount = Number(amount);
        if (Number.isNaN(numAmount) || numAmount <= 0) return;

        const result = await openStake({
            assetSymbol,
            planId,
            amount: numAmount,
        });

        if (!result.success) {
            // тут можно сделать mаппинг errorCode -> текст через i18n
            // пока просто ставим generic
            setLocalError(t("errorGeneric"));
            console.error("Stake error", result.error);
            return;
        }

        // Обновляем Wallet (балансы / summary и т.п.)
        await refreshAll();
        handleClose();
    };

    const currentAsset = assets?.find((a) => a.symbol === assetSymbol);
    const isSubmitDisabled =
        !assetSymbol ||
        !planId ||
        !amount ||
        mutating ||
        stakingLoading ||
        plansForAsset.length === 0;

    return (
        <Dialog open={stakeOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#11111f] border border-white/10 rounded-2xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg">
                        {t("title") /* en: "Stake your assets", es: "Haz staking de tus activos" */}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/50">
                        {t("description") /* en: "Lock your crypto to earn rewards over time.", es: "Bloquea tu cripto para ganar recompensas con el tiempo." */}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("asset")}</Label>
                        <Select
                            value={assetSymbol}
                            onValueChange={(val) => {
                                setAssetSymbol(val);
                                setLocalError(null);
                            }}
                        >
                            <SelectTrigger className="bg-[#181827] border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#181827] border-white/10">
                                {assets?.map((a) => (
                                    <SelectItem key={a.symbol} value={a.symbol}>
                                        {a.symbol}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {currentAsset && (
                            <p className="text-[11px] text-white/40 mt-1">
                                {/* en: "Available", es: "Disponible" */}
                                {t("available")}: {currentAsset.balance.toFixed(6)}{" "}
                                {currentAsset.symbol}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("plan")}</Label>
                        <Select
                            value={planId}
                            onValueChange={(val) => {
                                setPlanId(val);
                                setLocalError(null);
                            }}
                        >
                            <SelectTrigger className="bg-[#181827] border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#181827] border-white/10">
                                {plansForAsset.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name} • {p.duration}d • {p.apr}% APR
                                    </SelectItem>
                                ))}
                                {plansForAsset.length === 0 && (
                                    <div className="p-2 text-xs text-white/50">
                                        {t("noPlans") /* en: "No staking plans for this asset", es: "No hay planes de staking para este activo" */}
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("amount")}</Label>
                        <Input
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setLocalError(null);
                            }}
                            placeholder="0.00"
                            className="bg-[#181827] border-white/10 text-white"
                        />
                    </div>

                    {localError && (
                        <p className="text-[11px] text-red-400">
                            {localError}
                        </p>
                    )}

                    <Button
                        disabled={isSubmitDisabled}
                        className="w-full mt-2 bg-gradient-to-r from-[#2BFFDA] to-[#a94dff] text-[#050510] rounded-xl disabled:opacity-40"
                        onClick={onSubmit}
                    >
                        {mutating
                            ? t("submitting") /* en: "Staking...", es: "Procesando staking..." */
                            : t("submit") /* en: "Start staking", es: "Empezar staking" */}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
