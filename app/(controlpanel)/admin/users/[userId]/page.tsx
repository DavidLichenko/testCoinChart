import { notFound } from 'next/navigation'
import { prisma } from '@/prisma/prisma-client'
import { UserPersonalInfo } from '@/components/admin/users/user-personal-info'
import { UserVerificationInfo } from '@/components/admin/users/user-verification-info'
import { UserDepositsDashboard } from '@/components/admin/users/user-deposits-dashboard'
import { UserTradeTransactions } from '@/components/admin/users/user-trade-transactions'
import { UserComments } from '@/components/admin/users/user-comments'

async function getUserData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            balance: true,
            verification: true,
            orders: {
                where: { type: 'DEPOSIT' },
                orderBy: { createdAt: 'desc' },
            },
            trade_transaction: {
                orderBy: { createdAt: 'desc' },
            },
            comments: true,
        },
    })

    if (!user) {
        notFound()
    }

    return user
}

export default async function UserPage({ params }: { params: { userId: string } }) {
    const user = await getUserData(params.userId)

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">User Details</h1>

            <UserPersonalInfo user={user} />

            <UserVerificationInfo verification={user.verification[0]} />

            <UserDepositsDashboard deposits={user.orders} />

            <UserTradeTransactions transactions={user.trade_transaction} userId={user.id} />

            <UserComments comments={user.comments[0]?.messages || []} userId={user.id} />
        </div>
    )
}

