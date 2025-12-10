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
        // Check if the referred user has made a deposit of at least $500
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

        const hasMadeDeposit = totalDeposits >= 500;

        // Update referral status if conditions are met
        let updatedReferral = referral;
        if (hasMadeDeposit && referral.status === "PENDING") {
          // Update status to QUALIFIED and increase reward amount
          updatedReferral = await prisma.referral.update({
            where: { id: referral.id },
            data: {
              status: "QUALIFIED",
              rewardAmount: {
                increment: 40, // Add $40 to the existing $10 = $50 total
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

    // Calculate pending bonuses (referrals that are qualified but reward hasn't been claimed)
    const pendingBonuses = enrichedReferrals
      .filter(
        (referral) =>
          referral.status === "QUALIFIED" &&
          referral.referredUser.hasMadeDeposit &&
          referral.rewardAmount < 50
      )
      .reduce((sum) => sum + 40, 0); // $50 - $10 = $40 bonus

    return NextResponse.json({
      referrals: enrichedReferrals,
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

    // Create new referral
    const referral = await prisma.referral.create({
      data: {
        referrerId: userId,
        referredUserId: referredUserId,
        code: `REF-${userId.substring(0, 8)}`,
        rewardAmount: 10, // Default reward amount
        rewardCurrency: "USD",
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