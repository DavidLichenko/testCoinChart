// app/api/wallet/exchange/route.ts
import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";
import {getUserBalanceData} from "@/lib/user-balance";
import {pusherServer} from "@/lib/pusher-server";

// Helper function to handle decimal precision
function roundToPrecision(value: number, decimals: number = 8): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export async function POST(req: Request) {
    const userId = await requireAuth();
    const { fromSymbol, toSymbol, amount } = await req.json();

    if (!fromSymbol || !toSymbol || !amount) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    if (fromSymbol === toSymbol) {
        return NextResponse.json({ error: "Same asset" }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
    }

    // Round amount to 8 decimal places for consistency
    const roundedAmount = roundToPrecision(numAmount, 8);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const baseCurrency = (user.baseCurrency || "EUR") as "EUR" | "USD";

    // Проверка свободного баланса
    if (fromSymbol === baseCurrency) {
        // базовая валюта → используем нашу формулу availableToTrade
        const balanceData = await getUserBalanceData(userId);
        const available = balanceData.details.availableToTrade;

        if (roundedAmount > available + 1e-8) {
            return NextResponse.json(
                { error: "Not enough free balance" },
                { status: 400 }
            );
        }
    } else {
        // не базовая валюта → проверяем свой кошелёк по активу
        const fromBalance = await prisma.walletBalance.findUnique({
            where: { userId_assetSymbol: { userId, assetSymbol: fromSymbol } },
        });

        if (!fromBalance || fromBalance.ownBalance < roundedAmount - 1e-8) {
            return NextResponse.json(
                { error: "Insufficient funds" },
                { status: 400 }
            );
        }
    }

    // Получаем цены с Binance
    let priceFrom: number, priceTo: number;
    
    try {
        const urlFrom = `https://api.binance.com/api/v3/ticker/price?symbol=${fromSymbol}USDT`;
        const urlTo = `https://api.binance.com/api/v3/ticker/price?symbol=${toSymbol}USDT`;

        const [resFrom, resTo] = await Promise.all([
            fetch(urlFrom),
            fetch(urlTo)
        ]);

        if (!resFrom.ok || !resTo.ok) {
            throw new Error("Failed to fetch prices");
        }

        const p1 = await resFrom.json();
        const p2 = await resTo.json();

        priceFrom = Number(p1.price || 0);
        priceTo = Number(p2.price || 0);

        if (!priceFrom || !priceTo || isNaN(priceFrom) || isNaN(priceTo)) {
            throw new Error("Invalid price data");
        }
    } catch (error) {
        console.error("Exchange price fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch prices" },
            { status: 500 }
        );
    }

    // Calculate exchange amount with proper precision
    const valueInUSDT = roundToPrecision(roundedAmount * priceFrom, 8);
    const amountTo = roundToPrecision(valueInUSDT / priceTo, 8);

    if (amountTo <= 0) {
        return NextResponse.json(
            { error: "Calculated exchange amount is zero or negative" },
            { status: 400 }
        );
    }

    try {
        await prisma.$transaction(async (tx) => {
            // уменьшаем источник
            await tx.walletBalance.upsert({
                where: { userId_assetSymbol: { userId, assetSymbol: fromSymbol } },
                update: { 
                    ownBalance: { 
                        decrement: roundedAmount 
                    } 
                },
                create: {
                    userId,
                    assetSymbol: fromSymbol,
                    ownBalance: 0 - roundedAmount, // в теории не дойдём сюда из-за проверок, но на всякий случай
                },
            });

            // увеличиваем получаемый актив
            await tx.walletBalance.upsert({
                where: { userId_assetSymbol: { userId, assetSymbol: toSymbol } },
                update: { 
                    ownBalance: { 
                        increment: amountTo 
                    } 
                },
                create: {
                    userId,
                    assetSymbol: toSymbol,
                    ownBalance: amountTo,
                },
            });

            await tx.walletTransaction.create({
                data: {
                    userId,
                    assetSymbol: fromSymbol,
                    type: "EXCHANGE",
                    status: "COMPLETED",
                    amount: roundedAmount,
                    metadata: {
                        toSymbol,
                        amountTo,
                        priceFrom,
                        priceTo,
                        valueInUSDT,
                    },
                },
            });
            
            // Trigger wallet assets update
            // Fetch updated assets
            const updatedAssets = await tx.walletBalance.findMany({
                where: { userId },
                include: { asset: true },
            });
            
            // Transform assets to match the format expected by the frontend
            const formattedAssets = updatedAssets.map((b) => {
                return {
                    symbol: b.assetSymbol,
                    name: b.asset.name,
                    balance: b.ownBalance + b.locked,
                    ownBalance: b.ownBalance,
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
    } catch (error) {
        console.error("Exchange transaction error:", error);
        return NextResponse.json(
            { error: "Failed to complete exchange transaction" },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}