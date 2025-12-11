import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function POST(req: Request) {
  try {
    const userId = await requireAuth()
    const {
      amount,
      method,
      assetSymbol,
      transferType,
      userEmail,
      cardNumber,
      cardHolder,
      cryptoAddress,
      cryptoNetwork,
    } = await req.json()

    if (!amount || !method || !assetSymbol) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user's wallet balance
    const wallet = await prisma.walletBalance.findUnique({
      where: {
        userId_assetSymbol: { userId, assetSymbol },
      },
    })

    if (!wallet || wallet.ownBalance < amount) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 })
    }

    // Get withdrawal limit
    const limit = await prisma.withdrawalLimit.findUnique({
      where: { method },
    })

    if (!limit || !limit.isActive) {
      return NextResponse.json({ error: "Withdrawal method not available" }, { status: 400 })
    }

    // Check limits
    if (amount < limit.minAmount) {
      return NextResponse.json(
          { error: `Minimum withdrawal amount is ${limit.minAmount}` },
          { status: 400 }
      )
    }

    if (limit.maxAmount && amount > limit.maxAmount) {
      return NextResponse.json(
          { error: `Maximum withdrawal amount is ${limit.maxAmount}` },
          { status: 400 }
      )
    }

    // Check daily/monthly limits
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    if (limit.dailyLimit) {
      const todayWithdrawals = await prisma.walletTransaction.findMany({
        where: {
          userId,
          type: "WITHDRAW",
          status: "COMPLETED",
          createdAt: { gte: startOfDay },
        },
      })
      const todayTotal = todayWithdrawals.reduce((sum, t) => sum + t.amount, 0)
      if (todayTotal + amount > limit.dailyLimit) {
        return NextResponse.json(
            { error: `Daily withdrawal limit exceeded` },
            { status: 400 }
        )
      }
    }

    if (limit.monthlyLimit) {
      const monthWithdrawals = await prisma.walletTransaction.findMany({
        where: {
          userId,
          type: "WITHDRAW",
          status: "COMPLETED",
          createdAt: { gte: startOfMonth },
        },
      })
      const monthTotal = monthWithdrawals.reduce((sum, t) => sum + t.amount, 0)
      if (monthTotal + amount > limit.monthlyLimit) {
        return NextResponse.json(
            { error: `Monthly withdrawal limit exceeded` },
            { status: 400 }
        )
      }
    }

    // Calculate fee
    const fixedFee = limit.fee || 0
    const percentFee = limit.feePercent ? (amount * limit.feePercent) / 100 : 0
    const totalFee = fixedFee + percentFee
    const netAmount = amount - totalFee

    if (method === "CRYPTO") {
      // 1) Внутренний перевод пользователю
      if (transferType === "user") {
        if (!userEmail) {
          return NextResponse.json({ error: "User email required" }, { status: 400 })
        }

        const targetUser = await prisma.user.findUnique({
          where: { email: userEmail },
        })

        if (!targetUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        await prisma.$transaction(async (tx) => {
          // Debit from sender
          await tx.walletBalance.update({
            where: {
              userId_assetSymbol: { userId, assetSymbol },
            },
            data: {
              ownBalance: { decrement: amount },
            },
          })

          // Credit to receiver (create wallet if doesn't exist)
          await tx.walletBalance.upsert({
            where: {
              userId_assetSymbol: { userId: targetUser.id, assetSymbol },
            },
            update: {
              ownBalance: { increment: netAmount },
            },
            create: {
              userId: targetUser.id,
              assetSymbol,
              ownBalance: netAmount,
              creditLimit: 0,
              creditUsed: 0,
              locked: 0,
            },
          })

          // Create transaction records
          await tx.walletTransaction.create({
            data: {
              userId,
              assetSymbol,
              amount: -amount,
              type: "INTERNAL_TRANSFER",
              status: "COMPLETED",
              toUserId: targetUser.id,
              metadata: { fee: totalFee, netAmount },
            },
          })

          await tx.walletTransaction.create({
            data: {
              userId: targetUser.id,
              assetSymbol,
              amount: netAmount,
              type: "INTERNAL_TRANSFER",
              status: "COMPLETED",
              fromUserId: userId,
              metadata: { fromUser: userEmail },
            },
          })
        })

        return NextResponse.json({ success: true, message: "Transfer completed" })
      }

      // 2) Вывод на крипто-адрес
      if (transferType === "crypto") {
        if (!cryptoAddress || !cryptoNetwork) {
          return NextResponse.json(
              { error: "Crypto address and network required" },
              { status: 400 }
          )
        }

        await prisma.$transaction(async (tx) => {
          // Lock the funds
          await tx.walletBalance.update({
            where: {
              userId_assetSymbol: { userId, assetSymbol },
            },
            data: {
              ownBalance: { decrement: amount },
              locked: { increment: amount },
            },
          })

          // Create withdrawal order
          await tx.orders.create({
            data: {
              userId,
              type: "WITHDRAW",
              amount,
              status: "PENDING",
              withdrawMethod: "CRYPTO",
              cryptoAddress,
              cryptoNetwork,
              metadata: {
                fee: totalFee,
                netAmount,
              },
            },
          })
        })

        return NextResponse.json({
          success: true,
          message: "Withdrawal request submitted",
        })
      }

      // 3) По умолчанию — перевод в основную валюту (main balance)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
      })

      const baseCurrency = user?.baseCurrency || "USD"

      if (assetSymbol === baseCurrency) {
        return NextResponse.json(
            { error: "Asset is already in base currency" },
            { status: 400 }
        )
      }

      await prisma.$transaction(async (tx) => {
        // Debit from source asset
        await tx.walletBalance.update({
          where: {
            userId_assetSymbol: { userId, assetSymbol },
          },
          data: {
            ownBalance: { decrement: amount },
          },
        })

        // Credit to base currency (minus fee)
        await tx.walletBalance.upsert({
          where: {
            userId_assetSymbol: { userId, assetSymbol: baseCurrency },
          },
          update: {
            ownBalance: { increment: netAmount },
          },
          create: {
            userId,
            assetSymbol: baseCurrency,
            ownBalance: netAmount,
            creditLimit: 0,
            creditUsed: 0,
            locked: 0,
          },
        })

        // Create transaction record
        await tx.walletTransaction.create({
          data: {
            userId,
            assetSymbol,
            amount: -amount,
            type: "EXCHANGE",
            status: "COMPLETED",
            metadata: {
              toAsset: baseCurrency,
              fee: totalFee,
              netAmount,
            },
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: "Transfer to main balance completed",
      })
    } else if (method === "CARD") {
      // Card withdrawal - create pending order
      if (!cardNumber || !cardHolder) {
        return NextResponse.json({ error: "Card details required" }, { status: 400 })
      }

      await prisma.$transaction(async (tx) => {
        // Lock the funds
        await tx.walletBalance.update({
          where: {
            userId_assetSymbol: { userId, assetSymbol },
          },
          data: {
            ownBalance: { decrement: amount },
            locked: { increment: amount },
          },
        })

        // Create withdrawal order
        await tx.orders.create({
          data: {
            userId,
            type: "WITHDRAW",
            amount,
            status: "PENDING",
            withdrawMethod: "CARD",
            metadata: {
              cardNumber: cardNumber.slice(-4), // Only store last 4 digits
              cardHolder,
              fee: totalFee,
              netAmount,
            },
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: "Withdrawal request submitted",
      })
    }

    return NextResponse.json({ error: "Invalid withdrawal method" }, { status: 400 })
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
