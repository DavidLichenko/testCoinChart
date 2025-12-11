// app/api/auth/register/route.ts

import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {generateToken, hashPassword} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, baseCurrency, referralCode } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
      );
    }

    // Validate base currency (FiatCurrency enum: USD | EUR)
    const normalizedCurrency =
        baseCurrency === "USD" || baseCurrency === "EUR" ? baseCurrency : "EUR";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Handle referral code if provided
    let referrerId: string | null = null
    if (referralCode) {
      const code = referralCode.trim().toUpperCase()
      
      // First try to find by referral code
      let referrer = await prisma.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      })
      
      // If not found, try to find by user ID (for backward compatibility with ?ref=userId)
      if (!referrer && code.length > 8) {
        referrer = await prisma.user.findUnique({
          where: { id: code },
          select: { id: true },
        })
      }
      
      if (referrer) {
        referrerId = referrer.id
      }
    }

    // Create user (без TotalBalance / Balances)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        can_withdraw: false,
        isVerif: false,
        blocked: false,
        status: "NEW",
        baseCurrency: normalizedCurrency, // 👈 enum FiatCurrency
        referralCode: null, // Will be generated below
      },
    })

    // Generate unique referral code for new user
    const newReferralCode = `REF${user.id.slice(0, 8).toUpperCase()}`
    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: newReferralCode },
    })

    // Create referral record if user was referred
    if (referrerId) {
      try {
        // Get signup reward from settings
        const signupReward = await prisma.referralReward.findUnique({
          where: { action: "SIGNUP" },
        });

        const initialReward = signupReward?.rewardAmount || 10;
        const rewardCurrency = signupReward?.rewardCurrency || "USD";

        // Create referral record
        await prisma.referral.create({
          data: {
            referrerId: referrerId,
            referredUserId: user.id,
            code: newReferralCode,
            rewardAmount: initialReward,
            rewardCurrency: rewardCurrency,
            status: "PENDING",
          },
        });

        // Add reward to referrer's balance
        if (initialReward > 0) {
          const referrerBaseCurrency = await prisma.user.findUnique({
            where: { id: referrerId },
            select: { baseCurrency: true },
          });

          const currency = referrerBaseCurrency?.baseCurrency || "USD";
          
          // Update referrer's wallet balance
          await prisma.walletBalance.upsert({
            where: {
              userId_assetSymbol: {
                userId: referrerId,
                assetSymbol: currency,
              },
            },
            update: {
              ownBalance: {
                increment: initialReward,
              },
            },
            create: {
              userId: referrerId,
              assetSymbol: currency,
              ownBalance: initialReward,
              creditLimit: 0,
              creditUsed: 0,
              locked: 0,
            },
          });

          // Create order record for referral bonus
          await prisma.orders.create({
            data: {
              userId: referrerId,
              type: "DEPOSIT",
              amount: initialReward,
              status: "SUCCESSFUL",
              metadata: JSON.stringify({
                type: "REFERRAL_BONUS",
                referredUserId: user.id,
                referralCode: newReferralCode,
              }),
            },
          });
        }
      } catch (error) {
        // Log error but don't fail registration
        console.error("Error creating referral record:", error);
      }
    }

    // Create initial wallet balance in chosen fiat asset (EUR or USD)
    // Make sure you have Asset with symbol "EUR" and "USD" in the DB (seed).
    await prisma.walletBalance.upsert({
      where: {
        userId_assetSymbol: {
          userId: user.id,
          assetSymbol: normalizedCurrency,
        },
      },
      update: {},
      create: {
        userId: user.id,
        assetSymbol: normalizedCurrency,
        ownBalance: 0,
        creditLimit: 0,
        creditUsed: 0,
        locked: 0,
      },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

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
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
}
