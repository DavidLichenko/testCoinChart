import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";
import {pusherServer} from "@/lib/pusher-server";

export async function POST(req: Request) {
    const { toEmail, assetSymbol, amount, transferType } = await req.json();
    const fromUserId = await requireAuth()
    if (!assetSymbol || !amount)
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    if (transferType === "user") {
        if (!toEmail)
            return NextResponse.json({ error: "Email required for user transfer" }, { status: 400 });

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

    const fromUser = await prisma.user.findUnique({
        where: { id: fromUserId },
        select: { baseCurrency: true },
    });

    const baseCurrency = fromUser?.baseCurrency || "USD";

    if (transferType === "balance") {
        // Transfer to main balance (base currency)
        if (assetSymbol === baseCurrency) {
            return NextResponse.json(
                { error: "Asset is already in base currency" },
                { status: 400 }
            );
        }

        // Convert to base currency (simplified - in production use real exchange rates)
        await prisma.$transaction(async (tx) => {
            // Debit from source asset
            await tx.walletBalance.update({
                where: {
                    userId_assetSymbol: { userId: fromUserId, assetSymbol },
                },
                data: {
                    ownBalance: { decrement: amount },
                },
            });

            // Credit to base currency
            await tx.walletBalance.upsert({
                where: {
                    userId_assetSymbol: { userId: fromUserId, assetSymbol: baseCurrency },
                },
                update: {
                    ownBalance: { increment: amount }, // Simplified - should convert using exchange rate
                },
                create: {
                    userId: fromUserId,
                    assetSymbol: baseCurrency,
                    ownBalance: amount,
                    creditLimit: 0,
                    creditUsed: 0,
                    locked: 0,
                },
            });

            // Create transaction record
            await tx.walletTransaction.create({
                data: {
                    userId: fromUserId,
                    assetSymbol,
                    amount: -amount,
                    type: "EXCHANGE",
                    status: "COMPLETED",
                    metadata: { 
                        toAsset: baseCurrency,
                    },
                },
            });
        });

        return NextResponse.json({ success: true, message: "Transfer to main balance completed" });
    } else {
        // Transfer to another user
        const toUser = await prisma.user.findUnique({ where: { email: toEmail } });

        if (!toUser)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (toUser.id === fromUserId)
            return NextResponse.json({ error: "Cannot transfer to yourself" }, { status: 400 });

        await prisma.$transaction(async (tx) => {
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
                    ownBalance: amount,
                    creditLimit: 0,
                    creditUsed: 0,
                    locked: 0,
                }
            });

            await tx.walletTransaction.create({
                data: {
                    userId: fromUserId,
                    assetSymbol,
                    type: "INTERNAL_TRANSFER",
                    amount: -amount,
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
        });

        return NextResponse.json({ success: true });
    }
}