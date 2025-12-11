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
import Link from "next/link";

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

// Cloudinary preview helper
const toCloudinaryPreviewUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_auto,q_auto/");
  }
  return url;
};

async function convertHeicToJpeg(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
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
          text: t("unknownStatus"),
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

export default function ProfileMain() {
  const { user, logout } = useAuth();
  const { balance, liveProfit } = useBalance();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile form states
  const [name, setName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "es">(lang as "en" | "es");

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
    setSelectedLanguage(lang as "en" | "es");
  }, [lang]);

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
            setFrontIdPreview(
              toCloudinaryPreviewUrl(profileData.verification.frontIdUrl)
            );
            setBackIdPreview(
              toCloudinaryPreviewUrl(profileData.verification.backIdUrl)
            );
            setVerificationAddress(profileData.verification.address || "");
            setVerificationCity(profileData.verification.city || "");
            setVerificationPostalCode(profileData.verification.postalCode || "");
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

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Сохраняем файл
    if (type === "front") setFrontIdFile(file);
    else setBackIdFile(file);

    const ext = file.name.toLowerCase();

    // Если это HEIC — пробуем сделать JPEG превью
    if (ext.endsWith(".heic") || file.type === "image/heic") {
      try {
        const jpgPreview = await convertHeicToJpeg(file);
        if (type === "front") setFrontIdPreview(jpgPreview);
        else setBackIdPreview(jpgPreview);
        return;
      } catch (e) {
        console.error("HEIC convert error → fallback to ObjectURL", e);
      }
    }

    // Иначе обычный превью
    if (type === "front") setFrontIdPreview(URL.createObjectURL(file));
    else setBackIdPreview(URL.createObjectURL(file));
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
            }
            : null
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
        {/* LEFT: Sidebar (minimalistic loft with accent colors) */}
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
        </aside>

        {/* RIGHT: Main content */}
        <main className="flex-1 space-y-4">
          {/* Section: Profile / Account */}
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
                      onValueChange={(v) => setSelectedLanguage(v as "en" | "es")}
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
        </main>
      </div>
    </motion.div>
  );
}