"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/toast";
import { Plus, Minus, Wallet } from "lucide-react";
import { WalletBalance } from "./wallet-balance-item";
import { useI18n } from "@/components/i18n-provider";

interface WalletManagementProps {
  userId: string;
  walletBalances: WalletBalance[];
  onRefresh: () => void;
  baseCurrency?: "USD" | "EUR";
}

export function WalletManagement({ userId, walletBalances, onRefresh, baseCurrency = "USD" }: WalletManagementProps) {
  const { t } = useI18n("admin");
  // Find base currency balance or use first one
  const baseBalance = walletBalances.find(b => b.assetSymbol === baseCurrency) || walletBalances[0];
  const [selectedAsset, setSelectedAsset] = useState(baseBalance?.assetSymbol || "");
  
  // Balance change states
  const [balanceValue, setBalanceValue] = useState("");
  const [balanceOperation, setBalanceOperation] = useState<"add" | "subtract" | "set">("set");
  const [showBalanceInput, setShowBalanceInput] = useState(false);
  
  // Credit balance state
  const [creditBalanceValue, setCreditBalanceValue] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selected asset when base currency changes
  useEffect(() => {
    if (baseBalance) {
      setSelectedAsset(baseBalance.assetSymbol);
    }
  }, [baseCurrency, baseBalance]);

  const selectedBalance = walletBalances.find(b => b.assetSymbol === selectedAsset);

  // Initialize balance value when selected balance changes
  useEffect(() => {
    if (selectedBalance) {
      setBalanceValue(selectedBalance.ownBalance.toString());
      setCreditBalanceValue(selectedBalance.creditBalance?.toString() || "0");
    }
  }, [selectedBalance]);

  const handleAdjustWallet = async () => {
    if (!selectedAsset) {
      toast({
        title: t("error") || "Error",
        description: t("pleaseSelectAsset") || "Please select an asset",
        variant: "destructive",
      });
      return;
    }

    if (showBalanceInput && !balanceValue) {
      toast({
        title: t("error") || "Error",
        description: t("pleaseEnterBalance") || "Please enter a balance value",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let balanceDelta: number | undefined;
      
      if (showBalanceInput && balanceValue) {
        const numValue = parseFloat(balanceValue);
        if (isNaN(numValue)) {
          toast({
            title: t("error") || "Error",
            description: t("invalidBalanceValue") || "Invalid balance value",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        if (balanceOperation === "add") {
          balanceDelta = numValue;
        } else if (balanceOperation === "subtract") {
          balanceDelta = -numValue;
        } else {
          // Set operation - calculate delta from current balance
          const currentBalance = selectedBalance?.ownBalance || 0;
          balanceDelta = numValue - currentBalance;
        }
      }

      const res = await fetch("/api/admin/wallets/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          assetSymbol: selectedAsset,
          balanceDelta,
          creditBalance: creditBalanceValue ? parseFloat(creditBalanceValue) : undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: t("success") || "Success",
          description: "Wallet updated successfully",
        });
        // Clear form
        setBalanceValue("");
        setCreditBalanceValue("");
        setBalanceOperation("set");
        setShowBalanceInput(false);
        // Refresh data
        onRefresh();
      } else {
        const error = await res.json();
        toast({
          title: t("error") || "Error",
          description: error.error || t("walletUpdateFailed") || "Failed to update wallet",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Error updating wallet:", e);
      toast({
        title: t("error") || "Error",
        description: t("walletUpdateFailed") || "Failed to update wallet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Asset Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-300">{t("asset")}</Label>
        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
          <SelectTrigger className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm">
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
        {selectedBalance && (
          <div className="text-xs text-slate-400 mt-1">
            {t("currentBalance")}: <span className="font-semibold text-slate-300">{selectedBalance.ownBalance.toFixed(2)} {selectedAsset}</span>
          </div>
        )}
      </div>

      {/* Balance Change Section */}
      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {t("balance")}
          </Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={`h-7 w-7 p-0 rounded-lg ${
                balanceOperation === "subtract" ? "bg-rose-500/20 text-rose-400" : "text-slate-400 hover:text-slate-300"
              }`}
              onClick={() => {
                setBalanceOperation("subtract");
                setShowBalanceInput(true);
              }}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={`h-7 w-7 p-0 rounded-lg ${
                balanceOperation === "add" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-slate-300"
              }`}
              onClick={() => {
                setBalanceOperation("add");
                setShowBalanceInput(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {showBalanceInput ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={balanceValue}
                onChange={(e) => setBalanceValue(e.target.value)}
                placeholder={balanceOperation === "set" ? t("newBalance") : balanceOperation === "add" ? t("amountToAdd") : t("amountToSubtract")}
                className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm flex-1"
                step="0.01"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-10 px-3 text-slate-400 hover:text-slate-300"
                onClick={() => {
                  setShowBalanceInput(false);
                  setBalanceValue("");
                  setBalanceOperation("set");
                }}
              >
                ×
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className={`px-2 py-1 rounded ${
                balanceOperation === "add" ? "bg-emerald-500/20 text-emerald-400" :
                balanceOperation === "subtract" ? "bg-rose-500/20 text-rose-400" :
                "bg-blue-500/20 text-blue-400"
              }`}>
                {balanceOperation === "add" ? t("adding") : balanceOperation === "subtract" ? t("subtracting") : t("setting")}
              </div>
              {balanceValue && selectedBalance && balanceOperation !== "set" && (
                <span className="text-slate-400">
                  {t("newBalance")}: {
                    (balanceOperation === "add" 
                      ? selectedBalance.ownBalance + parseFloat(balanceValue || "0")
                      : selectedBalance.ownBalance - parseFloat(balanceValue || "0")
                    ).toFixed(2)
                  } {selectedAsset}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            {t("clickToAddOrSubtract")}
          </div>
        )}

        {/* Direct set input (when neither + nor - is selected) */}
        {!showBalanceInput && (
          <Input
            type="number"
            value={balanceValue}
            onChange={(e) => {
              setBalanceValue(e.target.value);
              setBalanceOperation("set");
            }}
            placeholder={t("enterNewBalance")}
            className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm"
            step="0.01"
          />
        )}
        {selectedBalance && (
          <div className="text-xs text-slate-400 mt-1">
            {t("currentBalance")}: <span className="font-semibold text-slate-300">{selectedBalance.ownBalance.toFixed(2)} {selectedAsset}</span>
          </div>
        )}
      </div>

      {/* Credit Balance Section */}
      <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <Label className="text-sm font-semibold text-slate-200">
          {t("creditBalance")}
        </Label>
        <Input
          type="number"
          value={creditBalanceValue}
          onChange={(e) => setCreditBalanceValue(e.target.value)}
          placeholder={t("enterCreditBalance") || "Enter credit balance"}
          className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm"
          step="0.01"
        />
        {selectedBalance && (
          <div className="text-xs text-slate-400">
            {t("current")}: <span className="font-semibold text-slate-300">{(selectedBalance.creditBalance || 0).toFixed(2)} {selectedAsset}</span>
          </div>
        )}
      </div>

      <Button
        onClick={handleAdjustWallet}
        disabled={isSubmitting || (!showBalanceInput && !balanceValue)}
        className="w-full rounded-lg bg-emerald-600 text-sm font-medium hover:bg-emerald-700 h-10"
      >
        {isSubmitting ? t("updating") : t("updateWallet")}
      </Button>
    </div>
  );
}
