"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const LinkBox = ({ href = "", name = "" }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <AnimatePresence mode="wait">
            <Link
                href={href}
                className={`
          relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all
          ${
                    isActive
                        ? "text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                }
        `}
            >
                <span className="relative z-10">{name}</span>

                {/* Active Background */}
                {isActive && (
                    <motion.div
                        layoutId="navActiveGlow"
                        transition={{ type: "spring", stiffness: 250, damping: 22 }}
                        className="
              absolute inset-0 rounded-xl bg-gradient-to-r 
              from-indigo-600/70 to-purple-600/70 shadow-lg 
              backdrop-blur-sm
            "
                    />
                )}
            </Link>
        </AnimatePresence>
    );
};

export default LinkBox;
