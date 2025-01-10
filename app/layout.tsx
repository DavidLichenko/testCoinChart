import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./icons.css"
import {ThemeProvider} from "@/components/providers/ThemeProvider";
import {Toaster} from "@/components/ui/toaster";
import HeaderMobile from "@/components/HeaderMobile";
import React from "react";
import {MobileNav} from "@/components/mobile-nav";
// import {CheckAuth} from "@/actions/form";



const roboto = Plus_Jakarta_Sans({
    subsets: ["latin"], // Include subsets (e.g., Latin, Cyrillic)
    weight: ["400", "500", "300", "700"], // Add weights you want to use (optional)
    style: ["normal", "italic"], // Include styles (optional)
    display: "swap", // Improves performance by swapping fonts
});
export const metadata: Metadata = {
    title: "Aragon Trade",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    // CheckAuth()
    return (
        <>
            <html lang="en" suppressHydrationWarning={true} >
            <body className={roboto.className} suppressHydrationWarning={true}>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
            >

                    <HeaderMobile />
                {/*<div className="h-screen">*/}
                    {children}
                {/*</div>*/}
                    <MobileNav/>

                <Toaster />
            </ThemeProvider>
            </body>
            </html>
        </>
    );
}
