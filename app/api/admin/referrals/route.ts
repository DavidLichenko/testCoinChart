import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { getCurrentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get all referrals for this user
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

    return NextResponse.json(referrals);
  } catch (error) {
    console.error("Error fetching user referrals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add a referral connection manually
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
    const { userId, referralEmail } = body;

    if (!userId || !referralEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the referral user by email
    const referralUser = await prisma.user.findUnique({
      where: { email: referralEmail },
    });

    if (!referralUser) {
      return NextResponse.json({ error: "User not found with this email" }, { status: 404 });
    }

    // Check if user is trying to refer themselves
    if (referralUser.id === userId) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Update the referral user to be referred by this user
    const updatedUser = await prisma.user.update({
      where: { id: referralUser.id },
      data: { referredById: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        TotalBalance: true,
      },
    });

    // Trigger Pusher event for the referrer
    try {
      await pusherServer.trigger(`user-${userId}`, 'referral-added', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt.toISOString(),
        TotalBalance: updatedUser.TotalBalance || 0,
      });
    } catch (pusherError) {
      console.error('Pusher error:', pusherError);
      // Don't fail the operation if Pusher fails
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error adding referral:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
