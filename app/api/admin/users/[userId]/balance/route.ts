import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
    req: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Проверяем, что это админ
        const admin = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { role: true },
        })

        if (
            !admin ||
            (admin.role !== "OWNER" &&
                admin.role !== "CR_MANAGMENT" &&
                admin.role !== "TEAMLEAD")
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { userId } = params

        const [user, balances] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, TotalBalance: true },
            }),
            prisma.balances.findUnique({
                where: { userId },
                select: { usd: true },
            }),
        ])

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // приоритет — balances.usd, потом fallback на user.TotalBalance
        const totalBalance = balances?.usd ?? user.TotalBalance ?? 0

        return NextResponse.json({
            userId,
            totalBalance,
        })
    } catch (error) {
        console.error("Error in GET /api/admin/users/[userId]/balance:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
