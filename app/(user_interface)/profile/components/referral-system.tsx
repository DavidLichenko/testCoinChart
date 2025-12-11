"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  Users,
  Wallet,
  Gift,
  Copy,
  Share2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast";
import { Input } from "@/components/ui/input";

interface ReferredUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  hasMadeDeposit: boolean;
}

interface Referral {
  id: string;
  referredUser: ReferredUser;
  rewardAmount: number;
  status: string;
  createdAt: string;
}

export function ReferralSystem() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    totalEarnings: 0,
    qualified: 0,
    pendingBonus: 0,
  });
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Fetch user profile to get referral code
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setReferralCode(data.referralCode || "");
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    };
    fetchProfile();
  }, []);

  // безопасно соберём ссылку с реферальным кодом
  useEffect(() => {
    if (typeof window !== "undefined" && referralCode) {
      setReferralLink(`${window.location.origin}/register?ref=${referralCode}`);
    } else if (typeof window !== "undefined" && user?.id) {
      setReferralLink(`${window.location.origin}/register?ref=${user.id}`);
    }
  }, [user?.id, referralCode]);

  useEffect(() => {
    const fetchReferralsData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/referrals");
        if (!response.ok) throw new Error("Failed to fetch referrals");

        const data = await response.json();
        setReferrals(data.referrals);
        setStats(data.stats);
        if (data.rewards) {
          setRewards(data.rewards);
        }
      } catch (error) {
        console.error("Error fetching referrals data:", error);
        toast({
          title: t("error"),
          description: t("couldNotLoadReferrals"),
          variant: "destructive" as any,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReferralsData();
  }, [t]);

  const totalReferrals = stats.total;
  const qualifiedReferrals = stats.qualified;
  const pendingReferrals = Math.max(0, totalReferrals - qualifiedReferrals);
  const totalEarnings = stats.totalEarnings;

  const copyToClipboard = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: t("copied"),
      description: t("referralLinkCopied"),
    });
    setTimeout(() => setCopied(false), 1800);
  };

  const copyCodeToClipboard = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCodeCopied(true);
    toast({
      title: t("copied"),
      description: t("referralCodeCopied") || "Referral code copied to clipboard",
    });
    setTimeout(() => setCodeCopied(false), 1800);
  };

  const shareReferralLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("joinAragonTrade"),
          text: t("referralShareMessage"),
          url: referralLink,
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const statusBadgeClass = (status: string) => {
    if (status === "QUALIFIED")
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";
    if (status === "PENDING")
      return "bg-amber-500/10 text-amber-300 border-amber-500/40";
    return "bg-slate-700/40 text-slate-300 border-slate-600/40";
  };

  const eligibleBadgeClass = (hasDeposit: boolean) =>
      hasDeposit
          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
          : "bg-slate-700/40 text-slate-300 border-slate-600/40";

  if (loading) {
    return (
        <div className="flex min-h-[260px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-t-2 border-violet-500" />
            <p className="text-xs text-slate-400">{t("loading")}...</p>
          </div>
        </div>
    );
  }

  const hasReferrals = referrals.length > 0;

  return (
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-5 px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-0 lg:py-0">
        {/* Верхний баннер + короткая статистика в нём */}
        <Card className="rounded-lg border-[#252537] bg-[linear-gradient(135deg,#ff7a3c_0%,#f43f5e_35%,#7c3aed_100%)] text-white shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
          <CardContent className="flex flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                  <Gift className="h-3.5 w-3.5" />
                  {t("inviteAndEarn")}
                </p>
                <h1 className="text-xl font-semibold sm:text-2xl">
                  {t("referralHeroTitle")}
                </h1>
                <p className="max-w-xl text-xs text-white/80 sm:text-sm">
                  {t("referralHeroSubtitle")}
                </p>
              </div>

              {/* справа компактный блок метрик */}
              <div className="grid min-w-[220px] grid-cols-3 gap-2 rounded-lg bg-black/25 p-2 text-center text-xs">
                <div className="space-y-1 rounded-md bg-black/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-white/60">
                    {t("invited")}
                  </p>
                  <p className="text-lg font-semibold">{totalReferrals}</p>
                </div>
                <div className="space-y-1 rounded-md bg-black/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-white/60">
                    {t("qualified")}
                  </p>
                  <p className="text-lg font-semibold">{qualifiedReferrals}</p>
                </div>
                <div className="space-y-1 rounded-md bg-black/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-white/60">
                    {t("pending")}
                  </p>
                  <p className="text-lg font-semibold">{pendingReferrals}</p>
                </div>
              </div>
            </div>

            {/* Referral link bar как у лутрана */}
            <div className="flex flex-col gap-3 rounded-lg bg-black/25 px-3 py-3 sm:flex-row sm:items-center">
              <div className="flex-1 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-white/70">
                  {t("yourReferralLink")}
                </p>
                <Input
                    value={referralLink}
                    readOnly
                    className="h-9 w-full rounded-md border-transparent bg-black/40 text-xs text-white placeholder:text-white/30"
                />
              </div>
              <div className="flex gap-2 pt-1 sm:pt-0">
                <Button
                    size="sm"
                    className="flex-1 rounded-md bg-white text-[11px] font-semibold text-[#111827] hover:bg-slate-100"
                    onClick={copyToClipboard}
                >
                  {copied ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        {t("copied")}
                      </>
                  ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        {t("copy")}
                      </>
                  )}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="hidden rounded-md border-white/40 bg-black/40 text-[11px] font-semibold text-white hover:bg-white/10 sm:flex"
                    onClick={shareReferralLink}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  {t("share")}
                </Button>
              </div>
            </div>

            {/* Referral Code */}
            {referralCode && (
              <div className="flex flex-col gap-3 rounded-lg bg-black/25 px-3 py-3 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-white/70">
                    {t("yourReferralCode") || "Your Referral Code"}
                  </p>
                  <Input
                      value={referralCode}
                      readOnly
                      className="h-9 w-full rounded-md border-transparent bg-black/40 text-xs text-white placeholder:text-white/30 font-mono text-center font-bold"
                  />
                </div>
                <div className="flex gap-2 pt-1 sm:pt-0">
                  <Button
                      size="sm"
                      className="flex-1 rounded-md bg-white text-[11px] font-semibold text-[#111827] hover:bg-slate-100"
                      onClick={copyCodeToClipboard}
                  >
                    {codeCopied ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          {t("copied")}
                        </>
                    ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          {t("copy")}
                        </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Средний блок: условия и ключевые цифры (в стиле "Terms") */}
        <Card className="rounded-lg border-[#252537] bg-[#0b0b14]">
          <CardHeader className="border-b border-[#252537] px-4 py-3 sm:px-6">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-100">
              <span>{t("terms")}</span>
              <span className="text-[11px] text-emerald-300">
              {t("verifiedPayouts")}
            </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-4 sm:px-6">
            {rewards.length > 0 ? (
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between rounded-lg border border-[#252537] bg-[#151520] px-3 py-2.5"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-100">
                        {reward.actionLabel}
                      </p>
                      {reward.description && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {reward.description}
                        </p>
                      )}
                      {reward.threshold && (
                        <p className="mt-1 text-[10px] text-slate-500">
                          Minimum: {reward.rewardCurrency === "EUR" ? "€" : "$"}
                          {reward.threshold.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        +{reward.rewardCurrency === "EUR" ? "€" : "$"}
                        {reward.rewardAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-400">
                <p>• {t("referralRewardSignup") || "Get $10 when someone signs up using your link"}</p>
                <p>• {t("referralRewardDeposit") || "Get $40 bonus when they deposit $500+"}</p>
              </div>
            )}
          </CardContent>
          <CardContent className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
            {/* верхняя полоса-баннер под условия выплаты */}
            <div className="flex items-center justify-between gap-3 rounded-md bg-[linear-gradient(90deg,#1e293b,#020617)] px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/15">
                  <Wallet className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {t("youWillReceiveReward")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t("oneRewardPerQualifiedFriend")}
                  </p>
                </div>
              </div>
              <div className="hidden flex-col items-end text-right text-xs text-slate-300 sm:flex">
              <span className="font-semibold">
                ${stats.pendingBonus.toFixed(2)} {t("pending")}
              </span>
                <span className="text-[11px] text-slate-500">
                ${totalEarnings.toFixed(2)} {t("totalEarned")}
              </span>
              </div>
            </div>

            {/* два блока: что нужно тебе и другу */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-md bg-[#10101a] px-3 py-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span>{t("whatIsRequiredFromYou")}</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li>• {t("completeVerificationAndKYC")}</li>
                  <li>• {t("followPlatformRules")}</li>
                  <li>• {t("withdrawalsAfterVerificationOnly")}</li>
                </ul>
              </div>
              <div className="space-y-2 rounded-md bg-[#10101a] px-3 py-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Users className="h-4 w-4 text-violet-300" />
                  <span>{t("requiredFromFriend")}</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li>• {t("friendMustRegisterWithLink")}</li>
                  <li>• {t("friendMustVerifyAndDeposit")}</li>
                  <li>• {t("friendMustStartTrading")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список приглашённых */}
        <Card className="rounded-lg border-[#252537] bg-[#0b0b14]">
          <CardHeader className="border-b border-[#252537] px-4 py-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Users className="h-4 w-4 text-violet-300" />
              {t("listOfInvited")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-4">
            {hasReferrals ? (
                <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="sticky top-0 z-10 bg-[#0b0b14]">
                    <tr className="border-b border-[#252537] text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2 text-left sm:px-6">
                        {t("name")}
                      </th>
                      <th className="px-4 py-2 text-left sm:px-6">
                        {t("email")}
                      </th>
                      <th className="px-4 py-2 text-left sm:px-6">
                        {t("reward")}
                      </th>
                      <th className="px-4 py-2 text-left sm:px-6">
                        {t("status")}
                      </th>
                      <th className="px-4 py-2 text-left sm:px-6">
                        {t("bonusEligible")}
                      </th>
                      <th className="px-4 py-2 text-left sm:px-6">
                        {t("date")}
                      </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#191927]">
                    {referrals.map((referral) => (
                        <tr
                            key={referral.id}
                            className="hover:bg-[#11111d] transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-100 sm:px-6">
                            {referral.referredUser.name || t("unnamed")}
                          </td>
                          <td className="px-4 py-3 text-slate-400 sm:px-6">
                            {referral.referredUser.email}
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-300 sm:px-6">
                            ${referral.rewardAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <Badge
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusBadgeClass(
                                    referral.status
                                )}`}
                            >
                              {t(referral.status.toLowerCase())}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <Badge
                                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${eligibleBadgeClass(
                                    referral.referredUser.hasMadeDeposit
                                )}`}
                            >
                              {referral.referredUser.hasMadeDeposit
                                  ? t("eligible")
                                  : t("notEligible")}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-400 sm:px-6">
                            {new Date(
                                referral.createdAt
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10101a]">
                    <Gift className="h-7 w-7 text-slate-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-100">
                    {t("noReferralsYet")}
                  </h3>
                  <p className="max-w-sm text-xs text-slate-500">
                    {t("shareYourLinkToStartEarning")}
                  </p>
                  {referralLink && (
                      <div className="mt-2 text-[11px] text-emerald-300">
                        {referralLink}
                      </div>
                  )}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
