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
import {useBalance} from "@/hooks/useBalance";

export function ExchangeModal() {
    const { exchangeOpen, closeAll, activeAssetSymbol } = useWalletModals();
    const { assets, refreshAll } = useWallet();
    const { t } = useI18n("wallet.modals.exchange")
    const { details, refetchBalance } = useBalance();

    const [fromSymbol, setFromSymbol] = useState<string | undefined>();
    const [toSymbol, setToSymbol] = useState<string | undefined>();
    const [amount, setAmount] = useState("");
    const [estimatedReceive, setEstimatedReceive] = useState<number | null>(null);

    // Get the selected asset for displaying currency info
    const selectedAsset = useMemo(() => {
        if (!fromSymbol || !assets) return null;
        return assets.find(a => a.symbol === fromSymbol);
    }, [fromSymbol, assets]);

    // Calculate estimated receive amount
    useEffect(() => {
        if (!fromSymbol || !toSymbol || !amount || !assets) {
            setEstimatedReceive(null);
            return;
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setEstimatedReceive(null);
            return;
        }

        // Get asset prices
        const fromAsset = assets.find(a => a.symbol === fromSymbol);
        const toAsset = assets.find(a => a.symbol === toSymbol);
        
        if (!fromAsset || !toAsset || !fromAsset.price || !toAsset.price) {
            setEstimatedReceive(null);
            return;
        }

        // Calculate conversion
        const valueInUSDT = numAmount * fromAsset.price;
        const receiveAmount = valueInUSDT / toAsset.price;
        
        setEstimatedReceive(receiveAmount);
    }, [fromSymbol, toSymbol, amount, assets]);

    // Get max amount for the selected asset
    const maxAmount = useMemo(() => {
        if (!fromSymbol || !assets) return 0;
        const asset = assets.find(a => a.symbol === fromSymbol);
        
        if (!asset) return 0;
        
        // For base currency, use availableToTrade
        if (details && fromSymbol === details.baseCurrency) {
            return details.availableToTrade;
        }
        
        // For other assets, use ownBalance
        return asset.ownBalance || 0;
    }, [fromSymbol, assets, details]);

    useEffect(() => {
        if (assets && assets.length > 0) {
            setFromSymbol(activeAssetSymbol ?? assets[0].symbol);
            const firstOther = assets.find(
                (a) => a.symbol !== (activeAssetSymbol ?? assets[0].symbol)
            );
            setToSymbol(firstOther?.symbol ?? undefined);
        }
    }, [activeAssetSymbol, assets]);

    const handleClose = () => {
        closeAll();
        setAmount("");
    };

    const onSubmit = async () => {
        if (!fromSymbol || !toSymbol || !amount) return;
        const numAmount = Number(amount);
        if (Number.isNaN(numAmount) || numAmount <= 0) return;

        const res = await fetch("/api/wallet/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromSymbol, toSymbol, amount: numAmount })
        });

        if (!res.ok) {
            console.error("Exchange error", await res.json());
            return;
        }

        await refreshAll();
        // Also refresh the global balance to update the header
        await refetchBalance();
        handleClose();
    };

    const availableToSymbol = assets?.filter((a) => a.symbol !== fromSymbol) ?? [];

    return (
        <Dialog open={exchangeOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#090b1a] border border-[#121426] rounded-3xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg">
                        {t("title") /* en: "Exchange assets", es: "Intercambiar activos" */}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/50">
                        {t("description") /* en: "Swap one crypto asset to another at market price.", es: "Cambia un activo cripto por otro al precio de mercado." */}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("from")}</Label>
                        <Select
                            value={fromSymbol}
                            onValueChange={(val) => setFromSymbol(val)}
                        >
                            <SelectTrigger className="bg-[#0f1126] border-[#121426] text-white rounded-2xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f1126] border-[#121426] rounded-2xl">
                                {assets?.map((a) => (
                                    <SelectItem key={a.symbol} value={a.symbol}>
                                        {a.symbol}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("to")}</Label>
                        <Select
                            value={toSymbol}
                            onValueChange={(val) => setToSymbol(val)}
                        >
                            <SelectTrigger className="bg-[#0f1126] border-[#121426] text-white rounded-2xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f1126] border-[#121426] rounded-2xl">
                                {availableToSymbol.map((a) => (
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
                                className="bg-[#0f1126] border-[#121426] text-white pr-16 rounded-2xl"
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
                        {selectedAsset && (
                            <div className="text-[10px] text-white/50 mt-1">
                                Available: {maxAmount.toFixed(8)} {selectedAsset.symbol}
                                {details?.baseCurrency === "EUR" && details?.eurUsdRate && selectedAsset.symbol === details.baseCurrency && (
                                    <span className="block">
                                        ≈ {(maxAmount * details.eurUsdRate).toFixed(2)} USD
                                    </span>
                                )}
                            </div>
                        )}
                        {estimatedReceive !== null && toSymbol && (
                            <div className="text-[10px] text-white/50 mt-1">
                                You will receive: {estimatedReceive.toFixed(8)} {toSymbol}
                                {details?.baseCurrency === "EUR" && details?.eurUsdRate && toSymbol === details.baseCurrency && (
                                    <span className="block">
                                        ≈ {(estimatedReceive * details.eurUsdRate).toFixed(2)} USD
                                    </span>
                                )}
                            </div>
                        )}

                    </div>

                    <Button
                        className="w-full mt-2 bg-gradient-to-r from-[#8b5cf6] to-[#7e22ce] text-white rounded-2xl"
                        onClick={onSubmit}
                    >
                        {t("submit") /* en: "Confirm exchange", es: "Confirmar intercambio" */}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
