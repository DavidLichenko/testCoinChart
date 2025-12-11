import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint для обновления курсов валют
 * Использует exchangerate-api.com для получения актуальных курсов
 */
export async function GET(request: Request) {
  try {
    // Проверка авторизации (только для Vercel Cron)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const baseCurrency = "EUR"; // Базовая валюта сайта
    const API_KEY = process.env.EXCHANGE_RATE_API_KEY;

    if (!API_KEY) {
      console.error("EXCHANGE_RATE_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Получаем курсы от exchangerate-api.com
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== "success") {
      throw new Error(`API response: ${data["error-type"] || "unknown error"}`);
    }

    const rates = data.conversion_rates;
    const updatedRates: string[] = [];

    // Обновляем курсы основных валют
    const currenciesToUpdate = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD"];

    for (const currency of currenciesToUpdate) {
      if (rates[currency]) {
        const rate = currency === baseCurrency ? 1.0 : rates[currency];

        await prisma.fxRate.upsert({
          where: { symbol: currency },
          update: {
            toBase: rate,
            baseCurrency: baseCurrency,
            updatedAt: new Date(),
          },
          create: {
            symbol: currency,
            toBase: rate,
            baseCurrency: baseCurrency,
          },
        });

        updatedRates.push(`${currency}: ${rate}`);
      }
    }

    // Также обновляем курсы основных криптовалют от Binance
    const cryptoCurrencies = ["BTC", "ETH", "USDT", "BNB", "SOL", "XRP"];
    
    for (const crypto of cryptoCurrencies) {
      try {
        // Получаем цену в USD от Binance
        const binanceRes = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${crypto}USDT`
        );

        if (binanceRes.ok) {
          const binanceData = await binanceRes.json();
          const priceInUsd = parseFloat(binanceData.price);

          // Конвертируем USD в EUR (базовую валюту)
          const usdToEur = rates["USD"] || 1;
          const priceInEur = priceInUsd * usdToEur;

          await prisma.fxRate.upsert({
            where: { symbol: crypto },
            update: {
              toBase: priceInEur,
              baseCurrency: baseCurrency,
              updatedAt: new Date(),
            },
            create: {
              symbol: crypto,
              toBase: priceInEur,
              baseCurrency: baseCurrency,
            },
          });

          updatedRates.push(`${crypto}: ${priceInEur.toFixed(2)} EUR`);
        }
      } catch (error) {
        console.error(`Failed to update ${crypto} rate:`, error);
      }
    }

    console.log(`[FxRate Update] Successfully updated ${updatedRates.length} rates`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedRates.length} exchange rates`,
      rates: updatedRates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating FX rates:", error);
    return NextResponse.json(
      {
        error: "Failed to update exchange rates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
