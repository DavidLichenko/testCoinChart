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
    const { assets, refreshAll, summary } = useWallet();
    const { t } = useI18n("wallet.modals.exchange")
    const { details, refetchBalance } = useBalance();

    const baseCurrency = summary?.baseCurrency ?? "USD";
    
    // Filter out base currency - only allow crypto-to-crypto exchanges
    const cryptoAssets = useMemo(() => {
        if (!assets) return [];
        return assets.filter(a => a.symbol !== baseCurrency);
    }, [assets, baseCurrency]);

    const [fromSymbol, setFromSymbol] = useState<string | undefined>();
    const [toSymbol, setToSymbol] = useState<string | undefined>();
    const [amount, setAmount] = useState("");
    const [estimatedReceive, setEstimatedReceive] = useState<number | null>(null);

    // Get the selected asset for displaying currency info
    const selectedAsset = useMemo(() => {
        if (!fromSymbol || !cryptoAssets) return null;
        return cryptoAssets.find(a => a.symbol === fromSymbol);
    }, [fromSymbol, cryptoAssets]);

    // Calculate estimated receive amount
    useEffect(() => {
        if (!fromSymbol || !toSymbol || !amount || !cryptoAssets) {
            setEstimatedReceive(null);
            return;
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setEstimatedReceive(null);
            return;
        }

        // Get asset prices
        const fromAsset = cryptoAssets.find(a => a.symbol === fromSymbol);
        const toAsset = cryptoAssets.find(a => a.symbol === toSymbol);
        
        if (!fromAsset || !toAsset || !fromAsset.price || !toAsset.price) {
            setEstimatedReceive(null);
            return;
        }

        // Calculate conversion
        const valueInUSDT = numAmount * fromAsset.price;
        const receiveAmount = valueInUSDT / toAsset.price;
        
        setEstimatedReceive(receiveAmount);
    }, [fromSymbol, toSymbol, amount, cryptoAssets]);

    // Get max amount for the selected asset (ownBalance only)
    const maxAmount = useMemo(() => {
        if (!fromSymbol || !cryptoAssets) return 0;
        const asset = cryptoAssets.find(a => a.symbol === fromSymbol);
        return asset?.ownBalance || 0;
    }, [fromSymbol, cryptoAssets]);

    useEffect(() => {
        if (cryptoAssets && cryptoAssets.length > 0) {
            const activeAsset = activeAssetSymbol ? cryptoAssets.find(a => a.symbol === activeAssetSymbol) : undefined;
            setFromSymbol(activeAsset ? activeAsset.symbol : cryptoAssets[0].symbol);
            const firstOther = cryptoAssets.find(
                (a) => a.symbol !== (activeAsset ? activeAsset.symbol : cryptoAssets[0].symbol)
            );
            setToSymbol(firstOther?.symbol ?? undefined);
        }
    }, [activeAssetSymbol, cryptoAssets]);

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

    const availableToSymbol = cryptoAssets?.filter((a) => a.symbol !== fromSymbol) ?? [];

    return (
        <Dialog open={exchangeOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#090b1a] border border-[#121426] rounded-3xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg">
                        {t("title") /* en: "Exchange crypto", es: "Intercambiar cripto" */}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/50">
                        {t("description") /* en: "Swap one crypto to another at market price.", es: "Cambia una cripto por otra al precio de mercado." */}
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
                                {cryptoAssets?.map((a) => (
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
                            </div>
                        )}
                        {estimatedReceive !== null && toSymbol && (
                            <div className="text-[10px] text-white/50 mt-1">
                                You will receive: {estimatedReceive.toFixed(8)} {toSymbol}
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
