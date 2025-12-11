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
  User,
  Mail,
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
  const [transferType, setTransferType] = useState<"balance" | "user" | "crypto">("balance");
  const [userEmail, setUserEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [userCryptoAddresses, setUserCryptoAddresses] = useState<any[]>([]);

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

        // Fetch user crypto addresses
        const addressesRes = await fetch("/api/user/crypto-addresses");
        if (addressesRes.ok) {
          const addressesData = await addressesRes.json();
          setUserCryptoAddresses(addressesData);
        }
      } catch (error) {
        console.error("Error fetching withdrawal data:", error);
        toast({
          title: t("error"),
          description: "Failed to load withdrawal data",
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
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: t("invalidAmount"),
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLimit) {
      toast({
        title: "Error",
        description: "Selected withdrawal method is not available",
        variant: "destructive",
      });
      return;
    }

    // Check limits
    if (amountNum < selectedLimit.minAmount) {
      toast({
        title: "Amount too low",
        description: `Minimum withdrawal amount is ${selectedLimit.minAmount}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedLimit.maxAmount && amountNum > selectedLimit.maxAmount) {
      toast({
        title: "Amount too high",
        description: `Maximum withdrawal amount is ${selectedLimit.maxAmount}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedLimit.dailyLimit && (usedToday + amountNum) > selectedLimit.dailyLimit) {
      toast({
        title: "Daily limit exceeded",
        description: `Daily withdrawal limit is ${selectedLimit.dailyLimit}`,
        variant: "destructive",
      });
      return;
    }

    if (amountNum > availableBalance) {
      toast({
        title: "Insufficient funds",
        description: `Available balance: ${availableBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedMethod === "CRYPTO" && transferType === "user" && !userEmail) {
      toast({
        title: "Missing information",
        description: "Please enter user email for transfer",
        variant: "destructive",
      });
      return;
    }

    if (selectedMethod === "CRYPTO" && transferType === "crypto" && (!cryptoAddress || !cryptoNetwork)) {
      toast({
        title: "Missing information",
        description: "Please enter crypto address and network",
        variant: "destructive",
      });
      return;
    }

    if (selectedMethod === "CARD" && (!cardNumber || !cardHolder)) {
      toast({
        title: "Missing information",
        description: "Please enter card details",
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
          assetSymbol: selectedAsset,
          transferType,
          userEmail: transferType === "user" ? userEmail : null,
          cardNumber: selectedMethod === "CARD" ? cardNumber : null,
          cardHolder: selectedMethod === "CARD" ? cardHolder : null,
          cryptoAddress: transferType === "crypto" ? cryptoAddress : null,
          cryptoNetwork: transferType === "crypto" ? cryptoNetwork : null,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Withdrawal request submitted",
          description: "Your withdrawal request is being processed",
        });

        // Reset form
        setAmount("");
        setSelectedMethod(null);
        setUserEmail("");
        setCardNumber("");
        setCardHolder("");
        refetchBalance();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "❌ Submission failed",
          description: errorData.error || "Could not process withdrawal",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Network error occurred",
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
          <p className="mt-4 text-gray-500">Loading withdrawal options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">{t("withdrawFunds")}</h1>
        <p className="text-gray-500 text-xs mt-1">Transfer funds to your account or another user</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ArrowUpCircle className="h-4 w-4 text-purple-400" />
                Withdrawal Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Asset Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-400 font-medium">
                  Select Asset
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
                          : "border-slate-800 bg-slate-900/70 text-slate-500 hover:border-slate-700"
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
                  Amount
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="h-11 rounded-lg border-slate-800 bg-slate-900/70 pl-11 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    Min: {selectedLimit.minAmount} {selectedAsset}
                    {selectedLimit.maxAmount && ` • Max: ${selectedLimit.maxAmount} ${selectedAsset}`}
                  </div>
                )}
              </div>

              {/* Method Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400 font-medium">
                  Withdrawal Method
                </Label>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("CARD")}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all text-left ${
                      selectedMethod === "CARD"
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-300">Card</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {limits.find(l => l.method === "CARD")?.processingTime || "1-3 business days"}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("CRYPTO")}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all text-left ${
                      selectedMethod === "CRYPTO"
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                    }`}
                  >
                    <Coins className="h-4 w-4 text-slate-400" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-300">Crypto</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Transfer to main balance or another user
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
                    className="space-y-3 rounded-lg bg-slate-900/70 p-4 border border-slate-800"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="cardHolder" className="text-xs text-slate-400">
                        Card Holder Name
                      </Label>
                      <Input
                        id="cardHolder"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Enter card holder name"
                        className="h-10 rounded-lg border-slate-800 bg-slate-900/70 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cardNumber" className="text-xs text-slate-400">
                        Card Number
                      </Label>
                      <Input
                        id="cardNumber"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Enter card number"
                        className="h-10 rounded-lg border-slate-800 bg-slate-900/70 text-sm"
                      />
                    </div>
                  </motion.div>
                )}

                {selectedMethod === "CRYPTO" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 rounded-lg bg-slate-900/70 p-4 border border-slate-800"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">Transfer Type</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setTransferType("balance")}
                          className={`rounded-lg border p-3 transition-all ${
                            transferType === "balance"
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-slate-800 bg-slate-900/70"
                          }`}
                        >
                          <Wallet className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                          <div className="text-xs font-medium">To Main Balance</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferType("user")}
                          className={`rounded-lg border p-3 transition-all ${
                            transferType === "user"
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-slate-800 bg-slate-900/70"
                          }`}
                        >
                          <User className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                          <div className="text-xs font-medium">To Another User</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferType("crypto")}
                          className={`rounded-lg border p-3 transition-all ${
                            transferType === "crypto"
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-slate-800 bg-slate-900/70"
                          }`}
                        >
                          <Coins className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                          <div className="text-xs font-medium">To Crypto Address</div>
                        </button>
                      </div>
                    </div>
                    {transferType === "user" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="userEmail" className="text-xs text-slate-400">
                          User Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                          <Input
                            id="userEmail"
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="Enter user email"
                            className="pl-9 h-10 rounded-lg border-slate-800 bg-slate-900/70 text-sm"
                          />
                        </div>
                      </div>
                    )}
                    {transferType === "crypto" && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">Network</Label>
                          <Select value={cryptoNetwork} onValueChange={setCryptoNetwork}>
                            <SelectTrigger className="h-10 rounded-lg border-slate-800 bg-slate-900/70 text-sm">
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                            <SelectContent className="border-slate-800 bg-slate-900">
                              <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                              <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                              <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                              <SelectItem value="BEP20">BEP20 (Binance Smart Chain)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cryptoAddress" className="text-xs text-slate-400">
                            Crypto Address
                          </Label>
                          <Input
                            id="cryptoAddress"
                            value={cryptoAddress}
                            onChange={(e) => setCryptoAddress(e.target.value)}
                            placeholder="Enter crypto address"
                            className="h-10 rounded-lg border-slate-800 bg-slate-900/70 text-sm font-mono"
                          />
                        </div>
                        {userCryptoAddresses.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Or select saved address</Label>
                            <div className="space-y-1.5">
                              {userCryptoAddresses
                                .filter(addr => addr.assetSymbol === selectedAsset && addr.isActive)
                                .map((addr) => (
                                  <button
                                    key={addr.id}
                                    type="button"
                                    onClick={() => {
                                      setCryptoAddress(addr.address);
                                      setCryptoNetwork(addr.network);
                                    }}
                                    className="w-full rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-left text-xs hover:border-slate-700 transition"
                                  >
                                    <div className="font-medium text-slate-200">{addr.label || addr.network}</div>
                                    <div className="text-slate-400 font-mono text-[10px] truncate">{addr.address}</div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fee Calculation */}
              {selectedLimit && amount && !isNaN(parseFloat(amount)) && (
                <div className="rounded-lg bg-slate-900/70 p-3 border border-slate-800">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-slate-300 font-medium">{amount} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Fee:</span>
                    <span className="text-slate-300 font-medium">
                      {calculateFee(parseFloat(amount)).toFixed(2)} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold pt-1.5 border-t border-slate-800">
                    <span className="text-slate-300">You will receive:</span>
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
                    Processing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Available Funds */}
        <div className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Wallet className="h-4 w-4 text-purple-400" />
                Available Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No funds available for withdrawal
                </div>
              ) : (
                assets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className={`rounded-lg border p-3 ${
                      selectedAsset === asset.symbol
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-800 bg-slate-900/70"
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
                        <div className="text-[10px] text-slate-500">Available</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Limits */}
          {selectedLimit && (
            <Card className="bg-slate-900/80 border-slate-800 rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-400">
                  Withdrawal Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {selectedLimit.dailyLimit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Daily Limit:</span>
                    <span className="font-semibold text-slate-300">
                      {selectedLimit.dailyLimit.toFixed(2)} {selectedAsset}
                    </span>
                  </div>
                )}
                {selectedLimit.monthlyLimit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Monthly Limit:</span>
                    <span className="font-semibold text-slate-300">
                      {selectedLimit.monthlyLimit.toFixed(2)} {selectedAsset}
                    </span>
                  </div>
                )}
                {selectedLimit.dailyLimit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Used Today:</span>
                    <span className="font-semibold text-slate-300">
                      {usedToday.toFixed(2)} {selectedAsset}
                    </span>
                  </div>
                )}
                {selectedLimit.monthlyLimit && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Used This Month:</span>
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
