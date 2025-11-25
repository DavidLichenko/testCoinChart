"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main admin panel with team section selected
    router.push("/admin?section=team");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  );
}
