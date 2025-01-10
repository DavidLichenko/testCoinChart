import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Overview } from '@/components/admin/overview'
import { RecentDeposits } from '@/components/admin/recent-deposits'
import { prisma } from '@/prisma/prisma-client'
import { Users, DollarSign, Activity } from 'lucide-react'

async function getOverviewData() {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get total revenue (deposits) from last month
  const lastMonthRevenue = await prisma.orders.aggregate({
    where: {
      type: 'DEPOSIT',
      status: 'SUCCESSFUL',
      createdAt: {
        gte: lastMonth,
        lt: thisMonth
      }
    },
    _sum: {
      amount: true
    }
  })

  // Get total users
  const totalUsers = await prisma.user.count()

  // Get active users today
  const activeUsers = await prisma.user.count({
    where: {
      updatedAt: {
        gte: new Date(now.setHours(0, 0, 0, 0))
      }
    }
  })

  // Get monthly deposits for chart
  const monthlyDeposits = await prisma.$queryRaw`
    SELECT 
      date_trunc('month', "createdAt") as month,
      SUM(amount) as total
    FROM "Orders"
    WHERE 
      type = 'DEPOSIT' 
      AND status = 'SUCCESSFUL'
      AND "createdAt" >= NOW() - INTERVAL '1 year'
    GROUP BY month
    ORDER BY month ASC
  `

  // Get recent deposits
  const recentDeposits = await prisma.orders.findMany({
    where: {
      type: 'DEPOSIT',
      status: 'SUCCESSFUL',
      createdAt: {
        gte: lastMonth
      }
    },
    include: {
      User: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  return {
    revenue: lastMonthRevenue._sum.amount || 0,
    totalUsers,
    activeUsers,
    monthlyDeposits,
    recentDeposits
  }
}

export default async function AdminPage() {
  const data = await getOverviewData()

  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue (Last Month)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from previous month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={data.monthlyDeposits} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentDeposits data={data.recentDeposits} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

