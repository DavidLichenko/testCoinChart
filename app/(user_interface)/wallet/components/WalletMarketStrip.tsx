"use client";

import {useBinancePrices} from "../hooks/useBinancePrices";
import {useI18n} from "@/components/i18n-provider";

const SYMBOLS = ["BTC", "ETH", "USDT", "BNB", "SOL", "XRP", "ADA"];

export function WalletMarketStrip() {
    const prices = useBinancePrices(SYMBOLS);
    const { t } = useI18n("wallet.market");

    return (
        <section className="space-y-3">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-white/80">
                    {t("title") /* en: "Market overview", es: "Resumen del mercado" */}
                </h2>
                <span className="text-[11px] text-white/40">
          {t("live") /* en: "Live prices", es: "Precios en vivo" */}
        </span>
            </div>

            <div className="bg-[#11111f] rounded-2xl border border-white/5 p-3 space-y-2">
                {SYMBOLS.map((sym) => {
                    const ticker = prices[`${sym}USDT`.toLowerCase()];
                    const price = ticker ? Number(ticker.c) : 0;
                    const change = ticker ? Number(ticker.P) : 0;
                    const isUp = change >= 0;

                    return (
                        <div
                            key={sym}
                            className="flex items-center justify-between py-1.5 text-xs"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7a3cff] to-[#2BFFDA] flex items-center justify-center text-[10px] font-semibold">
                                    {sym[0]}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{sym}</p>
                                    <p className="text-white/40 text-[11px]">/USDT</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white text-sm">
                                    {price ? price.toFixed(2) : "--"}
                                </p>
                                <p
                                    className={`text-[11px] ${
                                        isUp ? "text-green-400" : "text-red-400"
                                    }`}
                                >
                                    {change ? change.toFixed(2) + "%" : "--"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
