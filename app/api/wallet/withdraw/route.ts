import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";

export async function POST(req: Request) {
    const userId = await requireAuth()
    const { assetSymbol, amount, address } = await req.json();

    if (!assetSymbol || !amount)
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const balance = await prisma.walletBalance.findUnique({
        where: { userId_assetSymbol: { userId, assetSymbol } }
    });

    // Prevent withdrawing credit funds - only allow withdrawing ownBalance
    if (!balance || balance.ownBalance < amount)
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

    const tx = await prisma.walletTransaction.create({
        data: {
            userId,
            assetSymbol,
            amount,
            type: "WITHDRAW",
            status: "PENDING",
            metadata: { address }
        }
    });

    return NextResponse.json(tx);
}
