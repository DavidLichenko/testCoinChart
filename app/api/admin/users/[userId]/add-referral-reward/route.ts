import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const currentUserId = await requireAuth();
    
    // Check if current user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });

    if (
      !currentUser ||
      (currentUser.role !== "OWNER" &&
        currentUser.role !== "CR_MANAGMENT" &&
        currentUser.role !== "TEAMLEAD")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { referredUserId, rewardAmount, description } = body;

    const userId = params.userId;

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: userId,
        referredUserId: referredUserId || null, // Can be null for manual rewards
        code: `MANUAL-${Date.now()}`,
        rewardAmount: Number(rewardAmount),
        rewardCurrency: "USD",
        status: "QUALIFIED", // Manual rewards are auto-qualified
      },
    });

    // Add balance to user
    const userWallet = await prisma.walletBalance.findFirst({
      where: {
        userId: userId,
        assetSymbol: "USD",
      },
    });

    if (userWallet) {
      await prisma.walletBalance.update({
        where: { id: userWallet.id },
        data: {
          ownBalance: {
            increment: Number(rewardAmount),
          },
        },
      });
    }

    // Create transaction record
    await prisma.orders.create({
      data: {
        userId: userId,
        type: "DEPOSIT",
        amount: Number(rewardAmount),
        status: "SUCCESSFUL",
      },
    });

    return NextResponse.json({
      success: true,
      referral,
    });
  } catch (error) {
    console.error("Error adding referral reward:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
