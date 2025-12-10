"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { useBalance } from "@/hooks/useBalance";
import {
  CreditCard,
  Wallet,
  ArrowUpCircle,
  Banknote,
  Coins,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/toast";

interface WithdrawalMethod {
  id: string;
  name: string;
  type: "bank" | "crypto" | "paypal";
  minAmount: number;
  fee: number;
  processingTime: string;
}

interface CryptoAsset {
  symbol: string;
  name: string;
  network: string;
  icon: string;
}
interface WalletSummary {
  totalBalance: number;
  ownFunds: number;
  creditUsed: number;
  creditLimit: number;
  availableToTrade: number;
  baseCurrency: string;
  approxUsd?: number;
}
export default function ProfileWithdrawPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { balance } = useBalance();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdrawal form states
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("USD");
  const [recipient, setRecipient] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState("");

  // Available methods and assets
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  useEffect(() => {
    const fetchWithdrawalOptions = async () => {
      setLoading(true);
      try {
        // In a real implementation, you would fetch these from your API
        setMethods([
          {
            id: "bank",
            name: t("bankTransfer"),
            type: "bank",
            minAmount: 50,
            fee: 2.5,
            processingTime: t("processingTimeBank"),
          },
          {
            id: "crypto",
            name: t("cryptoWallet"),
            type: "crypto",
            minAmount: 10,
            fee: 0.5,
            processingTime: t("processingTimeCrypto"),
          },
        ]);

        setAssets([
          { symbol: "USD", name: "US Dollar", network: "SWIFT", icon: "$" },
          { symbol: "BTC", name: "Bitcoin", network: "BTC", icon: "₿" },
          { symbol: "ETH", name: "Ethereum", network: "ERC20", icon: "Ξ" },
          { symbol: "USDT", name: "Tether", network: "TRC20", icon: "₮" },
        ]);
      } catch (error) {
        console.error("Error fetching withdrawal options:", error);
        toast({
          title: t("error"),
          description: t("couldNotLoadWithdrawalOptions"),
          variant: "destructive" as any,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalOptions();
  }, [t]);

  const handleSubmit = async () => {
    if (!amount || !selectedMethod) {
      toast({
        title: t("missingInformation"),
        description: t("pleaseFillAllRequiredFields"),
        variant: "destructive" as any,
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: t("invalidAmount"),
        description: t("pleaseEnterValidAmount"),
        variant: "destructive" as any,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, you would send this to your API
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          method: selectedMethod,
          asset: selectedAsset,
          recipient,
          walletAddress,
          network,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ " + t("withdrawalRequestSubmitted"),
          description: t("withdrawalProcessing"),
        });

        // Reset form
        setAmount("");
        setSelectedMethod("");
        setRecipient("");
        setWalletAddress("");
        setNetwork("");
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "❌ " + t("submissionFailed"),
          description: errorData.error || t("couldNotProcessWithdrawal"),
          variant: "destructive" as any,
        });
      }
    } catch (error) {
      toast({
        title: "❌ " + t("error"),
        description: t("networkError"),
        variant: "destructive" as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch wallet summary
        const walletResponse = await fetch("/api/wallet/summary");
        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          setWalletSummary(walletData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  const selectedMethodData = methods.find(method => method.id === selectedMethod);

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">{t("loadingWithdrawalOptions")}...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t("withdrawFunds")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("transferFundsToYourAccount")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Withdrawal Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <ArrowUpCircle className="h-5 w-5 text-violet-400" />
                  {t("withdrawalForm")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm text-gray-400 font-medium">
                    {t("amount")}
                  </Label>
                  <div className="relative">
                    <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={t("enterAmount")}
                        className="h-14 rounded-xl border-gray-800 bg-gray-900/70 pl-14 text-lg shadow-inner"
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                      {walletSummary?.baseCurrency}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("availableBalance")}: <span className="font-bold text-gray-300">{walletSummary?.baseCurrency} {balance.toFixed(2)}</span>
                  </div>
                </div>

                {/* Asset Selection */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400 font-medium">
                    {t("asset")}
                  </Label>
                  <div className="grid grid-cols-4 gap-3">
                    {assets.map((asset) => (
                        <button
                            key={asset.symbol}
                            type="button"
                            onClick={() => setSelectedAsset(asset.symbol)}
                            className={`flex flex-col items-center justify-center rounded-xl border p-4 text-sm transition-all duration-300 ${
                                selectedAsset === asset.symbol
                                    ? "border-violet-500 bg-violet-500/20 text-violet-300 shadow-lg shadow-violet-500/20"
                                    : "border-gray-800 bg-gray-900/70 text-gray-500 hover:border-gray-700 hover:shadow-md"
                            }`}
                        >
                          <span className="text-xl">{asset.icon}</span>
                          <span className="mt-2 truncate font-medium">{asset.symbol}</span>
                        </button>
                    ))}
                  </div>
                </div>

                {/* Method Selection */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400 font-medium">
                    {t("withdrawalMethod")}
                  </Label>
                  <div className="grid gap-4">
                    {methods.map((method) => (
                        <div
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
                                selectedMethod === method.id
                                    ? "border-violet-500 bg-violet-500/20 shadow-lg shadow-violet-500/20"
                                    : "border-gray-800 bg-gray-900/70 hover:border-gray-700 hover:shadow-md"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {method.type === "bank" ? (
                                  <Banknote className="h-6 w-6 text-gray-500" />
                              ) : (
                                  <Coins className="h-6 w-6 text-gray-500" />
                              )}
                              <div>
                                <div className="font-bold text-gray-300">
                                  {method.name}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {t("minAmount")}: <span className="font-medium text-gray-400">${method.minAmount}</span> • {t("fee")}: <span className="font-medium text-gray-400">${method.fee}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {method.processingTime}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Method-Specific Fields */}
                {selectedMethodData && (
                    <div className="space-y-5 rounded-2xl bg-gray-900/70 p-5 border border-gray-800">
                      {selectedMethodData.type === "bank" ? (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="recipient" className="text-sm text-gray-400 font-medium">
                                {t("bankAccountHolder")}
                              </Label>
                              <Input
                                  id="recipient"
                                  value={recipient}
                                  onChange={(e) => setRecipient(e.target.value)}
                                  placeholder={t("enterAccountHolderName")}
                                  className="h-11 rounded-xl border-gray-800 bg-gray-900/70 text-sm shadow-inner"
                              />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="bankName" className="text-sm text-gray-400 font-medium">
                                  {t("bankName")}
                                </Label>
                                <Input
                                    id="bankName"
                                    placeholder={t("enterBankName")}
                                    className="h-11 rounded-xl border-gray-800 bg-gray-900/70 text-sm shadow-inner"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="accountNumber" className="text-sm text-gray-400 font-medium">
                                  {t("accountNumber")}
                                </Label>
                                <Input
                                    id="accountNumber"
                                    placeholder={t("enterAccountNumber")}
                                    className="h-11 rounded-xl border-gray-800 bg-gray-900/70 text-sm shadow-inner"
                                />
                              </div>
                            </div>
                          </>
                      ) : (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="walletAddress" className="text-sm text-gray-400 font-medium">
                                {t("walletAddress")}
                              </Label>
                              <Input
                                  id="walletAddress"
                                  value={walletAddress}
                                  onChange={(e) => setWalletAddress(e.target.value)}
                                  placeholder={t("enterWalletAddress")}
                                  className="h-11 rounded-xl border-gray-800 bg-gray-900/70 text-sm shadow-inner"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="network" className="text-sm text-gray-400 font-medium">
                                {t("network")}
                              </Label>
                              <select
                                  id="network"
                                  value={network}
                                  onChange={(e) => setNetwork(e.target.value)}
                                  className="h-11 w-full rounded-xl border border-gray-800 bg-gray-900/70 px-4 text-sm text-gray-300 shadow-inner"
                              >
                                <option value="">{t("selectNetwork")}</option>
                                <option value="BTC">Bitcoin (BTC)</option>
                                <option value="ERC20">Ethereum (ERC20)</option>
                                <option value="TRC20">Tron (TRC20)</option>
                                <option value="BEP20">Binance Smart Chain (BEP20)</option>
                              </select>
                            </div>
                          </>
                      )}
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                  <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedMethod}
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-2 font-medium shadow-lg shadow-violet-500/30"
                  >
                    {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          {t("processing")}
                        </>
                    ) : (
                        t("requestWithdrawal")
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-gray-300 mb-1">
                      {t("securityNotice")}
                    </h3>
                    <p className="text-gray-500">
                      {t("withdrawalSecurityDescription")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Balance Card */}
            <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <CreditCard className="h-5 w-5 text-violet-400" />
                  {t("accountBalance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white">
                  {walletSummary?.baseCurrency} {balance.toFixed(2)}
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  {t("availableForWithdrawal")}
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Limits */}
            <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-400">
                  {t("withdrawalLimits")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("dailyLimit")}:</span>
                  <span className="font-bold text-gray-300">$10,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("monthlyLimit")}:</span>
                  <span className="font-bold text-gray-300">$50,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("usedToday")}:</span>
                  <span className="font-bold text-gray-300">$0</span>
                </div>
              </CardContent>
            </Card>

            {/* Processing Times */}
            <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-400">
                  {t("processingTimes")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("bankTransfers")}:</span>
                  <span className="font-bold text-gray-300">1-3 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("cryptoTransfers")}:</span>
                  <span className="font-bold text-gray-300">10-30 minutes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}