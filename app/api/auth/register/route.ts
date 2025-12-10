// app/api/auth/register/route.ts

import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {generateToken, hashPassword} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, baseCurrency } = await request.json();

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
      },
    });

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
