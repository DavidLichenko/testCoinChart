import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"
import { calculateUserWalletSummary } from "@/lib/wallet-summary"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
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

        const { userId } = await params

        // Get user wallet summary
        const walletSummary = await calculateUserWalletSummary(userId)
        
        // Get user wallet balances
        const walletBalances = await prisma.walletBalance.findMany({
            where: { userId },
            include: { asset: true },
        })

        return NextResponse.json({ walletSummary, walletBalances })
    } catch (error) {
        console.error("Error fetching user wallet data:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}