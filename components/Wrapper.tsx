"use client";

import React from "react";
import { usePathname } from "next/navigation";
import HeaderMobile from "@/components/HeaderMobile";
import { MobileNav } from "@/components/mobile-nav";
import { SessionProvider } from "next-auth/react"; // Wrap with SessionProvider
import { BalanceProvider } from "@/context/BalanceContext"; // Wrap with BalanceProvider

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Define routes where Header and Nav should NOT be displayed
    const noHeaderNavRoutes = ["/sign-in", "/sign-up", "/welcome", "/admin_panel"];

    const shouldShowHeaderNav = !noHeaderNavRoutes.includes(pathname);

    return (
        <SessionProvider>
            <BalanceProvider>
                {/* Wrap with the header and navigation logic */}
                {shouldShowHeaderNav && <HeaderMobile />}
                <main className={'grow'}>{children}</main>
                {shouldShowHeaderNav && <MobileNav />}
            </BalanceProvider>
        </SessionProvider>
    );
}