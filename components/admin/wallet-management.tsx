"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/toast";
import { WalletBalance } from "./wallet-balance-item"; // Reusing the interface

interface WalletManagementProps {
  userId: string;
  walletBalances: WalletBalance[];
  onRefresh: () => void;
}

export function WalletManagement({ userId, walletBalances, onRefresh }: WalletManagementProps) {
  const [selectedAsset, setSelectedAsset] = useState(walletBalances[0]?.assetSymbol || "");
  const [balanceDelta, setBalanceDelta] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [creditUsed, setCreditUsed] = useState("");
  const [lockedDelta, setLockedDelta] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdjustWallet = async () => {
    if (!selectedAsset) {
      toast({
        title: "Error",
        description: "Please select an asset",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/wallets/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          assetSymbol: selectedAsset,
          balanceDelta: balanceDelta ? parseFloat(balanceDelta) : undefined,
          lockedDelta: lockedDelta ? parseFloat(lockedDelta) : undefined,
          creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
          creditUsed: creditUsed ? parseFloat(creditUsed) : undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Wallet updated successfully",
        });
        // Clear form
        setBalanceDelta("");
        setCreditLimit("");
        setCreditUsed("");
        setLockedDelta("");
        // Refresh data
        onRefresh();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update wallet",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Error updating wallet:", e);
      toast({
        title: "Error",
        description: "Failed to update wallet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold mb-3">Adjust Wallet</h3>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Asset</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900 text-sm">
                {walletBalances.map((balance) => (
                  <SelectItem key={balance.id} value={balance.assetSymbol}>
                    {balance.assetSymbol} - {balance.asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Balance Delta</Label>
              <Input
                type="number"
                value={balanceDelta}
                onChange={(e) => setBalanceDelta(e.target.value)}
                placeholder="e.g., 100 or -50"
                className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
              />
              <p className="text-xs text-slate-500">Positive to add, negative to subtract</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Locked Delta</Label>
              <Input
                type="number"
                value={lockedDelta}
                onChange={(e) => setLockedDelta(e.target.value)}
                placeholder="e.g., 100 or -50"
                className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
              />
              <p className="text-xs text-slate-500">Positive to lock, negative to unlock</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Credit Limit</Label>
              <Input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="e.g., 1000"
                className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Credit Used</Label>
              <Input
                type="number"
                value={creditUsed}
                onChange={(e) => setCreditUsed(e.target.value)}
                placeholder="e.g., 500"
                className="h-9 rounded-xl border-slate-800 bg-slate-900 text-sm"
              />
            </div>
          </div>

          <Button
            onClick={handleAdjustWallet}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-600 text-sm font-medium hover:bg-emerald-700"
          >
            {isSubmitting ? "Updating..." : "Update Wallet"}
          </Button>
        </div>
      </div>
    </div>
  );
}