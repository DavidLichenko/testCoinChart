import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const userId = await requireAuth();

    // Get user with referral code
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate referral code if user doesn't have one
    if (!user.referralCode) {
      const generateUniqueReferralCode = async (): Promise<string> => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i++) {
          code += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const existing = await prisma.user.findUnique({
          where: { referralCode: code },
        });

        if (existing) {
          return generateUniqueReferralCode();
        }

        return code;
      };

      const newReferralCode = await generateUniqueReferralCode();
      
      // Update user with new referral code
      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: newReferralCode },
        select: { referralCode: true },
      });
    }

    // Get all referrals
    const referrals = await prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        TotalBalance: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get all referral rewards
    const rewards = await prisma.referralReward.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total earnings
    const totalEarnings = rewards.reduce((sum: number, reward: any) => sum + reward.amount, 0);

    return NextResponse.json({
      referralCode: user.referralCode,
      referrals,
      rewards,
      totalEarnings,
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
