"use client";

import {useEffect, useState} from "react";
import {useWallet} from "../../hooks/useWallet";
import {useWalletModals} from "../../hooks/useWalletModals";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useI18n} from "@/components/i18n-provider";

export function WithdrawModal() {
    const { withdrawOpen, closeAll, activeAssetSymbol } = useWalletModals();
    const { assets, refreshAll } = useWallet();
    const { t } = useI18n("wallet.modals.withdraw")


    const [assetSymbol, setAssetSymbol] = useState<string | undefined>();
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");

    useEffect(() => {
        if (activeAssetSymbol) setAssetSymbol(activeAssetSymbol);
        else if (assets && assets.length > 0) setAssetSymbol(assets[0].symbol);
    }, [activeAssetSymbol, assets]);

    const handleClose = () => {
        closeAll();
        setAmount("");
        setAddress("");
    };

    const onSubmit = async () => {
        if (!assetSymbol || !amount || !address) return;
        const numAmount = Number(amount);
        if (Number.isNaN(numAmount) || numAmount <= 0) return;

        const res = await fetch("/api/wallet/withdraw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetSymbol, amount: numAmount, address })
        });

        if (!res.ok) {
            console.error("Withdraw error", await res.json());
            return;
        }

        await refreshAll();
        handleClose();
    };

    return (
        <Dialog open={withdrawOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#11111f] border border-white/10 rounded-2xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg">
                        {t("title") /* en: "Withdraw crypto", es: "Retirar cripto" */}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/50">
                        {t("description") /* en: "Request a withdrawal to your external wallet.", es: "Solicita un retiro a tu billetera externa." */}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
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
                        <Input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-[#181827] border-white/10 text-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-white/70">{t("address")}</Label>
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="0x... / TRC20 / BEP20"
                            className="bg-[#181827] border-white/10 text-white"
                        />
                    </div>

                    <Button
                        className="w-full mt-2 bg-gradient-to-r from-[#ff357a] to-[#ff7a3c] text-white rounded-xl"
                        onClick={onSubmit}
                    >
                        {t("submit") /* en: "Request withdrawal", es: "Solicitar retiro" */}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
