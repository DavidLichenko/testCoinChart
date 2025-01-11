'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

export function UserDepositsDashboard({ deposits }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const chartData = deposits.slice(0, 10).map(deposit => ({
    date: new Date(deposit.createdAt).toLocaleDateString(),
    amount: deposit.amount
  }))

  const totalDeposits = deposits.reduce((sum, deposit) => sum + deposit.amount, 0)

  const data = {
    labels: chartData.map(d => d.date),
    datasets: [
      {
        label: 'Deposit Amount',
        data: chartData.map(d => d.amount),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Deposits'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  }

  if (!isClient) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>Deposit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">
              Total Deposits: ${totalDeposits.toFixed(2)}
            </div>
            <div className="h-[300px] flex items-center justify-center">
              Loading chart...
            </div>
          </CardContent>
        </Card>
    )
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-4">
            Total Deposits: ${totalDeposits.toFixed(2)}
          </div>
          <div className="h-[300px]">
            <Bar data={data} options={options} />
          </div>
        </CardContent>
      </Card>
  )
}

