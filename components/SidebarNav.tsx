'use client'
import React, {useEffect} from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation'

function SidebarNav({link, isActive,text}:{link:string; isActive?:boolean;text:string}) {

    const pathname = usePathname();
    if (link === pathname) {
        isActive = true
    } else {
        isActive = false
    }

    // useEffect(() => {
    //     if (pathname !== '/trade') {
    //         sendSocket(true)
    //     }
    // }, [pathname]);



    return (
        <Link href={link} className={`${isActive ? " bg-gradient-to-r from-indigo-700 to-indigo-500 opacity-100" : "bg-transparent hover:bg-gray-700"} text-white border-border font-bold border-2 rounded-2xl px-6 py-4 opacity-85 transition-all hover:opacity-100`}>
            {text}
        </Link>
    );
}

export default SidebarNav;

