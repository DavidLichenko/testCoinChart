import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";
import {pusherServer} from "@/lib/pusher-server";

export async function POST(req: Request) {
    const { toEmail, assetSymbol, amount } = await req.json();
    const fromUserId = await requireAuth()
    if (!toEmail || !assetSymbol || !amount)
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const toUser = await prisma.user.findUnique({ where: { email: toEmail } });

    if (!toUser)
        return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (toUser.id === fromUserId)
        return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });

    const fromBalance = await prisma.walletBalance.findUnique({
        where: { userId_assetSymbol: { userId: fromUserId, assetSymbol } }
    });

    // Prevent transferring credit funds - only allow transferring ownBalance
    if (!fromBalance || fromBalance.ownBalance < amount)
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
        await tx.walletBalance.update({
            where: { userId_assetSymbol: { userId: fromUserId, assetSymbol } },
            data: { ownBalance: { decrement: amount } }
        });

        await tx.walletBalance.upsert({
            where: { userId_assetSymbol: { userId: toUser.id, assetSymbol } },
            update: { ownBalance: { increment: amount } },
            create: {
                userId: toUser.id,
                assetSymbol,
                ownBalance: amount
            }
        });

        await tx.walletTransaction.create({
            data: {
                userId: fromUserId,
                assetSymbol,
                type: "INTERNAL_TRANSFER",
                amount,
                status: "COMPLETED",
                toUserId: toUser.id
            }
        });

        await tx.walletTransaction.create({
            data: {
                userId: toUser.id,
                assetSymbol,
                type: "INTERNAL_TRANSFER",
                amount,
                status: "COMPLETED",
                fromUserId
            }
        });
        
        // Trigger wallet assets update for both users
        // Fetch updated assets for sender
        const updatedSenderAssets = await tx.walletBalance.findMany({
            where: { userId: fromUserId },
            include: { asset: true },
        });
        
        // Transform sender assets
        const formattedSenderAssets = updatedSenderAssets.map((b) => {
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
        
        // Trigger update for sender via Pusher
        await pusherServer.trigger(`user-${fromUserId}`, "wallet-assets-update", formattedSenderAssets);
        
        // Fetch updated assets for receiver
        const updatedReceiverAssets = await tx.walletBalance.findMany({
            where: { userId: toUser.id },
            include: { asset: true },
        });
        
        // Transform receiver assets
        const formattedReceiverAssets = updatedReceiverAssets.map((b) => {
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
        
        // Trigger update for receiver via Pusher
        await pusherServer.trigger(`user-${toUser.id}`, "wallet-assets-update", formattedReceiverAssets);
    });

    return NextResponse.json({ success: true });
}