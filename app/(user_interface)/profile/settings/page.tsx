"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  Lock,
  User,
  Phone,
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
import { toast } from "@/components/toast";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isVerif: boolean;
}

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<"USD" | "EUR">("USD");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "es">(lang as "en" | "es");

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
          setEmail(profileData.email || "");
          setBaseCurrency(profileData.baseCurrency || "USD");
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
        body: JSON.stringify({ name, email, baseCurrency, mobileNumber }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        const oldBaseCurrency = baseCurrency;
        
        toast({
          title: "✅ " + t("success"),
          description: t("profileUpdated") || "Profile updated successfully",
        });
        
        setUserProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));
        if (updatedProfile.baseCurrency) {
          setBaseCurrency(updatedProfile.baseCurrency);
        }

        if (selectedLanguage) setLang(selectedLanguage);
        
        // Refresh balance data after currency change
        if (updatedProfile.baseCurrency && updatedProfile.baseCurrency !== oldBaseCurrency) {
          // Reload to refresh balance data
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-900/60 border border-slate-800/60 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-900/60 border border-slate-800/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-50 animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t("settings")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("manageYourPreferences")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-[#1a1a2d] to-[#16162a] border-purple-500/20 rounded-2xl shadow-[0_8px_20px_rgb(0,0,0,0.4),0_0_1px_rgb(139,92,246,0.2)]">
            <CardHeader className="pb-4 border-b border-purple-500/10">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <User className="h-5 w-5 text-purple-400" />
                {t("profileSettings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm text-gray-300 font-medium"
                  >
                    {t("name")}
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl border-purple-500/20 bg-[#13131f] text-sm focus:border-purple-500 focus:ring-purple-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_0_3px_rgba(168,85,247,0.15)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm text-gray-300 font-medium"
                  >
                    {t("email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-purple-500/20 bg-[#13131f] text-sm focus:border-purple-500 focus:ring-purple-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_0_3px_rgba(168,85,247,0.15)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="mobile"
                  className="text-sm text-gray-300 font-medium flex items-center gap-2"
                >
                  <Phone className="h-4 w-4 text-purple-400" />
                  {t("mobileNumber")}
                </Label>
                <div className="phone-input-wrapper">
                  <PhoneInput
                    defaultCountry="us"
                    value={mobileNumber}
                    onChange={(phone) => setMobileNumber(phone)}
                    className="phone-input-custom"
                    inputClassName="phone-input-field"
                    countrySelectorStyleProps={{
                      className: "phone-country-selector",
                      buttonClassName: "phone-country-button",
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="language"
                    className="text-sm text-gray-300 font-medium"
                  >
                    {t("language")}
                  </Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={(v) => setSelectedLanguage(v as "en" | "es")}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-purple-500/20 bg-[#13131f] text-sm focus:border-purple-500 focus:ring-purple-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-purple-500/20 bg-[#1a1a2d] rounded-xl shadow-[0_8px_20px_rgb(0,0,0,0.6)]">
                      <SelectItem value="en">
                        {t("english")}
                      </SelectItem>
                      <SelectItem value="es">
                        {t("spanish")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label
                    htmlFor="baseCurrency"
                    className="text-sm text-gray-300 font-medium"
                  >
                    {t("baseCurrency")}
                  </Label>
                  <Select
                    value={baseCurrency}
                    onValueChange={(v: "USD" | "EUR") => setBaseCurrency(v)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-purple-500/20 bg-[#13131f] text-sm focus:border-purple-500 focus:ring-purple-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <img 
                            src={`/icons/forex_icons/${baseCurrency}.png`} 
                            alt={baseCurrency} 
                            className="h-4 w-4" 
                          />
                          <span>{baseCurrency}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-purple-500/20 bg-[#1a1a2d] rounded-xl shadow-[0_8px_20px_rgb(0,0,0,0.6)]">
                      <SelectItem value="USD">
                        <div className="flex items-center gap-2">
                          <img src="/icons/forex_icons/USD.png" alt="USD" className="h-4 w-4" />
                          <span>USD</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="EUR">
                        <div className="flex items-center gap-2">
                          <img src="/icons/forex_icons/EUR.png" alt="EUR" className="h-4 w-4" />
                          <span>EUR</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  onClick={handleUpdateProfile}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-2.5 font-medium shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] transition-all"
                >
                  {t("updateProfile")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-gradient-to-br from-[#1a1a2d] to-[#16162a] border-purple-500/20 rounded-2xl shadow-[0_8px_20px_rgb(0,0,0,0.4),0_0_1px_rgb(139,92,246,0.2)]">
            <CardHeader className="pb-4 border-b border-purple-500/10">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <Lock className="h-5 w-5 text-purple-400" />
                {t("securitySettings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="">
                <Button variant="outline" className="rounded-xl border-purple-500/30 bg-[#13131f] text-sm text-gray-300 hover:border-purple-500/60 hover:bg-purple-500/10 h-10 px-4 transition-colors shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                  {t("changePassword")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="bg-gradient-to-br from-[#1a1a2d] to-[#16162a] border-purple-500/20 rounded-2xl shadow-[0_8px_20px_rgb(0,0,0,0.4),0_0_1px_rgb(139,92,246,0.2)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500 shadow-[0_4px_14px_rgba(168,85,247,0.5)]">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {userProfile?.name || t("user")}
                  </p>
                  <p className="truncate text-xs text-gray-400 mt-1">
                    {userProfile?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .phone-input-wrapper .react-international-phone-input-container {
          width: 100%;
        }
        
        .phone-input-wrapper .react-international-phone-input {
          height: 44px !important;
          border-radius: 0.75rem !important;
          border: 1px solid rgba(168, 85, 247, 0.2) !important;
          background: #13131f !important;
          font-size: 0.875rem !important;
          color: white !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.4) !important;
        }

        .phone-input-wrapper .react-international-phone-input:focus {
          border-color: rgb(168 85 247) !important;
          ring: 2px !important;
          ring-color: rgb(168 85 247 / 0.2) !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 0 0 3px rgba(168,85,247,0.15) !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-button {
          background: #13131f !important;
          border: none !important;
          border-right: 1px solid rgba(168, 85, 247, 0.2) !important;
          border-radius: 0.75rem 0 0 0.75rem !important;
          height: 44px !important;
          padding: 0 12px !important;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.3) !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-button:hover {
          background: rgb(107 33 168 / 0.15) !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown {
          background: #1a1a2d !important;
          border: 1px solid rgba(168, 85, 247, 0.2) !important;
          border-radius: 0.75rem !important;
          max-height: 300px !important;
          overflow-y: auto !important;
          box-shadow: 0 8px 20px rgb(0,0,0,0.6) !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item {
          color: white !important;
          padding: 8px 12px !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item:hover {
          background: rgb(107 33 168 / 0.15) !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item--selected {
          background: rgb(107 33 168 / 0.25) !important;
        }

        .phone-input-wrapper .react-international-phone-country-selector-dropdown__list-item--focused {
          background: rgb(107 33 168 / 0.2) !important;
        }
      `}</style>
    </div>
  );
}