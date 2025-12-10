import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";

export async function POST(req: Request) {
    const userId = await requireAuth()
    const { assetSymbol, amount, txHash } = await req.json();

    if (!assetSymbol || !amount)
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const asset = await prisma.asset.findUnique({
        where: { symbol: assetSymbol }
    });

    if (!asset)
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const tx = await prisma.walletTransaction.create({
        data: {
            userId,
            assetSymbol,
            type: "DEPOSIT",
            status: "PENDING",
            amount,
            txHash
        }
    });

    return NextResponse.json(tx);
}
