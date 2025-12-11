"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  Bell,
  Globe,
  Lock,
  Mail,
  User,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/toast";

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
  const [baseCurrency, setBaseCurrency] = useState<"USD" | "EUR">("USD");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "es">(lang as "en" | "es");

  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);

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
        body: JSON.stringify({ name, email, baseCurrency }),
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

  const handleSaveSettings = async () => {
    try {
      // In a real implementation, this would save settings to the backend
      toast({
        title: "✅ " + t("success"),
        description: t("settingsSaved"),
      });
    } catch (error) {
      toast({
        title: "❌ " + t("error"),
        description: t("settingsSaveFailed"),
        variant: "destructive" as any,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t("loadingSettings")}...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen text-gray-50 p-4 sm:p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t("settings")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("manageYourPreferences")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <User className="h-5 w-5 text-violet-400" />
                {t("profileSettings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm text-gray-400 font-medium"
                  >
                    {t("name")}
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl border-gray-800 bg-gray-900/70 text-sm shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm text-gray-400 font-medium"
                  >
                    {t("email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-gray-800 bg-gray-900/70 text-sm shadow-inner"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="language"
                    className="text-sm text-gray-400 font-medium"
                  >
                    {t("language")}
                  </Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={(v) => setSelectedLanguage(v as "en" | "es")}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-800 bg-gray-900/70 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-800 bg-gray-900 rounded-xl">
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
                    className="text-sm text-gray-400 font-medium"
                  >
                    {t("baseCurrency") || "Base Currency"}
                  </Label>
                  <Select
                    value={baseCurrency}
                    onValueChange={(v: "USD" | "EUR") => setBaseCurrency(v)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-800 bg-gray-900/70 text-sm">
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
                    <SelectContent className="border-gray-800 bg-gray-900 rounded-xl">
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

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={handleUpdateProfile}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-5 py-2 font-medium shadow-lg shadow-violet-500/30"
                >
                  {t("updateProfile")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <Bell className="h-5 w-5 text-violet-400" />
                {t("notificationSettings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/70 border border-gray-800/60">
                <div>
                  <div className="text-sm font-medium text-gray-300">
                    {t("pushNotifications")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t("receivePushNotifications")}
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/70 border border-gray-800/60">
                <div>
                  <div className="text-sm font-medium text-gray-300">
                    {t("emailNotifications")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t("receiveEmailNotifications")}
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/70 border border-gray-800/60">
                <div>
                  <div className="text-sm font-medium text-gray-300">
                    {t("soundNotifications")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t("playSoundForNotifications")}
                  </div>
                </div>
                <Switch
                  checked={soundNotifications}
                  onCheckedChange={setSoundNotifications}
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <Lock className="h-5 w-5 text-violet-400" />
                {t("securitySettings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pt-2">
                <Button variant="outline" className="rounded-xl border-gray-800 bg-gray-900/70 text-sm text-gray-300 hover:border-violet-500/60 hover:bg-violet-500/20 h-10 px-4">
                  {t("changePassword")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {userProfile?.name || t("user")}
                  </p>
                  <p className="truncate text-xs text-gray-500 mt-1">
                    {userProfile?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                {t("quickActions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-xl border-gray-800 bg-gray-900/70 text-sm text-gray-300 hover:border-violet-500/60 hover:bg-violet-500/20 h-10"
              >
                <Mail className="h-4 w-4 mr-2" />
                {t("contactSupport")}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-xl border-gray-800 bg-gray-900/70 text-sm text-gray-300 hover:border-violet-500/60 hover:bg-violet-500/20 h-10"
              >
                <Globe className="h-4 w-4 mr-2" />
                {t("languagePreferences")}
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="sticky top-6">
            <Button 
              onClick={handleSaveSettings}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-5 py-2 font-medium shadow-lg shadow-violet-500/30"
            >
              {t("saveSettings")}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}