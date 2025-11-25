import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { updateBalance } from "@/app/actions/updateBalance"

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { type, ticker, volume, leverage, margin, openIn, takeProfit, stopLoss, assetType } = body

    // Validate required fields
    if (!type || !ticker || !volume || !leverage || !margin || !openIn || !assetType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Parse and validate numeric values
    const parsedVolume = Number.parseFloat(volume)
    const parsedLeverage = Number.parseInt(leverage)
    const parsedMargin = Number.parseFloat(margin)
    const parsedOpenIn = Number.parseFloat(openIn)
    const parsedTakeProfit = takeProfit ? Number.parseFloat(takeProfit) : null
    const parsedStopLoss = stopLoss ? Number.parseFloat(stopLoss) : null

    // Validate parsed values
    if (isNaN(parsedVolume) || parsedVolume <= 0) {
      return NextResponse.json({ error: "Invalid volume" }, { status: 400 })
    }
    
    if (isNaN(parsedLeverage) || parsedLeverage <= 0) {
      return NextResponse.json({ error: "Invalid leverage" }, { status: 400 })
    }
    
    if (isNaN(parsedMargin) || parsedMargin <= 0) {
      return NextResponse.json({ error: "Invalid margin" }, { status: 400 })
    }
    
    if (isNaN(parsedOpenIn) || parsedOpenIn <= 0) {
      return NextResponse.json({ error: "Invalid open price" }, { status: 400 })
    }
    
    if (parsedTakeProfit !== null && isNaN(parsedTakeProfit)) {
      return NextResponse.json({ error: "Invalid take profit value" }, { status: 400 })
    }
    
    if (parsedStopLoss !== null && isNaN(parsedStopLoss)) {
      return NextResponse.json({ error: "Invalid stop loss value" }, { status: 400 })
    }

    // Additional Binance/MT5-style validations
    // Validate leverage limits based on asset type
    const leverageLimits: Record<string, number> = {
      "Crypto": 100,
      "IEX": 50,
      "Forex": 1000,
      "Metal": 200
    };
    
    const maxLeverage = leverageLimits[assetType] || 100;
    if (parsedLeverage > maxLeverage) {
      return NextResponse.json({ error: `Maximum leverage for ${assetType} is ${maxLeverage}x` }, { status: 400 });
    }
    
    // Validate volume limits
    const minVolume = 0.01;
    const maxVolume = 1000;
    if (parsedVolume < minVolume || parsedVolume > maxVolume) {
      return NextResponse.json({ error: `Volume must be between ${minVolume} and ${maxVolume}` }, { status: 400 });
    }
    
    // Validate take profit and stop loss distances
    if (parsedTakeProfit !== null) {
      const minDistance = parsedOpenIn * 0.001; // 0.1% minimum distance
      const tpDistance = Math.abs(parsedTakeProfit - parsedOpenIn);
      if (tpDistance < minDistance) {
        return NextResponse.json({ error: "Take profit must be at least 0.1% away from entry price" }, { status: 400 });
      }
    }
    
    if (parsedStopLoss !== null) {
      const minDistance = parsedOpenIn * 0.001; // 0.1% minimum distance
      const slDistance = Math.abs(parsedStopLoss - parsedOpenIn);
      if (slDistance < minDistance) {
        return NextResponse.json({ error: "Stop loss must be at least 0.1% away from entry price" }, { status: 400 });
      }
      
      // Validate TP/SL logic (BUY: TP > entry > SL, SELL: SL > entry > TP)
      if (type === "BUY" && parsedStopLoss >= parsedOpenIn) {
        return NextResponse.json({ error: "Stop loss for BUY orders must be below entry price" }, { status: 400 });
      }
      
      if (type === "SELL" && parsedStopLoss <= parsedOpenIn) {
        return NextResponse.json({ error: "Stop loss for SELL orders must be above entry price" }, { status: 400 });
      }
      
      if (parsedTakeProfit !== null) {
        if (type === "BUY" && parsedTakeProfit <= parsedOpenIn) {
          return NextResponse.json({ error: "Take profit for BUY orders must be above entry price" }, { status: 400 });
        }
        
        if (type === "SELL" && parsedTakeProfit >= parsedOpenIn) {
          return NextResponse.json({ error: "Take profit for SELL orders must be below entry price" }, { status: 400 });
        }
      }
    }

    // Create trade and update balance in a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if user exists and has sufficient balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { TotalBalance: true }
      })

      if (!user) {
        throw new Error("User not found")
      }

      const currentBalance = user.TotalBalance || 0
      if (currentBalance < parsedMargin) {
        throw new Error("Insufficient balance")
      }

      // Create the trade
      const trade = await tx.trade_Transaction.create({
        data: {
          userId,
          type,
          ticker,
          volume: parsedVolume,
          leverage: parsedLeverage,
          margin: parsedMargin,
          openIn: parsedOpenIn,
          openInA: parsedOpenIn, // Current price at open
          takeProfit: parsedTakeProfit,
          stopLoss: parsedStopLoss,
          assetType,
          profit: 0, // Initial profit is 0
          status: "OPEN",
        },
      })

      // Update user balance
      const newBalance = currentBalance - parsedMargin
      await tx.user.update({
        where: { id: userId },
        data: {
          TotalBalance: newBalance,
        },
      })

      return { trade, newBalance }
    }, {
      timeout: 10000 // 10 second timeout
    })

    // Send updated balance via Pusher (outside of transaction to prevent timeouts)
    try {
      await updateBalance(userId, result.newBalance)
    } catch (pusherError) {
      console.error("Failed to send balance update via Pusher:", pusherError)
      // Don't fail the entire operation if Pusher fails
    }

    return NextResponse.json(result.trade)
  } catch (error) {
    console.error("Error creating trade:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}