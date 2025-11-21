"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  User,
  Shield,
  CreditCard,
  FileText,
  Camera,
  LogOut,
  BadgeCheck,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast";
import { useBalance } from "@/hooks/useBalance";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isVerif: boolean;
  verification: {
    status: string; // PENDING, APPROVED, REJECTED
    address?: string;
    city?: string;
    postalCode?: string;
    frontIdUrl?: string;
    backIdUrl?: string;
  } | null;
}

interface Order {
  id: string;
  type: "DEPOSIT" | "WITHDRAW";
  status: string;
  amount: number;
  createdAt: string;
}

const VerificationStatusBadge = ({ status }: { status?: string }) => {
  if (!status) {
    return (
        <Badge
            variant="outline"
            className="inline-flex items-center gap-1 rounded-full border-slate-600 bg-slate-900/70 px-3 py-1 text-xs text-slate-300"
        >
          <Clock className="h-3 w-3 text-slate-400" />
          <span>Not submitted</span>
        </Badge>
    );
  }

  const config = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: <Clock className="w-3 h-3 mr-1" />,
          text: "Pending review",
          cls: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        };
      case "APPROVED":
        return {
          icon: <BadgeCheck className="w-3 h-3 mr-1" />,
          text: "Verified",
          cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="w-3 h-3 mr-1" />,
          text: "Rejected",
          cls: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        };
      default:
        return {
          icon: null,
          text: "Unknown",
          cls: "border-slate-600 bg-slate-900/70 text-slate-300",
        };
    }
  };

  const cfg = config(status);
  return (
      <Badge
          variant="outline"
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${cfg.cls}`}
      >
        {cfg.icon}
        <span>{cfg.text}</span>
      </Badge>
  );
};

type SectionKey = "profile" | "verification" | "withdraw" | "history";

const sections: {
  key: SectionKey;
  icon: React.ComponentType<{ className?: string }>;
  i18nKey: string;
}[] = [
  { key: "profile", icon: User, i18nKey: "profile" },
  { key: "verification", icon: Shield, i18nKey: "verification" },
  { key: "withdraw", icon: CreditCard, i18nKey: "withdraw" },
  { key: "history", icon: FileText, i18nKey: "history" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { balance, liveProfit } = useBalance();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSection, setSelectedSection] =
      useState<SectionKey>("profile");

  // Withdraw form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"crypto" | "bank">(
      "crypto",
  );
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  // Profile form states
  const [name, setName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(lang);

  // Upload states
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile] = useState<File | null>(null);
  const [frontIdPreview, setFrontIdPreview] = useState<string | null>(null);
  const [backIdPreview, setBackIdPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification form states
  const [verificationAddress, setVerificationAddress] = useState("");
  const [verificationCity, setVerificationCity] = useState("");
  const [verificationPostalCode, setVerificationPostalCode] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setSelectedLanguage(lang);
  }, [lang]);

  // 🟣 URL → selectedSection (поддержка ?tab=withdraw)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as SectionKey | null;

    if (
        tab === "profile" ||
        tab === "verification" ||
        tab === "withdraw" ||
        tab === "history"
    ) {
      setSelectedSection(tab);
    }
  }, []);

  const handleSectionChange = (section: SectionKey) => {
    setSelectedSection(section);

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("tab", section);
    router.replace(`/profile?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const profileResponse = await fetch("/api/user/profile");
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile(profileData);
          setName(profileData.name || "");

          if (profileData.verification) {
            setFrontIdPreview(profileData.verification.frontIdUrl || null);
            setBackIdPreview(profileData.verification.backIdUrl || null);
            setVerificationAddress(profileData.verification.address || "");
            setVerificationCity(profileData.verification.city || "");
            setVerificationPostalCode(
                profileData.verification.postalCode || "",
            );
          }
        }

        const ordersResponse = await fetch("/api/orders");
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setTransactions(ordersData.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          title: t("error"),
          description: t("couldNotLoadProfile"),
          variant: "destructive" as any,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [t]);

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        toast({
          title: "✅ " + t("success"),
          description: t("profileUpdated"),
        });
        const updatedProfile = await response.json();
        setUserProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));

        if (selectedLanguage) setLang(selectedLanguage);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "❌ " + t("error"),
        description: t("profileUpdateFailed"),
        variant: "destructive" as any,
      });
    }
  };

  const handleChangePassword = async () => {
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast({
          title: "✅ " + t("success"),
          description: t("passwordUpdated"),
        });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "❌ " + t("error"),
          description: err.error || t("passwordUpdateFailed"),
          variant: "destructive" as any,
        });
      }
    } catch (e) {
      toast({
        title: "❌ " + t("error"),
        description: t("networkError"),
        variant: "destructive" as any,
      });
    }
  };

  const handleFileChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      type: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("fileTooLarge"),
        description: t("selectImageSmallerThan5mb"),
        variant: "destructive" as any,
      });
      return;
    }

    if (type === "front") {
      setFrontIdFile(file);
      setFrontIdPreview(URL.createObjectURL(file));
    } else {
      setBackIdFile(file);
      setBackIdPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitVerification = async () => {
    if (!frontIdFile || !backIdFile) {
      toast({
        title: t("missingDocuments"),
        description: t("uploadBothIdImages"),
        variant: "destructive" as any,
      });
      return;
    }

    if (!verificationAddress || !verificationCity || !verificationPostalCode) {
      toast({
        title: t("missingInformation"),
        description: t("fillAddressCityPostal"),
        variant: "destructive" as any,
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("frontId", frontIdFile);
    formData.append("backId", backIdFile);
    formData.append("address", verificationAddress);
    formData.append("city", verificationCity);
    formData.append("postalCode", verificationPostalCode);

    try {
      const response = await fetch("/api/user/verification", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "✅ " + t("verificationSubmitted"),
          description: t("underReviewUpTo24h"),
        });
        const updatedData = await response.json();
        setUserProfile((prev) =>
            prev
                ? {
                  ...prev,
                  verification: updatedData.verification,
                  isVerif: updatedData.isVerif,
                }
                : null,
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "❌ " + t("submissionFailed"),
          description: errorData.error || t("couldNotSubmitDocs"),
          variant: "destructive" as any,
        });
      }
    } catch (error) {
      toast({
        title: "❌ " + t("networkError"),
        description: t("unexpectedNetworkError"),
        variant: "destructive" as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: t("invalidAmount"),
        description: t("enterValidAmount"),
        variant: "destructive" as any,
      });
      return;
    }
    if (amount > balance + liveProfit) {
      toast({
        title: t("insufficientFunds"),
        description: t("cannotWithdrawMoreThanEquity"),
        variant: "destructive" as any,
      });
      return;
    }

    const withdrawData: any = {
      type: "WITHDRAW",
      amount,
      withdrawMethod,
    };

    if (withdrawMethod === "crypto") {
      withdrawData.cryptoAddress = cryptoAddress;
    } else {
      withdrawData.bankName = bankName;
      withdrawData.cardNumber = cardNumber;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withdrawData),
      });

      if (res.ok) {
        toast({
          title: "✅ " + t("withdrawalRequested"),
          description: t("withdrawalSubmittedForProcessing"),
        });
        setWithdrawAmount("");
      } else {
        const error = await res.json().catch(() => ({}));
        toast({
          title: "❌ " + t("withdrawalFailed"),
          description: error.error || t("unknownError"),
          variant: "destructive" as any,
        });
      }
    } catch (err) {
      toast({
        title: "❌ " + t("networkError"),
        description: t("couldNotSubmitWithdrawal"),
        variant: "destructive" as any,
      });
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">{t("loadingProfile")}...</p>
          </div>
        </div>
    );
  }

  const equity = (balance + liveProfit).toFixed(2);

  return (
      <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="min-h-screen bg-slate-950/95 text-slate-50"
      >
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 py-6 md:flex-row md:py-8 lg:px-0">
          {/* LEFT: Sidebar (Telegram-style) */}
          <aside className="md:w-64 md:flex-shrink-0">
            {/* User card */}
            <Card className="mb-4 bg-slate-900/80 border-slate-800/80 shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-sky-500 shadow-lg shadow-purple-500/30">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {userProfile?.name || t("user")}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {userProfile?.email}
                    </p>
                    <div className="mt-2">
                      <VerificationStatusBadge
                          status={userProfile?.verification?.status}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-xl bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                  <span className="text-slate-400">
                    {t("availableForWithdrawal")}
                  </span>
                    <span className="font-mono font-semibold text-purple-200">
                    ${equity}
                  </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation (Telegram-like) */}
            <Card className="hidden bg-slate-900/80 border-slate-800/80 shadow-sm md:block">
              <CardContent className="p-2">
                <nav className="flex flex-col gap-1">
                  {sections.map((item) => {
                    const Icon = item.icon;
                    const active = selectedSection === item.key;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => handleSectionChange(item.key)}
                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all ${
                                active
                                    ? "bg-gradient-to-r from-purple-600/80 to-indigo-500/80 text-white shadow-md shadow-purple-500/25"
                                    : "text-slate-300 hover:bg-slate-800/70"
                            }`}
                        >
                      <span className="flex items-center gap-2">
                        <Icon
                            className={`h-4 w-4 ${
                                active
                                    ? "text-white"
                                    : "text-slate-400 group-hover:text-slate-100"
                            }`}
                        />
                        <span className="font-medium">
                          {t(item.i18nKey)}
                        </span>
                      </span>
                        </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Mobile top nav */}
            <Card className="bg-slate-900/80 border-slate-800/80 shadow-sm md:hidden">
              <CardContent className="flex gap-2 overflow-x-auto p-2">
                {sections.map((item) => {
                  const Icon = item.icon;
                  const active = selectedSection === item.key;
                  return (
                      <button
                          key={item.key}
                          type="button"
                          onClick={() => handleSectionChange(item.key)}
                          className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs transition ${
                              active
                                  ? "bg-purple-600 text-white shadow-sm"
                                  : "bg-slate-800 text-slate-200"
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{t(item.i18nKey)}</span>
                      </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Logout button at bottom of sidebar (md+) */}
            <div className="mt-4 hidden md:block">
              <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-slate-700 bg-slate-900/80 text-xs text-slate-200 hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-200"
              >
                <LogOut className="h-4 w-4" />
                {t("logoutLabel")}
              </Button>
            </div>
          </aside>

          {/* RIGHT: Main content */}
          <main className="flex-1 space-y-4">
            {/* Section: Profile / Account */}
            {selectedSection === "profile" && (
                <motion.div
                    key="profile-section"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                >
                  <Card className="bg-slate-900/80 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-purple-300" />
                        {t("accountDetails")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                              htmlFor="name"
                              className="text-xs text-slate-300"
                          >
                            {t("name")}
                          </Label>
                          <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                              htmlFor="language"
                              className="text-xs text-slate-300"
                          >
                            {t("language")}
                          </Label>
                          <Select
                              value={selectedLanguage}
                              onValueChange={(v) => setSelectedLanguage(v)}
                          >
                            <SelectTrigger className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-700 bg-slate-900">
                              <SelectItem value="en">
                                {t("english")}
                              </SelectItem>
                              <SelectItem value="es">
                                {t("spanish")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={handleUpdateProfile}
                            className="rounded-xl bg-purple-600 px-5 text-xs font-medium hover:bg-purple-700"
                        >
                          {t("updateProfile")}
                        </Button>
                      </div>

                      <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                          <Shield className="h-4 w-4 text-purple-300" />
                          {t("changePassword")}
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label
                                htmlFor="current-password"
                                className="text-xs text-slate-300"
                            >
                              {t("currentPassword")}
                            </Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                }
                                className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                                htmlFor="new-password"
                                className="text-xs text-slate-300"
                            >
                              {t("newPassword")}
                            </Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={handleChangePassword}
                              className="rounded-xl border-slate-700 bg-slate-900 text-xs text-slate-100 hover:border-purple-500 hover:bg-purple-500/10"
                          >
                            {t("savePassword")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
            )}

            {/* Section: Verification */}
            {selectedSection === "verification" && (
                <motion.div
                    key="verification-section"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                  <Card className="bg-slate-900/80 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="h-4 w-4 text-purple-300" />
                        {t("identityVerification")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                        <p>{t("uploadGovId")}</p>
                        <VerificationStatusBadge
                            status={userProfile?.verification?.status}
                        />
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Front ID */}
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-300">
                            {t("frontId")}
                          </Label>
                          <div className="relative flex h-44 w-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/80">
                            {frontIdPreview ? (
                                <img
                                    src={frontIdPreview}
                                    alt="Front ID Preview"
                                    className="h-full w-full rounded-2xl object-contain"
                                />
                            ) : (
                                <div className="text-center text-xs text-slate-500">
                                  <Camera className="mx-auto h-7 w-7 text-slate-500" />
                                  <p className="mt-2">
                                    {t("clickToUpload")}
                                  </p>
                                </div>
                            )}
                            <Input
                                type="file"
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "front")}
                            />
                          </div>
                        </div>

                        {/* Back ID */}
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-300">
                            {t("backId")}
                          </Label>
                          <div className="relative flex h-44 w-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/80">
                            {backIdPreview ? (
                                <img
                                    src={backIdPreview}
                                    alt="Back ID Preview"
                                    className="h-full w-full rounded-2xl object-contain"
                                />
                            ) : (
                                <div className="text-center text-xs text-slate-500">
                                  <Camera className="mx-auto h-7 w-7 text-slate-500" />
                                  <p className="mt-2">
                                    {t("clickToUpload")}
                                  </p>
                                </div>
                            )}
                            <Input
                                type="file"
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "back")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label
                              htmlFor="verification-address"
                              className="text-xs text-slate-300"
                          >
                            {t("address")}
                          </Label>
                          <Input
                              id="verification-address"
                              value={verificationAddress}
                              onChange={(e) =>
                                  setVerificationAddress(e.target.value)
                              }
                              placeholder={t("enterYourFullAddress")}
                              className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                              htmlFor="verification-city"
                              className="text-xs text-slate-300"
                          >
                            {t("city")}
                          </Label>
                          <Input
                              id="verification-city"
                              value={verificationCity}
                              onChange={(e) =>
                                  setVerificationCity(e.target.value)
                              }
                              placeholder={t("enterYourCity")}
                              className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                              htmlFor="verification-postal"
                              className="text-xs text-slate-300"
                          >
                            {t("postalCode")}
                          </Label>
                          <Input
                              id="verification-postal"
                              value={verificationPostalCode}
                              onChange={(e) =>
                                  setVerificationPostalCode(e.target.value)
                              }
                              placeholder={t("enterPostalCode")}
                              className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                          />
                        </div>
                      </div>

                      <Button
                          onClick={handleSubmitVerification}
                          disabled={
                              isSubmitting ||
                              userProfile?.verification?.status === "APPROVED"
                          }
                          className="rounded-xl bg-purple-600 px-5 text-xs font-medium hover:bg-purple-700"
                      >
                        {isSubmitting
                            ? t("submitting") + "..."
                            : userProfile?.verification?.status === "APPROVED"
                                ? t("verified")
                                : t("submitForReview")}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
            )}

            {/* Section: Withdraw */}
            {selectedSection === "withdraw" && (
                <motion.div
                    key="withdraw-section"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                  <Card className="bg-slate-900/80 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="h-4 w-4 text-purple-300" />
                        {t("withdraw")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="rounded-2xl bg-slate-950/60 px-4 py-3 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span>{t("availableForWithdrawal")}</span>
                          <span className="font-mono text-sm font-semibold text-purple-200">
                        ${equity}
                      </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                            htmlFor="withdraw-amount"
                            className="text-xs text-slate-300"
                        >
                          {t("amountUsd")}
                        </Label>
                        <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-300">
                          {t("method")}
                        </Label>
                        <Select
                            value={withdrawMethod}
                            onValueChange={(v: "crypto" | "bank") =>
                                setWithdrawMethod(v)
                            }
                        >
                          <SelectTrigger className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-900 text-sm">
                            <SelectItem value="crypto">
                              {t("crypto")}
                            </SelectItem>
                            <SelectItem value="bank">
                              {t("bankTransfer")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {withdrawMethod === "crypto" && (
                          <div className="space-y-2">
                            <Label
                                htmlFor="crypto-address"
                                className="text-xs text-slate-300"
                            >
                              {t("cryptoAddressLabel")}
                            </Label>
                            <Input
                                id="crypto-address"
                                placeholder="0x..."
                                value={cryptoAddress}
                                onChange={(e) => setCryptoAddress(e.target.value)}
                                className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                            />
                          </div>
                      )}

                      {withdrawMethod === "bank" && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label
                                  htmlFor="bank-name"
                                  className="text-xs text-slate-300"
                              >
                                {t("bankName")}
                              </Label>
                              <Input
                                  id="bank-name"
                                  placeholder="e.g., Chase"
                                  value={bankName}
                                  onChange={(e) => setBankName(e.target.value)}
                                  className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                  htmlFor="card-number"
                                  className="text-xs text-slate-300"
                              >
                                {t("accountNumber")}
                              </Label>
                              <Input
                                  id="card-number"
                                  placeholder="**** **** **** 1234"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  className="h-9 rounded-xl border-slate-700 bg-slate-900 text-sm"
                              />
                            </div>
                          </div>
                      )}

                      <Button
                          onClick={handleWithdraw}
                          disabled={userProfile?.isVerif !== true}
                          className="rounded-xl bg-purple-600 px-5 text-xs font-medium hover:bg-purple-700"
                      >
                        {userProfile?.isVerif !== true
                            ? t("verificationRequired")
                            : t("submitWithdrawal")}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
            )}

            {/* Section: History */}
            {selectedSection === "history" && (
                <motion.div
                    key="history-section"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                  <Card className="bg-slate-900/80 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-purple-300" />
                        {t("transactionHistory")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {transactions.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs md:text-sm">
                              <thead>
                              <tr className="border-b border-slate-800 text-left text-slate-400">
                                <th className="pb-2 font-medium">
                                  {t("type")}
                                </th>
                                <th className="pb-2 font-medium">
                                  {t("amount")}
                                </th>
                                <th className="pb-2 font-medium">
                                  {t("status")}
                                </th>
                                <th className="pb-2 font-medium">
                                  {t("date")}
                                </th>
                              </tr>
                              </thead>
                              <tbody>
                              {transactions.map((tx) => (
                                  <tr
                                      key={tx.id}
                                      className="border-t border-slate-800 text-slate-200"
                                  >
                                    <td className="py-2">
                                <span
                                    className={`font-semibold ${
                                        tx.type === "DEPOSIT"
                                            ? "text-emerald-300"
                                            : "text-orange-300"
                                    }`}
                                >
                                  {tx.type}
                                </span>
                                    </td>
                                    <td className="py-2">
                                      ${tx.amount.toFixed(2)}
                                    </td>
                                    <td className="py-2">
                                      <Badge className="rounded-full border-slate-700 bg-slate-800/80 text-xs">
                                        {tx.status}
                                      </Badge>
                                    </td>
                                    <td className="py-2 text-slate-400">
                                      {new Date(tx.createdAt).toLocaleString()}
                                    </td>
                                  </tr>
                              ))}
                              </tbody>
                            </table>
                          </div>
                      ) : (
                          <p className="py-4 text-center text-sm text-slate-500">
                            {t("noTransactions")}
                          </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
            )}

            {/* Mobile logout inside main on small screens */}
            <div className="mt-3 md:hidden">
              <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-slate-700 bg-slate-900 text-xs text-slate-200 hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-200"
              >
                <LogOut className="h-4 w-4" />
                {t("logoutLabel")}
              </Button>
            </div>
          </main>
        </div>
      </motion.div>
  );
}
