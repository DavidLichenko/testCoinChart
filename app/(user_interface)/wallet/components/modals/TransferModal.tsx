"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { useWallet } from "@/app/(user_interface)/wallet/hooks/useWallet";
import { useBalance, refetchBalance } from "@/hooks/useBalance";

interface TransferModalProps {
    transferOpen: boolean;
    closeAll: () => void;
    activeAssetSymbol?: string;
}

export function TransferModal({ transferOpen, closeAll, activeAssetSymbol }: TransferModalProps) {
    const { t } = useI18n("wallet.modals.transfer");
    const { assets, refreshAll } = useWallet();
    const { details } = useBalance();
    const [assetSymbol, setAssetSymbol] = useState("");
    const [amount, setAmount] = useState("");
    const [toEmail, setToEmail] = useState("");

    const selectedAsset = assets?.find(a => a.symbol === assetSymbol);

    const maxAmount = selectedAsset ? selectedAsset.ownBalance : 0;

    useEffect(() => {
        if (activeAssetSymbol) setAssetSymbol(activeAssetSymbol);
        else if (assets && assets.length > 0) setAssetSymbol(assets[0].symbol);
    }, [activeAssetSymbol, assets]);

    const handleClose = () => {
        closeAll();
        setAmount("");
        setToEmail("");
    };

    const onSubmit = async () => {
        if (!assetSymbol || !amount || !toEmail) return;
        const numAmount = Number(amount);
        if (Number.isNaN(numAmount) || numAmount <= 0) return;

        const res = await fetch("/api/wallet/transfer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetSymbol, amount: numAmount, toEmail })
        });

        if (!res.ok) {
            console.error("Transfer error", await res.json());
            return;
        }

        // Refresh all wallet data
        await refreshAll();
        
        // Also refresh the global balance to update the header
        await refetchBalance();
        
        handleClose();
    };

    return (
        <Dialog open={transferOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#11111f] border border-white/10 rounded-2xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg">
                        {t("title") /* en: "Transfer to user", es: "Transferir a usuario" */}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/50">
                        {t("description") /* en: "Send funds to another user by email.", es: "Envía fondos a otro usuario por email." */}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("email")}</Label>
                        <Input
                            value={toEmail}
                            onChange={(e) => setToEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="bg-[#181827] border-white/10 text-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("asset")}</Label>
                        <Select
                            value={assetSymbol}
                            onValueChange={(val) => setAssetSymbol(val)}
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
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("amount")}</Label>
                        <div className="relative">
                            <Input
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-[#181827] border-white/10 text-white pr-16"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 rounded bg-[#252536] px-2 text-[10px] text-white hover:bg-[#2d2d42]"
                                onClick={() => setAmount(maxAmount.toString())}
                            >
                                MAX
                            </Button>
                        </div>
                        {selectedAsset && (
                            <div className="text-[10px] text-white/50 mt-1">
                                Available: {maxAmount.toFixed(8)} {selectedAsset.symbol}
                                {details?.baseCurrency === "EUR" && details?.approxUsd && selectedAsset.symbol === details.baseCurrency && (
                                    <span className="block">
                                        ≈ {(maxAmount * (details.approxUsd / (details.tradingBalance || 1))).toFixed(2)} USD
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-full mt-2 bg-gradient-to-r from-[#2BFFDA] to-[#7a3cff] text-[#050510] rounded-xl"
                        onClick={onSubmit}
                    >
                        {t("submit") /* en: "Send transfer", es: "Enviar transferencia" */}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
