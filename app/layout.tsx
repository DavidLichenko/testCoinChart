// app/layout.tsx
import type {Metadata} from "next";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import {I18nProvider} from "@/components/i18n-provider";
import {Poppins} from "next/font/google"
import {cn} from "@/lib/utils";
import localFont from "next/font/local";
import {Toaster} from "react-hot-toast";
import {Footer} from "@/components/footer";
import { AuthProvider } from "@/components/auth-provider";

const geistSans = localFont({
    src: "./../public/fonts/Geist[wght].woff2",
    variable: "--font-geist-sans",
    weight: "100 900",
    display: "swap",
});
const poppins = Poppins({
    subsets:['latin'],
    display: "swap",
    weight:['100', '200', '300', '400', '500', '600', '700', '800', '900']
})
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
        icon: "/barchart3.png",
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
                "",
                poppins.className,
                "h-full"
                // geistSans.variable,
                // geistMono.variable
            )}
        >
        <AuthProvider>
        <ThemeProvider
            attribute="class"
            defaultTheme={"dark"}
            enableSystem={false}
            forcedTheme={'dark'}
        >
            <I18nProvider>
                <div className="flex flex-col min-h-screen">
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                </div>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 3000,
                    }}
                />
            </I18nProvider>
        </ThemeProvider>
        </AuthProvider>
        </body>
        </html>
    );
}
