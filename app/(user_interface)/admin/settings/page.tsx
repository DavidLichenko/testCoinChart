"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";

import {useAuth} from "@/components/auth-provider";
import SettingsManagement from "@/components/admin/settings-management";

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;

        if (user.role !== "OWNER") {
            router.push("/admin");
        }
    }, [user, router]);

    if (!user || user.role !== "OWNER") {
        return null;
    }

    return (
        <div className="space-y-4">
            <SettingsManagement />
        </div>
    );
}
