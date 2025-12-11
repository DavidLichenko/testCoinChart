"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { useBalance } from "@/hooks/useBalance";
import {
  CreditCard,
  Wallet,
  ArrowUpCircle,
  Coins,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast";
import { AnimatedNumber } from "@/components/animated-number";

interface WithdrawalLimit {
  id: string;
  method: string;
  minAmount: number;
  maxAmount: number | null;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  fee: number;
  feePercent: number | null;
  processingTime: string | null;
  isActive: boolean;
}

interface WalletAsset {
  symbol: string;
  name: string;
  balance: number;
  ownBalance: number;
}

export default function ProfileWithdrawPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { balance, details, refetchBalance } = useBalance();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdrawal form states
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"CARD" | "CRYPTO" | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [selectedCryptoAsset, setSelectedCryptoAsset] = useState<string>("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [availableNetworks, setAvailableNetworks] = useState<string[]>([]);

  // Data
  const [limits, setLimits] = useState<WithdrawalLimit[]>([]);
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [usedToday, setUsedToday] = useState(0);
  const [usedThisMonth, setUsedThisMonth] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch withdrawal limits
        const limitsRes = await fetch("/api/withdrawal/limits");
        if (limitsRes.ok) {
          const limitsData = await limitsRes.json();
          setLimits(limitsData.filter((l: WithdrawalLimit) => l.isActive));
        }

        // Fetch wallet assets
        const assetsRes = await fetch("/api/wallet/assets");
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          setAssets(assetsData.filter((a: WalletAsset) => a.ownBalance > 0));
          if (assetsData.length > 0 && !selectedAsset) {
            const baseAsset = assetsData.find((a: WalletAsset) => 
              a.symbol === (details?.baseCurrency || "USD")
            );
            setSelectedAsset(baseAsset?.symbol || assetsData[0].symbol);
          }
        }

        // Fetch used withdrawal amounts
        const usedRes = await fetch("/api/withdrawal/used");
        if (usedRes.ok) {
          const usedData = await usedRes.json();
          setUsedToday(usedData.today || 0);
          setUsedThisMonth(usedData.month || 0);
        }

        // Fetch available networks for crypto withdrawal
        const networksRes = await fetch("/api/wallet/deposit-addresses");
        if (networksRes.ok) {
          const networksData = await networksRes.json();
          const networks = [...new Set(networksData.map((n: any) => n.network))];
          setAvailableNetworks(networks);
        }
      } catch (error) {
        console.error("Error fetching withdrawal data:", error);
        toast({
          title: t("error"),
          description: t("failedToLoadWithdrawalData"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [details?.baseCurrency, t]);

  const selectedLimit = limits.find(l => l.method === selectedMethod);
  const selectedAssetData = assets.find(a => a.symbol === selectedAsset);
  const availableBalance = selectedAssetData?.ownBalance || 0;

  const calculateFee = (amount: number) => {
    if (!selectedLimit) return 0;
    const fixedFee = selectedLimit.fee || 0;
    const percentFee = selectedLimit.feePercent 
      ? (amount * selectedLimit.feePercent) / 100 
      : 0;
    return fixedFee + percentFee;
  };

  const handleSubmit = async () => {
    if (!amount || !selectedMethod || !selectedAsset) {
      toast({
        title: t("missingInformation"),
        description: t("pleaseFillAllRequiredFields"),
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: t("invalidAmount"),
        description: t("pleaseEnterValidAmount"),
        variant: "destructive",
      });
      return;
    }

    if (!selectedLimit) {
      toast({
        title: t("error"),
        description: t("selectedMethodNotAvailable"),
        variant: "destructive",
      });
      return;
    }

    // Check limits
    if (amountNum < selectedLimit.minAmount) {
      toast({
        title: t("amountTooLowTitle"),
        description: `${t("minimumAmountIs")} ${selectedLimit.minAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedLimit.maxAmount && amountNum > selectedLimit.maxAmount) {
      toast({
        title: t("amountTooHighTitle"),
        description: `${t("maximumAmountIs")} ${selectedLimit.maxAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedLimit.dailyLimit && (usedToday + amountNum) > selectedLimit.dailyLimit) {
      toast({
        title: t("dailyLimitExceededTitle"),
        description: `${t("dailyLimitIs")} ${selectedLimit.dailyLimit.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (amountNum > availableBalance) {
      toast({
        title: t("insufficientFundsTitle"),
        description: `${t("availableBalance")}: ${availableBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedMethod === "CRYPTO" && (!selectedCryptoAsset || !cryptoAddress || !cryptoNetwork)) {
      toast({
        title: t("missingInformation") || "Missing information",
        description: t("pleaseEnterCryptoAddress") || "Please select crypto asset, network and enter address",
        variant: "destructive",
      });
      return;
    }

    if (selectedMethod === "CARD" && (!cardNumber || !cardHolder)) {
      toast({
        title: t("missingInformation") || "Missing information",
        description: t("pleaseEnterCardDetails") || "Please enter card details",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          method: selectedMethod,
          assetSymbol: selectedMethod === "CARD" ? selectedAsset : selectedCryptoAsset,
          cardNumber: selectedMethod === "CARD" ? cardNumber : null,
          cardHolder: selectedMethod === "CARD" ? cardHolder : null,
          cryptoAddress: selectedMethod === "CRYPTO" ? cryptoAddress : null,
          cryptoNetwork: selectedMethod === "CRYPTO" ? cryptoNetwork : null,
        }),
      });

      if (response.ok) {
        toast({
          title: `✅ ${t("withdrawalRequestSubmitted") || "Withdrawal request submitted"}`,
          description: t("withdrawalRequestProcessing") || "Your withdrawal request is being processed",
        });

        // Reset form
        setAmount("");
        setSelectedMethod(null);
        setSelectedCryptoAsset("");
        setCardNumber("");
        setCardHolder("");
        setCryptoAddress("");
        setCryptoNetwork("");
        refetchBalance();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: `❌ ${t("submissionFailed") || "Submission failed"}`,
          description: errorData.error || t("couldNotProcessWithdrawal") || "Could not process withdrawal",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: `❌ ${t("error") || "Error"}`,
        description: t("networkErrorOccurred") || "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto" />
          <p className="mt-4 text-gray-500">{t("loadingWithdrawalOptions")}</p>
          </div>
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-slate-950 min-h-screen">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">{t("withdrawFunds")}</h1>
        <p className="text-gray-500 text-xs mt-1">{t("transferFundsToAccount")}</p>
        </div>

      <div className="grid gap-4 lg:grid-cols-3">
          {/* Withdrawal Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900 border-slate-800 rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ArrowUpCircle className="h-4 w-4 text-purple-400" />
                {t("withdrawalForm")}
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              {/* Asset Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-400 font-medium">
                  {t("selectAsset")}
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {assets.map((asset) => (
                    <button
                      key={asset.symbol}
                      type="button"
                      onClick={() => setSelectedAsset(asset.symbol)}
                      className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs transition-all ${
                        selectedAsset === asset.symbol
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-base font-bold">{asset.symbol}</span>
                      <span className="mt-0.5 text-[10px] text-slate-400">
                        {asset.ownBalance.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

                {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs text-slate-400 font-medium">
                  {t("amount")}
                  </Label>
                  <div className="relative">
                    <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    placeholder={t("enterAmount")}
                    className="h-11 rounded-lg border-slate-800 bg-slate-900 pl-11 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    step="0.01"
                    min={selectedLimit?.minAmount || 0}
                    max={selectedLimit?.maxAmount || undefined}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Wallet className="h-4 w-4 text-slate-500" />
                    </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                    {selectedAsset}
                    </div>
                  </div>
                {selectedLimit && (
                  <div className="text-[10px] text-slate-500">
                    {t("min")}: {selectedLimit.minAmount} {selectedAsset}
                    {selectedLimit.maxAmount && ` • ${t("max")}: ${selectedLimit.maxAmount} ${selectedAsset}`}
                  </div>
                )}
                </div>

              {/* Method Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400 font-medium">
                  {t("withdrawalMethod")}
                  </Label>
                <div className="grid gap-2">
                        <button
                            type="button"
                    onClick={() => setSelectedMethod("CARD")}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all text-left ${
                      selectedMethod === "CARD"
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-300">{t("card")}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {limits.find(l => l.method === "CARD")?.processingTime || t("businessDays1to3")}
                  </div>
                </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("CRYPTO")}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all text-left ${
                      selectedMethod === "CRYPTO"
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <Coins className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-300">{t("crypto")}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t("withdrawToCryptoAddress")}
                                </div>
                              </div>
                  </button>
                  </div>
                </div>

                {/* Method-Specific Fields */}
              <AnimatePresence mode="wait">
                {selectedMethod === "CARD" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 rounded-lg bg-slate-900 p-4 border border-slate-800"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="cardHolder" className="text-xs text-slate-400">
                        {t("cardHolderName")}
                              </Label>
                              <Input
                        id="cardHolder"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder={t("enterCardHolderName")}
                        className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm"
                              />
                            </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cardNumber" className="text-xs text-slate-400">
                        {t("cardNumber")}
                                </Label>
                                <Input
                        id="cardNumber"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder={t("enterCardNumber")}
                        className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm"
                                />
                              </div>
                  </motion.div>
                )}

                {selectedMethod === "CRYPTO" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 rounded-lg bg-slate-900 p-4 border border-slate-800"
                  >
                    {/* Crypto Asset Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">{t("selectCryptoAsset")}</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {assets.map((asset) => (
                          <button
                            key={asset.symbol}
                            type="button"
                            onClick={() => {
                              setSelectedCryptoAsset(asset.symbol);
                              setCryptoNetwork("");
                              setCryptoAddress("");
                            }}
                            className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs transition-all ${
                              selectedCryptoAsset === asset.symbol
                                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                                : "border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700"
                            }`}
                          >
                            <span className="text-base font-bold">{asset.symbol}</span>
                            <span className="mt-0.5 text-[10px] text-slate-400">
                              {asset.ownBalance.toFixed(2)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedCryptoAsset && (
                      <>
                        {/* Network Selection */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">{t("selectNetwork")}</Label>
                          <Select value={cryptoNetwork} onValueChange={setCryptoNetwork}>
                            <SelectTrigger className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm">
                              <SelectValue placeholder={t("selectNetwork")} />
                            </SelectTrigger>
                            <SelectContent className="border-slate-800 bg-slate-900">
                              {availableNetworks.map((network) => (
                                <SelectItem key={network} value={network}>
                                  {network}
                                </SelectItem>
                              ))}
                              {availableNetworks.length === 0 && (
                                <>
                                  <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                                  <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                                  <SelectItem value="BEP20">BEP20 (Binance Smart Chain)</SelectItem>
                                  <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Crypto Address Input */}
                        <div className="space-y-1.5">
                          <Label htmlFor="cryptoAddress" className="text-xs text-slate-400">
                            {t("cryptoAddress")}
                          </Label>
                          <Input
                            id="cryptoAddress"
                            value={cryptoAddress}
                            onChange={(e) => setCryptoAddress(e.target.value)}
                            placeholder={t("enterCryptoAddress")}
                            className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm font-mono"
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fee Calculation */}
              {selectedLimit && amount && !isNaN(parseFloat(amount)) && (
                <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{t("amount")}:</span>
                    <span className="text-slate-300 font-medium">{amount} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{t("fee")}:</span>
                    <span className="text-slate-300 font-medium">
                      {calculateFee(parseFloat(amount)).toFixed(2)} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold pt-1.5 border-t border-slate-800">
                    <span className="text-slate-300">{t("youWillReceive") || "You will receive"}:</span>
                    <span className="text-purple-400">
                      {(parseFloat(amount) - calculateFee(parseFloat(amount))).toFixed(2)} {selectedAsset}
                    </span>
                  </div>
                    </div>
                )}

                {/* Submit Button */}
                  <Button
                      onClick={handleSubmit}
                disabled={isSubmitting || !selectedMethod || !amount}
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11"
                  >
                    {isSubmitting ? (
                        <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("processing")}
                        </>
                    ) : (
                  t("withdraw")
                    )}
                  </Button>
              </CardContent>
            </Card>
          </div>

        {/* Sidebar - Available Funds */}
        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Wallet className="h-4 w-4 text-purple-400" />
                {t("availableFunds")}
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-3">
              {assets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {t("noFundsAvailable")}
                </div>
              ) : (
                assets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className={`rounded-lg border p-3 ${
                      selectedAsset === asset.symbol
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-800 bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-300">{asset.symbol}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{asset.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-100">
                          <AnimatedNumber
                            value={asset.ownBalance}
                            maximumFractionDigits={2}
                            minimumFractionDigits={2}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">{t("available")}</div>
                      </div>
                </div>
                </div>
                ))
              )}
              </CardContent>
            </Card>

            {/* Withdrawal Limits */}
          {selectedLimit && (
            <Card className="bg-slate-900 border-slate-800 rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-400">
                  {t("withdrawalLimits")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {selectedLimit.dailyLimit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{t("dailyLimitLabel")}:</span>
                    <span className="font-semibold text-slate-300">
                      {selectedLimit.dailyLimit.toFixed(2)} {selectedAsset}
                    </span>
                </div>
                )}
                {selectedLimit.monthlyLimit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{t("monthlyLimitLabel")}:</span>
                    <span className="font-semibold text-slate-300">
                      {selectedLimit.monthlyLimit.toFixed(2)} {selectedAsset}
                    </span>
                </div>
                )}
                {selectedLimit.dailyLimit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{t("usedToday")}:</span>
                    <span className="font-semibold text-slate-300">
                      {usedToday.toFixed(2)} {selectedAsset}
                    </span>
                </div>
                )}
                {selectedLimit.monthlyLimit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{t("usedThisMonth")}:</span>
                    <span className="font-semibold text-slate-300">
                      {usedThisMonth.toFixed(2)} {selectedAsset}
                    </span>
                </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
  );
}
