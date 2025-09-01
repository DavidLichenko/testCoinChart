"use client"

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {BarChart3, FileText, Home, Newspaper} from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";

const MobileFooter = () => {
    const pathname = usePathname();
    const { t } = useI18n();
    const navItems = [
        { href: "/dashboard", label: t("bottomDashboard"), icon: Home },
        { href: "/transactions", label: t("bottomTransactions"), icon: FileText },
        { href: "/market", label: t("bottomTrade"), icon: BarChart3 },
        { href: "/news", label: t("bottomNews"), icon: Newspaper },
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
            <div className="flex justify-around py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button variant="ghost" size="sm" className={`flex flex-col items-center space-y-1 h-auto ${isActive ? 'text-purple-400' : 'text-gray-400'} hover:text-white`}>
                                <Icon className="w-5 h-5"/>
                                <span className="text-xs">{item.label}</span>
                            </Button>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
};

export default MobileFooter;


{/* Mobile Bottom Navigation */
}

