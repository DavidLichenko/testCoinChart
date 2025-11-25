"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
                               onSuccess = () => {},
                               onSwitchToLogin = () => {},
                             }: RegisterFormProps) {
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("registrationFailed"));
        setLoading(false);
        return;
      }

      onSuccess();
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
        {/* FORM CARD */}
        <motion.div
            initial={{opacity: 0, scale: 0.96}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: 0.35, ease: "easeOut"}}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 px-6 py-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Branding */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center">
              <img src={'/logo.png'} className="h-14 w-14 text-white"/>
            </div>
            <span className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                  ARAGON<br/>TRADE
                </span>
          </div>

          {/* Header */}
          <h1 className="text-xl font-semibold text-white">
            {t("createAccountTitle")}
          </h1>
          <p className="mt-1 mb-6 text-sm text-slate-300">
            {t("createAccountSubtitle")}
          </p>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {/* Error message */}
            {error && (
                <motion.div
                    initial={{opacity: 0, y: -6}}
                    animate={{opacity: 1, y: 0}}
                    className="rounded-lg border border-red-500/40 bg-red-900/10 px-3 py-2.5 text-sm text-red-400"
                >
                  {error}
                </motion.div>
            )}

            {/* Full name */}
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="name">
                {t("fullName")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                <Input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("enterFullName")}
                    className="h-10 rounded-xl border-slate-700 bg-slate-950/70 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="email">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("enterEmail")}
                    className="h-10 rounded-xl border-slate-700 bg-slate-950/70 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="password">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("createPassword")}
                    className="h-10 rounded-xl border-slate-700 bg-slate-950/70 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </Button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <label className="text-sm text-slate-200" htmlFor="confirmPassword">
                {t("confirmPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
                <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("confirmYourPassword")}
                    className="h-10 rounded-xl border-slate-700 bg-slate-950/70 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                      <EyeOff size={16}/>
                  ) : (
                      <Eye size={16}/>
                  )}
                </Button>
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
                    {t("registering")}
                  </>
              ) : (
                  <>
                    {t("register")}
                    <ArrowRight className="h-4 w-4"/>
                  </>
              )}
            </Button>

            {/* Switch to login */}
            <div className="pt-2 text-center text-xs text-slate-400">
              {t("alreadyHaveAccount")}{" "}
              <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-purple-300 hover:text-purple-200"
              >
                {t("signIn")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
  );
}
