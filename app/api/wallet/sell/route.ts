// app/api/wallet/sell/route.ts
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";
import {pusherServer} from "@/lib/pusher-server";

export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const { assetSymbol, amount } = await req.json();

        // Validation
        if (!assetSymbol || typeof amount !== "number" || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid assetSymbol or amount" },
                { status: 400 }
            );
        }

        const symbol = String(assetSymbol).toUpperCase();

        // Get user base currency
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { baseCurrency: true },
        });

        const baseCurrency = user?.baseCurrency ?? "USD";

        // Cannot sell base currency
        if (symbol === baseCurrency) {
            return NextResponse.json(
                { error: "Cannot sell base currency" },
                { status: 400 }
            );
        }

        // Get Binance price for crypto
        const pair = `${symbol}USDT`;
        const priceRes = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`
        );

        if (!priceRes.ok) {
            return NextResponse.json(
                { error: "Failed to fetch price from Binance" },
                { status: 502 }
            );
        }

        const priceJson: any = await priceRes.json();
        const priceUSDT = Number(priceJson.price);

        if (!priceUSDT || Number.isNaN(priceUSDT)) {
            return NextResponse.json(
                { error: "Invalid price from Binance" },
                { status: 502 }
            );
        }

        // Calculate value in USD
        const valueInUsd = amount * priceUSDT;

        // Convert to user's base currency
        let valueInBase = valueInUsd;

        if (baseCurrency === "EUR") {
            try {
                // Get real-time EUR/USDT rate from Binance
                const eurUsdtRes = await fetch(
                    "https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT"
                );
                
                if (eurUsdtRes.ok) {
                    const eurUsdtData = await eurUsdtRes.json();
                    const eurUsdtRate = parseFloat(eurUsdtData.price);
                    
                    if (eurUsdtRate && eurUsdtRate > 0) {
                        // Convert USD value to EUR
                        valueInBase = valueInUsd / eurUsdtRate;
                    }
                }
            } catch (error) {
                console.warn("Failed to fetch EUR/USDT rate, using fallback:", error);
                // Fallback to database FX rate
                const fxUsd = await prisma.fxRate.findUnique({
                    where: { symbol: "USD" },
                });
                
                if (fxUsd && fxUsd.toBase > 0) {
                    valueInBase = valueInUsd * fxUsd.toBase;
                }
            }
        }

        await prisma.$transaction(async (tx) => {
            // Check crypto balance
            const cryptoWallet = await tx.walletBalance.findUnique({
                where: {
                    userId_assetSymbol: {
                        userId,
                        assetSymbol: symbol,
                    },
                },
            });

            if (!cryptoWallet || cryptoWallet.ownBalance < amount) {
                throw new Error("INSUFFICIENT_CRYPTO");
            }

            // Deduct crypto
            await tx.walletBalance.update({
                where: {
                    userId_assetSymbol: {
                        userId,
                        assetSymbol: symbol,
                    },
                },
                data: {
                    ownBalance: { decrement: amount },
                },
            });

            // Add to base currency balance
            await tx.walletBalance.upsert({
                where: {
                    userId_assetSymbol: {
                        userId,
                        assetSymbol: baseCurrency,
                    },
                },
                update: {
                    ownBalance: { increment: valueInBase },
                },
                create: {
                    userId,
                    assetSymbol: baseCurrency,
                    ownBalance: valueInBase,
                    locked: 0,
                },
            });

            // Log transaction
            await tx.walletTransaction.create({
                data: {
                    userId,
                    assetSymbol: symbol,
                    type: "EXCHANGE", // selling crypto is an exchange
                    status: "COMPLETED",
                    amount,
                    metadata: {
                        soldFor: baseCurrency,
                        valueInBase,
                        valueInUsd,
                        priceUSDT,
                    },
                },
            });
            
            // Trigger wallet assets update
            const updatedAssets = await tx.walletBalance.findMany({
                where: { userId },
                include: { asset: true },
            });
            
            const formattedAssets = updatedAssets.map((b) => {
                return {
                    symbol: b.assetSymbol,
                    name: b.asset.name,
                    balance: b.ownBalance + b.locked,
                    ownBalance: b.ownBalance,
                    creditBalance: 0, // Not used in new system
                    price: 0,
                    change24h: 0,
                    totalValue: 0,
                    totalValueUsd: 0,
                };
            });
            
            await pusherServer.trigger(`user-${userId}`, "wallet-assets-update", formattedAssets);
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Sell route error:", e);

        if (e instanceof Error && e.message === "INSUFFICIENT_CRYPTO") {
            return NextResponse.json(
                { error: "Insufficient crypto balance" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal error while selling crypto" },
            { status: 500 }
        );
    }
}
