'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BarChart3, MessageSquare, Package, Settings, Users, ShoppingCart } from 'lucide-react'

const adminNavItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: BarChart3,
  },
  {
    title: 'Chats',
    href: '/admin/chats',
    icon: MessageSquare,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="border-r bg-muted/40">
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6" />
            <span>Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto">
          <nav className="grid gap-4 items-start px-4 text-sm font-medium">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="justify-start"
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

