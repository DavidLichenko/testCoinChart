// app/api/wallet/summary/route.ts
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";

type BinanceTicker = { symbol: string; price: string };

export async function GET() {
    const userId = await requireAuth();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
    });

    const baseCurrency = user?.baseCurrency ?? "USD"; // USER.baseCurrency из схемы

    const balances = await prisma.walletBalance.findMany({
        where: { userId },
        include: { asset: true },
    });

    if (!balances.length) {
        return NextResponse.json({
            totalBalance: 0,
            ownFunds: 0,
            creditUsed: 0,
            creditLimit: 0,
            availableToTrade: 0,
            baseCurrency,
            approxUsd: 0,
        });
    }

    // Берём ВСЕ цены с Binance (USDT-база)
    const tickersRes = await fetch(
        "https://api.binance.com/api/v3/ticker/price",
        { cache: "no-store" }
    );

    if (!tickersRes.ok) {
        // На всякий случай graceful fallback, чтобы не ломать фронт
        return NextResponse.json({
            totalBalance: 0,
            ownFunds: 0,
            creditUsed: 0,
            creditLimit: 0,
            availableToTrade: 0,
            baseCurrency,
            approxUsd: 0,
        });
    }

    const tickers = (await tickersRes.json()) as BinanceTicker[];

    const priceMap: Record<string, number> = {};
    for (const t of tickers) {
        priceMap[t.symbol] = Number(t.price);
    }

    const getUsdtPrice = (symbol: string): number => {
        if (symbol === "USDT") return 1;
        if (symbol === "USD") return 1; // условно: 1 USD ≈ 1 USDT
        const key = symbol + "USDT";   // BTC → BTCUSDT, EUR → EURUSDT
        return priceMap[key] ?? 0;
    };

    // Считаем всё в USDT, потом конвертим в baseCurrency
    const eurUsdt = priceMap["EURUSDT"] ?? 0;
    const usdtToBase =
        baseCurrency === "USD"
            ? 1
            : eurUsdt
                ? 1 / eurUsdt // из USDT → EUR
                : 1;          // fallback

    let totalUsdt = 0;
    let ownUsdt = 0;
    let creditUsedUsdt = 0;
    let creditLimitUsdt = 0;

    for (const b of balances) {
        const priceUsdt = getUsdtPrice(b.assetSymbol) || 0;

        // total = own + locked + creditUsed (то, чем реально владеем / пользуемся)
        const ownVal = b.ownBalance * priceUsdt;
        const lockedVal = b.locked * priceUsdt;
        const creditUsedVal = b.creditUsed * priceUsdt;
        const creditLimitVal = b.creditLimit * priceUsdt;

        totalUsdt += ownVal + lockedVal + creditUsedVal;
        ownUsdt += ownVal;
        creditUsedUsdt += creditUsedVal;
        creditLimitUsdt += creditLimitVal;
    }

    const totalBalance = totalUsdt * usdtToBase;
    const ownFunds = ownUsdt * usdtToBase;
    const creditUsed = creditUsedUsdt * usdtToBase;
    const creditLimit = creditLimitUsdt * usdtToBase;
    const availableToTrade = ownFunds + (creditLimit - creditUsed);

    // Оценка в USD (для подписи под EUR)
    const approxUsd =
        baseCurrency === "EUR" && eurUsdt
            ? totalBalance * eurUsdt // EUR → USDT≈USD
            : totalBalance;          // уже USD

    return NextResponse.json({
        totalBalance,
        ownFunds,
        creditUsed,
        creditLimit,
        availableToTrade,
        baseCurrency,
        approxUsd,
    });
}