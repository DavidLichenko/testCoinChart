"use client";

import { ReferralSystem } from "../components/referral-system";

export default function ReferralsPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Referrals</h1>
        <p className="text-gray-500 text-sm mt-1">Invite friends and earn rewards</p>
      </div>
      <ReferralSystem />
    </div>
  );
}