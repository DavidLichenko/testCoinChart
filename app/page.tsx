"use client"
import WelcomePage from "@/components/auth/welcome-page";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleAuthSuccess = () => {
    router.push("/dashboard");
  };

  return <WelcomePage onAuthSuccess={handleAuthSuccess} />;
}