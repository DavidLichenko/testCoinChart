import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";

export async function GET() {
    const plans = await prisma.stakingPlan.findMany({
        where: { isActive: true },
        orderBy: { duration: "asc" },
        include: { asset: true }
    });

    return NextResponse.json(plans);
}
