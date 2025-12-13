// app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";  // your Prisma client instance
import { hashPassword, generateToken } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(request: Request) {
  try {
    const { name, email, password, referralCode } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Validate referral code if provided
    let referredById: string | undefined = undefined;
    if (referralCode && referralCode.trim() !== "") {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim() },
      });
      
      if (referrer) {
        referredById = referrer.id;
      }
      // If code is invalid, we just ignore it silently (don't error)
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate unique referral code for new user
    const generateUniqueReferralCode = async (): Promise<string> => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Check if code already exists
      const existing = await prisma.user.findUnique({
        where: { referralCode: code },
      });
      
      if (existing) {
        return generateUniqueReferralCode(); // Try again
      }
      
      return code;
    };

    const uniqueReferralCode = await generateUniqueReferralCode();

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        TotalBalance: 0,
        can_withdraw: false,
        isVerif: false,
        blocked: false,
        status: "NEW",
        referralCode: uniqueReferralCode,
        referredById,
      },
    });

    // Trigger Pusher event for referrer if this user was referred
    if (referredById) {
      try {
        await pusherServer.trigger(`user-${referredById}`, 'referral-added', {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          TotalBalance: user.TotalBalance || 0,
        });
      } catch (pusherError) {
        console.error('Pusher error:', pusherError);
        // Don't fail registration if Pusher fails
      }
    }

    // Create initial balance
    await prisma.balances.create({
      data: {
        userId: user.id,
        usd: 0,
      },
    });

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    // Prepare response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // Set cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/", // important to make cookie available on all routes
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
