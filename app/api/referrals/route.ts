import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();

    // Get referrals for the current user
    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: userId,
      },
      include: {
        referredUser: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Enrich referrals with deposit information and update statuses
    const enrichedReferrals = await Promise.all(
      referrals.map(async (referral) => {
        // Get active referral rewards from settings
        const signupReward = await prisma.referralReward.findUnique({
          where: { action: "SIGNUP" },
        });
        const depositThresholdReward = await prisma.referralReward.findFirst({
          where: { 
            action: "DEPOSIT_THRESHOLD",
            isActive: true,
          },
        });

        // Check if the referred user has made a deposit meeting threshold
        const depositOrders = await prisma.orders.findMany({
          where: {
            userId: referral.referredUser.id,
            type: "DEPOSIT",
            status: "SUCCESSFUL",
          },
        });

        const totalDeposits = depositOrders.reduce(
          (sum, order) => sum + order.amount,
          0
        );

        const threshold = depositThresholdReward?.threshold || 500;
        const hasMadeDeposit = totalDeposits >= threshold;

        // Update referral status if conditions are met
        let updatedReferral = referral;
        if (hasMadeDeposit && referral.status === "PENDING" && depositThresholdReward) {
          // Update status to QUALIFIED and add threshold reward
          const bonusAmount = depositThresholdReward.rewardAmount;
          updatedReferral = await prisma.referral.update({
            where: { id: referral.id },
            data: {
              status: "QUALIFIED",
              rewardAmount: {
                increment: bonusAmount,
              },
            },
            include: {
              referredUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  createdAt: true,
                },
              },
            },
          });
        }

        return {
          ...updatedReferral,
          referredUser: {
            ...updatedReferral.referredUser,
            hasMadeDeposit,
          },
        };
      })
    );

    // Get referral statistics
    const stats = await prisma.referral.aggregate({
      where: {
        referrerId: userId,
      },
      _count: true,
      _sum: {
        rewardAmount: true,
      },
    });

    const qualifiedCount = await prisma.referral.count({
      where: {
        referrerId: userId,
        status: "QUALIFIED",
      },
    });

    // Get referral rewards for display
    const referralRewards = await prisma.referralReward.findMany({
      where: { isActive: true },
      orderBy: { rewardAmount: "desc" },
    });

    // Calculate pending bonuses based on active rewards
    const depositThresholdReward = referralRewards.find(
      (r) => r.action === "DEPOSIT_THRESHOLD"
    );
    const signupReward = referralRewards.find((r) => r.action === "SIGNUP");
    const signupAmount = signupReward?.rewardAmount || 0;
    const thresholdBonus = depositThresholdReward?.rewardAmount || 0;

    const pendingBonuses = enrichedReferrals
      .filter(
        (referral) =>
          referral.status === "QUALIFIED" &&
          referral.referredUser.hasMadeDeposit &&
          referral.rewardAmount < signupAmount + thresholdBonus
      )
      .reduce((sum) => sum + thresholdBonus, 0);

    return NextResponse.json({
      referrals: enrichedReferrals,
      rewards: referralRewards, // Include rewards for display
      stats: {
        total: stats._count,
        totalEarnings: stats._sum.rewardAmount || 0,
        qualified: qualifiedCount,
        pendingBonus: pendingBonuses,
      },
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const { referredUserId } = body;

    // Check if referral already exists
    const existingReferral = await prisma.referral.findUnique({
      where: {
        referredUserId: referredUserId,
      },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: "Referral already exists" },
        { status: 400 }
      );
    }

    // Get signup reward from settings
    const signupReward = await prisma.referralReward.findUnique({
      where: { action: "SIGNUP" },
    });

    const initialReward = signupReward?.rewardAmount || 10;
    const rewardCurrency = signupReward?.rewardCurrency || "USD";

    // Create new referral
    const referral = await prisma.referral.create({
      data: {
        referrerId: userId,
        referredUserId: referredUserId,
        code: `REF-${userId.substring(0, 8)}`,
        rewardAmount: initialReward,
        rewardCurrency: rewardCurrency,
        status: "PENDING",
      },
    });

    return NextResponse.json(referral);
  } catch (error) {
    console.error("Error creating referral:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}