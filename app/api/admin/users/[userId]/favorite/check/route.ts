import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const { searchParams } = new URL(request.url)
        const agentId = searchParams.get('agentId')

        if (!agentId) {
            return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
        }

        // Check if user is favorited by agent
        const favorite = await prisma.favoriteClient.findUnique({
            where: {
                agentId_clientId: {
                    agentId: agentId,
                    clientId: params.userId
                }
            }
        })

        return NextResponse.json({ isFavorite: !!favorite })

    } catch (error) {
        console.error("Error checking user favorite status:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}