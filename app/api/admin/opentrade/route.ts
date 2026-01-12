// app/api/admin/opentrade/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const categoryToAssetTypeMap: Record<string, string> = {
    "forex": "FOREX",
    "crypto": "CRYPTO",
    "stocks": "STOCK",
    "indices": "INDEX",
    "commodities": "COMMODITY",
    "other": "CRYPTO"
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, type, ticker, volume, leverage, margin, openIn, takeProfit, stopLoss, assetType } = body

        if (!userId || !type || !ticker || !volume || !leverage || !margin || !openIn) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // ТОЛЬКО маржа, без комиссии
        const totalCost = Number(margin)

        if ((user.TotalBalance || 0) < totalCost) {
            return NextResponse.json({
                error: "Insufficient balance",
                details: `Need $${totalCost.toFixed(2)} but only have $${(user.TotalBalance || 0).toFixed(2)}`,
                requiredMargin: margin
            }, { status: 400 })
        }

        // Определяем assetType если не передан
        let finalAssetType = assetType

        if (!finalAssetType) {
            const upperTicker = ticker.toUpperCase()

            if (upperTicker.includes('.')) {
                finalAssetType = "IEX"
            } else if (/^[A-Z]{6}$/.test(upperTicker)) {
                finalAssetType = "Forex"
            } else if (/\d/.test(upperTicker)) {
                finalAssetType = "IEX"
            } else if (["XAU", "XAG", "OIL", "GOLD", "SILVER", "BRENT", "WTI"].some(kw => upperTicker.includes(kw))) {
                finalAssetType = "Metal"
            } else {
                // По умолчанию крипто
                finalAssetType = "Crypto"
            }
        }

        const trade = await prisma.trade_Transaction.create({
            data: {
                userId,
                type,
                ticker,
                volume: Number(volume),
                leverage: Number(leverage),
                margin: totalCost,
                openIn: Number(openIn),
                openInA: Number(openIn),
                takeProfit: takeProfit ? Number(takeProfit) : null,
                stopLoss: stopLoss ? Number(stopLoss) : null,
                assetType: finalAssetType,
                profit: 0,
                status: "OPEN",
            },
        })

        // Списание ТОЛЬКО маржи
        await prisma.user.update({
            where: { id: userId },
            data: {
                TotalBalance: {
                    decrement: totalCost,
                },
            },
        })

        return NextResponse.json({
            success: true,
            trade,
            deductedAmount: totalCost,
            assetType: finalAssetType
        })
    } catch (error) {
        console.error("Admin error creating trade:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}