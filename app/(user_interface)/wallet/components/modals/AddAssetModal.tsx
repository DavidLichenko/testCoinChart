"use client";

import {useState} from "react";
import {useWallet} from "../../hooks/useWallet";
import {useWalletModals} from "../../hooks/useWalletModals";
import useSWR from "swr";
import {fetcher} from "../../hooks/fetcher";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useI18n} from "@/components/i18n-provider";

type AssetMeta = {
    symbol: string;
    name: string;
    type: string;
    isStakable: boolean;
};

export function AddAssetModal() {
    const { addAssetOpen, closeAll } = useWalletModals();
    const { refreshAll } = useWallet();
    const { t } = useI18n("wallet.modals.addAsset")

    const { data: availableAssets, isLoading } = useSWR<AssetMeta[]>(
        addAssetOpen ? "/api/wallet/available-assets" : null,
        fetcher
    );

    const [submitting, setSubmitting] = useState<string | null>(null);

    const handleClose = () => {
        closeAll();
        setSubmitting(null);
    };

    const handleAdd = async (symbol: string) => {
        setSubmitting(symbol);
        const res = await fetch("/api/wallet/add-asset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetSymbol: symbol })
        });

        if (!res.ok) {
            console.error("Add asset error", await res.json());
            setSubmitting(null);
            return;
        }

        await refreshAll();
        handleClose();
    };

    return (
        <Dialog open={addAssetOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#11111f] border border-white/10 rounded-2xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg">
                        {t("title") /* en: "Add new asset", es: "Agregar nuevo activo" */}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/50">
                        {t("description") /* en: "Select a crypto asset to add it to your wallet.", es: "Selecciona un activo cripto para añadirlo a tu billetera." */}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-2 max-h-72 overflow-y-auto">
                    {isLoading && (
                        <p className="text-xs text-white/50">
                            {t("loading") /* en: "Loading assets...", es: "Cargando activos..." */}
                        </p>
                    )}

                    {!isLoading && availableAssets && availableAssets.length === 0 && (
                        <p className="text-xs text-white/50">
                            {t("empty") /* en: "No more assets available", es: "No hay más activos disponibles" */}
                        </p>
                    )}

                    {!isLoading &&
                        availableAssets &&
                        availableAssets.map((a) => (
                            <div
                                key={a.symbol}
                                className="flex items-center justify-between gap-2 bg-[#181827] rounded-xl p-3 border border-white/10"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        {a.symbol}
                                    </p>
                                    <p className="text-[11px] text-white/50">{a.name}</p>
                                    {a.isStakable && (
                                        <p className="text-[10px] text-[#2BFFDA] mt-1">
                                            {/* en: "Staking available", es: "Staking disponible" */}
                                            {t("stakable")}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    disabled={!!submitting}
                                    size="sm"
                                    className="rounded-xl bg-gradient-to-r from-[#7a3cff] to-[#a94dff] text-white"
                                    onClick={() => handleAdd(a.symbol)}
                                >
                                    {submitting === a.symbol
                                        ? t("adding") /* en: "Adding...", es: "Agregando..." */
                                        : t("add") /* en: "Add", es: "Agregar" */}
                                </Button>
                            </div>
                        ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
