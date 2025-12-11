"use client";

import {useEffect, useState, useMemo} from "react";
import {useWallet} from "../../hooks/useWallet";
import {useWalletModals} from "../../hooks/useWalletModals";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useI18n} from "@/components/i18n-provider";
import {useBinancePrices} from "../../hooks/useBinancePrices";
import {useBalance} from "@/hooks/useBalance";

export function WithdrawModal() {
    const { withdrawOpen, closeAll, activeAssetSymbol } = useWalletModals();
    const { assets, refreshAll, summary } = useWallet();
    const { t } = useI18n("wallet.modals.withdraw")
    const { refetchBalance } = useBalance();

    const baseCurrency = summary?.baseCurrency ?? "USD";
    
    // Filter out base currency - only allow selling crypto for base currency
    const cryptoAssets = useMemo(() => {
        if (!assets) return [];
        return assets.filter(a => a.symbol !== baseCurrency);
    }, [assets, baseCurrency]);

    const [assetSymbol, setAssetSymbol] = useState<string | undefined>();
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [estimatedReceive, setEstimatedReceive] = useState<number | null>(null);

    // Get prices from Binance
    const prices = useBinancePrices(assetSymbol ? [assetSymbol, "EURUSDT"] : ["EURUSDT"]);
    const ticker = assetSymbol ? prices[assetSymbol] : undefined;
    const eurusdtTicker = prices["EURUSDT"];
    const priceUsdt = ticker ? Number(ticker.c) : 0;
    const eurUsdtRate = eurusdtTicker ? Number(eurusdtTicker.c) : 1;

    // Calculate estimated receive amount in base currency
    useEffect(() => {
        const num = Number(amount);
        if (!num || Number.isNaN(num) || num <= 0 || !priceUsdt) {
            setEstimatedReceive(null);
            return;
        }
        
        // Calculate value in USD first
        const valueInUsd = num * priceUsdt;
        
        // Convert to base currency (EUR) if needed
        if (baseCurrency === "EUR" && eurUsdtRate > 0) {
            setEstimatedReceive(valueInUsd / eurUsdtRate);
        } else {
            // For USD users, USDT ≈ USD
            setEstimatedReceive(valueInUsd);
        }
    }, [amount, priceUsdt, baseCurrency, eurUsdtRate]);

    // Get max amount (ownBalance of selected crypto)
    const maxAmount = useMemo(() => {
        if (!assetSymbol || !cryptoAssets) return 0;
        const asset = cryptoAssets.find(a => a.symbol === assetSymbol);
        return asset?.ownBalance || 0;
    }, [assetSymbol, cryptoAssets]);

    useEffect(() => {
        if (activeAssetSymbol && cryptoAssets.find(a => a.symbol === activeAssetSymbol)) {
            setAssetSymbol(activeAssetSymbol);
        } else if (cryptoAssets && cryptoAssets.length > 0) {
            setAssetSymbol(cryptoAssets[0].symbol);
        }
    }, [activeAssetSymbol, cryptoAssets]);

    const handleClose = () => {
        if (loading) return;
        closeAll();
        setAmount("");
        setError(null);
    };

    const onSubmit = async () => {
        if (!assetSymbol || !amount) return;
        const numAmount = Number(amount);
        if (Number.isNaN(numAmount) || numAmount <= 0) {
            setError("Enter a valid amount");
            return;
        }

        if (numAmount > maxAmount) {
            setError("Insufficient balance");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/wallet/sell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assetSymbol, amount: numAmount })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                console.error("Sell error", data);
                setError(
                    (data && data.error) ||
                    "Failed to sell crypto. Please try again."
                );
                setLoading(false);
                return;
            }

            await refreshAll();
            await refetchBalance();

            handleClose();
        } catch (e) {
            console.error("Sell error:", e);
            setError("Unexpected error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={withdrawOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#090b1a] border border-[#121426] rounded-3xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg">
                        {t("title") /* en: "Sell crypto", es: "Vender cripto" */}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/50">
                        {t("description") /* en: "Convert your crypto to base currency.", es: "Convierte tu cripto a moneda base." */}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Error */}
                    {error && (
                        <div className="rounded-2xl border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("asset")}</Label>
                        <Select
                            value={assetSymbol}
                            onValueChange={(val) => setAssetSymbol(val)}
                        >
                            <SelectTrigger className="bg-[#0f1126] border-[#121426] text-white rounded-2xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f1126] border-[#121426] rounded-2xl">
                                {cryptoAssets?.map((a) => (
                                    <SelectItem key={a.symbol} value={a.symbol}>
                                        {a.symbol}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("amount")}</Label>
                        <div className="relative">
                            <Input
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-[#0f1126] border-[#121426] text-white rounded-2xl pr-16"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 rounded bg-[#0f1126] px-2 text-[10px] text-white hover:bg-[#090b1a]"
                                onClick={() => setAmount(maxAmount.toString())}
                            >
                                MAX
                            </Button>
                        </div>
                        <div className="text-[10px] text-white/50 mt-1">
                            Available: {maxAmount.toFixed(8)} {assetSymbol}
                        </div>
                    </div>

                    {/* Price info */}
                    <div className="rounded-2xl bg-[#0f1126] border border-[#121426] px-3 py-2 text-[11px] text-white/70 space-y-1">
                        <div className="flex items-center justify-between">
                            <span>Market price</span>
                            <span className="font-semibold">
                                {priceUsdt ? `${priceUsdt.toFixed(2)} USDT` : "--"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>You will receive</span>
                            <span className="font-semibold">
                                {estimatedReceive
                                    ? `≈ ${estimatedReceive.toFixed(2)} ${baseCurrency}`
                                    : "--"}
                            </span>
                        </div>
                        <p className="text-[10px] text-white/40">
                            Estimate is based on Binance price in USDT.
                            {baseCurrency === "EUR" && " EUR/USDT conversion rate is applied."}
                        </p>
                    </div>

                    <Button
                        className="w-full mt-2 bg-gradient-to-r from-[#8b5cf6] to-[#7e22ce] text-white rounded-2xl"
                        onClick={onSubmit}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : t("submit") /* en: "Sell crypto", es: "Vender cripto" */}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
