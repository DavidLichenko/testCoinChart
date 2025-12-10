// app/api/admin/wallets/adjust/route.ts
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";
import {pusherServer} from "@/lib/pusher-server";
import {getUserBalanceData} from "@/lib/user-balance";

function isAdminRole(role: string | null | undefined) {
    return role === "OWNER" || role === "CR_MANAGMENT" || role === "TEAMLEAD";
}

export async function POST(request: Request) {
    try {
        const adminId = await requireAuth();

        const me = await prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true },
        });

        if (!me || !isAdminRole(me.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            userId,
            assetSymbol,
            balanceDelta,
            lockedDelta,
            creditLimit,
            creditUsed,
        } = body;

        if (!userId || !assetSymbol) {
            return NextResponse.json(
                { error: "userId and assetSymbol are required" },
                { status: 400 }
            );
        }

        const asset = await prisma.asset.findUnique({
            where: { symbol: assetSymbol },
            select: { symbol: true },
        });

        if (!asset) {
            return NextResponse.json(
                { error: `Unknown asset symbol: ${assetSymbol}` },
                { status: 400 }
            );
        }

        const existing = await prisma.walletBalance.findUnique({
            where: {
                userId_assetSymbol: {
                    userId,
                    assetSymbol,
                },
            },
        });

        let newOwn = existing?.ownBalance ?? 0;
        let newLocked = existing?.locked ?? 0;
        let newCreditLimit = existing?.creditLimit ?? 0;
        let newCreditUsed = existing?.creditUsed ?? 0;

        if (typeof balanceDelta === "number" && !isNaN(balanceDelta)) {
            newOwn += balanceDelta;
        }

        if (typeof lockedDelta === "number" && !isNaN(lockedDelta)) {
            newLocked += lockedDelta;
        }

        // When setting credit limit, we add to the user's account
        if (typeof creditLimit === "number" && !isNaN(creditLimit)) {
            newCreditLimit = creditLimit;
        }

        if (typeof creditUsed === "number" && !isNaN(creditUsed)) {
            newCreditUsed = creditUsed;
        }

        if (newOwn < 0 || newLocked < 0 || newCreditLimit < 0 || newCreditUsed < 0) {
            return NextResponse.json(
                { error: "Negative values are not allowed" },
                { status: 400 }
            );
        }

        if (newCreditUsed > newCreditLimit) {
            return NextResponse.json(
                { error: "Credit used cannot exceed credit limit" },
                { status: 400 }
            );
        }

        const updated = await prisma.walletBalance.upsert({
            where: {
                userId_assetSymbol: {
                    userId,
                    assetSymbol,
                },
            },
            update: {
                ownBalance: newOwn,
                locked: newLocked,
                creditLimit: newCreditLimit,
                creditUsed: newCreditUsed,
            },
            create: {
                userId,
                assetSymbol,
                ownBalance: newOwn,
                locked: newLocked,
                creditLimit: newCreditLimit,
                creditUsed: newCreditUsed,
            },
        });

        // Get updated user balance data for real-time update
        try {
            const userData = await getUserBalanceData(userId);
            
            // Send balance update via Pusher for real-time updates on user side
            await pusherServer.trigger(`user-${userId}`, 'balance-update', {
                balance: userData.balance,
                liveProfit: userData.liveProfit,
                details: userData.details,
            });
            
            // Also send wallet assets update
            const updatedAssets = await prisma.walletBalance.findMany({
                where: { userId },
                include: { asset: true },
            });
            
            const formattedAssets = updatedAssets.map((b) => {
                return {
                    symbol: b.assetSymbol,
                    name: b.asset.name,
                    balance: b.ownBalance + b.locked,
                    ownBalance: b.ownBalance,
                    creditUsed: b.creditUsed,
                    creditLimit: b.creditLimit,
                    price: 0,
                    change24h: 0,
                    totalValue: 0,
                    totalValueUsd: 0,
                };
            });
            
            await pusherServer.trigger(`user-${userId}`, "wallet-assets-update", formattedAssets);
        } catch (pusherError) {
            console.error("Failed to send balance update via Pusher:", pusherError);
            // Don't fail the entire operation if Pusher fails
        }

        return NextResponse.json({ ok: true, walletBalance: updated });
    } catch (error) {
        console.error("Admin wallets adjust error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}