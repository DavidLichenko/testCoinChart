// app/api/admin/users/[userId]/balance/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasAdminAccess } from "@/lib/admin-access"
import { getUserBalanceData } from "@/lib/user-balance"

export async function GET(
    req: NextRequest,
    { params }: { params: { userId: string } },
) {
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

        const { userId } = params

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const data = await getUserBalanceData(userId)

        return NextResponse.json({
            userId,
            balance: data.balance,
            liveProfit: data.liveProfit,
            details: data.details,
        })
    } catch (error) {
        console.error("Error fetching user balance:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        )
    }
}
