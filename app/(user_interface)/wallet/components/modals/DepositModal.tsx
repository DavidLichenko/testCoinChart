"use client";

import {useEffect, useMemo, useState} from "react";
import {useWallet} from "../../hooks/useWallet";
import {useWalletModals} from "../../hooks/useWalletModals";
import {useI18n} from "@/components/i18n-provider";

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useBinancePrices} from "../../hooks/useBinancePrices";

export function DepositModal() {
    const { depositOpen, closeAll, activeAssetSymbol } = useWalletModals();
    const { summary, refreshAll } = useWallet();
    const { t } = useI18n("wallet.modals.deposit");

    const baseCurrency = summary?.baseCurrency ?? "USD";
    const available = summary?.ownFunds ?? 0; // Changed from availableToTrade to ownFunds

    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // выбранный ассет — из модального стора
    const assetSymbol = activeAssetSymbol ?? "BTC";

    // подтянем цену с Binance (для подсказки "≈ сколько заплатишь")
    const prices = useBinancePrices(assetSymbol ? [assetSymbol, "EURUSDT"] : ["EURUSDT"]);
    const ticker = assetSymbol ? prices[assetSymbol] : undefined;
    const eurusdtTicker = prices["EURUSDT"];
    const priceUsdt = ticker ? Number(ticker.c) : 0;
    const eurUsdtRate = eurusdtTicker ? Number(eurusdtTicker.c) : 1; // EUR/USDT rate

    const estimatedCost = useMemo(() => {
        const num = Number(amount);
        if (!num || Number.isNaN(num) || num <= 0 || !priceUsdt) return null;
        
        // Calculate cost in USD first
        const costInUsd = num * priceUsdt;
        
        // Convert to base currency (EUR) if needed
        if (baseCurrency === "EUR" && eurUsdtRate > 0) {
            return costInUsd / eurUsdtRate;
        }
        
        // For USD users, USDT ≈ USD
        return costInUsd;
    }, [amount, priceUsdt, baseCurrency, eurUsdtRate]);

    useEffect(() => {
        // сбрасываем состояние при смене ассета
        setAmount("");
        setError(null);
    }, [assetSymbol, depositOpen]);

    const handleClose = () => {
        if (loading) return;
        closeAll();
        setAmount("");
        setError(null);
    };

    const onSubmit = async () => {
        if (!assetSymbol) return;

        const numAmount = Number(amount);
        if (!numAmount || Number.isNaN(numAmount) || numAmount <= 0) {
            setError("Enter a valid amount");
            return;
        }

        // простая проверка, чтобы не пытались купить на сумму сильно выше доступного
        if (estimatedCost && estimatedCost > available * 1.05) {
            setError("Not enough available balance to buy this amount");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/wallet/buy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assetSymbol,
                    amount: numAmount,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                console.error("Buy error", data);
                setError(
                    (data && data.error) ||
                    "Failed to buy asset. Please try again."
                );
                setLoading(false);
                return;
            }

            await refreshAll();

            // красивый glow на фоне
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("wallet-balance-glow"));
            }

            handleClose();
        } catch (e) {
            console.error("Buy error:", e);
            setError("Unexpected error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={depositOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#090b1a] border border-[#121426] rounded-3xl max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                        {/* ВАЖНО: есть DialogTitle → больше нет ошибки от Radix */}
                        <DialogTitle className="text-white text-lg">
                            {/* можно переименовать в t("buyTitle"), если хочешь */}
                            {t("title") || "Buy crypto"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-white/55">
                            {t("description") ||
                                "Use your main balance to buy crypto and hold or stake it."}
                        </DialogDescription>
                    </div>

                    {/* pill с выбранным активом */}
                    {assetSymbol && (
                        <div className="flex items-center gap-2 bg-[#0f1126] rounded-full px-3 py-1 border border-[#121426]">
                            <div className="w-6 h-6 rounded-full bg-[#090b1a] flex items-center justify-center overflow-hidden">
                                <img
                                    src={`/icons/crypto_icons/${assetSymbol}.png`}
                                    alt={assetSymbol}
                                    className="w-5 h-5 object-contain"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                />
                            </div>
                            <span className="text-xs text-white/80 font-medium">
                {assetSymbol}
              </span>
                        </div>
                    )}
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {/* Ошибка */}
                    {error && (
                        <div className="rounded-2xl border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    )}

                    {/* Доступный баланс */}
                    <div className="rounded-2xl bg-[#0f1126] border border-[#121426] px-3 py-2.5 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-white/60">Available to spend</span>
                            <span className="font-semibold text-white">
                {available.toFixed(2)} {baseCurrency}
              </span>
                        </div>
                        <p className="mt-1 text-[11px] text-white/40">
                            This is your own funds balance (can be used to buy crypto).
                        </p>
                    </div>

                    {/* Ввод количества крипты */}
                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">
                            Amount to buy ({assetSymbol})
                        </Label>
                        <Input
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-[#0f1126] border-[#121426] text-white rounded-2xl h-10 text-sm"
                        />
                        <p className="text-[11px] text-white/40">
                            Enter how much {assetSymbol} you want to buy.
                        </p>
                    </div>

                    {/* Подсказка по цене */}
                    <div className="rounded-2xl bg-[#0f1126] border border-[#121426] px-3 py-2 text-[11px] text-white/70 space-y-1">
                        <div className="flex items-center justify-between">
                            <span>Market price</span>
                            <span className="font-semibold">
                {priceUsdt ? `${priceUsdt.toFixed(2)} USDT` : "--"}
              </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Estimated cost</span>
                            <span className="font-semibold">
                {estimatedCost
                    ? `≈ ${estimatedCost.toFixed(2)} ${baseCurrency}`
                    : "--"}
              </span>
                        </div>
                        <p className="text-[10px] text-white/40">
                            Estimate is based on Binance price in USDT. 
                            {baseCurrency === "EUR" && " EUR/USDT conversion rate is applied."}
                        </p>
                    </div>

                    <Button
                        className="w-full mt-1 bg-gradient-to-r from-[#8b5cf6] to-[#7e22ce] text-white rounded-2xl h-10 text-sm font-semibold"
                        onClick={onSubmit}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Buy"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
