"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/components/auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  Shield,
  BarChart3,
  MessageCircle,
} from "lucide-react"

// Admin sections
import UsersManagement from "@/components/admin/users-management"
import TeamManagement from "@/components/admin/team-management"
import TransactionsManagement from "@/components/admin/transactions-management"
import OrdersManagement from "@/components/admin/orders-management"
import SettingsManagement from "@/components/admin/settings-management"
import VerificationManagement from "@/components/admin/verification-management"
import DashboardStats from "@/components/admin/dashboard-stats"
import ChatManagement from "@/components/admin/chat-management"

type SectionKey =
    | "dashboard"
    | "users"
    | "team"
    | "transactions"
    | "orders"
    | "verification"
    | "chat"
    | "settings"

const baseSections: {
  key: SectionKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "team", label: "Team", icon: Users },
  { key: "transactions", label: "Trades", icon: TrendingUp },
  { key: "orders", label: "Orders", icon: CreditCard },
  { key: "verification", label: "Verification", icon: Shield },
  { key: "chat", label: "Chat", icon: MessageCircle },
]

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSection, setSelectedSection] =
      useState<SectionKey>("dashboard")

  // Guard: only admins
  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const isAdmin =
        user.role === "OWNER" ||
        user.role === "CR_MANAGMENT" ||
        user.role === "TEAMLEAD"

    if (!isAdmin) {
      router.push("/dashboard")
    }
  }, [user, router])

  // Handle section parameter from URL
  useEffect(() => {
    const sectionParam = searchParams.get("section")
    if (sectionParam && sectionParam in baseSections) {
      setSelectedSection(sectionParam as SectionKey)
    }
  }, [ searchParams])

  if (
      !user ||
      (user.role !== "OWNER" &&
          user.role !== "CR_MANAGMENT" &&
          user.role !== "TEAMLEAD")
  ) {
    return null
  }

  const sections =
      user.role === "OWNER"
          ? [
            ...baseSections,
            { key: "settings" as SectionKey, label: "Settings", icon: Settings },
          ]
          : baseSections

  const activeSectionConfig = sections.find(
      (s) => s.key === selectedSection
  ) || sections[0]

  return (
      <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="min-h-screen bg-gradient-to-br from-[#050215] via-[#120423] to-[#050215] text-slate-50"
      >
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 py-6 md:flex-row md:py-8 lg:px-0">
          {/* LEFT: Sidebar, как в профиле / Discord-style */}
          <aside className="md:w-64 md:flex-shrink-0 space-y-4">
            {/* Admin header card */}
            <Card className="bg-slate-950/80 border-slate-800/80 shadow-sm">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-sky-500 shadow-lg shadow-purple-500/40">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-300">
                      Admin Panel
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {user.name || user.email}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Role:{" "}
                      <span className="uppercase tracking-wide">
                      {user.role}
                    </span>
                    </p>
                  </div>
                </div>

                <div className="mt-1 rounded-xl bg-slate-900/80 px-3 py-2 text-[11px] text-slate-300">
                  <p className="text-slate-400">Current section</p>
                  <p className="font-medium text-purple-200">
                    {activeSectionConfig.label}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Desktop nav (vertical) */}
            <Card className="hidden bg-slate-950/80 border-slate-800/80 shadow-sm md:block">
              <CardContent className="p-2">
                <nav className="flex flex-col gap-1">
                  {sections.map((section) => {
                    const Icon = section.icon
                    const active = selectedSection === section.key
                    return (
                        <button
                            key={section.key}
                            type="button"
                            onClick={() => setSelectedSection(section.key)}
                            className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all ${
                                active
                                    ? "bg-gradient-to-r from-purple-600/90 to-indigo-500/90 text-white shadow-md shadow-purple-500/30"
                                    : "text-slate-200 hover:bg-slate-900/80"
                            }`}
                        >
                      <span className="flex items-center gap-2">
                        <Icon
                            className={`h-4 w-4 ${
                                active
                                    ? "text-white"
                                    : "text-slate-400 group-hover:text-slate-100"
                            }`}
                        />
                        <span className="font-medium">
                          {section.label}
                        </span>
                      </span>
                        </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Mobile top nav (chips) */}
            <Card className="bg-slate-950/80 border-slate-800/80 shadow-sm md:hidden">
              <CardContent className="flex gap-2 overflow-x-auto p-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  const active = selectedSection === section.key
                  return (
                      <button
                          key={section.key}
                          type="button"
                          onClick={() => setSelectedSection(section.key)}
                          className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[11px] transition ${
                              active
                                  ? "bg-purple-600 text-white shadow-sm"
                                  : "bg-slate-900 text-slate-200"
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{section.label}</span>
                      </button>
                  )
                })}
              </CardContent>
            </Card>

          </aside>

          {/* RIGHT: main content */}
          <main className="flex-1 space-y-4">
            {/* Header title like dashboard */}
            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Control users, trades, verification and platform settings in one
                place.
              </p>
            </div>

            {/* Section content */}
            {selectedSection === "dashboard" && (
                <motion.div
                    key="admin-dashboard"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <DashboardStats />
                </motion.div>
            )}

            {selectedSection === "users" && (
                <motion.div
                    key="admin-users"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <UsersManagement />
                </motion.div>
            )}

            {selectedSection === "team" && (
                <motion.div
                    key="admin-team"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <TeamManagement />
                </motion.div>
            )}

            {selectedSection === "transactions" && (
                <motion.div
                    key="admin-transactions"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <TransactionsManagement />
                </motion.div>
            )}

            {selectedSection === "orders" && (
                <motion.div
                    key="admin-orders"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <OrdersManagement />
                </motion.div>
            )}

            {selectedSection === "verification" && (
                <motion.div
                    key="admin-verification"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <VerificationManagement />
                </motion.div>
            )}

            {selectedSection === "chat" && (
                <motion.div
                    key="admin-chat"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <ChatManagement />
                </motion.div>
            )}

            {selectedSection === "settings" && user.role === "OWNER" && (
                <motion.div
                    key="admin-settings"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <SettingsManagement />
                </motion.div>
            )}
          </main>
        </div>
      </motion.div>
  )
}
