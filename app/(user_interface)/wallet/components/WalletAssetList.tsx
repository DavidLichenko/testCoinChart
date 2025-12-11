"use client";

import {useMemo, useState} from "react";
import {useWallet} from "../hooks/useWallet";
import {useBinancePrices} from "../hooks/useBinancePrices";
import {CRYPTO_LIST} from "../config/cryptoList";
import {useI18n} from "@/components/i18n-provider";
import {Input} from "@/components/ui/input";
import {useWalletModals} from "../hooks/useWalletModals";
import {Button} from "@/components/ui/button";
import {ArrowUpRight, ArrowDownRight, Wallet, ArrowRight, Send, Repeat} from "lucide-react";

type Props = {
    selectedSymbol?: string | null;
    onSelectSymbol: (symbol: string) => void;
};

export function WalletAssetList({ selectedSymbol, onSelectSymbol }: Props) {
    const { assets } = useWallet();
    const { t } = useI18n("wallet.assets");
    const [search, setSearch] = useState("");
    const { openDeposit, openTransfer, openExchange } = useWalletModals();

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const maxScroll = el.scrollHeight - el.clientHeight;
        const progress = maxScroll > 0 ? el.scrollTop / maxScroll : 0;

        window.dispatchEvent(
            new CustomEvent("wallet-scroll", {
                detail: { progress },
            })
        );
    };

    // цены с Binance, как раньше
    const prices = useBinancePrices(CRYPTO_LIST.map((c) => c.symbol));

    // мапа "символ → баланс" из /api/wallet/assets
    const balancesBySymbol = useMemo(() => {
        const map: Record<string, number> = {};
        if (assets) {
            for (const a of assets) {
                map[a.symbol] = a.balance; // теперь это own + locked
            }
        }
        return map;
    }, [assets]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        const enriched = CRYPTO_LIST.map((c) => {
            const balance = balancesBySymbol[c.symbol] ?? 0;
            const ticker = prices[c.symbol];
            const price = ticker ? Number(ticker.c) : 0;
            const change = ticker ? Number(ticker.P) : 0;
            const totalValue = price * balance;

            return {
                ...c,
                balance,
                price,
                change,
                totalValue,
            };
        });

        const searched = q
            ? enriched.filter(
                (c) =>
                    c.symbol.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q)
            )
            : enriched;

        return searched.sort((a, b) => {
            const aHas = a.balance > 0 ? 1 : 0;
            const bHas = b.balance > 0 ? 1 : 0;
            if (aHas !== bHas) return bHas - aHas; // у кого есть — сверху
            return a.symbol.localeCompare(b.symbol);
        });
    }, [balancesBySymbol, prices, search]);

    return (
        <section className="space-y-4">
            {/* search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">{t("title")}</h2>
                <div className="w-full sm:w-56">
                    <Input
                        placeholder={t("searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 bg-[#090b1a] border-[#121426] text-xs"
                    />
                </div>
            </div>

            <div className="bg-[#090b1a]/95 rounded-2xl border border-[#121426] overflow-hidden">
                {/* header - responsive grid */}
                <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] gap-2 px-4 py-3 text-[11px] text-white/50 uppercase tracking-wide">
                    <div>{t("columnAsset")}</div>
                    <div className="text-right">{t("columnPrice")}</div>
                    <div className="text-right">{t("columnChange")}</div>
                    <div className="text-right">{t("columnBalance")}</div>
                    <div className="text-right">{t("columnActions")}</div>
                </div>

                {/* mobile header */}
                <div className="md:hidden grid grid-cols-3 gap-2 px-4 py-3 text-[11px] text-white/50 uppercase tracking-wide border-b border-white/5">
                    <div>{t("columnAsset")}</div>
                    <div className="text-right">{t("columnPrice")}</div>
                    <div className="text-right">{t("columnBalance")}</div>
                </div>

                {/* scrollable list */}
                <div
                    id="wallet-asset-scroll"
                    className="max-h-[600px] overflow-y-auto divide-y divide-white/5"
                    onScroll={handleScroll}
                >
                    {filtered.map((c) => {
                        const hasBalance = c.balance > 0;
                        const isPositive = c.change > 0;
                        const isNegative = c.change < 0;

                        return (
                            <div
                                key={c.symbol}
                                className={`w-full grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] grid-cols-3 gap-2 px-4 py-3 text-sm items-center transition ${
                                    selectedSymbol === c.symbol
                                        ? "bg-[#0f1126]"
                                        : "hover:bg-[#090b1a]"
                                }`}
                                onClick={() => onSelectSymbol(c.symbol)}
                            >
                                {/* asset + icon (mobile and desktop) */}
                                <div className="flex items-center gap-3 text-left col-span-2 md:col-span-1">
                                    <div className="w-8 h-8 rounded-full bg-[#090b1a] flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <img
                                            src={`/icons/crypto_icons/${c.symbol}.png`}
                                            alt={c.symbol}
                                            className="w-6 h-6 object-contain"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display =
                                                    "none";
                                            }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {c.symbol}
                                        </p>
                                        <p className="text-[11px] text-white/45 truncate hidden md:block">
                                            {c.name}
                                        </p>
                                    </div>
                                </div>

                                {/* price (mobile and desktop) */}
                                <div className="text-right">
                                    <p className="text-sm text-white">
                                        {c.price ? `$${c.price.toFixed(2)}` : "--"}
                                    </p>
                                </div>

                                {/* change (desktop only) */}
                                <div className="hidden md:block text-right">
                                    <p
                                        className={`text-xs flex items-center justify-end gap-1 ${
                                            isPositive
                                                ? "text-green-400"
                                                : isNegative
                                                    ? "text-red-400"
                                                    : "text-white/50"
                                        }`}
                                    >
                                        {isPositive && <ArrowUpRight className="w-3 h-3" />}
                                        {isNegative && <ArrowDownRight className="w-3 h-3" />}
                                        {c.change ? `${Math.abs(c.change).toFixed(2)}%` : "--"}
                                    </p>
                                </div>

                                {/* balance (mobile and desktop) */}
                                <div className="text-right col-span-1 md:col-span-1">
                                    <p className="text-sm text-white truncate">
                                        {c.balance ? c.balance.toFixed(6) : "0.000000"}
                                    </p>
                                    <p className="text-[11px] text-white/35 truncate hidden md:block">
                                        {c.totalValue ? `≈ $${c.totalValue.toFixed(2)}` : ""}
                                    </p>
                                </div>

                                {/* actions (desktop only) */}
                                <div
                                    className="hidden md:flex items-center justify-end gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        size="sm"
                                        className="rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#7e22ce] text-white text-[11px] font-bold px-3 py-1 h-8 min-w-[70px]"
                                        onClick={() => openDeposit(c.symbol)}
                                    >
                                        {t("actionBuy")}
                                    </Button>

                                    {hasBalance && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-lg border-white/20 bg-white/5 text-[11px] px-2 py-1 h-8"
                                                onClick={() => openExchange(c.symbol)}
                                            >
                                                <Repeat className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-lg border-white/20 bg-white/5 text-[11px] px-2 py-1 h-8"
                                                onClick={() => openTransfer(c.symbol)}
                                            >
                                                <Send className="w-3 h-3" />
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* mobile actions (mobile only) */}
                                <div
                                    className="md:hidden flex items-center justify-end gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        size="sm"
                                        className="rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#7e22ce] text-white text-[10px] font-bold px-2 py-1 h-7 min-w-[60px]"
                                        onClick={() => openDeposit(c.symbol)}
                                    >
                                        {t("actionBuy")}
                                    </Button>

                                    {hasBalance && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-lg border-white/20 bg-white/5 text-[10px] px-1.5 py-1 h-7"
                                            onClick={() => openExchange(c.symbol)}
                                        >
                                            <Repeat className="w-2.5 h-2.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}