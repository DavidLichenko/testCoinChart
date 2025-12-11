// prisma/seed-referral-rewards.ts
// Script to seed referral rewards
// Run with: npx ts-node prisma/seed-referral-rewards.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding referral rewards...');

  // Trade Profit Reward (7%)
  await prisma.referralReward.upsert({
    where: { action: 'TRADE_PROFIT' },
    update: {
      actionLabel: 'Trade Profit Commission',
      rewardAmount: 0,
      rewardPercent: 7.0,
      rewardCurrency: 'USD',
      isActive: true,
      description: 'Earn 7% of your referral\'s trading profits automatically',
    },
    create: {
      action: 'TRADE_PROFIT',
      actionLabel: 'Trade Profit Commission',
      rewardAmount: 0,
      rewardPercent: 7.0,
      rewardCurrency: 'USD',
      isActive: true,
      description: 'Earn 7% of your referral\'s trading profits automatically',
    },
  });

  // Signup Reward
  await prisma.referralReward.upsert({
    where: { action: 'SIGNUP' },
    update: {
      actionLabel: 'New User Signup',
      rewardAmount: 10,
      rewardPercent: null,
      rewardCurrency: 'USD',
      isActive: true,
      description: 'Get $10 when someone signs up using your link',
    },
    create: {
      action: 'SIGNUP',
      actionLabel: 'New User Signup',
      rewardAmount: 10,
      rewardPercent: null,
      rewardCurrency: 'USD',
      isActive: true,
      description: 'Get $10 when someone signs up using your link',
    },
  });

  // Deposit Threshold Reward
  await prisma.referralReward.upsert({
    where: { action: 'DEPOSIT_THRESHOLD' },
    update: {
      actionLabel: 'First Deposit $500+',
      rewardAmount: 40,
      rewardPercent: null,
      rewardCurrency: 'USD',
      threshold: 500,
      isActive: true,
      description: 'Get $40 bonus when your referral deposits $500 or more',
    },
    create: {
      action: 'DEPOSIT_THRESHOLD',
      actionLabel: 'First Deposit $500+',
      rewardAmount: 40,
      rewardPercent: null,
      rewardCurrency: 'USD',
      threshold: 500,
      isActive: true,
      description: 'Get $40 bonus when your referral deposits $500 or more',
    },
  });

  console.log('Referral rewards seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
