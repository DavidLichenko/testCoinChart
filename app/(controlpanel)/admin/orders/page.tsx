import { Suspense } from 'react'
import { OrdersTable } from '@/components/admin/orders/orders-table'
import { OrdersTableSkeleton } from '@/components/admin/orders/orders-table-skeleton'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/prisma/prisma-client'

async function getOrders() {
    try {
        const orders = await prisma.orders.findMany({
            include: {
                User: true
            },
            orderBy: { createdAt: 'desc' },
        })
        return orders
    } catch (error) {
        console.error('Error fetching orders:', error)
        return []
    }
}

export default async function OrdersPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/sign-in')
    }

    const orders = await getOrders()

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Orders</h1>
            <Suspense fallback={<OrdersTableSkeleton />}>
                <OrdersTable initialOrders={orders} />
            </Suspense>
        </div>
    )
}

