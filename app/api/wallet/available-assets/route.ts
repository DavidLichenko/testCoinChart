import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";

export async function GET() {
    const userId = await requireAuth()

    const balances = await prisma.walletBalance.findMany({
        where: { userId },
        select: { assetSymbol: true }
    });

    const already = balances.map((b) => b.assetSymbol);

    const assets = await prisma.asset.findMany({
        where: {
            isEnabled: true,
            NOT: { symbol: { in: already } }
        },
        orderBy: { symbol: "asc" }
    });

    return NextResponse.json(assets);
}
