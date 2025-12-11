// lib/referral-rewards.ts
import { prisma } from "@/lib/prisma";

/**
 * Конвертирует сумму из одной валюты в другую
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
    // Получаем курсы валют
    const fromRate = await prisma.fxRate.findUnique({
      where: { symbol: fromCurrency },
    });
    
    const toRate = await prisma.fxRate.findUnique({
      where: { symbol: toCurrency },
    });

    if (!fromRate || !toRate) {
      console.error(`Currency rates not found for ${fromCurrency} or ${toCurrency}`);
      return amount; // Возвращаем исходную сумму если курс не найден
    }

    // Конвертируем: amount (from) -> базовая валюта -> to валюта
    const amountInBase = amount / fromRate.toBase;
    const convertedAmount = amountInBase * toRate.toBase;

    return convertedAmount;
  } catch (error) {
    console.error("Error converting currency:", error);
    return amount;
  }
}

/**
 * Начисляет реферальную награду за профит трейда
 */
export async function processTradeReferralReward(
  tradeId: string,
  referredUserId: string,
  profit: number,
  tradeCurrency: string
) {
  try {
    // Проверяем что профит положительный
    if (profit <= 0) {
      return; // Не начисляем бонус за убыток
    }

    // Находим реферала
    const referral = await prisma.referral.findUnique({
      where: { referredUserId },
      include: {
        referrer: {
          select: {
            id: true,
            baseCurrency: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!referral) {
      return; // Нет реферера
    }

    // Получаем настройки награды за профит трейда
    const tradeReward = await prisma.referralReward.findFirst({
      where: {
        action: "TRADE_PROFIT",
        isActive: true,
      },
    });

    if (!tradeReward || !tradeReward.rewardPercent) {
      console.log("Trade profit referral reward not configured");
      return;
    }

    // Вычисляем награду (процент от профита)
    const rewardPercent = tradeReward.rewardPercent;
    const rewardInTradeCurrency = (profit * rewardPercent) / 100;

    // Конвертируем награду в базовую валюту реферера
    const referrerBaseCurrency = referral.referrer.baseCurrency || "USD";
    const rewardInReferrerCurrency = await convertCurrency(
      rewardInTradeCurrency,
      tradeCurrency,
      referrerBaseCurrency
    );

    // Начисляем награду реферу в транзакции
    await prisma.$transaction(async (tx) => {
      // Обновляем баланс реферера
      await tx.walletBalance.upsert({
        where: {
          userId_assetSymbol: {
            userId: referral.referrerId,
            assetSymbol: referrerBaseCurrency,
          },
        },
        create: {
          userId: referral.referrerId,
          assetSymbol: referrerBaseCurrency,
          ownBalance: rewardInReferrerCurrency,
          locked: 0,
          creditLimit: 0,
          creditUsed: 0,
        },
        update: {
          ownBalance: {
            increment: rewardInReferrerCurrency,
          },
        },
      });

      // Обновляем сумму награды в реферале
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          rewardAmount: {
            increment: rewardInReferrerCurrency,
          },
          rewardCurrency: referrerBaseCurrency,
          updatedAt: new Date(),
        },
      });

      // Создаем транзакцию в кошельке
      await tx.walletTransaction.create({
        data: {
          userId: referral.referrerId,
          assetSymbol: referrerBaseCurrency,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount: rewardInReferrerCurrency,
          metadata: {
            type: "REFERRAL_REWARD",
            referralId: referral.id,
            tradeId: tradeId,
            referredUserId: referredUserId,
            profit: profit,
            profitCurrency: tradeCurrency,
            rewardPercent: rewardPercent,
          },
        },
      });

      // Создаем уведомление
      await tx.notification.create({
        data: {
          userId: referral.referrerId,
          type: "REFERRAL",
          title: "Referral Reward Received",
          body: `You earned ${rewardInReferrerCurrency.toFixed(2)} ${referrerBaseCurrency} (${rewardPercent}% of your referral's trade profit)`,
          metadata: {
            rewardAmount: rewardInReferrerCurrency,
            currency: referrerBaseCurrency,
            referredUser: referral.referrer.name || referral.referrer.email,
            tradeId: tradeId,
          },
        },
      });
    });

    console.log(
      `Referral reward processed: ${rewardInReferrerCurrency.toFixed(2)} ${referrerBaseCurrency} to user ${referral.referrerId}`
    );
  } catch (error) {
    console.error("Error processing trade referral reward:", error);
    // Не пробрасываем ошибку, чтобы не сломать закрытие трейда
  }
}
