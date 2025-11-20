"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Settings, 
  Shield, 
  FileText,
  BarChart3,
  DollarSign,
  Activity,
  AlertTriangle,
  MessageCircle
} from "lucide-react"

// Import admin components
import UsersManagement from "@/components/admin/users-management"
import TransactionsManagement from "@/components/admin/transactions-management"
import OrdersManagement from "@/components/admin/orders-management"
import SettingsManagement from "@/components/admin/settings-management"
import VerificationManagement from "@/components/admin/verification-management"
import DashboardStats from "@/components/admin/dashboard-stats"
import ChatManagement from "@/components/admin/chat-management"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const isAdmin = user.role === 'OWNER' || user.role === 'CR_MANAGMENT' || user.role === 'TEAMLEAD'
    if (!isAdmin) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user || (user.role !== 'OWNER' && user.role !== 'CR_MANAGMENT' && user.role !== 'TEAMLEAD')) {
    return null
  }

  const getTabLabel = (value: string) => {
    const labels: Record<string, string> = {
      dashboard: "Dashboard",
      users: "Users",
      transactions: "Trades",
      orders: "Orders",
      verification: "Verification",
      chat: "Chat",
      settings: "Settings"
    }
    return labels[value] || value
  }

  const getTabIcon = (value: string) => {
    const icons: Record<string, React.ReactNode> = {
      dashboard: <BarChart3 className="w-4 h-4" />,
      users: <Users className="w-4 h-4" />,
      transactions: <TrendingUp className="w-4 h-4" />,
      orders: <CreditCard className="w-4 h-4" />,
      verification: <Shield className="w-4 h-4" />,
      chat: <MessageCircle className="w-4 h-4" />,
      settings: <Settings className="w-4 h-4" />
    }
    return icons[value] || null
  }

  const tabs = [
    { value: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
    { value: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { value: "transactions", label: "Trades", icon: <TrendingUp className="w-4 h-4" /> },
    { value: "orders", label: "Orders", icon: <CreditCard className="w-4 h-4" /> },
    { value: "verification", label: "Verification", icon: <Shield className="w-4 h-4" /> },
    { value: "chat", label: "Chat", icon: <MessageCircle className="w-4 h-4" /> },
    ...(user.role === "OWNER" ? [{ value: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> }] : [])
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-950 text-white"
    >
      <div className="p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400">Welcome back, {user.name || user.email}</p>
        </div>

        {/* Admin Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Mobile Select */}
          <div className="lg:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-base h-12">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getTabIcon(activeTab)}
                    <span>{getTabLabel(activeTab)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-[80vh]">
                {tabs.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value} className="text-base py-3">
                    <div className="flex items-center gap-2">
                      {tab.icon}
                      {tab.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tabs */}
          <TabsList className={`hidden lg:grid w-full ${user.role === "OWNER" ? "grid-cols-7" : "grid-cols-6"} bg-gray-800 h-12`}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionsManagement />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <VerificationManagement />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <ChatManagement />
          </TabsContent>

          {user.role === "OWNER" && (
            <TabsContent value="settings" className="space-y-6">
              <SettingsManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </motion.div>
  )
}