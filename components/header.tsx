'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, User, LogOut, ChevronRight, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DepositModal } from "@/components/deposit-modal"
import { useAuth } from "@/components/auth-provider"
import { useBalance } from "@/hooks/useBalance"
import ChatButton from "@/components/chat/chat-button"
import NavItem from "@/components/nav-item"
import { useIsMobile } from "@/hooks/use-mobile"
import { useI18n } from "@/components/i18n-provider"
import { useRouter } from "next/navigation"

export default function Header() {
    const { balance, liveProfit } = useBalance()
    const { user, logout } = useAuth()
    const { t } = useI18n()
    const isMobile = useIsMobile()
    const router = useRouter()

    const totalEquity = balance + (liveProfit || 0)
    const [depositModalOpen, setDepositModalOpen] = useState(false)

    // Custom menu
    const [openMenu, setOpenMenu] = useState(false)

    const toggleMenu = () => setOpenMenu(!openMenu)

    // redirect to withdraw tab
    const goWithdraw = () => {
        router.push("/profile?tab=withdraw")
        setOpenMenu(false)
    }


    // MOBILE HEADER
    if (isMobile) {
        return (
            <header className="sticky top-0 z-[60] bg-gray-950/95 backdrop-blur-md border-b border-gray-800 h-16 flex items-center justify-between px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <img src={'/logo.png'}   className="h-12 w-12text-white" />
                    <span className="text-white font-bold text-xs uppercase">Aragon Trade</span>
                </Link>

                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-xs text-gray-400">{t("equity")}</p>
                        <p className="text-sm font-bold text-white">
                            ${totalEquity.toFixed(2)}
                        </p>
                    </div>

                    <Button size="sm" onClick={() => setDepositModalOpen(true)}>
                        {t("deposit")}
                    </Button>

                    <ChatButton />

                    {/* Profile Button */}
                    <div className="relative">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full bg-gray-800 hover:bg-gray-700"
                            onClick={toggleMenu}
                        >
                            <User className="h-5 w-5 text-white" />
                        </Button>

                        {/* MOBILE MENU */}
                        <AnimatePresence>
                            {openMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-2 z-[80]"
                                >
                                    <button
                                        onClick={() => { router.push("/profile"); setOpenMenu(false) }}
                                        className="flex items-center justify-between px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded-lg"
                                    >
                                        {t("profileLabel")}
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </button>

                                    <button
                                        onClick={goWithdraw}
                                        className="flex items-center justify-between px-3 py-2 text-sm text-indigo-300 hover:bg-gray-800 rounded-lg"
                                    >
                                        {t("withdraw")}
                                        <ChevronRight className="h-4 w-4 text-indigo-300" />
                                    </button>

                                    <div className="my-1 border-t border-gray-700" />

                                    <button
                                        onClick={logout}
                                        className="flex items-center justify-between px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg"
                                    >
                                        {t("logoutLabel")}
                                        <LogOut className="h-4 w-4 text-red-400" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
            </header>
        )
    }


    // DESKTOP HEADER
    return (
        <>
            <header className="sticky top-0 z-[60] bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                    {/* LEFT SIDE */}
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <img src={'/logo.png'} className="h-16 w-16"/>
                            <span className="text-white font-bold text-lg">AragonTrade</span>
                        </Link>

                        <nav className="hidden md:flex items-center">
                            <NavItem />
                        </nav>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex items-center gap-4">

                        {/* EQUITY */}
                        <div className="text-right">
                            <p className="text-xs text-gray-400">{t("totalEquity")}</p>
                            <p className="text-lg font-bold text-white">
                                ${totalEquity.toFixed(2)}
                            </p>
                        </div>

                        {/* Deposit */}
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 rounded-xl px-4"
                            onClick={() => setDepositModalOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t("deposit")}
                        </Button>

                        <ChatButton />

                        {/* PROFILE MENU */}
                        <div className="relative">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full bg-gray-800 hover:bg-gray-700"
                                onClick={toggleMenu}
                            >
                                <User className="h-5 w-5 text-white" />
                            </Button>

                            {/* DESKTOP MENU */}
                            <AnimatePresence>
                                {openMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-3 w-56 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-xl p-3 z-[80]"
                                    >
                                        <div className="px-2 py-1 text-gray-400 text-xs">
                                            {t("myAccount")}
                                        </div>

                                        <button
                                            onClick={() => { router.push("/profile"); setOpenMenu(false) }}
                                            className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded-lg"
                                        >
                                            {t("profileLabel")}
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        </button>

                                        <button
                                            onClick={goWithdraw}
                                            className="flex items-center justify-between w-full px-3 py-2 text-sm text-indigo-300 hover:bg-gray-800 rounded-lg"
                                        >
                                            {t("withdraw")}
                                            <ChevronRight className="h-4 w-4 text-indigo-300" />
                                        </button>

                                        <div className="my-2 border-t border-gray-700" />

                                        <button
                                            onClick={logout}
                                            className="flex items-center justify-between w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg"
                                        >
                                            {t("logoutLabel")}
                                            <LogOut className="h-4 w-4 text-red-400" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </header>

            <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
        </>
    )
}
