"use client";

import React from "react";
import { usePathname } from "next/navigation";
import HeaderMobile from "@/components/HeaderMobile";
import { MobileNav } from "@/components/mobile-nav";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Define routes where Header and Nav should NOT be displayed
    const noHeaderNavRoutes = ["/sign-in", "/sign-up", "/welcome", "/admin_panel"];

    const shouldShowHeaderNav = !noHeaderNavRoutes.includes(pathname);

    return (
        <>
            {shouldShowHeaderNav && <HeaderMobile />}
            <main>{children}</main>
            {shouldShowHeaderNav && <MobileNav />}
        </>
    );
}