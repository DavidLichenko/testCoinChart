import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'

export async function DELETE(
    request: Request,
    { params }: { params: { userId: string; commentId: string } }
) {
    try {
        const { userId, commentId } = params

        const comments = await prisma.comments.findUnique({
            where: { userId }
        })

        if (!comments || !comments.messages) {
            return NextResponse.json({ error: 'Comments not found' }, { status: 404 })
        }

        // Filter out the comment to be deleted
        const currentMessages = comments.messages as any[]
        const updatedMessages = currentMessages.filter(msg => msg.id !== commentId)

        // Update the comments with the filtered messages
        await prisma.comments.update({
            where: { userId },
            data: {
                messages: updatedMessages
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting comment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

