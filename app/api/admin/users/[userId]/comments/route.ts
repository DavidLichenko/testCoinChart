import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
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

        // Get user comments
        const userComments = await prisma.comments.findUnique({
            where: { userId: params.userId }
        })

        return NextResponse.json({
            comments: userComments?.messages || ""
        })

    } catch (error) {
        console.error("Error fetching user comments:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { userId: string } }
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

        const { comments } = await request.json()

        // Update or create user comments
        const updatedComments = await prisma.comments.upsert({
            where: { userId: params.userId },
            update: { messages: comments },
            create: { 
                userId: params.userId,
                messages: comments
            }
        })

        return NextResponse.json(updatedComments)

    } catch (error) {
        console.error("Error updating user comments:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}