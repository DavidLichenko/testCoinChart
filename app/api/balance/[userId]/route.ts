import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const userId = params.userId

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { balance: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const balance = user.balance[0]?.usd ?? user.TotalBalance ?? 0

        return NextResponse.json({ balance })
    } catch (error) {
        console.error('Error fetching balance:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

