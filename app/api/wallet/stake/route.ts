// app/api/wallet/stake/route.ts
import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";
import {getUserBalanceData} from "@/lib/user-balance";
import {pusherServer} from "@/lib/pusher-server";

export async function POST(req: Request) {
    const userId = await requireAuth();
    const { planId, amount } = await req.json();

    if (!planId || !amount) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (amount <= 0) {
        return NextResponse.json(
            { error: "Amount must be > 0" },
            { status: 400 }
        );
    }

    const plan = await prisma.stakingPlan.findUnique({
        where: { id: planId },
        include: { asset: true },
    });

    if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (!plan.isActive) {
        return NextResponse.json(
            { error: "Plan is not active" },
            { status: 400 }
        );
    }

    if (!plan.asset.isStakable) {
        return NextResponse.json(
            { error: "Asset not stakable" },
            { status: 400 }
        );
    }

    if (amount < plan.minAmount) {
        return NextResponse.json(
            { error: `Minimum amount is ${plan.minAmount}` },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { baseCurrency: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const baseCurrency = (user.baseCurrency || "EUR") as "EUR" | "USD";

    // Если стейкинг актив в базовой валюте — смотрим availableToTrade
    if (plan.assetSymbol === baseCurrency) {
        const balanceData = await getUserBalanceData(userId);
        const available = balanceData.details.availableToTrade;

        if (amount > available + 1e-8) {
            return NextResponse.json(
                { error: "Not enough free balance" },
                { status: 400 }
            );
        }
    } else {
        // иначе обычная проверка ownBalance
        const balance = await prisma.walletBalance.findUnique({
            where: {
                userId_assetSymbol: {
                    userId,
                    assetSymbol: plan.assetSymbol,
                },
            },
        });

        if (!balance || balance.ownBalance < amount - 1e-8) {
            return NextResponse.json(
                { error: "Insufficient balance" },
                { status: 400 }
            );
        }
    }

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + plan.duration);

    const result = await prisma.$transaction(async (tx) => {
        await tx.walletBalance.update({
            where: {
                userId_assetSymbol: {
                    userId,
                    assetSymbol: plan.assetSymbol,
                },
            },
            data: {
                ownBalance: { decrement: amount },
                locked: { increment: amount },
            },
        });

        const position = await tx.stakingPosition.create({
            data: {
                userId,
                assetSymbol: plan.assetSymbol,
                amount,
                planId: plan.id,
                rewardRate: plan.apr,
                endsAt,
            },
        });

        await tx.walletTransaction.create({
            data: {
                userId,
                assetSymbol: plan.assetSymbol,
                type: "STAKE_LOCK",
                status: "COMPLETED",
                amount,
                metadata: {
                    planId: plan.id,
                    duration: plan.duration,
                    apr: plan.apr,
                },
            },
        });
        
        // Trigger wallet assets update
        // Fetch updated assets
        const updatedAssets = await tx.walletBalance.findMany({
            where: { userId },
            include: { asset: true },
        });
        
        // Transform assets to match the format expected by the frontend
        const formattedAssets = updatedAssets.map((b) => {
            return {
                symbol: b.assetSymbol,
                name: b.asset.name,
                balance: b.ownBalance + b.locked,
                ownBalance: b.ownBalance,
                creditUsed: b.creditUsed,
                creditLimit: b.creditLimit,
                price: 0,
                change24h: 0,
                totalValue: 0,
                totalValueUsd: 0,
            };
        });
        
        // Trigger update via Pusher
        await pusherServer.trigger(`user-${userId}`, "wallet-assets-update", formattedAssets);

        return position;
    });

    return NextResponse.json(result);
}
