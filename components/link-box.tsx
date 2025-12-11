"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface LinkBoxProps {
  href?: string;
  name?: string;
  color?: string;
  bg?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const LinkBox: React.FC<LinkBoxProps> = ({ 
  href = "", 
  name = "", 
  color = "", 
  bg = "", 
  icon = <></>,
  onClick
}) => {
  const pathname = usePathname();
  const isActive = pathname.toLowerCase() === href.toLowerCase();

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`
          relative px-5 py-2.5 rounded-2xl group inline-flex gap-2 items-center bg-[#090b1a] font-bold text-[13px] transition-colors duration-200 ${!isActive && color}
          ${
            isActive
              ? `text-white ${bg} hover:${bg}`
              : `text-gray-300 hover:text-white`
          }
        `}
      >
        <div className={`transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-gray-400"} group-hover:text-white`}>
          {icon}
        </div>
        <span className="relative z-10">{name}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`
        relative px-5 py-2.5 rounded-2xl group inline-flex gap-2 items-center bg-[#090b1a] font-bold text-[13px] transition-colors duration-200 ${!isActive && color}
        ${
          isActive
            ? `text-white ${bg} hover:${bg}`
            : `text-gray-300 hover:text-white`
        }
      `}
    >
      <div className={`transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-gray-400"} group-hover:text-white`}>
        {icon}
      </div>
      <span className="relative z-10">{name}</span>
    </Link>
  );
};

export default LinkBox;