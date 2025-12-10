"use client";
import React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {AnimatePresence} from "framer-motion";

const LinkBox = ({ href = "", name = "" , color="", bg="",icon = <></>}) => {
    const pathname = usePathname();

    const isActive = pathname.toLowerCase() === href.toLowerCase();
    // console.log(href.toLowerCase())
    return (
        <AnimatePresence mode="wait">
            <Link
                href={href}
                className={`
          relative px-5 py-2.5 rounded-sm group inline-flex gap-2 items-center bg-background font-bold bounce text-[13px] ${color} ${isActive ? "" : {color}} transition
          ${
                    isActive
                        ? `text-white ${bg} hover:${bg}`
                        : `text-gray-300 hover:text-white `
                }
        `}
            >
                <div className={`group-hover:-rotate-[5deg] ${isActive ? "text-white" : "text-gray-400"}  group-hover:scale-110 group-hover:text-white  transition`}>{icon}</div>
                <span className="relative z-10">{name}</span>


            </Link>
        </AnimatePresence>
    );
};

export default LinkBox;
