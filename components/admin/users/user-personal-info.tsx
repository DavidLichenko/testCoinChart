import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function UserPersonalInfo({ user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-semibold">Name</p>
          <p>{user.name || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Email</p>
          <p>{user.email}</p>
        </div>
        <div>
          <p className="font-semibold">Phone</p>
          <p>{user.number || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Balance</p>
          <p>${user.balance[0]?.usd.toFixed(2) || '0.00'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

