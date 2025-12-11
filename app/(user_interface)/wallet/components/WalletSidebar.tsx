"use client";

import {useWallet} from "../hooks/useWallet";
import {useWalletModals} from "../hooks/useWalletModals";
import {useI18n} from "@/components/i18n-provider";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Button} from "@/components/ui/button";
import {WalletHistory} from "./WalletHistory";

type Props = {
    selectedSymbol?: string | null;
};

export function WalletSidebar({ selectedSymbol }: Props) {
    const { summary, assets } = useWallet();
    const { openDeposit, openWithdraw } = useWalletModals();
    const { t } = useI18n("wallet.sidebar");
    const pathname = usePathname();

    const isStaking = pathname.startsWith("/wallet/staking");
    const isWallet = pathname === "/wallet" || pathname.startsWith("/wallet?");

    // Extract detailed balance information
    const total = summary?.totalBalance ?? 0;
    const base = (summary?.baseCurrency as "USD" | "EUR") ?? "USD";
    
    // Calculate crypto balance (sum of all crypto assets)
    const cryptoBalance = assets?.reduce((sum, asset) => {
        // Exclude base currency assets (USD/EUR) from crypto balance
        if (asset.symbol === "USD" || asset.symbol === "USDT" || asset.symbol === base) {
            return sum;
        }
        return sum + asset.totalValue;
    }, 0) ?? 0;
    
    // Show credit information only if there's credit and it's configured
    const hasCredit = (summary?.creditLimit ?? 0) > 0;
    const creditUsed = summary?.creditUsed ?? 0;
    const creditLimit = summary?.creditLimit ?? 0;
    
    // For EUR users, we might want to show an approximate USD value
    const approxUsd =
        base === "EUR" && (summary as any)?.approxUsd
            ? Number((summary as any).approxUsd)
            : base === "USD"
                ? total
                : undefined;

    return (
        <aside className="space-y-6">
            {/* Total balance + actions */}
            <div className="bg-gradient-to-br from-[#17172b] via-[#181832] to-[#241642] rounded-2xl p-5 border border-white/10 shadow-lg">
                <p className="text-[11px] uppercase tracking-wide text-white/60">
                    {t("totalLabel")}
                </p>

                <div className="flex items-baseline justify-between mt-2">
                    <p className="text-3xl font-semibold text-white">
                        {total.toFixed(2)} {base}
                    </p>
                    <span className="text-xs text-white/40">{base}</span>
                </div>

                {approxUsd !== undefined && base === "EUR" && (
                    <p className="mt-1 text-[11px] text-white/45">
                        ≈ {approxUsd.toFixed(2)} USD
                    </p>
                )}

                {/* Detailed balance breakdown */}
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60">{t("cryptoBalance")}</span>
                        <span className="text-white font-medium">
                            {cryptoBalance.toFixed(2)} {base}
                        </span>
                    </div>
                    {hasCredit && (
                        <div className="flex justify-between text-sm">
                            <span className="text-white/60">{t("creditBalance")}</span>
                            <span className="text-white font-medium">
                                {creditUsed.toFixed(2)} / {creditLimit.toFixed(2)} {base}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex gap-2">
                    <Button
                        className="flex-1 rounded-xl bg-gradient-to-r from-[#2BFFDA] to-[#7a3cff] text-[#050510] text-sm font-medium shadow-[0_0_18px_rgba(123,97,255,0.35)]"
                        onClick={() => openDeposit(selectedSymbol ?? undefined)}
                    >
                        {t("deposit") /* тут уже логически Buy, но ключ можешь переименовать */}
                    </Button>
                    <Button
                        className="flex-1 rounded-xl bg-[#0f0f1f] border border-white/15 text-sm font-medium hover:bg-[#17172b]"
                        onClick={() => openWithdraw(selectedSymbol ?? undefined)}
                    >
                        {t("withdraw")}
                    </Button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="bg-[#11111f] rounded-2xl p-4 border border-white/8 space-y-3 text-sm">
                <p className="text-[11px] uppercase tracking-wide text-white/45">
                    {t("navigation")}
                </p>

                <div className="space-y-2">
                    {/* Wallet */}
                    <Link
                        href="/wallet"
                        className={
                            "block w-full rounded-2xl px-3 py-2.5 text-sm font-medium transition-all " +
                            (!isStaking
                                ? "bg-[linear-gradient(135deg,#2BFFDA,#7a3cff)] text-[#050550] shadow-[0_0_22px_rgba(124,97,255,0.55)]"
                                : "text-white/70 hover:text-white hover:bg-white/5")
                        }
                    >
                        <div className="flex items-center gap-2">
              <span
                  className={
                      "inline-flex h-5 w-1 rounded-full " +
                      (!isStaking ? "bg-[#050510]/40" : "bg-white/10")
                  }
              />
                            <span>{t("navWallet")}</span>
                        </div>
                    </Link>

                    {/* Staking */}
                    <Link
                        href="/wallet/staking"
                        className={
                            "block w-full rounded-2xl px-3 py-2.5 text-sm font-medium transition-all " +
                            (isStaking
                                ? "bg-[linear-gradient(135deg,#7a3cff,#ff4fd1)] text-[#fff] shadow-[0_0_22px_rgba(255,79,209,0.55)]"
                                : "text-white/70 hover:text-white hover:bg-white/5")
                        }
                    >
                        <div className="flex items-center gap-2">
              <span
                  className={
                      "inline-flex h-5 w-1 rounded-full " +
                      (isStaking ? "bg-[#050510]/40" : "bg-white/10")
                  }
              />
                            <span>{t("navStaking")}</span>
                        </div>
                    </Link>
                </div>

                <p className="text-[11px] text-white/40 leading-snug">
                    {t("stakingHint")}
                </p>
            </nav>

            {/* History Section */}
            <div className="bg-[#11111f] rounded-2xl p-4 border border-white/8">
                <WalletHistory />
            </div>
        </aside>
    );
}
