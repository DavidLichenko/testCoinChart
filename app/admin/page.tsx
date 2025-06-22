"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-950 text-white"
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user.name || user.email}</p>
        </div>

        {/* Admin Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-gray-800 h-12">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
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

          <TabsContent value="settings" className="space-y-6">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}