// app/api/user/update-balance/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"
import { broadcastUserBalance } from "@/lib/balance-broadcast"

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser()

        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const admin = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { role: true },
        })

        if (!admin || !hasAdminAccess(admin)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { userId, newBalance } = await request.json()

        if (!userId || typeof newBalance !== "number") {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 })
        }

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { baseCurrency: true },
            })

            if (!user) {
                throw new Error("User not found")
            }

            const baseCurrency = user.baseCurrency || "EUR"

            await tx.walletBalance.upsert({
                where: {
                    userId_assetSymbol: {
                        userId,
                        assetSymbol: baseCurrency,
                    },
                },
                update: {
                    ownBalance: newBalance,
                },
                create: {
                    userId,
                    assetSymbol: baseCurrency,
                    ownBalance: newBalance,
                    creditLimit: 0,
                    creditUsed: 0,
                    locked: 0,
                },
            })
        })

        // пушим уже пересчитанный equity и детали
        const data = await broadcastUserBalance(userId)

        return NextResponse.json({
            success: true,
            balance: data.balance,
            liveProfit: data.liveProfit,
            details: data.details,
        })
    } catch (error) {
        console.error("Error in /api/user/update-balance:", error)
        if (error instanceof Error && error.message === "User not found") {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        )
    }
}
