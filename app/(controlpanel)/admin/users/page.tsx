import { Suspense } from 'react'
import { UsersTable } from '@/components/admin/users/users-table'
import { UsersTableSkeleton } from '@/components/admin/users/users-table-skeleton'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/prisma/prisma-client'

async function getUsers() {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error('Unauthorized')

    // If the user is a worker, only show assigned users
    if (session.user.role === 'WORKER') {
        return await prisma.user.findMany({
            where: {
                assignedTo: session.user.id
            },
            include: {
                balance: true
            },
            orderBy: { createdAt: 'desc' },
        })
    }

    // For admin and other roles, show all users
    return await prisma.user.findMany({
        include: {
            balance: true
        },
        orderBy: { createdAt: 'desc' },
    })
}

export default async function UsersPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/sign-in')
    }

    const users = await getUsers()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">User List</h2>
                    <p className="text-muted-foreground">
                        Manage your users and their roles here.
                    </p>
                </div>
            </div>
            <Suspense fallback={<UsersTableSkeleton />}>
                <UsersTable
                    initialUsers={users}
                    userRole={session.user.role}
                    userId={session.user.id}
                />
            </Suspense>
        </div>
    )
}

