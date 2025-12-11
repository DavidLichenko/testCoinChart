"use client";

import {motion} from "framer-motion";
import {useWallet} from "../hooks/useWallet";
import {useI18n} from "@/components/i18n-provider";


export function WalletSummary() {
    const { summary, isLoading } = useWallet();
    const { t } = useI18n("wallet.summary");

    if (isLoading || !summary) {
        return (
            <div className="bg-[#0f0f1a] rounded-2xl p-6 animate-pulse h-40" />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#141428] via-[#141428] to-[#1d1233] rounded-2xl p-6 shadow-xl border border-white/5"
        >
            <div className="flex justify-between items-start gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-white/60">
                        {t("totalBalance") /* en: "Total Balance", es: "Balance total" */}
                    </p>
                    <p className="text-3xl md:text-4xl font-semibold mt-2 text-white">
                        {summary.totalBalance.toFixed(2)} {summary.baseCurrency}
                    </p>
                </div>

                {/* Здесь потом можно добавить селектор валюты */}
                <div className="hidden md:flex items-center gap-2 text-xs text-white/50">
                    {/* t("baseCurrency") en: "Base currency", es: "Moneda base" */}
                    <span>{summary.baseCurrency}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <SummaryTile
                    label={t("ownFunds") /* en: "Own funds", es: "Fondos propios" */}
                    value={summary.ownFunds}
                    highlight
                />
                <SummaryTile
                    label={t("creditBalance") /* en: "Credit balance", es: "Saldo de crédito" */}
                    value={summary.creditBalance}
                    positive
                />
                <SummaryTile
                    label={
                        t("availableToTrade") // en: "Available to trade", es: "Disponible para operar"
                    }
                    value={summary.availableToTrade}
                    positive
                />
            </div>
        </motion.div>
    );
}

function SummaryTile({
                         label,
                         value,
                         highlight,
                         positive
                     }: {
    label: string;
    value: number;
    highlight?: boolean;
    positive?: boolean;
}) {
    return (
        <div className="bg-[#11111f] rounded-xl p-4 border border-white/5 flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-wide text-white/50">
                {label}
            </p>
            <p
                className={`text-lg md:text-xl font-semibold ${
                    highlight ? "text-[#2BFFDA]" : positive ? "text-[#4ade80]" : "text-white"
                }`}
            >
                {value.toFixed(2)}
            </p>
        </div>
    );
}
