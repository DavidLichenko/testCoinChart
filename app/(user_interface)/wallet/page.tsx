"use client";

import {useState} from "react";
import {WalletSidebar} from "./components/WalletSidebar";
import {WalletAssetList} from "./components/WalletAssetList";
import {useI18n} from "@/components/i18n-provider";

export default function WalletPage() {
    const { t } = useI18n("wallet.page");
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    return (
        <>
            <header className="mb-2">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    {t("title")}
                </h1>
                <p className="text-sm text-white/60 mt-1">{t("subtitle")}</p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
                <WalletSidebar selectedSymbol={selectedSymbol} />
                <WalletAssetList
                    selectedSymbol={selectedSymbol}
                    onSelectSymbol={(sym) => setSelectedSymbol(sym)}
                />
            </div>
        </>
    );
}
