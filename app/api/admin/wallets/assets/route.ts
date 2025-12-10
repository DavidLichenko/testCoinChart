// app/api/admin/wallets/assets/route.ts
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";

export async function GET() {
    try {
        const adminId = await requireAuth();

        // only admins
        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true },
        });

        if (
            !admin ||
            !["OWNER", "CR_MANAGMENT", "TEAMLEAD"].includes(admin.role)
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const assets = await prisma.asset.findMany({
            where: { isEnabled: true },
            orderBy: { symbol: "asc" },
            select: {
                symbol: true,
                name: true,
                type: true,
                isStakable: true,
            },
        });

        return NextResponse.json({ assets });
    } catch (err) {
        console.error("admin wallets assets error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
