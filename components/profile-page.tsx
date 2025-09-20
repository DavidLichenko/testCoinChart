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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  if (!status)
    return (
      <Badge variant="secondary" className="w-48 my-1">
        Not Submitted
      </Badge>
    );

  const config = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: <Clock className="w-4 h-4 mr-2" />,
          text: "Pending Review",
          cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        };
      case "APPROVED":
        return {
          icon: <BadgeCheck className="w-4 h-4 mr-2" />,
          text: "Verified",
          cls: "bg-green-500/20 text-green-400 border-green-500/30",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="w-4 h-4 mr-2" />,
          text: "Rejected",
          cls: "bg-red-500/20 text-red-400 border-red-500/30",
        };
      default:
        return {
          icon: null,
          text: "Unknown",
          cls: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        };
    }
  };

  const cfg = config(status);
  return (
    <Badge className={`flex items-center w-48 my-1 ${cfg.cls}`}>
      {cfg.icon}
      <span>{cfg.text}</span>
    </Badge>
  );
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { balance, liveProfit } = useBalance();
  const { t, lang, setLang } = useI18n();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdraw form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("crypto");
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

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const profileResponse = await fetch("/api/user/profile");
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile(profileData);
          setName(profileData.name || "");
          // Pre-fill previews if documents were already uploaded
          if (profileData.verification) {
            setFrontIdPreview(profileData.verification.frontIdUrl);
            setBackIdPreview(profileData.verification.backIdUrl);
            setVerificationAddress(profileData.verification.address || "");
            setVerificationCity(profileData.verification.city || "");
            setVerificationPostalCode(
              profileData.verification.postalCode || ""
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
        setUserProfile((prev) =>
          prev ? { ...prev, ...updatedProfile } : null
        );
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
    type: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
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
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{t("loadingProfile")}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Dashboard Header */}
      <Card className="bg-gray-900/80 backdrop-blur border-gray-800 shadow-xl">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {userProfile?.name || t("user")}
              </h2>
              <p className="text-gray-400 text-sm">{userProfile?.email}</p>
              <div className="mt-2">
                <VerificationStatusBadge
                  status={userProfile?.verification?.status}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 md:text-right">
            <div>
              <p className="text-gray-400 text-sm">
                {t("availableForWithdrawal")}
              </p>
              <p className="text-2xl font-bold">
                ${(balance + liveProfit).toFixed(2)}
              </p>
            </div>
            <Button variant="destructive" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> {t("logout")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2 h-full gap-2 lg:grid-cols-4 bg-gray-800/70 border border-gray-700">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            {t("profile")}
          </TabsTrigger>
          <TabsTrigger value="verification">
            <Shield className="w-4 h-4 mr-2" />
            {t("verification")}
          </TabsTrigger>
          <TabsTrigger value="withdraw">
            <CreditCard className="w-4 h-4 mr-2" />
            {t("withdraw")}
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="w-4 h-4 mr-2" />
            {t("history")}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle>{t("accountDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t("language")}</Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={(v) => setSelectedLanguage(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("english")}</SelectItem>
                      <SelectItem value="es">{t("spanish")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleUpdateProfile}>
                  {t("updateProfile")}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> {t("changePassword")}
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">
                      {t("currentPassword")}
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t("newPassword")}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Button variant="secondary" onClick={handleChangePassword}>
                    {t("savePassword")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="mt-6">
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle>{t("identityVerification")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-400 flex flex-col gap-2">
                {t("uploadGovId")}{" "}
                <VerificationStatusBadge
                  status={userProfile?.verification?.status}
                />
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Front ID */}
                <div className="space-y-2">
                  <Label>{t("frontId")}</Label>
                  <div className="w-full h-48 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center bg-gray-950 relative">
                    {frontIdPreview ? (
                      <img
                        src={frontIdPreview}
                        alt="Front ID Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 mx-auto text-gray-500" />
                        <p className="text-sm text-gray-500 mt-2">
                          {t("clickToUpload")}
                        </p>
                      </div>
                    )}
                    <Input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "front")}
                    />
                  </div>
                </div>
                {/* Back ID */}
                <div className="space-y-2">
                  <Label>{t("backId")}</Label>
                  <div className="w-full h-48 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center bg-gray-950 relative">
                    {backIdPreview ? (
                      <img
                        src={backIdPreview}
                        alt="Back ID Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 mx-auto text-gray-500" />
                        <p className="text-sm text-gray-500 mt-2">
                          {t("clickToUpload")}
                        </p>
                      </div>
                    )}
                    <Input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "back")}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-address">{t("address")}</Label>
                  <Input
                    id="verification-address"
                    value={verificationAddress}
                    onChange={(e) => setVerificationAddress(e.target.value)}
                    placeholder={t("enterYourFullAddress")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verification-city">{t("city")}</Label>
                  <Input
                    id="verification-city"
                    value={verificationCity}
                    onChange={(e) => setVerificationCity(e.target.value)}
                    placeholder={t("enterYourCity")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verification-postal">{t("postalCode")}</Label>
                  <Input
                    id="verification-postal"
                    value={verificationPostalCode}
                    onChange={(e) => setVerificationPostalCode(e.target.value)}
                    placeholder={t("enterPostalCode")}
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmitVerification}
                disabled={
                  isSubmitting ||
                  userProfile?.verification?.status === "APPROVED"
                }
              >
                {isSubmitting
                  ? t("submitting") + "..."
                  : userProfile?.verification?.status === "APPROVED"
                  ? t("verified")
                  : t("submitForReview")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw" className="mt-6">
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle>{t("withdraw")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-400">{t("availableForWithdrawal")}</p>
                <p className="text-2xl font-bold">
                  ${(balance + liveProfit).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">{t("amountUsd")}</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("method")}</Label>
                <Select
                  value={withdrawMethod}
                  onValueChange={setWithdrawMethod}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">{t("crypto")}</SelectItem>
                    <SelectItem value="bank">{t("bankTransfer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {withdrawMethod === "crypto" && (
                <div className="space-y-2">
                  <Label htmlFor="crypto-address">
                    {t("cryptoAddressLabel")}
                  </Label>
                  <Input
                    id="crypto-address"
                    placeholder="0x..."
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                  />
                </div>
              )}
              {withdrawMethod === "bank" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">{t("bankName")}</Label>
                    <Input
                      id="bank-name"
                      placeholder="e.g., Chase"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-number">{t("accountNumber")}</Label>
                    <Input
                      id="card-number"
                      placeholder="**** **** **** 1234"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleWithdraw}
                disabled={userProfile?.isVerif !== true}
              >
                {userProfile?.isVerif !== true
                  ? t("verificationRequired")
                  : t("submitWithdrawal")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-gray-900/80 border-gray-800">
            <CardHeader>
              <CardTitle>{t("transactionHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-left">
                        <th className="pb-2 font-medium">{t("type")}</th>
                        <th className="pb-2 font-medium">{t("amount")}</th>
                        <th className="pb-2 font-medium">{t("status")}</th>
                        <th className="pb-2 font-medium">{t("date")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-t border-gray-800">
                          <td className="py-2 font-semibold {tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-orange-400'}">
                            {tx.type}
                          </td>
                          <td className="py-2">${tx.amount.toFixed(2)}</td>
                          <td className="py-2">
                            <Badge>{tx.status}</Badge>
                          </td>
                          <td className="py-2">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  {t("noTransactions")}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
