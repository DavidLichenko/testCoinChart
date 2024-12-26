import React from 'react';

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList, navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import Link from "next/link";
const items = [
    {
        title: "Leads",
        url: "/admin_panel/",

    },
    {
        title: "Agents",
        url: "/admin_panel/agents",

    },
    {
        title: "Live Support",
        url: "/admin_panel/transaction",

    },
    {
        title: "Settings",
        url: "/admin_panel/settings",

    }
]
const AdminSidebar = ({children}) => {
    return (
        <div className="h-full">
            <header className='flex w-[80%]  mx-auto justify-center items-center pt-10'>
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem className='flex gap-12'>
                            {items.map((item,index) => (
                                <Link href={'' + item.url} legacyBehavior passHref key={index}>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                        {item.title}
                                    </NavigationMenuLink>
                                </Link>
                            ))}

                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </header>
            <main className="main w-full  overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default AdminSidebar;