// app/api/trades/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { broadcastUserBalance } from "@/lib/balance-broadcast"

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

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    let {
      type,
      ticker,
      volume,
      leverage,
      margin,
      openIn,
      takeProfit,
      stopLoss,
      assetType,
      aiEnabled,
    } = body

    // ------------------------------
    // FIXED: do NOT use “!volume”
    // ------------------------------
    if (
        type == null ||
        ticker == null ||
        volume == null ||
        leverage == null ||
        margin == null ||
        openIn == null ||
        assetType == null
    ) {
      return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
      )
    }

    // Force numeric types
    volume = Number(volume)
    leverage = Number(leverage)
    margin = Number(margin)
    openIn = Number(openIn)
    takeProfit = takeProfit ? Number(takeProfit) : null
    stopLoss = stopLoss ? Number(stopLoss) : null

    // Validate numeric input
    if (isNaN(volume) || volume <= 0) return NextResponse.json({ error: "Invalid volume" }, { status: 400 })
    if (isNaN(leverage) || leverage <= 0) return NextResponse.json({ error: "Invalid leverage" }, { status: 400 })
    if (isNaN(margin) || margin <= 0) return NextResponse.json({ error: "Invalid margin" }, { status: 400 })
    if (isNaN(openIn) || openIn <= 0) return NextResponse.json({ error: "Invalid open price" }, { status: 400 })

    // Asset leverage limits
    const leverageLimits: Record<string, number> = {
      Crypto: 100,
      IEX: 50,
      Forex: 1000,
      Metal: 200,
    }

    const maxLev = leverageLimits[assetType] || 100
    if (leverage > maxLev)
      return NextResponse.json(
          { error: `Maximum leverage for ${assetType} is ${maxLev}x` },
          { status: 400 }
      )

    // ------------------------------
    // Transaction
    // ------------------------------

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
      })

      if (!user) throw new Error("User not found")

      const baseCurrency = user.baseCurrency || "USD"

      // ВАЖНО: Если пользователь в EUR, конвертируем margin в USD для трейда
      // Все трейды открываются в USD, но margin блокируется в базовой валюте юзера
      let marginInBaseCurrency = margin
      
      if (baseCurrency === "EUR") {
        // Margin пришел в EUR, нужно проверить баланс в EUR
        // Но для трейда нужно конвертировать в USD
        const marginInUSD = await convertCurrency(margin, "EUR", "USD")
        // marginInBaseCurrency остается в EUR для блокировки баланса
        // marginInUSD используется для расчета профита трейда
      }

      const wallet = await tx.walletBalance.findUnique({
        where: {
          userId_assetSymbol: { userId, assetSymbol: baseCurrency },
        },
      })

      // Проверяем доступный баланс: собственные средства + доступный кредит
      const ownBalance = wallet?.ownBalance || 0
      const creditLimit = wallet?.creditLimit || 0
      const creditUsed = wallet?.creditUsed || 0
      const creditAvailable = Math.max(0, creditLimit - creditUsed)
      
      // Доступно для трейда: собственные средства + доступный кредит
      const available = ownBalance + creditAvailable

      // Проверяем баланс в базовой валюте пользователя
      if (available < marginInBaseCurrency) throw new Error("InsufficientBalance")
      
      // Определяем, сколько использовать из кредита (если нужно)
      const ownBalanceToUse = Math.min(ownBalance, marginInBaseCurrency)
      const creditToUse = Math.max(0, marginInBaseCurrency - ownBalanceToUse)

      // Lock margin: сначала используем собственные средства, затем кредит
      await tx.walletBalance.update({
        where: {
          userId_assetSymbol: { userId, assetSymbol: baseCurrency },
        },
        data: {
          ownBalance: { decrement: ownBalanceToUse },
          creditUsed: creditToUse > 0 ? { increment: creditToUse } : undefined,
          locked: { increment: marginInBaseCurrency },
        },
      })

      const trade = await tx.trade_Transaction.create({
        data: {
          userId,
          type,
          ticker,
          volume,
          leverage,
          margin: marginInBaseCurrency, // Сохраняем margin в базовой валюте юзера (EUR или USD)
          openIn,
          openInA: openIn,
          takeProfit,
          stopLoss,
          assetType,
          aiEnabled: !!aiEnabled,
          profit: 0,
          status: "OPEN",
        },
      })

      return { trade }
    })

    await broadcastUserBalance(userId)

    return NextResponse.json(result.trade)
  } catch (error) {
    console.error("Trade create error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "InsufficientBalance") {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
