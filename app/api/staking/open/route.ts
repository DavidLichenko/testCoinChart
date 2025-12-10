import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";

type OpenBody = {
    assetSymbol?: string;
    planId?: string;
    amount?: number;
};

export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const body = (await req.json()) as OpenBody;

        const { assetSymbol, planId, amount } = body;

        if (!assetSymbol || !planId || !amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: "BAD_REQUEST" },
                { status: 400 },
            );
        }

        const plan = await prisma.stakingPlan.findUnique({
            where: { id: planId },
            include: { asset: true },
        });

        if (!plan || !plan.isActive || plan.assetSymbol !== assetSymbol) {
            return NextResponse.json(
                { success: false, error: "INVALID_PLAN" },
                { status: 400 },
            );
        }

        if (!plan.asset.isEnabled || !plan.asset.isStakable) {
            return NextResponse.json(
                { success: false, error: "ASSET_NOT_STAKABLE" },
                { status: 400 },
            );
        }

        if (plan.minAmount && amount < plan.minAmount) {
            return NextResponse.json(
                { success: false, error: "AMOUNT_BELOW_MIN" },
                { status: 400 },
            );
        }

        const balance = await prisma.walletBalance.findUnique({
            where: {
                userId_assetSymbol: {
                    userId,
                    assetSymbol,
                },
            },
        });

        if (!balance || balance.ownBalance < amount) {
            return NextResponse.json(
                { success: false, error: "INSUFFICIENT_BALANCE" },
                { status: 400 },
            );
        }

        const now = new Date();
        const durationDays = plan.duration ?? 0;
        const endsAt =
            durationDays > 0
                ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
                : null;

        const result = await prisma.$transaction(async (tx) => {
            const updatedBalance = await tx.walletBalance.update({
                where: { userId_assetSymbol: { userId, assetSymbol } },
                data: {
                    ownBalance: { decrement: amount },
                    locked: { increment: amount },
                },
            });

            const position = await tx.stakingPosition.create({
                data: {
                    userId,
                    assetSymbol,
                    planId,
                    amount,
                    rewardRate: plan.apr,
                    startedAt: now,
                    endsAt,
                    status: "ACTIVE",
                },
                include: {
                    asset: true,
                    plan: true,
                },
            });

            await tx.walletTransaction.create({
                data: {
                    userId,
                    assetSymbol,
                    type: "STAKE_LOCK",
                    status: "COMPLETED",
                    amount,
                    metadata: {
                        planId,
                        positionId: position.id,
                    },
                },
            });

            return { position, balance: updatedBalance };
        });

        return NextResponse.json({ success: true, ...result });
    } catch (err) {
        console.error("POST /api/staking/open error:", err);
        return NextResponse.json(
            { success: false, error: "STAKING_OPEN_ERROR" },
            { status: 500 },
        );
    }
}
