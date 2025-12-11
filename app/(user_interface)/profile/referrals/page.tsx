"use client";

import { ReferralSystem } from "../components/referral-system";
import { useI18n } from "@/components/i18n-provider";

export default function ReferralsPage() {
  const { t } = useI18n();
  
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t("referrals") || "Referrals"}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("inviteFriendsAndEarnRewards") || "Invite friends and earn rewards"}</p>
      </div>
      <ReferralSystem />
    </div>
  );
}