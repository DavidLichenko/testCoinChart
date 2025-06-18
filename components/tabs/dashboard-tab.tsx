import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardTab({totalAmount, totalProfit, totalDeposit}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Amount</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-xl sm:text-2xl font-bold">${totalAmount.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Profit</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-xl sm:text-2xl font-bold">${totalProfit.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Deposits</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-xl sm:text-2xl font-bold">${totalDeposit.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

