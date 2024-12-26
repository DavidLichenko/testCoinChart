import React from 'react';
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link"
import {NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport, navigationMenuTriggerStyle} from "@/components/ui/navigation-menu";

const Page = () => {
    return (
        <AdminSidebar>
            <div className={'w-full h-[80%] mx-auto flex items-center justify-center'}>
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <Link href="/admin_panel/users" legacyBehavior passHref>
                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                    Users
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </AdminSidebar>
    );
};

export default Page;