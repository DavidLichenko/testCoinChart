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

    const baseCurrency = user?.baseCurrency ?? "USD";

    let balances = await prisma.walletBalance.findMany({
        where: { userId },
        include: { asset: true },
    });

    // If user has no wallet balances, try to migrate from old Balances model
    if (!balances.length) {
        const legacy = await prisma.balances.findUnique({
            where: { userId },
        });

        if (legacy) {
            // Create USD wallet from legacy balance
            if (legacy.usd > 0) {
                await prisma.walletBalance.create({
                    data: {
                        userId,
                        assetSymbol: "USD",
                        ownBalance: legacy.usd,
                        creditLimit: 0,
                        creditUsed: 0,
                        locked: 0,
                    },
                });
            }

            // Create EUR wallet from legacy balance
            if (legacy.eur > 0) {
                await prisma.walletBalance.create({
                    data: {
                        userId,
                        assetSymbol: "EUR",
                        ownBalance: legacy.eur,
                        creditLimit: 0,
                        creditUsed: 0,
                        locked: 0,
                    },
                });
            }

            // Reload balances after migration
            balances = await prisma.walletBalance.findMany({
                where: { userId },
                include: { asset: true },
            });
        } else {
            // Create default base currency wallet with 0 balance
            await prisma.walletBalance.create({
                data: {
                    userId,
                    assetSymbol: baseCurrency,
                    ownBalance: 0,
                    creditLimit: 0,
                    creditUsed: 0,
                    locked: 0,
                },
            });

            balances = await prisma.walletBalance.findMany({
                where: { userId },
                include: { asset: true },
            });
        }
    }

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

    // Get unique asset symbols that we need prices for
    const uniqueSymbols = [...new Set(balances.map(b => b.assetSymbol))];
    
    // Only fetch prices for assets we actually have + EUR (for conversion)
    // Build specific symbols list: BTCUSDT, ETHUSDT, EURUSDT, etc.
    const symbolsToFetch = uniqueSymbols
        .filter(s => s !== "USD" && s !== "USDT") // Skip USD/USDT as they're 1:1
        .map(s => `${s}USDT`)
        .concat(["EURUSDT"]) // Always include EUR for conversion
        .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    const priceMap: Record<string, number> = {};
    
    // Fetch only the specific symbols we need (much faster than all tickers)
    if (symbolsToFetch.length > 0) {
        try {
            // Fetch individual prices in parallel
            const pricePromises = symbolsToFetch.map(symbol => 
                fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, 
                    { cache: "no-store", next: { revalidate: 5 } }
                ).then(r => r.ok ? r.json() : null)
            );
            
            const prices = await Promise.all(pricePromises);
            
            for (const price of prices) {
                if (price && price.symbol && price.price) {
                    priceMap[price.symbol] = Number(price.price);
                }
            }
        } catch (error) {
            console.error("Error fetching Binance prices:", error);
            // Continue with empty price map - will default to 0
        }
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

        // total = own + locked (только свободный баланс, без кредита)
        const ownVal = b.ownBalance * priceUsdt;
        const lockedVal = b.locked * priceUsdt;
        const creditUsedVal = b.creditUsed * priceUsdt;
        const creditLimitVal = b.creditLimit * priceUsdt;

        totalUsdt += ownVal + lockedVal; // Только собственные средства + locked, без кредита
        ownUsdt += ownVal;
        creditUsedUsdt += creditUsedVal;
        creditLimitUsdt += creditLimitVal;
    }

    const totalBalance = totalUsdt * usdtToBase;
    const ownFunds = ownUsdt * usdtToBase;
    const creditUsed = creditUsedUsdt * usdtToBase;
    const creditLimit = creditLimitUsdt * usdtToBase;
    const availableToTrade = ownFunds + (creditLimit - creditUsed);

    // Оценка в USD (для подписи под EUR) - используем ownFunds (без кредита)
    const approxUsd =
        baseCurrency === "EUR" && eurUsdt
            ? ownFunds * eurUsdt // EUR → USDT≈USD
            : ownFunds;          // уже USD

    return NextResponse.json({
        totalBalance,
        ownFunds,
        creditUsed,
        creditLimit,
        availableToTrade,
        baseCurrency,
        approxUsd,
    }, {
        headers: {
            'Cache-Control': 'private, max-age=5', // Cache for 5 seconds
        },
    });
}