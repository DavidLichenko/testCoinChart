import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedFxRates() {
  console.log("Seeding FxRate data...");

  const baseCurrency = "EUR";

  // Базовые фиатные курсы (примерные значения, будут обновлены автоматически)
  const fiatRates = [
    { symbol: "EUR", toBase: 1.0 }, // базовая валюта
    { symbol: "USD", toBase: 1.09 },
    { symbol: "GBP", toBase: 0.86 },
    { symbol: "JPY", toBase: 158.5 },
    { symbol: "CHF", toBase: 0.94 },
    { symbol: "CAD", toBase: 1.48 },
    { symbol: "AUD", toBase: 1.66 },
  ];

  // Примерные курсы криптовалют в EUR (будут обновлены автоматически)
  const cryptoRates = [
    { symbol: "BTC", toBase: 95000.0 },
    { symbol: "ETH", toBase: 3500.0 },
    { symbol: "USDT", toBase: 1.09 },
    { symbol: "BNB", toBase: 620.0 },
    { symbol: "SOL", toBase: 230.0 },
    { symbol: "XRP", toBase: 2.3 },
  ];

  const allRates = [...fiatRates, ...cryptoRates];

  for (const rate of allRates) {
    await prisma.fxRate.upsert({
      where: { symbol: rate.symbol },
      update: {
        toBase: rate.toBase,
        baseCurrency: baseCurrency,
      },
      create: {
        symbol: rate.symbol,
        toBase: rate.toBase,
        baseCurrency: baseCurrency,
      },
    });

    console.log(`✓ Seeded ${rate.symbol}: ${rate.toBase} ${baseCurrency}`);
  }

  console.log("\n✅ FxRate seed completed!");
  console.log("Note: These are initial rates. Run the cron job to update with real-time data.");
}

seedFxRates()
  .catch((error) => {
    console.error("Error seeding FxRates:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
