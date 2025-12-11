"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, Cpu, Wallet, Gift, ArrowUpCircle, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (!user) return;
    if (user.role !== "OWNER") {
      router.push("/admin");
    }
  }, [user, router]);

  if (!user || user.role !== "OWNER") {
    return null;
  }

  const settingsCategories = [
    {
      title: t("stakingPlans") || "Staking Plans",
      description: "Manage staking plans and APR rates for different assets",
      icon: Coins,
      href: "/admin/settings/staking",
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: t("referralRewards") || "Referral Rewards",
      description: "Configure referral commission and bonus structures",
      icon: Gift,
      href: "/admin/settings/referrals",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: t("withdrawalLimits") || "Withdrawal Limits",
      description: "Set withdrawal limits, fees, and processing times",
      icon: ArrowUpCircle,
      href: "/admin/settings/withdrawals",
      color: "from-orange-500 to-red-500",
    },
    {
      title: t("cryptoAddresses") || "Crypto Addresses",
      description: "Manage deposit addresses for different crypto networks",
      icon: Wallet,
      href: "/admin/settings/crypto",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "AI Trading Tickers",
      description: "Configure tickers available for AI-powered trading",
      icon: Cpu,
      href: "/admin/settings/ai-trading",
      color: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t("platformSettings") || "Platform Settings"}</h1>
            <p className="text-sm text-slate-400">
              {t("manageStakingPlansAiTradingAndCryptoAddresses") || "Manage platform configuration and features"}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link key={category.href} href={category.href}>
              <Card className="group cursor-pointer border-[#252537] bg-[#0b0b14] transition-all hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20">
                <CardHeader>
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                      <ArrowUpCircle className="h-5 w-5 rotate-90" />
                    </div>
                  </div>
                  <CardTitle className="text-lg text-white">{category.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-400">
                    {category.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
