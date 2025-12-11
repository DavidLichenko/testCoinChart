// app/api/trades/[id]/close/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { broadcastUserBalance } from "@/lib/balance-broadcast"
import { processTradeReferralReward } from "@/lib/referral-rewards"

/**
 * Конвертирует сумму из одной валюты в другую через курс FxRate
 */
async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const fromRate = await prisma.fxRate.findUnique({
      where: { symbol: fromCurrency },
    });
    
    const toRate = await prisma.fxRate.findUnique({
      where: { symbol: toCurrency },
    });

    if (!fromRate || !toRate) {
      console.error(`Currency rates not found for ${fromCurrency} or ${toCurrency}`);
      return amount;
    }

    // Конвертируем через базовую валюту (USD)
    const amountInBase = amount / fromRate.toBase;
    const convertedAmount = amountInBase * toRate.toBase;

    return convertedAmount;
  } catch (error) {
    console.error("Error converting currency:", error);
    return amount;
  }
}

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
                // P/L calculation - правильный расчет для всех типов сделок (включая AI-trading)
                const openIn = trade.openIn
                const volume = trade.volume
                const leverage = trade.leverage

                // Расчет профита в USD (трейды всегда в USD)
                const rawProfit =
                    trade.type === "BUY"
                        ? (price - openIn) * volume * leverage
                        : (openIn - price) * volume * leverage

                const profitInUSD = Number.isFinite(rawProfit) ? rawProfit : 0

                // Если базовая валюта EUR, конвертируем profit в EUR
                let profitInBaseCurrency = profitInUSD
                if (baseCurrency === "EUR") {
                    profitInBaseCurrency = await convertCurrency(profitInUSD, "USD", "EUR")
                }

                // Получаем текущий баланс перед обновлением
                const wallet = await tx.walletBalance.findUnique({
                    where: {
                        userId_assetSymbol: {
                            userId,
                            assetSymbol: baseCurrency,
                        },
                    },
                })

                const currentBalance = wallet?.ownBalance || 0
                const currentLocked = wallet?.locked || 0
                
                // Рассчитываем новый баланс: текущий + разблокированная маржа + профит (в базовой валюте)
                const newBalance = currentBalance + trade.margin + profitInBaseCurrency

                // Если баланс уходит в минус, обнуляем его
                const finalBalance = Math.max(0, newBalance)
                const finalLocked = Math.max(0, currentLocked - trade.margin)

                // Обновляем сделку - сохраняем profit в базовой валюте
                const closed = await tx.trade_Transaction.update({
                    where: { id: trade.id },
                    data: {
                        status: "CLOSE",
                        closeIn: price,
                        profit: profitInBaseCurrency, // Профит в базовой валюте юзера
                        endAt: new Date(),
                    },
                })

                // Обновляем баланс: разблокируем маржу и добавляем профит (или обнуляем если уходит в минус)
                // Также возвращаем использованный кредит, если он был
                const walletBefore = await tx.walletBalance.findUnique({
                    where: {
                        userId_assetSymbol: {
                            userId,
                            assetSymbol: baseCurrency,
                        },
                    },
                })
                
                const currentCreditUsed = walletBefore?.creditUsed || 0
                // Если профит положительный, возвращаем кредит пропорционально
                // Если профит отрицательный, кредит остается использованным
                const creditToReturn = profitInBaseCurrency > 0 ? Math.min(currentCreditUsed, trade.margin) : 0
                
                await tx.walletBalance.update({
                    where: {
                        userId_assetSymbol: {
                            userId,
                            assetSymbol: baseCurrency,
                        },
                    },
                    data: {
                        locked: finalLocked,
                        ownBalance: finalBalance,
                        creditUsed: creditToReturn > 0 ? { decrement: creditToReturn } : undefined,
                    },
                })

                return { profit: profitInBaseCurrency, closedTrade: closed }
            },
            { timeout: 10000 }
        )

        await broadcastUserBalance(userId)

        // Начисляем реферальную награду если есть профит
        if (profit > 0) {
            // Запускаем асинхронно, чтобы не блокировать ответ
            processTradeReferralReward(
                closedTrade.id,
                userId,
                profit,
                baseCurrency
            ).catch((err) => {
                console.error("Failed to process referral reward:", err);
            });
        }

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
