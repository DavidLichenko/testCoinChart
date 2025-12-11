"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    BarChart3,
    CreditCard,
    MessageCircle,
    Settings as SettingsIcon,
    Shield,
    TrendingUp,
    Users,
    Wallet as WalletIcon,
    Pin,
    PinOff,
    ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { FavoriteClientsWindow } from "@/components/admin/favorite-clients-window";

type SectionKey =
    | "dashboard"
    | "users"
    | "team"
    | "wallets"
    | "transactions"
    | "orders"
    | "verification"
    | "chat"
    | "settings";

type Section = {
    key: SectionKey;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    ownerOnly?: boolean;
};

const SECTIONS: Section[] = [
    { key: "dashboard", label: "Dashboard", href: "/admin", icon: BarChart3 },
    { key: "users", label: "Users", href: "/admin/users", icon: Users },
    { key: "team", label: "Team", href: "/admin/team", icon: Users },
    { key: "wallets", label: "Wallets", href: "/admin/wallets", icon: WalletIcon },
    {
        key: "transactions",
        label: "Trades",
        href: "/admin/transactions",
        icon: TrendingUp,
    },
    {
        key: "orders",
        label: "Orders",
        href: "/admin/orders",
        icon: CreditCard,
    },
    {
        key: "verification",
        label: "Verification",
        href: "/admin/verification",
        icon: Shield,
    },
    { key: "chat", label: "Chat", href: "/admin/chat", icon: MessageCircle },
    {
        key: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: SettingsIcon,
        ownerOnly: true,
    },
];

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-sans",
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // guard
    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/");
            return;
        }

        const isAdmin =
            user.role === "OWNER" ||
            user.role === "CR_MANAGMENT" ||
            user.role === "TEAMLEAD";

        if (!isAdmin) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return null;
    }

    const isOwner = user.role === "OWNER";

    const sections = useMemo(
        () => SECTIONS.filter((s) => !s.ownerOnly || isOwner),
        [isOwner]
    );

    const activeSection =
        sections.find((s) =>
            s.key === "dashboard" ? pathname === "/admin" : pathname.startsWith(s.href)
        ) ?? sections[0];

    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [isMouseInSidebar, setIsMouseInSidebar] = useState(false);
    const [isMouseInTrigger, setIsMouseInTrigger] = useState(false);
    const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleOpenSidebar = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setSidebarVisible(true);
    };

    const handleCloseSidebar = () => {
        if (sidebarPinned) return; // Don't close if pinned
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        closeTimeoutRef.current = setTimeout(() => {
            if (!isMouseInSidebar && !isMouseInTrigger && !sidebarPinned) {
                setSidebarVisible(false);
            }
        }, 300);
    };

    React.useEffect(() => {
        // Check if user has seen the hint
        const hasSeenHint = localStorage.getItem("admin-sidebar-hint-seen");
        if (!hasSeenHint && !sidebarVisible) {
            const timer = setTimeout(() => setShowHint(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [sidebarVisible]);

    React.useEffect(() => {
        if (sidebarPinned) {
            setSidebarVisible(true);
        }
    }, [sidebarPinned]);

    React.useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const sidebarWidth = (sidebarVisible || sidebarPinned) ? "16rem" : "0";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={cn(
                "admin-theme dark min-h-screen bg-background text-foreground",
                plusJakarta.variable
            )}
            style={{
                "--admin-sidebar-width": sidebarWidth,
            } as React.CSSProperties}
        >
            <style jsx global>{`
                body {
                    --admin-sidebar-width: ${sidebarWidth};
                }
                header {
                    margin-left: var(--admin-sidebar-width, 0);
                    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>
            <div className="relative mx-auto flex max-w-[85%] flex-col gap-6 px-4 py-6 md:flex-row md:py-8">
                {/* Hint Tooltip */}
                {showHint && !sidebarVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="fixed left-16 top-1/2 -translate-y-1/2 z-50 hidden md:block"
                    >
                        <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
                            <ChevronRight className="h-4 w-4" />
                            <span>Hover left edge to open sidebar</span>
                            <button
                                onClick={() => {
                                    setShowHint(false);
                                    localStorage.setItem("admin-sidebar-hint-seen", "true");
                                }}
                                className="ml-2 hover:opacity-70"
                            >
                                ×
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Hover trigger area - увеличенная область */}
                <div
                    className="fixed left-0 top-0 z-40 h-full w-16 hidden md:block"
                    onMouseEnter={() => {
                        setIsMouseInTrigger(true);
                        handleOpenSidebar();
                        if (showHint) {
                            setShowHint(false);
                            localStorage.setItem("admin-sidebar-hint-seen", "true");
                        }
                    }}
                    onMouseLeave={() => {
                        setIsMouseInTrigger(false);
                        handleCloseSidebar();
                    }}
                />
                
                {/* LEFT: sidebar */}
                <motion.aside
                    className="fixed left-0 top-0 z-50 h-full w-64 space-y-4 bg-background/95 backdrop-blur-sm border-r border-border/50 overflow-y-auto p-4"
                    initial={{ x: -256 }}
                    animate={{
                        x: (sidebarVisible || sidebarPinned) ? 0 : -256,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    }}
                    onMouseEnter={() => {
                        setIsMouseInSidebar(true);
                        handleOpenSidebar();
                    }}
                    onMouseLeave={() => {
                        setIsMouseInSidebar(false);
                        handleCloseSidebar();
                    }}
                >
                    {/* Admin header card */}
                    <Card className="bg-card/90 border-border/80 shadow-sm">
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg">
                                        <BarChart3 className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            Admin Panel
                                        </p>
                                        <p className="truncate text-sm font-semibold text-foreground">
                                            {user.name || user.email}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Role:{" "}
                                            <span className="uppercase tracking-wide">
                      {user.role}
                    </span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSidebarPinned(!sidebarPinned);
                                        if (!sidebarPinned) {
                                            setSidebarVisible(true);
                                        }
                                    }}
                                    className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                                    title={sidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
                                >
                                    {sidebarPinned ? (
                                        <Pin className="h-4 w-4 text-primary" />
                                    ) : (
                                        <PinOff className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </button>
                            </div>

                            {/*<div className="mt-1 rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground">*/}
                            {/*    <p className="text-xs text-muted-foreground">Current section</p>*/}
                            {/*    <p className="font-bold text-sm  text-violet-400 ">*/}
                            {/*        {activeSection.label}*/}
                            {/*    </p>*/}
                            {/*</div>*/}
                        </CardContent>
                    </Card>

                    {/* Desktop vertical nav */}
                    <Card className="hidden bg-card/90 border-border/80 shadow-sm md:block">
                        <CardContent className="p-2">
                            <nav className="flex flex-col gap-1">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    const active = section.key === activeSection.key;
                                    return (
                                        <Link
                                            key={section.key}
                                            href={section.href}
                                            className={cn(
                                                "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all",
                                                active
                                                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                                                    : "text-foreground/80 hover:bg-muted/80"
                                            )}
                                        >
                      <span className="flex items-center gap-2">
                        <Icon
                            className={cn(
                                "h-4 w-4",
                                active
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground group-hover:text-foreground"
                            )}
                        />
                        <span className="font-medium">{section.label}</span>
                      </span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* Mobile chips nav */}
                    <Card className="bg-card/90 border-border/80 shadow-sm md:hidden">
                        <CardContent className="flex gap-2 overflow-x-auto p-2">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const active = section.key === activeSection.key;
                                return (
                                    <Link
                                        key={section.key}
                                        href={section.href}
                                        className={cn(
                                            "flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[11px] transition",
                                            active
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-muted text-foreground/80"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        <span>{section.label}</span>
                                    </Link>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.aside>

                {/* RIGHT: content */}
                <motion.main
                    className="flex-1 space-y-4 w-full transition-all duration-300"
                    animate={{
                        marginLeft: (sidebarVisible || sidebarPinned) ? "16rem" : "0",
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    }}
                >
                    <div className="mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            Admin · {activeSection.label}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage users, trades, verification and platform settings in one
                            place.
                        </p>
                    </div>

                    {children}
                </motion.main>
            </div>
            <FavoriteClientsWindow />
        </motion.div>
    );
}
