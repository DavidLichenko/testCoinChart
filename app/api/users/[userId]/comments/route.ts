import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId } = params
        const comments = await prisma.comments.findUnique({
            where: { userId }
        })

        // Return empty array if no comments exist
        if (!comments || !comments.messages) {
            return NextResponse.json([])
        }

        // Parse the JSON messages and ensure it's an array
        const messagesArray = comments.messages as any[] || []

        // Sort messages by createdAt
        const sortedMessages = messagesArray.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        return NextResponse.json(sortedMessages)
    } catch (error) {
        console.error('Error fetching comments:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId } = params
        const { content } = await request.json()

        const newComment = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content,
            createdAt: new Date().toISOString()
        }

        const existingComments = await prisma.comments.findUnique({
            where: { userId }
        })

        if (existingComments) {
            // Get existing messages and append new comment
            const currentMessages = existingComments.messages as any[] || []
            const updatedComments = await prisma.comments.update({
                where: { userId },
                data: {
                    messages: [...currentMessages, newComment]
                }
            })
            return NextResponse.json(newComment)
        } else {
            // Create new comments record
            await prisma.comments.create({
                data: {
                    userId,
                    messages: [newComment]
                }
            })
            return NextResponse.json(newComment)
        }
    } catch (error) {
        console.error('Error adding comment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

