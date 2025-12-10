"use client";

import { RiWalletFill } from "react-icons/ri";
import { useBalance } from "@/hooks/useBalance";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

interface MobileBalanceCardProps {
    className?: string;
}

export function MobileBalanceCard({ className }: MobileBalanceCardProps) {
    const { t } = useI18n();
    const { details, balance } = useBalance();

    const isLoading = !details;

    if (!details) {
        // Скелетон, пока не прилетел баланс
        return (
            <div
                className={cn(
                    "w-full rounded-xl bg-[#090812] border border-[#1b1729] px-3 py-3",
                    "flex flex-col gap-3 animate-pulse",
                    className
                )}
            >
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-[#151021]" />
                    <div className="flex flex-col gap-1">
                        <div className="h-3 w-20 rounded bg-[#151021]" />
                        <div className="h-2.5 w-32 rounded bg-[#151021]" />
                    </div>
                </div>

                <div className="h-6 w-28 rounded bg-[#151021]" />

                <div className="grid grid-cols-2 gap-2">
                    <div className="h-10 rounded-md bg-[#151021]" />
                    <div className="h-10 rounded-md bg-[#151021]" />
                </div>
            </div>
        );
    }

    const {
        baseCurrency,
        tradingBalance,
        tradingInTrade,
        availableToTrade,
        availableToWithdraw,
        pendingWithdrawAmount,
        lockedTrading,
        creditLimit,
        creditUsed,
        creditAvailable,
    } = details;

    const hasCredit = creditLimit > 0.0001;

    return (
        <div
            className={cn(
                "w-full rounded-xl bg-background border border-[#1b1729] px-3 py-3",
                "flex flex-col gap-3",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-800">
                        <RiWalletFill className="h-5 w-5 text-[#9b5bff]"/>
                    </div>
                    <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
              {t("balance")}
            </span>
                        <span className="text-[10px] text-[#6b7280]">
              {t("balanceShortDescription") ?? "Trading account overview"}
            </span>
                    </div>
                </div>

                <span className="rounded-full bg-[#181327] px-2.5 py-1 text-[10px] font-semibold text-[#d1d5db]">
          {baseCurrency}
        </span>
            </div>

            {/* Total */}
            <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
          <span className="text-[20px] font-semibold text-white leading-none">
            {balance.toFixed(2)}
          </span>
                    <span className="text-[11px] font-medium text-[#9ca3af] leading-none">
            {baseCurrency}
          </span>
                </div>
                <span className="text-[11px] text-[#6b7280]">
          {t("totalBalance") ?? "Total balance (equity)"}
        </span>
            </div>

            {/* Available chips */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-[#11101c] px-2.5 py-2">
                    <div className="text-[10px] text-[#9ca3af]">
                        {t("availableToTrade") ?? "Available to trade"}
                    </div>
                    <div className="mt-0.5 text-[13px] font-semibold text-white">
                        {availableToTrade.toFixed(2)} {baseCurrency}
                    </div>
                </div>

                <div className="rounded-md bg-[#11101c] px-2.5 py-2">
                    <div className="text-[10px] text-[#9ca3af]">
                        {t("availableToWithdraw") ?? "Available to withdraw"}
                    </div>
                    <div className="mt-0.5 text-[13px] font-semibold text-white">
                        {availableToWithdraw.toFixed(2)} {baseCurrency}
                    </div>
                </div>
            </div>

            {/* More breakdown */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#9ca3af]">
                <div className="rounded-md bg-[#0d0b18] px-2.5 py-2">
                    <div className="flex items-center justify-between">
                        <span>{t("inTrade") ?? "In trade"}</span>
                        <span className="font-semibold text-[#e5e7eb]">
        {tradingInTrade.toFixed(2)} {baseCurrency}
      </span>
                    </div>
                </div>

                <div className="rounded-md bg-[#0d0b18] px-2.5 py-2">
                    <div className="flex items-center justify-between">
                        <span>{t("fundsInWork") ?? "Funds in work"}</span>
                        <span className="font-semibold text-[#e5e7eb]">
        {lockedTrading.toFixed(2)} {baseCurrency}
      </span>
                    </div>
                </div>

                <div className="rounded-md bg-[#0d0b18] px-2.5 py-2">
                    <div className="flex items-center justify-between">
                        <span>{t("pendingWithdrawals") ?? "Pending withdraw"}</span>
                        <span className="font-semibold text-[#e5e7eb]">
        {pendingWithdrawAmount.toFixed(2)} {baseCurrency}
      </span>
                    </div>
                </div>

                {hasCredit && (
                    <div className="rounded-md bg-[#0d0b18] px-2.5 py-2">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span>{t("creditUsed") ?? "Credit used"}</span>
                                <span className="font-semibold text-[#f97373]">
            {creditUsed.toFixed(2)} {baseCurrency}
          </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#6b7280]">
                                <span>{t("creditLimit") ?? "Limit"}</span>
                                <span className="font-medium text-[#a5b4fc]">
            {creditLimit.toFixed(2)} {baseCurrency} ·{" "}
                                    {t("creditAvailable") ?? "Available"}{" "}
                                    {creditAvailable.toFixed(2)}
          </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
