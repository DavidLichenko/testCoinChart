"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { Bell, MessageSquare, Plus, LogOut, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DepositModal } from "@/components/deposit-modal"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function DesktopHeader() {
  const { user, logout } = useAuth()
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Portfolio" },
    { href: "/transactions", label: "Transactions" },
    { href: "/", label: "Market" },
    { href: "/news", label: "News" },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden lg:flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800"
      >
        {/* Logo */}
        <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          ARAGONTRADE
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                size="sm"
                className={`px-4 py-2 text-sm ${
                  pathname === item.href
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Balance */}
          <div className="text-right">
            <div className="text-xs text-gray-400">Balance</div>
            <div className="text-sm font-semibold text-green-400">$0</div>
          </div>

          {/* Deposit Button */}
          <Button
            onClick={() => setDepositModalOpen(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            Deposit
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="w-4 h-4" />
            <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500" />
          </Button>

          {/* Messages */}
          <Button variant="ghost" size="sm" className="p-2">
            <MessageSquare className="w-4 h-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {/*<DropdownMenuItem asChild>*/}
              {/*  <Link href="/profile" className="flex items-center">*/}
              {/*    <Settings className="w-4 h-4 mr-2" />*/}
              {/*    Settings*/}
              {/*  </Link>*/}
              {/*</DropdownMenuItem>*/}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="flex items-center text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
    </>
  )
}
