import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";

export async function POST(req: Request) {
    const userId = await requireAuth()

    const { assetSymbol } = await req.json();

    if (!assetSymbol)
        return NextResponse.json({ error: "Missing assetSymbol" }, { status: 400 });

    // Validate that the asset exists and is enabled, or create it if it's a cryptocurrency
    let asset = await prisma.asset.findUnique({
        where: { symbol: assetSymbol }
    });

    // If asset doesn't exist, try to create it automatically (for cryptocurrencies)
    if (!asset) {
        try {
            // Try to get price from Binance to verify it's a valid cryptocurrency
            const pair = `${assetSymbol}USDT`;
            const priceRes = await fetch(
                `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`
            );
            
            if (priceRes.ok) {
                // It's a valid cryptocurrency, create the asset
                asset = await prisma.asset.create({
                    data: {
                        symbol: assetSymbol,
                        name: assetSymbol, // We'll use symbol as name initially
                        type: "CRYPTO",
                        decimals: 8,
                        isEnabled: true,
                        isStakable: false,
                    },
                });
            } else {
                return NextResponse.json(
                    { error: "Asset does not exist and not a valid cryptocurrency" },
                    { status: 404 }
                );
            }
        } catch (error) {
            return NextResponse.json(
                { error: "Asset does not exist and unable to verify as cryptocurrency" },
                { status: 404 }
            );
        }
    }

    const existing = await prisma.walletBalance.findFirst({
        where: { userId, assetSymbol }
    });

    if (existing)
        return NextResponse.json({ error: "Already added" }, { status: 400 });

    const newBalance = await prisma.walletBalance.create({
        data: {
            userId,
            assetSymbol,
            ownBalance: 0,
            creditLimit: 0,
            creditUsed: 0,
            locked: 0
        }
    });

    return NextResponse.json(newBalance);
}