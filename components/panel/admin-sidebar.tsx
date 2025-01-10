'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {BarChart3, MessageSquare, Package, Settings, Users, ShoppingCart, Package2} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AdminSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const sidebarItems = [
  {
    title: 'Dashboard',
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

export function AdminSidebar({ open, setOpen }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-muted/40",
        open ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link 
          href="/admin" 
          className={cn(
            "flex items-center gap-2 font-semibold",
            !open && "justify-center"
          )}
        >
          <Package2 className="h-6 w-6" />
          {open && <span>Admin</span>}
        </Link>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "justify-start",
                !open && "justify-center px-2"
              )}
              asChild
            >
              <Link href={item.href}>
                <Icon className="h-5 w-5" />
                {open && <span className="ml-2">{item.title}</span>}
              </Link>
            </Button>
          )
        })}
      </div>
    </aside>
  )
}

