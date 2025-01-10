import { DataTable } from '@/components/admin/data-table'
import { columns } from './columns'
import { prisma } from '@/prisma/prisma-client'

async function getTransactions() {
  return await prisma.trade_Transaction.findMany({
    include: { User: true },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function TransactionsPage() {
  const transactions = await getTransactions()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <DataTable columns={columns} data={transactions} />
    </div>
  )
}

