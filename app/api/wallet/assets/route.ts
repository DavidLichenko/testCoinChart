// app/api/wallet/assets/route.ts
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";

type Binance24h = {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
};

export async function GET() {
    const userId = await requireAuth();

    // Optimize: select only needed fields
    let balances = await prisma.walletBalance.findMany({
        where: { userId },
        select: {
            assetSymbol: true,
            ownBalance: true,
            locked: true,
            creditUsed: true,
            creditLimit: true,
            asset: {
                select: {
                    name: true,
                },
            },
        },
    });

    // If user has no wallet balances, try to migrate from old Balances model
    if (!balances.length) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { baseCurrency: true },
        });

        const baseCurrency = user?.baseCurrency ?? "USD";
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
                select: {
                    assetSymbol: true,
                    ownBalance: true,
                    locked: true,
                    creditUsed: true,
                    creditLimit: true,
                    asset: {
                        select: {
                            name: true,
                        },
                    },
                },
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
                select: {
                    assetSymbol: true,
                    ownBalance: true,
                    locked: true,
                    creditUsed: true,
                    creditLimit: true,
                    asset: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
        }
    }

    if (!balances.length) {
        return NextResponse.json([], {
            headers: {
                'Cache-Control': 'private, max-age=60',
            },
        });
    }

    // Get unique symbols that we need prices for
    const uniqueSymbols = [...new Set(balances.map(b => b.assetSymbol))];
    
    // Only fetch prices for assets we actually have + EUR for conversion
    const symbolsToFetch = uniqueSymbols
        .filter(s => s !== "USD" && s !== "USDT") // Skip USD/USDT as they're 1:1
        .map(s => `${s}USDT`)
        .concat(["EURUSDT"]) // Always include EUR for conversion
        .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    const priceMap: Record<string, { lastPrice: string; priceChangePercent: string }> = {};
    
    // Fetch only the specific symbols we need (much faster than all 24h tickers)
    if (symbolsToFetch.length > 0) {
        try {
            // Fetch individual 24h tickers in parallel
            const tickerPromises = symbolsToFetch.map(symbol => 
                fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, 
                    { cache: "no-store" }
                ).then(r => r.ok ? r.json() : null)
            );
            
            const tickers = await Promise.all(tickerPromises);
            
            for (const ticker of tickers) {
                if (ticker && ticker.symbol) {
                    priceMap[ticker.symbol.toLowerCase()] = {
                        lastPrice: ticker.lastPrice,
                        priceChangePercent: ticker.priceChangePercent,
                    };
                }
            }
        } catch (error) {
            console.error("Error fetching Binance 24h tickers:", error);
            // Continue with empty price map - will use fallback prices
        }
    }

    // Get user's base currency and EUR/USD rate from already fetched price data
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
    });

    const baseCurrency = user?.baseCurrency ?? "USD";
    
    // Get EUR/USD rate from already fetched data instead of separate request
    let eurUsdRate = 1;
    const eurUsdTicker = priceMap["eurusdt"];
    if (eurUsdTicker) {
        eurUsdRate = parseFloat(eurUsdTicker.lastPrice) || 1;
    }

    const result = balances.map((b) => {
        // BTC → BTCUSDT, ETH → ETHUSDT и т.д.
        const key = (b.assetSymbol + "USDT").toLowerCase();
        const ticker = priceMap[key];

        const price = ticker ? Number(ticker.lastPrice) : 0;
        const change24h = ticker ? Number(ticker.priceChangePercent) : 0;

        // Только свободный баланс (ownBalance + locked), без кредита
        const totalBalanceAmount = b.ownBalance + b.locked;
        const visibleBalance = b.ownBalance + b.locked; // то, что показываем в списке
        
        // Calculate total value in USD (только для собственных средств)
        let totalValueUsd = 0;
        if (b.assetSymbol === "USD" || b.assetSymbol === "USDT") {
            totalValueUsd = totalBalanceAmount;
        } else if (b.assetSymbol === baseCurrency && baseCurrency === "EUR") {
            // Convert EUR to USD
            totalValueUsd = totalBalanceAmount * eurUsdRate;
        } else {
            // Convert crypto to USD
            totalValueUsd = totalBalanceAmount * price;
        }

        return {
            symbol: b.assetSymbol,
            name: b.asset.name,
            balance: visibleBalance,      // ownBalance + locked (без кредита)
            ownBalance: b.ownBalance,     // только собственные средства
            creditUsed: b.creditUsed,
            creditLimit: b.creditLimit,
            price,
            change24h,
            totalValue: price * totalBalanceAmount, // только для собственных средств
            totalValueUsd, // Add USD value for consistency with new calculation logic
        };
    });

    return NextResponse.json(result, {
        headers: {
            'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        },
    });
}