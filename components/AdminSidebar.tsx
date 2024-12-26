'use client'
import React, {useEffect, useState} from 'react';

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList, navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import {GetCurrentUser} from "@/actions/form";
import {useRouter} from "next/navigation";
import {Skeleton} from "@/components/ui/skeleton";
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

    const router = useRouter()
    const [currentUser,setCurrentUser] = useState(null)
    const [isLoading,setIsLoading] = useState(true)
    async function currentSession() {
        const { role }  = await GetCurrentUser()
        if( role === 'USER') {
            router.push('/')
        } else {
            setIsLoading(false)
        }
        if (!currentUser) {
            setCurrentUser( role)
        }
    }
    useEffect(()=>{
        currentSession()
    },[])

    return (
        <div className="h-full">
            { isLoading ? <Skeleton className={'h-screen  w-full'}><span className={'opacity-0 h-screen w-full'}>0</span></Skeleton> :
                <>
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
                </>
            }
        </div>
    );
};

export default AdminSidebar;