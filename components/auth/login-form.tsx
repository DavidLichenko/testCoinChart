/**
 * Дополнительные i18n-ключи, которые используются здесь:
 *
 * - welcomeBack           — "Welcome back"
 * - signInToAccount       — "Sign in to your account"
 * - loginFailed           — "Login failed"
 * - networkErrorTryAgain  — "Network error. Please try again."
 * - dontHaveAccount       — "Don't have an account?"
 * - signingIn             — "Signing in..."
 *
 * Новые (для этого варианта):
 * - forgotPassword        — "Forgot password?"
 * - rememberMe            — "Remember me"
 */

"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import { refetchBalance } from "@/hooks/useBalance";

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onBack?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("loginFailed"));
        return;
      }

      await refetchBalance();
      onSuccess();
    } catch (error) {
      setError(t("networkErrorTryAgain"));
    } finally {
      setLoading(false);
    }
  };

  return (
      <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#0b1020] via-[#090b1a] to-[#05040c] px-4"
      >
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
            className="w-full max-w-xl"
        >
          <Card className="overflow-hidden border-slate-800 bg-slate-900/95 text-white shadow-2xl shadow-black/50">
            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
              {/* Левая колонка: форма */}
              <div className="p-6 sm:p-7">
                {/* мини-лого/бренд */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center">
                    <img src={'/logo.png'} className="h-14 w-14 text-white" />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                  ARAGON<br/>TRADE
                </span>
                </div>

                <div className="mb-6">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {t("welcomeBack")}
                  </h1>
                  <p className="mt-1 text-sm text-slate-300">
                    {t("signInToAccount")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                      <motion.div
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="rounded-lg border border-red-500/40 bg-red-900/10 px-3 py-2.5 text-sm text-red-400"
                      >
                        {error}
                      </motion.div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200 text-sm">
                      {t("email")}
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10 rounded-xl border-slate-700 bg-slate-950/70 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                          placeholder={t("enterEmail")}
                          required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200 text-sm">
                      {t("password")}
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-10 rounded-xl border-slate-700 bg-slate-950/70 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                          placeholder={t("enterPassword")}
                          required
                      />
                      <button
                          type="button"
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
                          onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* remember + forgot */}
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <label className="flex items-center gap-2">
                      <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-purple-500 focus:ring-purple-500"
                      />
                      <span>{t("rememberMe") || "Remember me"}</span>
                    </label>
                    <Link
                        href="/forgot-password"
                        className="text-purple-300 hover:text-purple-200"
                    >
                      {t("forgotPassword") || "Forgot password?"}
                    </Link>
                  </div>

                  {/* Submit */}
                  <div className="pt-1">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-purple-500/40 hover:brightness-110 disabled:opacity-60"
                    >
                      {loading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                            {t("signingIn")}
                          </>
                      ) : (
                          <>
                            {t("signIn")}
                            <ArrowRight className="h-4 w-4" />
                          </>
                      )}
                    </Button>
                  </div>

                  {/* Switch to register */}
                  <div className="pt-1 text-center text-xs text-slate-400">
                    {t("dontHaveAccount")}{" "}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="font-medium text-purple-300 hover:text-purple-200"
                    >
                      {t("signUp")}
                    </button>
                  </div>
                </form>
              </div>

              {/* Правая колонка: небольшой “side panel” с акцентом */}
              <div className="hidden border-t border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 px-6 py-6 text-xs text-slate-200 md:block">
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {t("nextGenTradingPlatform")}
                </div>
                <p className="mb-4 text-[11px] text-slate-300">
                  {t("joinThousandsDescription")}
                </p>
                <div className="grid gap-3 text-[11px] text-slate-300">
                  <div className="rounded-xl bg-slate-950/70 px-3 py-2">
                    <div className="text-[10px] text-slate-400">
                      {t("activeTraders")}
                    </div>
                    <div className="text-lg font-semibold text-purple-200">
                      20K+
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-950/70 px-3 py-2">
                    <div className="text-[10px] text-slate-400">
                      {t("dailyVolume")}
                    </div>
                    <div className="text-lg font-semibold text-purple-200">
                      $2.5M
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
  );
}
