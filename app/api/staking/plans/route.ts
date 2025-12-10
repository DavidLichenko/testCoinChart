import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const assetSymbol = searchParams.get("assetSymbol") || undefined;

        const plans = await prisma.stakingPlan.findMany({
            where: {
                isActive: true,
                ...(assetSymbol ? { assetSymbol } : {}),
                asset: {
                    isEnabled: true,
                    isStakable: true,
                },
            },
            include: {
                asset: {
                    select: { symbol: true, name: true, decimals: true },
                },
            },
            orderBy: { apr: "desc" },
        });

        return NextResponse.json({ success: true, plans });
    } catch (err) {
        console.error("GET /api/staking/plans error:", err);
        return NextResponse.json(
            { success: false, error: "STAKING_PLANS_ERROR" },
            { status: 500 },
        );
    }
}
