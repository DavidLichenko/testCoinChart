import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function GET(
    req: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin using standardized function
        const admin = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { role: true },
        })

        if (!admin || !hasAdminAccess(admin)) {
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

        return NextResponse.json({ user, balances })
    } catch (error) {
        console.error("Error fetching user balance:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}