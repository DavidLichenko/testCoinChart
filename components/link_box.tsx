"use client";
import React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {motion} from "framer-motion";

const LinkBox = ({ href = "", name = "" , color="", bg="",icon = <></>}) => {
    const pathname = usePathname();

    const isActive = pathname.toLowerCase() === href.toLowerCase();
    
    return (
        <Link href={href} className="relative">
            <motion.div
                className={`
                    relative px-5 py-3 rounded-xl inline-flex gap-2.5 items-center font-semibold text-sm transition-all duration-200
                    ${
                        isActive
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30"
                            : "bg-[#0b0b14] text-gray-300 hover:text-white hover:bg-purple-600/10 hover:border-purple-500/30 border border-transparent"
                    }
                `}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div 
                    className={`transition-all duration-200 ${
                        isActive ? "text-white" : "text-gray-400 group-hover:text-purple-400"
                    }`}
                >
                    {icon}
                </div>
                <span className="relative z-10">{name}</span>
                
                {isActive && (
                    <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl"
                        style={{ zIndex: -1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
            </motion.div>
        </Link>
    );
};

export default LinkBox;
