import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        verification: true,
        walletBalances: {
          select: {
            assetSymbol: true,
            ownBalance: true,
            creditLimit: true,
            creditUsed: true,
          }
        }
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get balance from walletBalances
    const baseCurrency = user.baseCurrency || "USD"
    const wallet = user.walletBalances.find(w => w.assetSymbol === baseCurrency)
    const totalBalance = wallet?.ownBalance || 0

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      canWithdraw: user.can_withdraw,
      isVerif: user.isVerif,
      totalBalance,
      baseCurrency,
      blocked: user.blocked,
      status: user.status,
      createdAt: user.createdAt,
      verification: user.verification[0] || null,
      referralCode: user.referralCode,
      mobileNumber: user.mobileNumber,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { name, email, image, baseCurrency, mobileNumber } = body

    // Get current user to check old baseCurrency
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    })

    const updates: any = { name, email, image }
    
    // Add mobileNumber if provided
    if (mobileNumber !== undefined) {
      updates.mobileNumber = mobileNumber
    }
    
    // Handle baseCurrency change with balance conversion
    if (baseCurrency && currentUser && baseCurrency !== currentUser.baseCurrency) {
      const oldBaseCurrency = currentUser.baseCurrency || "USD"
      const newBaseCurrency = baseCurrency
      
      // Get EUR/USD rate from FxRate database
      let eurUsdRate = 1.0
      try {
        const fxRate = await prisma.fxRate.findUnique({
          where: { symbol: "EUR" },
        })
        if (fxRate && fxRate.toBase) {
          eurUsdRate = fxRate.toBase // EUR to USD rate
        }
      } catch (error) {
        console.warn("Failed to fetch EUR/USD rate from database, using fallback:", error)
      }
      
      // Get old base currency balance
      const oldBalance = await prisma.walletBalance.findUnique({
        where: {
          userId_assetSymbol: {
            userId,
            assetSymbol: oldBaseCurrency,
          },
        },
      })
      
      let convertedBalance = 0
      let convertedCreditLimit = 0
      let convertedCreditUsed = 0
      let convertedLocked = 0
      
      if (oldBalance) {
        // Convert balance based on currency change
        if (oldBaseCurrency === "EUR" && newBaseCurrency === "USD") {
          // EUR to USD: multiply by EUR/USD rate
          convertedBalance = oldBalance.ownBalance * eurUsdRate
          convertedCreditLimit = oldBalance.creditLimit * eurUsdRate
          convertedCreditUsed = oldBalance.creditUsed * eurUsdRate
          convertedLocked = oldBalance.locked * eurUsdRate
        } else if (oldBaseCurrency === "USD" && newBaseCurrency === "EUR") {
          // USD to EUR: divide by EUR/USD rate
          convertedBalance = oldBalance.ownBalance / eurUsdRate
          convertedCreditLimit = oldBalance.creditLimit / eurUsdRate
          convertedCreditUsed = oldBalance.creditUsed / eurUsdRate
          convertedLocked = oldBalance.locked / eurUsdRate
        } else {
          convertedBalance = oldBalance.ownBalance
          convertedCreditLimit = oldBalance.creditLimit
          convertedCreditUsed = oldBalance.creditUsed
          convertedLocked = oldBalance.locked
        }
      }
      
      // Update baseCurrency in user
      updates.baseCurrency = newBaseCurrency
      
      // Create/update wallet balance for new base currency
      await prisma.walletBalance.upsert({
        where: {
          userId_assetSymbol: {
            userId,
            assetSymbol: newBaseCurrency,
          },
        },
        update: {
          ownBalance: convertedBalance,
          creditLimit: convertedCreditLimit,
          creditUsed: convertedCreditUsed,
          locked: convertedLocked,
        },
        create: {
          userId,
          assetSymbol: newBaseCurrency,
          ownBalance: convertedBalance,
          creditLimit: convertedCreditLimit,
          creditUsed: convertedCreditUsed,
          locked: convertedLocked,
        },
      })
      
      // Set old balance to 0
      if (oldBalance && oldBaseCurrency !== newBaseCurrency) {
        await prisma.walletBalance.update({
          where: {
            userId_assetSymbol: {
              userId,
              assetSymbol: oldBaseCurrency,
            },
          },
          data: {
            ownBalance: 0,
            creditLimit: 0,
            creditUsed: 0,
            locked: 0,
          },
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user profile:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
