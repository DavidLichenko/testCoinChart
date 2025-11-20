// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";

const geistSans = localFont({
    src: "./../public/fonts/Geist[wght].woff2",
    variable: "--font-geist-sans",
    weight: "100 900",
    display: "swap",
});

const geistMono = localFont({
    src: "./../public/fonts/GeistMono[wght].woff2",
    variable: "--font-geist-mono",
    weight: "100 900",
    display: "swap",
});

export const metadata: Metadata = {
    title: "AragonTrade",
    description:
        "The best platform for secure and efficient trading. Analyze, track, and execute trades with ease.",
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
        <html lang="es" suppressHydrationWarning>
        <body
            className={cn(
                "min-h-screen bg-background font-sans antialiased pb-16 md:pb-0",
                geistSans.variable,
                geistMono.variable
            )}
        >
        <ThemeProvider
            attribute="class"
            defaultTheme={"dark"}
            enableSystem={false}
            forcedTheme={'dark'}
            disableTransitionOnChange
        >
            <I18nProvider>
                {children}
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 3000,
                    }}
                />
            </I18nProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
