import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'

export async function PUT(
    request: Request,
    { params }: { params: { userId: string; transactionId: string } }
) {
    try {
        const { userId, transactionId } = params
        const body = await request.json()

        const updatedTransaction = await prisma.trade_Transaction.update({
            where: { id: transactionId },
            data: {
                volume: body.volume,
                profit: body.profit,
            },
        })

        return NextResponse.json(updatedTransaction)
    } catch (error) {
        console.error('Error updating transaction:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

