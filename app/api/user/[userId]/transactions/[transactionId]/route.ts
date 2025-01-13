import { NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function PUT(
    request: Request,
    { params }: { params: { userId: string; transactionId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId, transactionId } = params
        const body = await request.json()

        // Verify the transaction belongs to the user
        const existingTransaction = await prisma.trade_Transaction.findFirst({
            where: {
                id: transactionId,
                userId: userId
            }
        })

        if (!existingTransaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        const updatedTransaction = await prisma.trade_Transaction.update({
            where: { id: transactionId },
            data: {
                volume: body.volume,
                leverage: body.leverage,
                profit: body.profit,
                status: body.status,
                closeIn: body.status === 'CLOSE' ? body.closeIn || existingTransaction.closeIn : null,
                endAt: body.status === 'CLOSE' ? new Date() : null
            },
        })

        return NextResponse.json(updatedTransaction)
    } catch (error) {
        console.error('Error updating transaction:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        )
    }
}

