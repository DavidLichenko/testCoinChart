"use client"

import { Home, BarChart2, ListIcon as ListView, Wallet } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Trade', href: '/trade', icon: BarChart2 },
  { name: 'Positions', href: '/history', icon: ListView },
  { name: 'Funds', href: '/funds', icon: Wallet },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-custom-800 border-t border-custom-400">
      <div className="flex h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center text-sm font-medium",
                isActive
                  ? "light:text-custom-900 dark:text-custom-200"
                  : "text-custom-400 hover:text-gray-300"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

