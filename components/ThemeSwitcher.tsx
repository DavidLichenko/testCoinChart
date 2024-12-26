"use client";
import React, {useEffect, useState} from 'react';
import {useTheme} from "next-themes";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {MoonIcon, SunIcon, DesktopIcon} from "@radix-ui/react-icons";


const ThemeSwitcher = () => {
    const {theme, setTheme} = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(()=>{
        setMounted(true)
    },[])

    if (!mounted) return;

    return (
        <Tabs>
            <TabsList>
                <TabsTrigger value="light" onClick={()=>{setTheme("light")}}>
                    <SunIcon className="h-[1.2rem] w-[1.2rem] transition-all duration-500" />
                </TabsTrigger>
                <TabsTrigger value="dark" onClick={()=>{setTheme("dark")}}>
                    <MoonIcon className="h-[1.2rem] w-[1.2rem] rotate-90 transition-all duration-500 dark:rotate-0" />
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
};

export default ThemeSwitcher;