import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { role: true }
        })

        if (!user || !hasAdminAccess(user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { userId } = await params

        // Get favorite tickers for the user
        const favorites = await prisma.favoriteTicker.findMany({
            where: { userId },
            select: {
                symbol: true,
            },
        })

        return NextResponse.json(favorites)
    } catch (error) {
        console.error("Error fetching favorite tickers:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

