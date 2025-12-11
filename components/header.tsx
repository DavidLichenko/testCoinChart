"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {AnimatePresence, motion} from "framer-motion";
import {ArrowRight, CandlestickChartIcon,
    ChartCandlestickIcon, ChevronRight, LogOut, LucideWalletCards, Newspaper, Plus, TextAlignStart, User, Wallet, X, Contact,
    Home,
    Activity,
    Users,
    Shield,
    Settings,
    FileText,
    CreditCard} from "lucide-react";
import { BsFillHouseDoorFill } from "react-icons/bs";
import { openSupportChat } from "@/lib/support-chat"
import {Button} from "@/components/ui/button";
import {DepositModal} from "@/components/deposit-modal";
import {useAuth} from "@/components/auth-provider";
import {useBalance} from "@/hooks/useBalance";
import {useIsMobile} from "@/hooks/use-mobile";
import {useI18n} from "@/components/i18n-provider";
import NavItem from "@/components/nav-item";
import {RiWalletFill} from "react-icons/ri";
import {MdSupportAgent} from "react-icons/md";
import { IoPeople } from "react-icons/io5";
import { FaShield } from "react-icons/fa6";
import { BsFillCreditCardFill } from "react-icons/bs";
import { AiFillFileText } from "react-icons/ai";
import { IoMdSettings } from "react-icons/io";
import { FaAngleRight } from "react-icons/fa";
import {MobileBalanceCard} from "@/components/balance-card";
import { AnimatedNumber } from "@/components/animated-number"

const MotionButton = motion(Button);
const navItems = [
    {
        name: "dashboard",
        href: "/profile/dashboard",
        icon: <BsFillHouseDoorFill className="h-4 w-4 text-app-muted" />,
    },
    {
        name: "transactions",
        href: "/profile/transactions",
        icon: <Activity className="h-4 w-4 text-app-muted" />,
    },
    {
        name: "referrals",
        href: "/profile/referrals",
        icon: <IoPeople className="h-4 w-4 text-app-muted"  />,
    },
    {
        name: "verification",
        href: "/profile/verification",
        icon: <FaShield className="h-4 w-4 text-app-muted" />,
    },
    {
        name: "withdraw",
        href: "/profile/withdraw",
        icon: <BsFillCreditCardFill className="h-4 w-4 text-app-muted"  />,
    },
    {
        name: "history",
        href: "/profile/history",
        icon: <AiFillFileText className="h-4 w-4 text-app-muted"  />,
    },
    {
        name: "settings",
        href: "/profile/settings",
        icon: <IoMdSettings className="h-4 w-4 text-app-muted" />,
    },
];
const MotionPlus = motion(Plus);
// Loading skeleton component for balance
const BalanceSkeleton = () => (
    <motion.div
        className="flex items-center gap-3 px-4 py-2 rounded-md bg-gray-900"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
    >
        <div className="h-8 w-8 rounded-md flex items-center justify-center text-violet-500 shadow-md bg-gray-800">
            <RiWalletFill className="h-6 w-6 opacity-50" />
        </div>
        <div className="flex flex-col items-start leading-tight">
            <div className="h-3 w-16 bg-gray-700 rounded mb-1"></div>
            <div className="h-4 w-24 bg-gray-700 rounded"></div>
        </div>
    </motion.div>
);

