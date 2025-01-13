import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId } = params
        const body = await request.json()

        const newTransaction = await prisma.trade_Transaction.create({
            data: {
                userId,
                type: body.type,
                volume: body.volume,
                margin: body.volume / body.leverage, // Calculate margin based on volume and leverage
                leverage: body.leverage,
                ticker: body.ticker,
                openInA: body.openInA,
                assetType: body.assetType,
                status: 'OPEN',
            },
        })

        return NextResponse.json(newTransaction)
    } catch (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        )
    }
}

