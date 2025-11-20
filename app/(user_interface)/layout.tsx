// app/(user_interface)/layout.tsx
"use client";

import type React from "react";
import { AuthProvider } from "@/components/auth-provider";

export default function UserInterfaceLayout({
                                                children,
                                            }: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}
