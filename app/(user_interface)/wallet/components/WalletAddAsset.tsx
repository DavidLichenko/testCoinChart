"use client";

import {useWalletModals} from "../hooks/useWalletModals";
import {Plus} from "lucide-react";
import {useI18n} from "@/components/i18n-provider";

export function WalletAddAsset() {
    const { openAddAsset } = useWalletModals();
    const { t } = useI18n("wallet.actions")

    return (
        <button
            onClick={openAddAsset}
            className="flex items-center gap-2 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2"
        >
            <Plus className="w-4 h-4" />
            {/* wallet.actions.addAsset -> en: "Add asset", es: "Agregar activo" */}
            {t("addAsset")}
        </button>
    );
}
