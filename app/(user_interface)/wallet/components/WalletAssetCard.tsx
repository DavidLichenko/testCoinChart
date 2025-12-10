"use client";

import {motion} from "framer-motion";
import {WalletAsset} from "../hooks/useWallet";
import {useWalletModals} from "../hooks/useWalletModals";
import {Button} from "@/components/ui/button";
import {ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine} from "lucide-react";

export function WalletAssetCard({ asset }: { asset: WalletAsset }) {
    const { openDeposit, openWithdraw, openExchange, openStake } = useWalletModals();

    const isUp = asset.change24h >= 0;

    return (
        <motion.div
            whileHover={{ scale: 1.02, translateY: -2 }}
            className="bg-[#11111f] rounded-2xl p-4 border border-white/5 shadow-lg flex flex-col justify-between gap-4"
        >
            <div className="flex justify-between items-start gap-3">
                <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                        {/* Можно вставить иконку монеты позже */}
                        {asset.symbol}
                    </p>
                    <p className="text-xs text-white/50">{asset.name}</p>
                </div>
                <div
                    className={`text-xs px-2 py-1 rounded-full border ${
                        isUp
                            ? "border-green-400/40 text-green-300 bg-green-500/10"
                            : "border-red-400/40 text-red-300 bg-red-500/10"
                    }`}
                >
                    {asset.change24h.toFixed(2)}%
                </div>
            </div>

            <div>
                <p className="text-xs text-white/50">
                    {/* i18n: wallet.assets.balance -> en: "Balance", es: "Saldo" */}
                    Balance
                </p>
                <p className="text-xl font-semibold text-white mt-1">
                    {asset.balance.toFixed(6)}
                </p>
                <p className="text-xs text-white/40 mt-1">
                    ≈ {asset.totalValue.toFixed(2)} USDT
                </p>
            </div>

            <div className="flex justify-between items-center gap-2">
                <div className="flex gap-2">
                    <IconButton
                        onClick={() => openDeposit(asset.symbol)}
                        icon={<ArrowDownToLine className="w-4 h-4" />}
                        // i18n: wallet.actions.deposit -> en: "Deposit", es: "Depositar"
                        label="Dep"
                    />
                    <IconButton
                        onClick={() => openWithdraw(asset.symbol)}
                        icon={<ArrowUpFromLine className="w-4 h-4" />}
                        // i18n: wallet.actions.withdraw -> en: "Withdraw", es: "Retirar"
                        label="Wdr"
                    />
                    <IconButton
                        onClick={() => openExchange(asset.symbol)}
                        icon={<ArrowRightLeft className="w-4 h-4" />}
                        // i18n: wallet.actions.exchange -> en: "Exchange", es: "Intercambiar"
                        label="Ex"
                    />
                </div>
                <Button
                    size="sm"
                    className="rounded-xl px-3 py-1 text-xs bg-gradient-to-r from-[#7a3cff] to-[#a94dff] text-white border-none"
                    onClick={() => openStake(asset.symbol)}
                >
                    {/* i18n: wallet.actions.stake -> en: "Stake", es: "Staking" */}
                    Stake
                </Button>
            </div>
        </motion.div>
    );
}

function IconButton({
                        onClick,
                        icon,
                        label
                    }: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
        >
            {icon}
            {/* label можно скрыть для компактности, или сделать tooltip */}
        </button>
    );
}
