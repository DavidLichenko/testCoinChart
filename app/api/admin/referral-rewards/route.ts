import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { getCurrentUser } from "@/lib/auth";
import { updateBalance } from "@/app/actions/updateBalance";
import type { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    await requireAuth();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if user is admin
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!fullUser || !["OWNER", "CR_MANAGMENT", "TEAMLEAD"].includes(fullUser.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, amount, referralEmail } = body;

    if (!userId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Optionally find referral user if email is provided
    let referralUserId: string | null = null;
    let referralUserName = "";
    
    if (referralEmail && referralEmail.trim() !== "") {
      const referralUser = await prisma.user.findUnique({
        where: { email: referralEmail.trim() },
        select: { id: true, name: true, email: true },
      });

      if (referralUser) {
        referralUserId = referralUser.id;
        referralUserName = referralUser.name || referralUser.email;
      }
    }

    // Create the referral reward and update balance in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create referral reward record
      const reward = await tx.referralReward.create({
        data: {
          userId: userId,
          referralUserId,
          amount: parsedAmount,
          source: referralUserId
            ? `Manual reward from referral: ${referralUserName}`
            : "Manual referral reward by admin",
        },
      });

      // Update user balance
      const targetUser = await tx.user.findUnique({
        where: { id: userId },
        select: { TotalBalance: true },
      });

      if (!targetUser) {
        throw new Error("User not found");
      }

      const newBalance = (targetUser.TotalBalance || 0) + parsedAmount;

      await tx.user.update({
        where: { id: userId },
        data: { TotalBalance: newBalance },
      });

      return { reward, newBalance };
    });

    // Update balance via Pusher
    try {
      await updateBalance(userId, result.newBalance);
    } catch (pusherError) {
      console.error("Failed to send balance update via Pusher:", pusherError);
    }

    return NextResponse.json({ success: true, reward: result.reward });
  } catch (error) {
    console.error("Error creating referral reward:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
