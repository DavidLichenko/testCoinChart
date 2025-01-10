import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./icons.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import ClientWrapper from "@/components/Wrapper"; // New client wrapper component

const roboto = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "300", "700"],
    style: ["normal", "italic"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Aragon Trade",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning={true}>
        <body className={`${roboto.className} flex flex-col min-h-screen`} suppressHydrationWarning={true}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <ClientWrapper>{children}</ClientWrapper>
            <Toaster />
        </ThemeProvider>
        </body>
        </html>
    );
}
