import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type Orders, type User } from "@prisma/client"

interface RecentDepositsProps {
  data: (Orders & {
    User: User
  })[]
}

export function RecentDeposits({ data }: RecentDepositsProps) {
  return (
    <div className="space-y-8">
      {data.map((deposit) => (
        <div key={deposit.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={deposit.User.imageUrl || '/placeholder.svg'} alt="Avatar" />
            <AvatarFallback>
              {deposit.User.name?.[0] || deposit.User.email[0]}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{deposit.User.name || deposit.User.email}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(deposit.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="ml-auto font-medium">+${deposit.amount.toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

