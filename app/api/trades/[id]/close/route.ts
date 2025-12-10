// app/api/trades/[id]/close/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { broadcastUserBalance } from "@/lib/balance-broadcast"

interface RouteParams {
    params: {
        id: string
    }
}

export async function POST(req: Request, { params }: RouteParams) {
    try {
        const userId = await requireAuth()
        const { id } = params
        const body = await req.json().catch(() => ({}))
        const { currentPrice } = body

        const price = Number(currentPrice)
        if (!price || !Number.isFinite(price) || price <= 0) {
            return NextResponse.json(
                { error: "Invalid current price" },
                { status: 400 }
            )
        }

        const trade = await prisma.trade_Transaction.findFirst({
            where: {
                id,
                userId,
            },
        })

        if (!trade) {
            return NextResponse.json({ error: "Trade not found" }, { status: 404 })
        }

        if (trade.status !== "OPEN") {
            return NextResponse.json(
                { error: "Trade is not open" },
                { status: 400 }
            )
        }

        const baseCurrencyUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { baseCurrency: true },
        })

        if (!baseCurrencyUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        const baseCurrency = baseCurrencyUser.baseCurrency || "USD"

        const { profit, closedTrade } = await prisma.$transaction(
            async (tx) => {
                // P/L
                const openIn = trade.openIn
                const volume = trade.volume
                const leverage = trade.leverage

                const rawProfit =
                    trade.type === "BUY"
                        ? (price - openIn) * volume * leverage
                        : (openIn - price) * volume * leverage

                const profit = Number.isFinite(rawProfit) ? rawProfit : 0

                // Обновляем сделку
                const closed = await tx.trade_Transaction.update({
                    where: { id: trade.id },
                    data: {
                        status: "CLOSE",
                        closeIn: price,
                        profit,
                        endAt: new Date(),
                    },
                })

                // Возвращаем margin + profit
                await tx.walletBalance.update({
                    where: {
                        userId_assetSymbol: {
                            userId,
                            assetSymbol: baseCurrency,
                        },
                    },
                    data: {
                        locked: { decrement: trade.margin },
                        ownBalance: { increment: trade.margin + profit },
                    },
                })

                return { profit, closedTrade: closed }
            },
            { timeout: 10000 }
        )

        await broadcastUserBalance(userId)

        return NextResponse.json(closedTrade)
    } catch (error) {
        console.error("Error closing trade:", error)
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
