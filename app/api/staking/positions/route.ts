import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";

export async function GET(req: Request) {
    try {
        const userId = await requireAuth();

        const positions = await prisma.stakingPosition.findMany({
            where: { userId },
            include: {
                asset: {
                    select: { symbol: true, name: true, decimals: true },
                },
                plan: true,
            },
            orderBy: { startedAt: "desc" },
        });

        return NextResponse.json({ success: true, positions });
    } catch (err) {
        console.error("GET /api/staking/positions error:", err);
        return NextResponse.json(
            { success: false, error: "STAKING_POSITIONS_ERROR" },
            { status: 500 },
        );
    }
}
