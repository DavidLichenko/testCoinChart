import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";
import {pusherServer} from "@/lib/pusher-server";

type CloseBody = {
    positionId?: string;
};

export async function POST(req: Request) {
    try {
        const userId = await requireAuth();
        const body = (await req.json()) as CloseBody;
        const { positionId } = body;

        if (!positionId) {
            return NextResponse.json(
                { success: false, error: "BAD_REQUEST" },
                { status: 400 },
            );
        }

        const position = await prisma.stakingPosition.findUnique({
            where: { id: positionId },
            include: {
                plan: true,
            },
        });

        if (!position || position.userId !== userId) {
            return NextResponse.json(
                { success: false, error: "NOT_FOUND" },
                { status: 404 },
            );
        }

        if (position.status !== "ACTIVE") {
            return NextResponse.json(
                { success: false, error: "ALREADY_CLOSED" },
                { status: 400 },
            );
        }

        const now = new Date();
        const msDiff = now.getTime() - position.startedAt.getTime();
        const daysHeld = msDiff > 0 ? msDiff / (1000 * 60 * 60 * 24) : 0;

        const apr = position.rewardRate ?? position.plan?.apr ?? 0;
        const baseAmount = position.amount;
        const reward =
            apr > 0 && daysHeld > 0
                ? (baseAmount * (apr / 100) * daysHeld) / 365
                : 0;

        const assetSymbol = position.assetSymbol;

        const result = await prisma.$transaction(async (tx) => {
            const updatedBalance = await tx.walletBalance.update({
                where: { userId_assetSymbol: { userId, assetSymbol } },
                data: {
                    ownBalance: { increment: baseAmount + reward },
                    locked: { decrement: baseAmount },
                },
            });

            const updatedPosition = await tx.stakingPosition.update({
                where: { id: position.id },
                data: {
                    status: "COMPLETED",
                    lastRewardAt: now,
                    endsAt: now,
                },
                include: {
                    asset: true,
                    plan: true,
                },
            });

            // Транзакции кошелька
            await tx.walletTransaction.create({
                data: {
                    userId,
                    assetSymbol,
                    type: "STAKE_UNLOCK",
                    status: "COMPLETED",
                    amount: baseAmount,
                    metadata: {
                        positionId: position.id,
                    },
                },
            });

            if (reward > 0) {
                await tx.walletTransaction.create({
                    data: {
                        userId,
                        assetSymbol,
                        type: "STAKE_REWARD",
                        status: "COMPLETED",
                        amount: reward,
                        metadata: {
                            positionId: position.id,
                        },
                    },
                });
            }
            
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

            return { position: updatedPosition, balance: updatedBalance, reward };
        });

        return NextResponse.json({ success: true, ...result });
    } catch (err) {
        console.error("POST /api/staking/close error:", err);
        return NextResponse.json(
            { success: false, error: "STAKING_CLOSE_ERROR" },
            { status: 500 },
        );
    }
}