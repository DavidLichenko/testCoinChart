import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function POST(
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

        const { favorite } = await request.json()
        const { userId } = await params

        if (favorite) {
            // Add to favorites (create FavoriteClient record)
            // Check if already favorited
            const existingFavorite = await prisma.favoriteClient.findUnique({
                where: {
                    agentId_clientId: {
                        agentId: currentUser.id,
                        clientId: userId
                    }
                }
            })

            if (!existingFavorite) {
                await prisma.favoriteClient.create({
                    data: {
                        agentId: currentUser.id,
                        clientId: userId
                    }
                })
            }
        } else {
            // Remove from favorites (delete FavoriteClient record)
            await prisma.favoriteClient.deleteMany({
                where: {
                    agentId: currentUser.id,
                    clientId: userId
                }
            })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error updating user favorite status:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}