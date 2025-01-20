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

        let users;

        if (session.user.role === 'WORKER') {
            // Fetch only assigned users for workers
            users = await prisma.user.findMany({
                where: {
                    assignedTo: session.user.id,
                    role: 'USER',
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
                            imageUrl:true,
                            createdAt: true
                        }
                    }
                }
            })
        } else {
            // Fetch all users for admins and other roles
            users = await prisma.user.findMany({
                where: {
                    role: 'USER',
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
                            imageUrl:true,
                            createdAt: true
                        }
                    }
                }
            })
        }

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

