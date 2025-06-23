'use client'
import React, { useState } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, User, Settings, Menu, X, BarChart3, Package2 } from "lucide-react";
import Link from "next/link";
import { DepositModal } from "@/components/deposit-modal";
import { useAuth } from "@/components/auth-provider";
import { useBalance } from "@/hooks/useBalance";
import ChatButton from "@/components/chat/chat-button";
import NavItem from "@/components/nav-item";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePathname } from "next/navigation"
import { ModeToggle } from "./theme-switcher"

const Header = () => {
    const { balance, liveProfit } = useBalance();
    const { user, logout } = useAuth();
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const isMobile = useIsMobile();
    const pathname = usePathname()
    
    const totalEquity = balance + (liveProfit || 0);

    const isAdmin = user?.role === 'OWNER' || user?.role === 'CR_MANAGMENT' || user?.role === 'TEAMLEAD';

    const navItems = [
        { name: "Transactions", href: "/transactions" },
    ]

    if (isMobile) {
        return (
            <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
                <Link href="/dashboard" className="flex items-end gap-2">
                    <BarChart3 className="h-6 w-6"/>
                    <span className="text-white font-bold text-sm top-0.5 relative">AT</span>
                    <span className="sr-only">AragonTrade</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground">Equity</div>
                        <div className="text-sm font-bold">${totalEquity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}</div>
                    </div>
                    <Button onClick={() => setDepositModalOpen(true)} size="sm">Deposit</Button>
                    <ChatButton />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full bg-gray-800 hover:bg-gray-700">
                          <User className="h-5 w-5" />
                          <span className="sr-only">Toggle user menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className={'bg-gray-900 '}>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={'focus:bg-gray-700'} asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                        <DropdownMenuItem className={'focus:bg-gray-700'} onClick={logout}>Logout</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
                </div>
            </header>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-40 bg-gray-950 border-b border-gray-800">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/dashboard" className="flex items-center space-x-2">
                                <BarChart3 className="text-white h-6 w-6" />
                                <span className="text-white font-bold text-lg">AragonTrade</span>
                            </Link>
                            <nav className="hidden md:flex items-center space-x-4">
                               <NavItem />
                            </nav>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                             <div className="text-right">
                               <p className="text-xs text-gray-400">Total Equity</p>
                               <p className="text-lg font-bold text-white">${totalEquity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}</p>
                             </div>
                             <Button className="bg-green-600 hover:bg-green-700" onClick={() => setDepositModalOpen(true)}>
                                 <Plus className="w-4 h-4 mr-2" />
                                 Deposit
                             </Button>
                             <ChatButton />
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="secondary" size="icon" className="rounded-full bg-gray-800 hover:bg-gray-700">
                                    <User className="h-5 w-5" />
                                    <span className="sr-only">Toggle user menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className={'bg-gray-900 '} align="end">
                                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem  className={'focus:bg-gray-700'} asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                                  <DropdownMenuItem className={'focus:bg-gray-700'} onClick={logout}>Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>
            <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
        </>
    );
};

export default Header;