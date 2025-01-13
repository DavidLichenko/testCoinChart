import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'

export async function POST(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId } = params
        const { content } = await request.json()
        console.log(userId)
        console.log(content)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { comments: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        let updatedComments
        if (user.comments[0]) {
            updatedComments = await prisma.comments.update({
                where: { userId },
                data: {
                    messages: {
                        push: { content, createdAt: new Date() },
                    },
                },
            })
        } else {
            updatedComments = await prisma.comments.create({
                data: {
                    userId,
                    messages: [{ content, createdAt: new Date() }],
                },
            })
        }

        return NextResponse.json(updatedComments.messages[updatedComments.messages.length - 1])
    } catch (error) {
        console.error('Error adding comment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

