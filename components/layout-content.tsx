"use client";

import { useAuth } from "@/components/auth-provider";
import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { usePathname } from "next/navigation";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  // Don't show header/footer on the home page if user is not authenticated
  const isHomePage = pathname === "/";
  const showHeaderFooter = !isHomePage || (!loading && user);

  return (
    <>
      {showHeaderFooter && <Header />}
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          {children}
        </main>
        {showHeaderFooter && <Footer />}
      </div>
    </>
  );
}
