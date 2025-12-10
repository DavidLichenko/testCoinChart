"use client";

import type React from "react";
import { SidebarNav } from "./components/sidebar-nav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-max max-w-screen-2xl mx-auto  w-full">
      {/*<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/15 via-gray-950/0 to-black/0"></div>*/}
      {/*<div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/10 via-gray-950/0 to-black/0"></div>*/}
      <div className="relative flex min-h-full">
        {/* Sidebar */}
        <div className="hidden w-80 flex-shrink-0 h-full  p-4 md:block">
          <SidebarNav />
        </div>
        
        {/* Main Content with max-w-screen-2xl */}
        <div className="flex-1 overflow-auto w-full h-fit">
          <div className="relative">
            <div className="max-w-screen-2xl px-4 py-6 mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
