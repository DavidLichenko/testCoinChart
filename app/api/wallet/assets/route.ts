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
    const balances = await prisma.walletBalance.findMany({
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

    if (!balances.length) {
        return NextResponse.json([], {
            headers: {
                'Cache-Control': 'private, max-age=60',
            },
        });
    }

    // тянем 24h-тикеры один раз (без Next.js cache, т.к. данные > 2MB)
    const res = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr",
        { 
            cache: "no-store", // Не используем Next.js data cache из-за размера данных > 2MB
        }
    );

    if (!res.ok) {
        // в крайнем случае вернём без цены, чтобы не падал фронт
        const fallback = balances.map((b) => ({
            symbol: b.assetSymbol,
            name: b.asset.name,
            balance: b.ownBalance + b.locked,
            ownBalance: b.ownBalance,
            creditUsed: b.creditUsed,
            creditLimit: b.creditLimit,
            price: 0,
            change24h: 0,
            totalValue: 0,
            totalValueUsd: 0, // Add USD value for consistency
        }));
        return NextResponse.json(fallback);
    }

    const data = (await res.json()) as Binance24h[];

    const priceMap: Record<string, Binance24h> = {};
    for (const row of data) {
        priceMap[row.symbol.toLowerCase()] = row;
    }

    // Also get real-time prices for USD conversion
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
    });

    const baseCurrency = user?.baseCurrency ?? "USD";
    
    // Get EUR/USD rate if needed
    let eurUsdRate = 1;
    if (baseCurrency === "EUR") {
        try {
            const eurUsdRes = await fetch(
                "https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT",
                { cache: "no-store" }
            );
            
            if (eurUsdRes.ok) {
                const eurUsdData = await eurUsdRes.json();
                eurUsdRate = parseFloat(eurUsdData.price) || 1;
            }
        } catch (error) {
            console.warn("Failed to fetch EUR/USD rate:", error);
        }
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