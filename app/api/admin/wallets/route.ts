// app/api/admin/wallets/route.ts
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {AssetType2, Prisma} from "@prisma/client";
import {requireAuth} from "@/lib/auth-utils";

const PAGE_SIZE_DEFAULT = 20;

function isAdminRole(role: string | null | undefined) {
    return role === "OWNER" || role === "CR_MANAGMENT" || role === "TEAMLEAD";
}

// Ensure at least base FIAT assets exist (USD, EUR)
async function ensureBaseFiatAssets() {
    await prisma.asset.upsert({
        where: { symbol: "USD" },
        update: {},
        create: {
            symbol: "USD",
            name: "US Dollar",
            type: AssetType2.FIAT,
            decimals: 2,
            isEnabled: true,
        },
    });

    await prisma.asset.upsert({
        where: { symbol: "EUR" },
        update: {},
        create: {
            symbol: "EUR",
            name: "Euro",
            type: AssetType2.FIAT,
            decimals: 2,
            isEnabled: true,
        },
    });
}

export async function GET(request: Request) {
    try {
        const userId = await requireAuth();

        const me = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!me || !isAdminRole(me.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Make sure base FIAT assets exist
        await ensureBaseFiatAssets();

        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim() || "";
        const page = Number(searchParams.get("page") || "1");
        const pageSize = Number(
            searchParams.get("pageSize") || PAGE_SIZE_DEFAULT
        );

        const whereUser: Prisma.UserWhereInput = q
            ? {
                OR: [
                    {
                        email: {
                            contains: q,
                            mode: "insensitive",
                        },
                    },
                    {
                        name: {
                            contains: q,
                            mode: "insensitive",
                        },
                    },
                    {
                        id: {
                            contains: q,
                        },
                    },
                ],
            }
            : {};

        const [usersRaw, total, assets] = await Promise.all([
            prisma.user.findMany({
                where: whereUser,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    baseCurrency: true,
                    walletBalances: {
                        select: {
                            id: true,
                            assetSymbol: true,
                            ownBalance: true,
                            creditLimit: true,
                            creditUsed: true,
                            locked: true,
                        },
                    },
                },
            }),

            prisma.user.count({
                where: whereUser,
            }),

            prisma.asset.findMany({
                where: { isEnabled: true },
                orderBy: { symbol: "asc" },
                select: {
                    symbol: true,
                    name: true,
                    type: true,
                },
            }),
        ]);

        return NextResponse.json({
            users: usersRaw,
            total,
            page,
            pageSize,
            assets,
        });
    } catch (error) {
        console.error("Admin wallets GET error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
