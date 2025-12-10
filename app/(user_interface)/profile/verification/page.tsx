"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  Shield,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast";
import LinkBox from "@/components/link-box";

interface VerificationData {
  status: string; // PENDING, APPROVED, REJECTED
  frontIdUrl?: string;
  backIdUrl?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export default function ProfileVerificationPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Upload states
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile] = useState<File | null>(null);
  const [frontIdPreview, setFrontIdPreview] = useState<string | null>(null);
  const [backIdPreview, setBackIdPreview] = useState<string | null>(null);

  const frontIdRef = useRef<HTMLInputElement>(null);
  const backIdRef = useRef<HTMLInputElement>(null);

  const toCloudinaryPreviewUrl = (url: string | undefined) => {
    if (!url) return null;
    return url.replace("/upload/", "/upload/c_scale,w_400/");
  };

  useEffect(() => {
    const fetchVerificationData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/user/verification");
        if (response.ok) {
          const data = await response.json();
          setVerificationData(data);
          setAddress(data.address || "");
          setCity(data.city || "");
          setPostalCode(data.postalCode || "");

          if (data.frontIdUrl) {
            setFrontIdPreview(toCloudinaryPreviewUrl(data.frontIdUrl));
          }
          if (data.backIdUrl) {
            setBackIdPreview(toCloudinaryPreviewUrl(data.backIdUrl));
          }
        }
      } catch (error) {
        console.error("Error fetching verification data:", error);
        toast({
          title: t("error"),
          description: t("couldNotLoadVerificationData"),
          variant: "destructive" as any,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationData();
  }, [t]);

  const handleFrontIdClick = () => {
    frontIdRef.current?.click();
  };

  const handleBackIdClick = () => {
    backIdRef.current?.click();
  };

  const handleFrontIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontIdPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackIdPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let frontIdUrl = verificationData?.frontIdUrl;
      let backIdUrl = verificationData?.backIdUrl;

      // upload front
      if (frontIdFile) {
        const frontFormData = new FormData();
        frontFormData.append("file", frontIdFile);
        frontFormData.append("upload_preset", "frontend_uploads");

        const frontResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: frontFormData,
            }
        );

        if (frontResponse.ok) {
          const frontData = await frontResponse.json();
          frontIdUrl = frontData.secure_url;
        }
      }

      // upload back
      if (backIdFile) {
        const backFormData = new FormData();
        backFormData.append("file", backIdFile);
        backFormData.append("upload_preset", "frontend_uploads");

        const backResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: backFormData,
            }
        );

        if (backResponse.ok) {
          const backData = await backResponse.json();
          backIdUrl = backData.secure_url;
        }
      }

      const response = await fetch("/api/user/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frontIdUrl,
          backIdUrl,
          address,
          city,
          postalCode,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setVerificationData(updatedData);
        toast({
          title: t("success"),
          description: t("verificationSubmitted"),
        });
      } else {
        throw new Error("Failed to submit verification");
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast({
        title: t("error"),
        description: t("couldNotSubmitVerification"),
        variant: "destructive" as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: t("approved"),
          className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
          description: t("verificationApprovedShort") ?? "",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: t("rejected"),
          className: "bg-rose-500/10 text-rose-300 border-rose-500/30",
          description: t("verificationRejectedShort") ?? "",
        };
      case "PENDING":
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: t("pending"),
          className: "bg-amber-500/10 text-amber-300 border-amber-500/30",
          description: t("verificationPendingShort") ?? "",
        };
    }
  };

  if (loading) {
    return (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-violet-500" />
            <p className="mt-3 text-xs text-slate-500">
              {t("loadingVerificationData")}…
            </p>
          </div>
        </div>
    );
  }

  const statusConfig = getStatusConfig(verificationData?.status || "PENDING");

  return (
      <div className="space-y-6 sm:space-y-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-50 tracking-tight">
              {t("verification")}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl">
              {t("verifyYourIdentityToAccessAllFeatures")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LinkBox
                href="/profile/dashboard"
                name={t("backToDashboard")}
                icon={<ArrowLeft className="h-4 w-4" />}
                color="hover:bg-[#1f2937]"
                bg="bg-[#111827]"
            />
          </div>
        </header>

        {/* Status card */}
        <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
          <CardContent className="px-4 sm:px-5 py-4 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border ${statusConfig.className}`}
                >
                  {statusConfig.icon}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    {t("verificationStatus")}
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {t("currentStatus")}:{" "}
                    <span className="font-medium">{statusConfig.text}</span>
                  </p>
                  {statusConfig.description && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {statusConfig.description}
                      </p>
                  )}
                </div>
              </div>

              <Badge
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium ${statusConfig.className}`}
              >
                {statusConfig.text}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* If already approved – show success block only */}
        {verificationData?.status === "APPROVED" && (
            <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
              <CardContent className="px-4 sm:px-6 py-8 text-center space-y-5">
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
                <div className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                    {t("verificationApproved")}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                    {t("congratulationsYourIdentityHasBeenVerified")}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2.5">
                  <LinkBox
                      href="/market"
                      name={t("startTrading")}
                      icon={<ArrowUpRight className="h-4 w-4" />}
                      color="hover:bg-[#4c1d95]/25"
                      bg="bg-[#4c1d95]/20"
                  />
                  <LinkBox
                      href="/wallet"
                      name={t("openWallet")}
                      icon={<Wallet className="h-4 w-4" />}
                      color="hover:bg-[#059669]/20"
                      bg="bg-[#059669]/15"
                  />
                </div>
              </CardContent>
            </Card>
        )}

        {/* Form (only if not approved) */}
        {verificationData?.status !== "APPROVED" && (
            <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
              <CardHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                <CardTitle className="flex items-center gap-3 text-base sm:text-lg font-semibold text-slate-50">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-violet-500/15 text-violet-300">
                    <Shield className="h-4 w-4" />
                  </div>
                  {t("identityVerification")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-5 pb-5">
                <form
                    id="verification-form"
                    onSubmit={handleSubmit}
                    className="space-y-6 sm:space-y-7"
                >
                  {/* ID uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <Label className="block text-xs sm:text-sm text-slate-400 font-medium mb-2">
                        {t("frontOfId")}
                      </Label>
                      <div
                          className="group rounded-sm border border-dashed border-[#20203a] bg-[#080818]/80 px-4 py-6 sm:px-5 sm:py-7 text-center cursor-pointer transition-colors hover:border-violet-500/70"
                          onClick={handleFrontIdClick}
                      >
                        <input
                            type="file"
                            ref={frontIdRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFrontIdChange}
                        />
                        {frontIdPreview ? (
                            <img
                                src={frontIdPreview}
                                alt="Front ID Preview"
                                className="mx-auto max-h-40 rounded-sm shadow-lg object-contain"
                            />
                        ) : (
                            <>
                              <Upload className="mx-auto mb-3 h-8 w-8 text-slate-600 group-hover:text-slate-400" />
                              <p className="text-xs text-slate-400">
                                {t("uploadFrontId")}
                              </p>
                            </>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="block text-xs sm:text-sm text-slate-400 font-medium mb-2">
                        {t("backOfId")}
                      </Label>
                      <div
                          className="group rounded-sm border border-dashed border-[#20203a] bg-[#080818]/80 px-4 py-6 sm:px-5 sm:py-7 text-center cursor-pointer transition-colors hover:border-violet-500/70"
                          onClick={handleBackIdClick}
                      >
                        <input
                            type="file"
                            ref={backIdRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleBackIdChange}
                        />
                        {backIdPreview ? (
                            <img
                                src={backIdPreview}
                                alt="Back ID Preview"
                                className="mx-auto max-h-40 rounded-sm shadow-lg object-contain"
                            />
                        ) : (
                            <>
                              <Upload className="mx-auto mb-3 h-8 w-8 text-slate-600 group-hover:text-slate-400" />
                              <p className="text-xs text-slate-400">
                                {t("uploadBackId")}
                              </p>
                            </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    <div>
                      <Label
                          htmlFor="address"
                          className="text-xs sm:text-sm text-slate-400 font-medium"
                      >
                        {t("address")}
                      </Label>
                      <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="mt-2 h-9 rounded-sm border border-[#20203a] bg-[#080818]/90 text-slate-50 text-sm"
                          placeholder={t("enterYourAddress")}
                      />
                    </div>

                    <div>
                      <Label
                          htmlFor="city"
                          className="text-xs sm:text-sm text-slate-400 font-medium"
                      >
                        {t("city")}
                      </Label>
                      <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="mt-2 h-9 rounded-sm border border-[#20203a] bg-[#080818]/90 text-slate-50 text-sm"
                          placeholder={t("enterYourCity")}
                      />
                    </div>

                    <div>
                      <Label
                          htmlFor="postalCode"
                          className="text-xs sm:text-sm text-slate-400 font-medium"
                      >
                        {t("postalCode")}
                      </Label>
                      <Input
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="mt-2 h-9 rounded-sm border border-[#20203a] bg-[#080818]/90 text-slate-50 text-sm"
                          placeholder={t("enterPostalCode")}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-sm bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-purple-700 disabled:opacity-70"
                    >
                      {isSubmitting && (
                          <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      )}
                      <span>
                    {isSubmitting
                        ? t("submitting")
                        : t("submitForVerification")}
                  </span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
        )}
      </div>
  );
}
