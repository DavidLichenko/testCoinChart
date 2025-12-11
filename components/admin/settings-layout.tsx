"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { hasOwnerAccess } from "@/lib/admin-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AdminSettingsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  backHref?: string;
}

export function AdminSettingsLayout({ children, title, description, backHref = "/admin/settings" }: AdminSettingsLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (!hasOwnerAccess(user)) {
      router.push("/admin");
    }
  }, [user, router]);

  if (!user || !hasOwnerAccess(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="border-red-500/20 bg-red-950/20">
          <CardContent className="p-6">
            <p className="text-red-400">Access denied. Only owners can access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-screen-2xl">{children}</div>
    </div>
  );
}
