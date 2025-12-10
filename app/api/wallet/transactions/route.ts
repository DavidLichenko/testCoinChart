import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";

export async function GET() {
    const userId = await requireAuth()

    const txs = await prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100
    });

    return NextResponse.json(txs);
}