export default function Header({homepage=false}) {
    const { balance, liveProfit, details, assets } = useBalance();
    const { user, logout, loading: authLoading } = useAuth();
    const { t } = useI18n("header");
    const isMobile = useIsMobile();
    const router = useRouter();
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [isBalanceLoading, setIsBalanceLoading] = useState(true);

    // If not authenticated, show simple header with login/register
    if (!authLoading && !user) {
        return (
            <header className="sticky top-0 z-[60] h-16 !bg-app-bgDeep border-b border-gray-600/10 backdrop-blur-2xl">
                <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <img
                            src="/logo.png"
                            className="h-12 w-12"
                            alt="AragonTrade"
                        />
                        <span className="text-white font-semibold text-lg">
                            AragonTrade
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/login")}
                            className="border-slate-700 text-white hover:bg-slate-800"
                        >
                            {t("signIn") || "Sign In"}
                        </Button>
                        <Button
                            onClick={() => router.push("/register")}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                        >
                            {t("signUp") || "Sign Up"}
                        </Button>
                    </div>
                </div>
            </header>
        )
    }
    // Check if balance data is loaded with a minimum loading time to prevent flickering
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (details !== null) {
            // Even if details are available, show loading for at least 300ms to prevent flickering
            timeoutId = setTimeout(() => {
                setIsBalanceLoading(false);
            }, 300);
        } else {
            // If details are null, show loading immediately
            setIsBalanceLoading(true);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [details]);

    // профильное меню (desktop)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const toggleProfileMenu = () => {
        setProfileMenuOpen((prev) => !prev);
        setBalanceMenuOpen(false);
    };

    // дропдаун баланса
    const [balanceMenuOpen, setBalanceMenuOpen] = useState(false);
    const toggleBalanceMenu = () => {
        setBalanceMenuOpen((prev) => !prev);
        setProfileMenuOpen(false);
    };
    const closeBalanceMenu = () => setBalanceMenuOpen(false);

    // бургер для mobile
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const toggleMobileMenu = () => {
        setMobileMenuOpen((prev) => !prev);
    }

    const goWithdraw = () => {
        router.push("/profile?tab=withdraw");
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
        setBalanceMenuOpen(false);
    };

    useEffect(() => {
        if (mobileMenuOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.classList.add("overflow-hidden");
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = scrollBarWidth + "px"; // предотвращает прыжок контента
        } else {
            document.body.classList.remove("overflow-hidden");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }

        return () => {
            document.body.classList.remove("overflow-hidden");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, [mobileMenuOpen]);

    // -------- расчёты баланса --------
    const baseCurrency = details?.baseCurrency ?? "USD";
    const tradingBalance = details?.tradingBalance ?? 0;
    const tradingInTrade = details?.tradingInTrade ?? 0;
    const pendingWithdrawAmount = details?.pendingWithdrawAmount ?? 0;


    // Internal values are in USD, but we display in user's preferred currency
    const walletTotalUsd = details?.walletTotal ?? 0;
    const stakingTotalUsd = details?.stakingTotal ?? 0;

    const creditLimit = details?.creditLimit ?? 0;
    const creditUsed = details?.creditUsed ?? 0;
    const creditAvailable = Math.max(0, creditLimit - creditUsed);
    const hasCredit = creditLimit > 0.0001;

    const tradingFree = Math.max(0, tradingBalance - tradingInTrade);

    // Total equity is already calculated in user's preferred currency by the backend
    // Exclude pending withdrawal amounts from total equity as per requirements
    const totalEquity = balance;

    const formatMoney = (v: number) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(v || 0);
    const [rotated, setRotated] = useState(false);
    // Calculate crypto balance from assets
    const cryptoBalanceUsd = assets?.reduce((sum, asset) => {
        // Exclude base currency assets (USD/EUR) from crypto balance
        if (asset.symbol === "USD" || asset.symbol === "USDT" || asset.symbol === baseCurrency) {
            return sum;
        }
        return sum + (asset.totalValueUsd || asset.totalValue || 0);
    }, 0) ?? 0;

    // For EUR users, convert crypto balance to EUR
    const cryptoBalanceDisplay = baseCurrency === "EUR" && details?.eurUsdRate
        ? cryptoBalanceUsd / details.eurUsdRate
        : cryptoBalanceUsd;


    type MoneyAnimatedProps = {
        value: number
        currency: string  // "USD" | "EUR" | ...
        className?: string
        minimumFractionDigits?: number
        maximumFractionDigits?: number
    }

    const MoneyAnimated: React.FC<MoneyAnimatedProps> = ({
                                                             value,
                                                             currency,
                                                             className,
                                                             minimumFractionDigits = 2,
                                                             maximumFractionDigits = 2,
                                                         }) => (
        <AnimatedNumber
            value={value || 0}
            suffix={` ${currency}`}
            minimumFractionDigits={minimumFractionDigits}
            maximumFractionDigits={maximumFractionDigits}
            className={className}
        />
    )
    // внутри Header (или рядом), просто замени старый BalanceDropdown на этот

    const BalanceDropdown = () => {
        const router = useRouter();
        const { t } = useI18n();
        const { balance: totalEquity, details } = useBalance();

        const hasDetails = !!details;

        const baseCurrency = details?.baseCurrency ?? "EUR";
        const availableToTrade = details?.availableToTrade ?? 0;
        const tradingInTrade = details?.tradingInTrade ?? 0;
        const lockedTrading = details?.lockedTrading ?? 0;
        const pendingWithdrawAmount = details?.pendingWithdrawAmount ?? 0;
        const creditLimit = details?.creditLimit ?? 0;
        const creditUsed = details?.creditUsed ?? 0;
        const creditAvailable = details?.creditAvailable ?? 0;
        const approxUsd = details?.approxUsd;

        const hasCredit = creditLimit > 0.0001;

        // либо берём из API, либо считаем fallback’ом
        const availableToWithdraw =
            details?.availableToWithdraw ??
            Math.max(
                0,
                (details?.tradingBalance ?? 0) -
                (details?.tradingInTrade ?? 0) -
                (details?.lockedTrading ?? 0)
            );

        const totalEquityDisplay = totalEquity ?? 0;

        const handleGoWithdraw = () => {
            router.push("/profile/withdraw");
            closeBalanceMenu();
        };

        const handleGoWallet = () => {
            router.push("/wallet");
            closeBalanceMenu();
        };

        const handleGoTrade = () => {
            router.push("/market");
            closeBalanceMenu();
        };

        const renderSkeleton = () => (
            <div className="space-y-3">
                <div className="rounded-lg bg-[#050510] border border-[#1f2937] px-3 py-2 animate-pulse">
                    <div className="h-3 w-24 rounded bg-[#111827]" />
                    <div className="mt-2 h-4 w-32 rounded bg-[#111827]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#050510] border border-[#111827] px-3 py-3 animate-pulse">
                        <div className="h-3 w-20 rounded bg-[#111827]" />
                        <div className="mt-2 h-4 w-16 rounded bg-[#111827]" />
                    </div>
                    <div className="rounded-lg bg-[#050510] border border-[#111827] px-3 py-3 animate-pulse">
                        <div className="h-3 w-24 rounded bg-[#111827]" />
                        <div className="mt-2 h-4 w-14 rounded bg-[#111827]" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-40 rounded bg-[#111827] animate-pulse" />
                    <div className="h-3 w-32 rounded bg-[#111827] animate-pulse" />
                    <div className="h-3 w-28 rounded bg-[#111827] animate-pulse" />
                </div>
            </div>
        );

        return (
            <AnimatePresence>
                {balanceMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16 }}
                        className="absolute top-14 left-3 right-3 md:-left-[calc(360px/2)] md:right-0 md:w-[360px] rounded-md bg-[#050510] border border-[#1f2937] p-3 z-[80] shadow-[0_18px_50px_rgba(0,0,0,0.7)]"
                    >
                        {!hasDetails ? (
                            renderSkeleton()
                        ) : (
                            <>
                                {/* Total balance / equity */}
                                <div className="mb-3 rounded-lg bg-[#050510] border border-[#1f2937] px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-[#6b7280] flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                        {t("totalBalance") ?? "Total balance"}
                    </span>
                                            <span className="text-[15px] font-semibold text-[#f9fafb]">
                      {formatMoney(totalEquityDisplay)} {baseCurrency}
                    </span>
                                        </div>
                                        <div className="flex items-center justify-center rounded-md bg-[#0b1120] px-2 py-1 text-[10px] text-[#9ca3af]">
                                            {t("balanceShortDescription") ??
                                                "Trading account overview"}
                                        </div>
                                    </div>
                                    {baseCurrency === "EUR" && approxUsd && (
                                        <div className="mt-1 text-[11px] text-[#6b7280] text-right">
                                            ≈ {formatMoney(approxUsd)} USD
                                        </div>
                                    )}
                                </div>

                                {/* Main actions: available to withdraw / trade */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={handleGoWithdraw}
                                        className="rounded-lg bg-[#050510] border border-[#111827] px-3 py-2.5 text-left hover:border-[#16a34a]/60 hover:bg-[#041008] transition-colors"
                                    >
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                                            {t("availableToWithdraw") ?? "Available to withdraw"}
                                        </div>
                                        <div className="mt-1 text-[13px] font-semibold text-[#e5e7eb]">
                                            {formatMoney(availableToWithdraw)} {baseCurrency}
                                        </div>
                                        <div className="mt-0.5 text-[10px] text-[#6b7280] flex items-center gap-1">
                                            {t("withdraw") ?? "Withdraw"}
                                            <ArrowRight className="w-2.5 h-2.5" />
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleGoTrade}
                                        className="rounded-lg bg-[#050510] border border-[#111827] px-3 py-2.5 text-left hover:border-[#6366f1]/60 hover:bg-[#07071a] transition-colors"
                                    >
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                                            {t("availableToTrade") ?? "Available to trade"}
                                        </div>
                                        <div className="mt-1 text-[13px] font-semibold text-[#e5e7eb]">
                                            {formatMoney(availableToTrade)} {baseCurrency}
                                        </div>
                                        <div className="mt-0.5 text-[10px] text-[#6b7280] flex items-center gap-1">
                                            {t("inTrade") ?? "In trade"}:{" "}
                                            <span className="font-medium text-[#e5e7eb]">
                      {formatMoney(tradingInTrade)} {baseCurrency}
                    </span>
                                        </div>
                                    </button>
                                </div>

                                {/* Breakdown */}
                                <div className="space-y-2 rounded-lg bg-[#050510] border border-[#111827] px-3 py-2.5">
                                    <div className="text-[11px] font-semibold text-[#9ca3af] mb-1">
                                        {t("breakdown") ?? "Breakdown"}
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-[#9ca3af]">
                                        <span>{t("inTrade") ?? "In trade"}</span>
                                        <span className="font-semibold text-[#e5e7eb]">
                    {formatMoney(tradingInTrade)} {baseCurrency}
                  </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-[#9ca3af]">
                                        <span>{t("fundsInWork") ?? "Funds in work"}</span>
                                        <span className="font-semibold text-[#e5e7eb]">
                    {formatMoney(lockedTrading)} {baseCurrency}
                  </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-[#9ca3af]">
                                        <span>{t("pendingWithdrawals") ?? "Pending withdrawals"}</span>
                                        <span className="font-semibold text-[#e5e7eb]">
                    {formatMoney(pendingWithdrawAmount)} {baseCurrency}
                  </span>
                                    </div>
                                </div>

                                {/* Credit block (only if credit exists) */}
                                {hasCredit && (
                                    <div className="mt-3 rounded-lg bg-[#050510] border border-[#4c1d95]/60 px-3 py-2.5">
                                        <div className="flex items-center justify-between text-[11px] text-[#9ca3af] mb-1">
                                            <span>{t("creditUsed") ?? "Credit used"}</span>
                                            <span className="font-semibold text-[#f97373]">
                      {formatMoney(creditUsed)} {baseCurrency}
                    </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-[#a5b4fc]">
                    <span>
                      {t("creditLimit") ?? "Limit"}:{" "}
                        {formatMoney(creditLimit)} {baseCurrency}
                    </span>
                                            <span>
                      {t("creditAvailable") ?? "Available"}:{" "}
                                                {formatMoney(creditAvailable)} {baseCurrency}
                    </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleGoWallet}
                                            className="mt-1.5 text-[10px] text-[#a855f7] hover:text-[#c4b5fd] flex items-center gap-1"
                                        >
                                            {t("wallet") ?? "Wallet"}
                                            <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };


    // ================== MOBILE HEADER ==================
    if (isMobile) {
        return (
            <>
                <header className="sticky top-0 z-[60] h-16 bg-[#050510] border-b border-white/10 backdrop-blur-xl px-4 flex items-center justify-between">
                    {/* LEFT: burger + logo */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleMobileMenu}
                            className="h-9 w-9 flex items-center justify-center"
                        >
                            {mobileMenuOpen ? (
                                <></>
                            ) : (
                                <TextAlignStart className="h-7 w-7 text-white" />
                            )}
                        </button>

                        <Link href="/" className="flex items-center gap-2">
                            <div className="text-white gap-0 flex flex-col justify-center items-end font-semibold text-xs uppercase tracking-[0.12em]">
                                <span>ARAGON</span><span className="ml-0">TRADE</span>
                            </div>
                        </Link>
                    </div>

                    {/* RIGHT: balance-pill + deposit */}
                    <div className="justify-center items-center flex  gap-3">
                        {/* BALANCE PILL */}
                        {isBalanceLoading ? (
                            <BalanceSkeleton />
                        ) : (
                            <button
                                onClick={toggleBalanceMenu}
                                className="bounce group flex items-center gap-3 px-4 py-2 rounded-md bg-gray-900"
                            >
                                <div
                                    className="h-8 w-8 rounded-md flex items-center justify-center text-violet-500 shadow-md">
                                    <RiWalletFill className="h-6 w-6"/>
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                     <span className="text-[10px] uppercase tracking-[0.16em] text-white/90">
                                         {t("totalEquity")}
                                    </span>
                                    <span className="text-[13px] font-semibold text-violet-500 flex items-center gap-1">
                                        <MoneyAnimated
                                            value={totalEquity}
                                            currency={baseCurrency}
                                        />
                                     </span>
                                </div>
                            </button>
                        )}

                        {/* DEPOSIT */}
                        <motion.button
                            onTap={() => setRotated(!rotated)}
                            initial={{scale: 1}}
                            whileTap={{scale:1.2}}
                            exit={{scale: 1}}
                            transition={{ duration: 0.2}}
                            className="group wh-38 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-sm p-1.5 justify-center items-center flex flex-col  shadow-md opacity-95"
                            onClick={() => {
                                setDepositModalOpen(true);
                                closeBalanceMenu();
                                setProfileMenuOpen(false);
                            }}
                        >
                            <MotionPlus
                                initial={{rotate:0}}
                                animate={{ rotate: rotated ? 180 : 0 }}
                                style={{transform:"rotate(var(--rotate))"}} className="!stroke-[4px] !h-4 !w-4 font-black "/>
                        </motion.button>
                    </div>

                    <BalanceDropdown/>
                    {/* MOBILE FULLSCREEN MENU (как на рефе) */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{opacity: 0,}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}
                                transition={{duration: 0.2}}
                                className="fixed inset-0 z-[90] flex-1 h-screen overflow-hidden w-screen bg-app-bgPage flex flex-col"
                            >
                                {/* top bar */}
                                <div
                                    className={"transition sticky top-0 z-[60] h-16 bg-[#050510] border-b border-white/10 backdrop-blur-xl px-4 w-full inline-flex justify-between"}>
                                    <div className="inline-flex items-center justify-between w-full  gap-3">
                                        <div className={'inline-flex gap-3'}>
                                            <button
                                                onClick={toggleMobileMenu}
                                                className="h-9 w-9 flex items-center justify-center"
                                            >
                                                {mobileMenuOpen ? (
                                                    <X className="h-7 w-7 text-gray-200 z-[9999]"/>
                                                ) : (
                                                    <TextAlignStart className="h-7 w-7 text-white"/>
                                                )}
                                            </button>

                                            <Link href="/" className="flex items-center gap-2">
                                                <div
                                                    className="text-white gap-0 flex flex-col justify-center items-end font-semibold text-xs uppercase tracking-[0.12em]">
                                                    <span>ARAGON</span><span className="ml-0">TRADE</span>
                                                </div>
                                            </Link>
                                        </div>
                                        <motion.div
                                            initial={{y: -10}}
                                            animate={{ y:0}}
                                            exit={{x:10}}
                                            transition={{type:"spring", duration: 0.1, ease:"easeInOut", damping:25, stiffness: 450 }}
                                            onClick={openSupportChat}
                                            className="inline-flex  gap-4 justify-end text-right items-center text-sm font-bold p-2  bg-background rounded-sm">
                                            <MdSupportAgent className="h-7 w-7 flex items-center justify-center"/>
                                            Support
                                        </motion.div>
                                    </div>
                                </div>
                                {/* scrollable content */}
                                <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4">
                                    <div className="w-full flex justify-between  items-center gap-2 py-2">
                                        <Link href={'/market'} onClick={() => {
                                            setMobileMenuOpen(false)
                                        }}
                                              className={'group flex w-full gap-2 items-center justify-center  p-4 rounded-md text-[11px] font-bold text-app-text bg-background focus:text-app-accentStrong focus:bg-gray-800'}>
                                            <ChartCandlestickIcon
                                                className={'w-5 h-5 md:w-6 md:h-6 text-app-muted group-focus:text-app-accentStrong'}/>
                                            <span>{t('market')}</span>
                                        </Link>
                                        <Link href={'/wallet'} onClick={() => {
                                            setMobileMenuOpen(false)
                                        }}
                                              className={'group flex w-full  gap-2 items-center justify-center  p-4 rounded-md text-[11px] font-bold text-app-text bg-background  focus:text-blue-400 focus:bg-gray-800'}>
                                            <LucideWalletCards
                                                className={'w-5 h-5 md:w-6 md:h-6 text-app-muted group-focus:text-blue-400'}/>
                                            <span>{t("wallet")}</span>
                                        </Link>
                                        <Link href={'/news'} onClick={() => {
                                            setMobileMenuOpen(false)
                                        }}
                                              className={' group flex w-full  gap-2 items-center justify-center   p-4 rounded-md text-[11px] font-bold text-app-text bg-background   focus:text-yellow-400 focus:bg-gray-800 '}>
                                            <Newspaper
                                                className={'w-5 h-5 md:w-6 md:h-6 text-app-muted group-focus:text-yellow-400'}/>
                                            <span>{t("news")}</span>
                                        </Link>

                                    </div>

                                    <div
                                        className="rounded-md bg-background px-3 py-3 shadow-md shadow-app-bgDeep backdrop-blur-sm">
                                        <div className="flex items-center  gap-3 justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-800 text-sm font-semibold text-white ">
                                                    <Contact className={'h-10 w-10'}/>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-[16px] font-medium text-slate-50">
                                                        {user?.name || user?.email || "Trader"}
                                                    </div>
                                                    {user?.id && (
                                                        <div className="text-[12px] text-slate-500">
                                                            ID: {user.id.slice(0, 6)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={logout}
                                                className="flex flex-col items-start justify-between  p-3 gap-1 text-[11px] text-red-400 rounded-xl bg-app-bgSurface hover:bg-[#17172b]"
                                            >
                                                <LogOut className="h-4 w-4 text-app-danger"/>
                                                {t("logout")}
                                            </button>
                                        </div>

                                    </div>
                                    <MobileBalanceCard/>
                                    {/* navigation block */}
                                    <div
                                        className="rounded-md bg-background p-3.5 flex gap-2 justify-between items-center">
                                        <nav className="flex flex-col gap-1 w-full">
                                            {navItems.map((item) => {
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => {
                                                            setMobileMenuOpen(false)
                                                        }}
                                                        className={'flex gap-2 justify-between items-center py-3.5 border-gray-800 w-full border-b-2 px-2 text-[14px] font-semibold'}>
                                                        <div className="flex items-center justify-center gap-4">
                                                            {item.icon}
                                                            <span>{t(`${item.name}`)}</span>
                                                        </div>
                                                        <FaAngleRight  className={'w-4 h-4 text-app-muted/40'}/>
                                                    </Link>
                                                )
                                            })}
                                        </nav>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <DepositModal
                        open={depositModalOpen}
                        onOpenChange={setDepositModalOpen}
                        userId={user?.id || ""}
                    />
                </header>
            </>
        );
    }

    // ================== DESKTOP HEADER ==================
    // (оставил как у тебя сейчас)
    return (
        <>
            <header className="sticky top-0 z-[60] h-16  !bg-app-bgDeep  border-b border-gray-600/10 backdrop-blur-2xl">
                <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between">
                    {/* LEFT: logo + nav */}
                    <div className="flex items-center gap-6 ">
                        <Link href="/" className="flex items-center gap-2 bounce">
                            <img
                                src="/logo.png"
                                className="h-12 w-12 hover:rotate-12 transition-all animate-out"
                                alt="AragonTrade"
                            />
                            <span className="text-white font-semibold text-lg">
                AragonTrade
              </span>
                        </Link>

                        <div className="hidden lg:flex items-center">
                            <NavItem/>
                        </div>
                    </div>

                    {/* RIGHT: balance pill + profile + deposit */}
                    <div className="flex items-center gap-4">
                        {/* BALANCE CARD */}
                        <div className="relative">
                            {isBalanceLoading ? (
                                <BalanceSkeleton/>
                            ) : (
                                <button
                                    onClick={toggleBalanceMenu}
                                    className="bounce group flex items-center gap-3 px-4 py-2 rounded-md bg-gray-900"
                                >
                                    <div
                                        className="h-8 w-8 rounded-md flex items-center justify-center text-violet-500 shadow-md">
                                        <RiWalletFill className="h-6 w-6"/>
                                    </div>
                                    <div className="flex flex-col items-start leading-tight">
                                         <span className="text-[10px] uppercase tracking-[0.16em] text-white/90">
                                             {t("totalEquity")}
                                         </span>
                                        <span
                                            className="text-[13px] font-semibold text-violet-500 flex items-center gap-1">
                                          <MoneyAnimated
                                              value={totalEquity}
                                              currency={baseCurrency}
                                          />
                                         </span>
                                    </div>
                                </button>
                            )}

                            {/* Desktop Balance Dropdown */}
                            <BalanceDropdown/>
                        </div>

                        {/* PROFILE MENU */}
                        <div className="relative">
                            <Button
                                size="lg"
                                variant="link"
                                className="flex bounce justify-between gap-4  w-full text-white px-4 py-2.5 rounded-md bg-background  "
                                onClick={()=>{router.push('/profile')}}
                            >
                                <User className="!h-5 !w-5 text-white" />
                                <span>{t('profile')}</span>
                                <ArrowRight className={"w-2 h-2"}/>
                            </Button>

                            {/*<AnimatePresence>*/}
                            {/*    {profileMenuOpen && (*/}
                            {/*        <motion.div*/}
                            {/*            initial={{ opacity: 0, y: -6 }}*/}
                            {/*            animate={{ opacity: 1, y: 0 }}*/}
                            {/*            exit={{ opacity: 0, y: -6 }}*/}
                            {/*            transition={{ duration: 0.15 }}*/}
                            {/*            className="absolute right-0 f mt-3 w-56 bg-[#050510] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-3 z-[80]"*/}
                            {/*        >*/}
                            {/*            <div className="px-2 py-1 text-white/50 text-xs">*/}
                            {/*                {t("myAccount")}*/}
                            {/*            </div>*/}

                            {/*            <button*/}
                            {/*                onClick={() => {*/}
                            {/*                    router.push("/profile");*/}
                            {/*                    setProfileMenuOpen(false);*/}
                            {/*                }}*/}
                            {/*                className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-200 hover:bg-[#151527] rounded-lg"*/}
                            {/*            >*/}
                            {/*                {t("profile")}*/}
                            {/*                <ChevronRight className="h-4 w-4 text-gray-400" />*/}
                            {/*            </button>*/}

                            {/*            <button*/}
                            {/*                onClick={goWithdraw}*/}
                            {/*                className="flex items-center justify-between w-full px-3 py-2 text-sm text-indigo-300 hover:bg-[#151527] rounded-lg"*/}
                            {/*            >*/}
                            {/*                {t("withdraw")}*/}
                            {/*                <ChevronRight className="h-4 w-4 text-indigo-300" />*/}
                            {/*            </button>*/}

                            {/*            <div className="my-2 border-t border-white/10" />*/}

                            {/*            <button*/}
                            {/*                onClick={logout}*/}
                            {/*                className="flex items-center justify-between w-full px-3 py-2 text-sm text-red-400 hover:bg-[#151527] rounded-lg"*/}
                            {/*            >*/}
                            {/*                {t("logout")}*/}
                            {/*                <LogOut className="h-4 w-4 text-red-400" />*/}
                            {/*            </button>*/}
                            {/*        </motion.div>*/}
                            {/*    )}*/}
                            {/*</AnimatePresence>*/}
                        </div>

                        {/* DEPOSIT BUTTON */}
                        <MotionButton
                            className="group bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] rounded-md px-5 font-semibold text-sm shadow-lg opacity-95 bounce"
                            onClick={() => {
                                setDepositModalOpen(true);
                                closeBalanceMenu();
                                setProfileMenuOpen(false);
                            }}
                            whileHover="hover"
                            initial="initial"
                        >
                            <motion.span
                                className="mr-2 inline-flex"
                                variants={{
                                    initial: { rotate: 0 },
                                    hover: { rotate: 90 },
                                }}
                                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                            >
                                <Plus className="!h-5 !w-5 font-bold" />
                            </motion.span>
                            {t("deposit")}
                        </MotionButton>
                    </div>
                </div>
            </header>

            <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} userId={user?.id || ""} />
        </>
    );
}
