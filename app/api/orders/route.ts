import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth()

    // Fetch user to get baseCurrency
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    })

    const baseCurrency = user?.baseCurrency || "USD"

    const orders = await prisma.orders.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    // Get EUR/USD rate for conversion if needed
    let eurUsdRate = 1;
    if (baseCurrency === "EUR") {
      try {
        const eurUsdtRes = await fetch(
          "https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT",
          { cache: "no-store" }
        );
        if (eurUsdtRes.ok) {
          const eurUsdtData = await eurUsdtRes.json();
          eurUsdRate = parseFloat(eurUsdtData.price) || 1;
        }
      } catch (error) {
        console.warn("Failed to fetch EUR/USDT rate:", error);
      }
    }

    // Convert order amounts to baseCurrency if needed
    // Note: Orders are typically stored in USD, so we convert if baseCurrency is EUR
    const ordersWithBaseCurrency = orders.map(order => {
      let convertedAmount = order.amount;
      // If order was created in USD but user's baseCurrency is EUR, convert
      if (baseCurrency === "EUR" && eurUsdRate) {
        convertedAmount = order.amount / eurUsdRate;
      }
      return {
        ...order,
        amount: convertedAmount,
        baseCurrency, // Add baseCurrency to response
      };
    });

    return NextResponse.json(ordersWithBaseCurrency)
  } catch (error) {
    console.error("Error fetching orders:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { type, amount, depositFrom, bankName, cardNumber, cryptoAddress, cryptoNetwork, withdrawMethod } = body

    // Validate required fields
    if (!type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const order = await prisma.orders.create({
      data: {
        userId,
        type,
        amount: Number.parseFloat(amount),
        status: "PENDING",
        depositFrom,
        bankName,
        cardNumber,
        cryptoAddress,
        cryptoNetwork,
        withdrawMethod,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
