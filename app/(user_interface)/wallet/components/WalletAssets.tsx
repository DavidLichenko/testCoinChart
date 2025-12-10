"use client";

import {useWallet} from "../hooks/useWallet";
import {WalletAssetCard} from "./WalletAssetCard";
import {useI18n} from "@/components/i18n-provider";
import useSWR from "swr";
import {fetcher} from "../hooks/fetcher";
import {useState} from "react";
import {Button} from "@/components/ui/button";

type AvailableAsset = {
    symbol: string;
    name: string;
    type: string;
    isStakable?: boolean;
};

export function WalletAssets() {
    const { assets, isLoading, refreshAll } = useWallet();
    const { t } = useI18n("wallet.assets");

    const {
        data: availableAssets,
        isLoading: availableLoading
    } = useSWR<AvailableAsset[]>(
        !assets || assets.length === 0 ? "/api/wallet/available-assets" : null,
        fetcher
    );

    const [adding, setAdding] = useState<string | null>(null);

    const handleQuickAdd = async (symbol: string) => {
        setAdding(symbol);
        try {
            const res = await fetch("/api/wallet/add-asset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assetSymbol: symbol })
            });

            if (!res.ok) {
                console.error("Add asset error", await res.json());
                return;
            }

            await refreshAll();
        } finally {
            setAdding(null);
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex justify-between items-center gap-2">
                <h2 className="text-lg font-semibold text-white">
                    {t("title") /* en: "Your assets", es: "Tus activos" */}
                </h2>
            </div>

            {/* 1) Скелет, пока грузится */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-[#0f0f1a] h-32 rounded-2xl animate-pulse"
                        />
                    ))}
                </div>
            )}

            {/* 2) Есть реальные активы */}
            {!isLoading && assets && assets.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {assets.map((asset) => (
                        <WalletAssetCard key={asset.symbol} asset={asset} />
                    ))}
                </div>
            )}

            {/* 3) Нет активов → показываем красиво “каталог” монет */}
            {!isLoading && assets && assets.length === 0 && (
                <div className="space-y-3">
                    <p className="text-sm text-white/60">
                        {t("empty") /* en: "You don't have any assets yet.", es: "Todavía no tienes activos." */}
                    </p>

                    <div className="bg-[#11111f] rounded-2xl border border-white/5 p-4 md:p-5 space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-xs uppercase tracking-wide text-white/50">
                                {/* en: "Popular crypto assets", es: "Activos cripto populares" */}
                                {t("popular")}
                            </p>
                            <p className="text-[11px] text-white/40">
                                {/* en: "Enable an asset to start using the wallet.", es: "Activa un activo para empezar a usar la billetera." */}
                                {t("popularHint")}
                            </p>
                        </div>

                        {availableLoading && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-[#181827] h-20 rounded-xl animate-pulse"
                                    />
                                ))}
                            </div>
                        )}

                        {!availableLoading && availableAssets && availableAssets.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {availableAssets.slice(0, 8).map((a) => (
                                    <div
                                        key={a.symbol}
                                        className="bg-[#181827] rounded-xl p-3 border border-white/10 flex flex-col justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {a.symbol}
                                            </p>
                                            <p className="text-[11px] text-white/50 truncate">
                                                {a.name}
                                            </p>
                                            {a.isStakable && (
                                                <p className="text-[10px] text-[#2BFFDA] mt-1">
                                                    {/* en: "Staking available", es: "Staking disponible" */}
                                                    {t("stakable")}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!!adding}
                                            className="mt-2 w-full rounded-lg border-white/20 bg-white/5 text-[11px] text-white hover:bg-white/10"
                                            onClick={() => handleQuickAdd(a.symbol)}
                                        >
                                            {adding === a.symbol
                                                ? t("adding") // en: "Adding...", es: "Agregando..."
                                                : t("add") /* en: "Add asset", es: "Agregar activo" */}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
