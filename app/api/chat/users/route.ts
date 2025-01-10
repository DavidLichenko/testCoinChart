import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from '@/prisma/prisma-client'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if the user has the ADMIN role
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch all users with their last message
        const users = await prisma.user.findMany({
            where: {
                role: {
                    not: 'ADMIN'  // Exclude admin users
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                    select: {
                        content: true,
                        createdAt: true
                    }
                }
            }
        })

        // Format the response
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            lastMessage: user.messages[0] || null
        }))

        return NextResponse.json(formattedUsers)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

