import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import {AuthProvider} from "@/components/auth-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";


// Load Geist Sans (variable font)
const geistSans = localFont({
    src: "./../public/fonts/Geist[wght].woff2",
    variable: "--font-geist-sans",
    weight: "100 900", // full range for variable font
    display: "swap",
});

// Load Geist Mono (variable font)
const geistMono = localFont({
    src: "./../public/fonts/GeistMono[wght].woff2",
    variable: "--font-geist-mono",
    weight: "100 900",
    display: "swap",
});

export const metadata: Metadata = {
    title: "AragonTrade",
    description: "The best platform for secure and efficient trading. Analyze, track, and execute trades with ease.",
    keywords: ["trade", "crypto", "stocks", "analysis", "portfolio", "exchange"],
    icons: {
        icon: "/barchart3.ico",
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
                    <I18nProvider>
                        {children}
                    </I18nProvider>
                        </AuthProvider>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 3000,
                    }}
                />
            </ThemeProvider>
            </body>
            </html>
        </>
    );
}
