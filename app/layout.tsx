import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./icons.css"
import {ThemeProvider} from "@/components/providers/ThemeProvider";
import {Toaster} from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Aragon Trade",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <html lang="en" suppressHydrationWarning={true}>
            <body className={inter.className} suppressHydrationWarning={true}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
            >
                {children}
                <Toaster />
            </ThemeProvider>
            </body>
            </html>
        </>
    );
}
