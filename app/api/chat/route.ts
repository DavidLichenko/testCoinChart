import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json()
        const session = await getServerSession(authOptions)
        console.log('Received messages:', messages)

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
        }

        const lastMessage = messages[messages.length - 1]

        if (!lastMessage.content) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
        }

        // Here you would typically process the message, perhaps using an AI service
        // For this example, we'll just echo the message back and save it to the database

        const savedMessage = await prisma.message.create({
            data: {
                content: lastMessage.content,
                userId: session.user.id, // Replace with actual user ID when you have authentication
                imageUrl: lastMessage.imageUrl || null, // Add imageUrl if it exists, otherwise null
            },
        })

        const response = {
            id: savedMessage.id,
            content: savedMessage.content,
            imageUrl: savedMessage.imageUrl,
            role: 'assistant'
        }

        console.log('Sending response:', response)
        return NextResponse.json(response)
    } catch (error) {
        console.error('Error in chat API:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET() {
    const session = await getServerSession(authOptions)
    try {
        const messages = await prisma.message.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: { createdAt: 'asc' },
        })
        return NextResponse.json(messages)
    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}