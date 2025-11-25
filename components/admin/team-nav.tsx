"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  BarChart3, 
  UserCheck, 
  Settings,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: User,
  },
  {
    name: "Team",
    href: "/admin/team",
    icon: Users,
  },
  {
    name: "Trades",
    href: "/admin/trades",
    icon: UserCheck,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function TeamNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            )}
          >
            <Icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}