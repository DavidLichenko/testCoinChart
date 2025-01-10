"use client"

import { Home, BarChart2, ListIcon as ListView, Wallet } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import React, {useEffect, useState} from "react";
import {Skeleton} from "@/components/ui/skeleton";
import {GetSession} from "@/actions/form";

const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Trade', href: '/trade', icon: BarChart2 },
    { name: 'Positions', href: '/history', icon: ListView },
    { name: 'Funds', href: '/funds', icon: Wallet },
]

export function MobileNav() {
    const pathname = usePathname()
    const [ses,setSes] = useState(false)
    const getSession = async() => {
        const session = await GetSession()
        if (!session) {
            return
        }
        setSes(true)
    }

    useEffect(() => {
        getSession()
    }, []);
    return (
        <>
            {!ses ? <Skeleton className={'h-16 w-full'}><span className={'opacity-0'}>0</span></Skeleton> :
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
            }
        </>
    )
}

