"use client"
import WelcomePage from "@/components/auth/welcome-page";
import { useAuth } from "@/components/auth-provider";

export default function HomePage() {
  const { user, loading } = useAuth();

  // Don't auto-redirect authenticated users - let them stay on home page
  // They can navigate manually if needed

  const handleAuthSuccess = () => {
    // Don't redirect after login - stay on current page
    // User will be shown the authenticated home page
  };

  return <WelcomePage onAuthSuccess={handleAuthSuccess} />;
}