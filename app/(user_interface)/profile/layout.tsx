"use client";

import type React from "react";
import { SidebarNav } from "./components/sidebar-nav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-max max-w-screen-2xl mx-auto w-full relative min-h-screen bg-zinc-950">
      {/* Simple gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pointer-events-none z-0" />
      
      <div className="relative z-10 flex min-h-full">
        {/* Sidebar */}
        <div className="hidden w-80 flex-shrink-0 h-full p-4 md:block">
          <SidebarNav />
        </div>
        
        {/* Main Content with max-w-screen-2xl */}
        <div className="flex-1 overflow-auto w-full h-fit">
          <div className="relative">
            <div className="max-w-screen-2xl px-4 py-6 mx-auto">
              {/* Deep dark blue-purple background with gradient */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0d0d1a] via-[#12121f] to-[#0f0f1c] backdrop-blur-lg border border-purple-500/10 p-6 min-h-[calc(100vh-8rem)] shadow-[0_8px_30px_rgb(0,0,0,0.6),0_0_80px_rgb(139,92,246,0.03)]">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
