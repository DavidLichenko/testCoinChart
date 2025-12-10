// app/api/wallet/buy/route.ts
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";
import {pusherServer} from "@/lib/pusher-server";

export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const { assetSymbol, amount } = await req.json();

        // Enhanced validation
        if (!assetSymbol || typeof amount !== "number" || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid assetSymbol or amount" },
                { status: 400 }
            );
        }

        // Validate asset symbol format
        if (typeof assetSymbol !== "string" || assetSymbol.length > 20) {
            return NextResponse.json(
                { error: "Invalid asset symbol format" },
                { status: 400 }
            );
        }

        // Validate amount precision (max 8 decimal places)
        if (Math.round(amount * 100000000) / 100000000 !== amount) {
            return NextResponse.json(
                { error: "Amount precision too high, maximum 8 decimal places allowed" },
                { status: 400 }
            );
        }

        const symbol = String(assetSymbol).toUpperCase();

        // Validate that the asset exists and is enabled, or create it if it's a cryptocurrency
        let asset = await prisma.asset.findUnique({
            where: { symbol },
        });

        // If asset doesn't exist, try to create it automatically (for cryptocurrencies)
        if (!asset) {
            try {
                // Try to get price from Binance to verify it's a valid cryptocurrency
                const pair = `${symbol}USDT`;
                const priceRes = await fetch(
                    `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`
                );
                
                if (priceRes.ok) {
                    // It's a valid cryptocurrency, create the asset
                    asset = await prisma.asset.create({
                        data: {
                            symbol,
                            name: symbol, // We'll use symbol as name initially
                            type: "CRYPTO",
                            decimals: 8,
                            isEnabled: true,
                            isStakable: false,
                        },
                    });
                } else {
                    return NextResponse.json(
                        { error: "Asset not found and not a valid cryptocurrency" },
                        { status: 400 }
                    );
                }
            } catch (error) {
                return NextResponse.json(
                    { error: "Asset not found and unable to verify as cryptocurrency" },
                    { status: 400 }
                );
            }
        }

        if (!asset.isEnabled) {
            return NextResponse.json(
                { error: "Asset is not available for trading" },
                { status: 400 }
            );
        }

        // --- get user base currency (USD / EUR) ---
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { baseCurrency: true },
        });

        const baseCurrency = user?.baseCurrency ?? "USD"; // "USD" | "EUR"
        const fiatSymbol = baseCurrency; // same string, используем как assetSymbol для фиата

        // --- Binance price: SYMBOLUSDT (BTCUSDT, ETHUSDT etc.) ---
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

        // priceUSDT ~ priceUSD
        const costInUsd = amount * priceUSDT;

        // convert to user's baseCurrency using real-time FX rates if needed
        let costInBase = costInUsd;

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
                        // Convert USD cost to EUR: costInUsd / (EUR/USDT rate) = cost in EUR
                        costInBase = costInUsd / eurUsdtRate;
                    }
                }
            } catch (error) {
                console.warn("Failed to fetch EUR/USDT rate, using fallback:", error);
                // Fallback to database FX rate
                const fxUsd = await prisma.fxRate.findUnique({
                    where: { symbol: "USD" },
                });
                
                // fxUsd.toBase = курс USD->EUR (по твоей схеме baseCurrency: "EUR")
                if (fxUsd && fxUsd.toBase > 0) {
                    costInBase = costInUsd * fxUsd.toBase;
                }
                // если нет курса — допустим ~1:1
            }
        }

        await prisma.$transaction(async (tx) => {
            // 1) Пытаемся найти кошелёк фиата в новой системе
            let fiatWallet = await tx.walletBalance.findUnique({
                where: {
                    userId_assetSymbol: {
                        userId,
                        assetSymbol: fiatSymbol,
                    },
                },
            });

            // 2) Если его НЕТ, пробуем подтянуть СТАРЫЙ баланс из модели Balances
            if (!fiatWallet) {
                const legacy = await tx.balances.findUnique({
                    where: { userId },
                });

                const legacyAmount =
                    baseCurrency === "EUR" ? legacy?.eur ?? 0 : legacy?.usd ?? 0;

                fiatWallet = await tx.walletBalance.create({
                    data: {
                        userId,
                        assetSymbol: fiatSymbol,
                        ownBalance: legacyAmount,
                        creditLimit: 0,
                        creditUsed: 0,
                        locked: 0,
                    },
                });
            }

            // 3) Проверяем, хватает ли денег в НОВОМ кошельке
            if (fiatWallet.ownBalance < costInBase) {
                throw new Error("INSUFFICIENT_FIAT");
            }

            // 4) Списываем фиат
            await tx.walletBalance.update({
                where: {
                    userId_assetSymbol: {
                        userId,
                        assetSymbol: fiatSymbol,
                    },
                },
                data: {
                    ownBalance: { decrement: costInBase },
                },
            });

            // 5) Создаём/увеличиваем крипто-баланс
            await tx.walletBalance.upsert({
                where: {
                    userId_assetSymbol: {
                        userId,
                        assetSymbol: symbol,
                    },
                },
                update: {
                    ownBalance: { increment: amount },
                },
                create: {
                    userId,
                    assetSymbol: symbol,
                    ownBalance: amount,
                    creditLimit: 0,
                    creditUsed: 0,
                    locked: 0,
                },
            });

            // 6) Логируем операцию
            await tx.walletTransaction.create({
                data: {
                    userId,
                    assetSymbol: symbol,
                    type: "EXCHANGE", // покупка за фиат — это обмен
                    status: "COMPLETED",
                    amount,
                    metadata: {
                        paidIn: fiatSymbol,
                        costInBase,
                        costInUsd,
                        priceUSDT,
                    },
                },
            });
            
            // 7) Trigger wallet assets update
            // Fetch updated assets
            const updatedAssets = await tx.walletBalance.findMany({
                where: { userId },
                include: { asset: true },
            });
            
            // Transform assets to match the format expected by the frontend
            const formattedAssets = updatedAssets.map((b) => {
                // BTC → BTCUSDT, ETH → ETHUSDT и т.д.
                const key = (b.assetSymbol + "USDT").toLowerCase();
                
                return {
                    symbol: b.assetSymbol,
                    name: b.asset.name,
                    balance: b.ownBalance + b.locked,      // 👈 теперь сюда попадает и locked
                    ownBalance: b.ownBalance,     // 👈 добавляем отдельное поле для ownBalance
                    creditUsed: b.creditUsed,
                    creditLimit: b.creditLimit,
                    price: 0, // Will be filled by frontend
                    change24h: 0, // Will be filled by frontend
                    totalValue: 0, // Will be filled by frontend
                    totalValueUsd: 0, // Will be filled by frontend
                };
            });
            
            // Trigger update via Pusher
            await pusherServer.trigger(`user-${userId}`, "wallet-assets-update", formattedAssets);
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Buy route error:", e);

        if (e instanceof Error && e.message === "INSUFFICIENT_FIAT") {
            return NextResponse.json(
                { error: "Insufficient fiat balance" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal error while buying asset" },
            { status: 500 }
        );
    }
}
