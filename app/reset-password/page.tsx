"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {Lock, ArrowRight, BarChart3, ArrowLeft} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import Link from "next/link";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const { t } = useI18n();

    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
                <p className="rounded-lg border border-red-600/40 bg-red-900/10 px-4 py-3 text-red-400">
                    {t("invalidToken")}
                </p>
            </div>
        );
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || t("resetFailed"));
            } else {
                setMessage(t("passwordChangedSuccess"));
            }
        } catch {
            setError(t("networkError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#08061a] via-[#0b0b18] to-[#06040d] px-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 px-6 py-8 shadow-2xl backdrop-blur-xl"
            >
                {/* Branding */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 shadow-lg shadow-purple-500/40">
                        <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                        ARAGONTRADE
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-xl font-semibold text-white">
                    {t("resetPasswordTitle")}
                </h1>
                <p className="mt-1 mb-6 text-sm text-slate-300">
                    {t("resetPasswordSubtitle")}
                </p>

                {/* Form */}
                <form onSubmit={submit} className="space-y-4">
                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{opacity: 0, y: -6}}
                            animate={{opacity: 1, y: 0}}
                            className="rounded-lg border border-red-500/40 bg-red-900/10 px-3 py-2.5 text-sm text-red-400"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Success */}
                    {message && (
                        <motion.div
                            initial={{opacity: 0, y: -6}}
                            animate={{opacity: 1, y: 0}}
                            className="rounded-lg border border-emerald-600/40 bg-emerald-900/10 px-3 py-2.5 text-sm text-emerald-400"
                        >
                            {message}
                        </motion.div>
                    )}

                    {/* Password field */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-200">{t("newPassword")}</label>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>

                            <Input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t("enterNewPassword")}
                                className="h-10 rounded-xl border-slate-700 bg-slate-950/70 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-purple-500/40 hover:brightness-110 disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"/>
                                {t("saving")}
                            </>
                        ) : (
                            <>
                                {t("changePassword")}
                                <ArrowRight className="h-4 w-4"/>
                            </>
                        )}
                    </Button>
                    <div className="relative pt-5">
                        <div
                            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px w-24 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>

                        <div className="text-center text-xs text-slate-400">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200 transition-colors"
                            >
                                <ArrowLeft className="h-3 w-3"/>
                                {t("backToHome")}
                            </Link>
                        </div>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
