"use client";

import { AdminSettingsLayout } from "@/components/admin/settings-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";

export default function ReferralSettingsPage() {
  return (
    <AdminSettingsLayout
      title="Referral Rewards"
      description="Configure referral commission percentages (currently set to 7% of trade profits)"
    >
      <Card className="border-[#252537] bg-[#0b0b14]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-purple-400" />
            Referral System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <Gift className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-emerald-300">Active Referral Reward</h3>
                <p className="mt-1 text-sm text-emerald-200/80">
                  Referrers receive <span className="font-bold">7%</span> of their referral's trade profits automatically.
                </p>
                <p className="mt-2 text-xs text-emerald-300/60">
                  This percentage is configured in the database via the TRADE_PROFIT referral reward.
                  The system automatically calculates and credits rewards when referred users close profitable trades.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300">How It Works:</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>User A invites User B using their referral link/code</span>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>User B registers and starts trading</span>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>When User B closes a profitable trade, User A automatically receives 7% of that profit</span>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Rewards are credited instantly to User A's wallet in their base currency</span>
              </div>
              <div className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>Currency conversion is handled automatically using FxRate</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <h4 className="font-semibold text-amber-300">Database Configuration</h4>
            <p className="mt-2 text-sm text-amber-200/80">
              To modify the percentage, update the <code className="rounded bg-amber-900/30 px-1 py-0.5">rewardPercent</code> field
              in the ReferralReward record where <code className="rounded bg-amber-900/30 px-1 py-0.5">action = 'TRADE_PROFIT'</code>.
            </p>
            <p className="mt-2 text-xs text-amber-300/60">
              The reward processing logic is located in <code className="rounded bg-amber-900/30 px-1 py-0.5">lib/referral-rewards.ts</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </AdminSettingsLayout>
  );  
}
