import { DataTable } from '@/components/admin/data-table'
import { columns } from './columns'
import { prisma } from '@/prisma/prisma-client'

async function getOrders() {
  return await prisma.orders.findMany({
    include: { User: true },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <DataTable columns={columns} data={orders} />
    </div>
  )
}

