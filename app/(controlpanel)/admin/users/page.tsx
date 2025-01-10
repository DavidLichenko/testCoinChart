import { DataTable } from '@/components/admin/data-table'
import { columns } from './columns'
import { prisma } from '@/prisma/prisma-client'

async function getUsers() {
  return await prisma.user.findMany()
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <DataTable columns={columns} data={users} />
    </div>
  )
}

