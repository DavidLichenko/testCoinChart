import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import {AuthProvider} from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "AragonTrade",
    description: "The best platform for secure and efficient trading. Analyze, track, and execute trades with ease.",
    keywords: ["trade", "crypto", "stocks", "analysis", "portfolio", "exchange"],
    icons: {
        icon: "/barchart3.svg",
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <html lang="en" suppressHydrationWarning>
            <body
                className={cn(
                    "min-h-screen bg-background font-sans antialiased pb-16 md:pb-0",
                    geistSans.variable,
                    geistMono.variable
                )}
            >
            <ThemeProvider
    attribute="class"
    defaultTheme="dark"  // <-- set dark as default
    enableSystem={false} // <-- do not use system
    disableTransitionOnChange
>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ThemeProvider>
            </body>
            </html>
        </>
    );
}
