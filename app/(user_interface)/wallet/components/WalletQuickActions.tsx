"use client";

import {useWalletModals} from "../hooks/useWalletModals";
import {Button} from "@/components/ui/button";
import {ArrowDownToLine, ArrowLeftRight, ArrowRightLeft, ArrowUpFromLine, Stars} from "lucide-react";
import {useI18n} from "@/components/i18n-provider";

export function WalletQuickActions() {
    const { openDeposit, openWithdraw, openTransfer, openExchange, openStake, openAddAsset } =
        useWalletModals();
    const { t } = useI18n("wallet.actions")

    return (
        <section className="space-y-3">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-white/80">
                    {t("quickActions") /* en: "Quick actions", es: "Acciones rápidas" */}
                </h2>
                <button
                    onClick={openAddAsset}
                    className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/70 hover:bg-white/10"
                >
                    {/* wallet.actions.addAsset -> en: "Add asset", es: "Agregar activo" */}
                    {t("addAsset")}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <ActionButton
                    icon={<ArrowDownToLine className="w-4 h-4" />}
                    label={t("deposit") /* en: "Deposit", es: "Depositar" */}
                    onClick={() => openDeposit()}
                />
                <ActionButton
                    icon={<ArrowUpFromLine className="w-4 h-4" />}
                    label={t("withdraw") /* en: "Withdraw", es: "Retirar" */}
                    onClick={() => openWithdraw()}
                />
                <ActionButton
                    icon={<ArrowLeftRight className="w-4 h-4" />}
                    label={t("transfer") /* en: "Transfer", es: "Transferir" */}
                    onClick={() => openTransfer()}
                />
                <ActionButton
                    icon={<ArrowRightLeft className="w-4 h-4" />}
                    label={t("exchange") /* en: "Exchange", es: "Intercambiar" */}
                    onClick={() => openExchange()}
                />
                <ActionButton
                    icon={<Stars className="w-4 h-4" />}
                    label={t("stake") /* en: "Stake", es: "Staking" */}
                    onClick={() => openStake()}
                />
            </div>
        </section>
    );
}

function ActionButton({
                          icon,
                          label,
                          onClick
                      }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <Button
            type="button"
            onClick={onClick}
            className="flex flex-col items-start justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#17172b] to-[#1f1236] border border-white/5 text-left h-20 hover:from-[#1d1d33] hover:to-[#241642]"
        >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <span className="text-xs font-medium text-white">{label}</span>
        </Button>
    );
}
