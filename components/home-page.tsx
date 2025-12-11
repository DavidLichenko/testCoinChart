"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
    ArrowRight,
    TrendingUp,
    Shield,
    Zap,
    BarChart3,
    Users,
    Headphones,
    Wallet,
    ArrowUpRight,
    Terminal,
    Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import {Skeleton} from "@/components/ui/skeleton";
import Header from "@/components/header";
import ChatButton from "@/components/chat/chat-button";

export function HomePageClient() {
    const { t } = useI18n();
    const { scrollY } = useScroll();
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const [loadUser,setLoadUser] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);

    // Parallax transforms
    const layer1Y = useTransform(scrollY, [0, 2000], [0, -200]);
    const layer2Y = useTransform(scrollY, [0, 2000], [0, -400]);
    const layer3Y = useTransform(scrollY, [0, 2000], [0, -600]);
    const layer4Y = useTransform(scrollY, [0, 2000], [0, -800]);

    // Content sections transforms
    const featuresY = useTransform(scrollY, [0, 2000], [0, -100]);
    const howItWorksY = useTransform(scrollY, [0, 2000], [0, -150]);
    const educationY = useTransform(scrollY, [0, 2000], [0, -200]);
    const ctaY = useTransform(scrollY, [0, 2000], [0, -100]);

    // Hero scale on scroll
    const heroScale = useTransform(scrollY, [0, 500], [1, 0.98]);

    // Content fade in
    const contentOpacity = useTransform(scrollY, [400, 800], [0, 1]);

    useEffect(() => {
        let cancelled = false;

        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me", { cache: "no-store" });
                if (!cancelled) {
                    setIsAuthenticated(res.ok);
                }
            } catch {
                if (!cancelled) {
                    setIsAuthenticated(false);
                }
            } finally {
                if (!cancelled) {
                    setLoadUser(false);
                }
            }
        };

        checkAuth();

        return () => {
            cancelled = true;
        };
    }, []);
    // Auto-play slider
    useEffect(() => {
        if (!isAutoPlaying || isDragging) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 6000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, isDragging]);

    // Swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setDragStartX(e.touches[0].clientX);
        setIsAutoPlaying(false);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - dragStartX;
        setDragOffset(diff);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 50;
        if (Math.abs(dragOffset) > threshold) {
            if (dragOffset > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        }
        setDragOffset(0);
    };

    // Mouse drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
        setIsAutoPlaying(false);
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const diff = currentX - dragStartX;
        setDragOffset(diff);
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 50;
        if (Math.abs(dragOffset) > threshold) {
            if (dragOffset > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        }
        setDragOffset(0);
    };

    const slides = [
        {
            id: "trading",
            icon: BarChart3,
            iconBg: "from-violet-600 to-violet-700",
            titleKey: "heroSlideTradeTitle",
            subtitleKey: "heroSlideTradeSubtitle",
            descriptionKey: "heroSlideTradeDesc",
            cta: isAuthenticated ? t("heroCtaGoToMarket") : t("heroCtaOpenAccount"),
            gradient: "from-violet-600/20 to-violet-700/20",
            borderColor: "border-violet-500/20",
            ctaClass: "bg-violet-500 hover:bg-violet-600",
        },
        {
            id: "wallet",
            icon: Wallet,
            iconBg: "from-cyan-600 to-cyan-700",
            titleKey: "heroSlideWalletTitle",
            subtitleKey: "heroSlideWalletSubtitle",
            descriptionKey: "heroSlideWalletDesc",
            cta: isAuthenticated ? t("heroCtaGoToDashboard") : t("heroCtaOpenAccount"),
            gradient: "from-cyan-600/20 to-cyan-700/20",
            borderColor: "border-cyan-500/20",
            ctaClass: "bg-cyan-500 hover:bg-cyan-600",
        },
        {
            id: "manager",
            icon: Headphones,
            iconBg: "from-orange-600 to-orange-700",
            titleKey: "heroSlideManagerTitle",
            subtitleKey: "heroSlideManagerSubtitle",
            descriptionKey: "heroSlideManagerDesc",
            cta: isAuthenticated ? t("heroCtaGoToDashboard") : t("heroCtaOpenAccount"),
            gradient: "from-orange-600/20 to-orange-700/20",
            borderColor: "border-orange-500/20",
            ctaClass: "bg-orange-500 hover:bg-orange-600",
        },
    ];

    const features = [
        {
            icon: Terminal,
            titleKey: "advancedTrading",
            descriptionKey: "advancedTradingDesc",
            gradient: "from-violet-600/20 to-violet-700/20",
            borderColor: "border-violet-500/20",
        },
        {
            icon: Shield,
            titleKey: "enterpriseSecurity",
            descriptionKey: "enterpriseSecurityDesc",
            gradient: "from-cyan-600/20 to-cyan-700/20",
            borderColor: "border-cyan-500/20",
        },
        {
            icon: Zap,
            titleKey: "lightningFast",
            descriptionKey: "lightningFastDesc",
            gradient: "from-orange-600/20 to-orange-700/20",
            borderColor: "border-orange-500/20",
        },
    ];

    const stats = [
        { value: "3800+", labelKey: "heroStatActiveClients", icon: Users },
        { value: "230+", labelKey: "trustedCompanies", icon: Award },
        { value: "$230M+", labelKey: "dailyVolume", icon: TrendingUp },
        { value: "0.001s", labelKey: "heroStatExecutionSpeed", icon: Zap },
    ];

    const howItWorksSteps = [
        { step: "01", titleKey: "stepCreateAccountTitle", descKey: "stepCreateAccountDesc" },
        { step: "02", titleKey: "stepFundAccountTitle", descKey: "stepFundAccountDesc" },
        { step: "03", titleKey: "stepStartTradingTitle", descKey: "stepStartTradingDesc" },
    ];

    const educationItems = [
        { titleKey: "educationItemAcademy", descKey: "educationItemAcademyDesc", icon: Terminal },
        { titleKey: "educationItemIdeas", descKey: "educationItemIdeasDesc", icon: BarChart3 },
        { titleKey: "educationItemSupport", descKey: "educationItemSupportDesc", icon: Shield },
    ];

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % 3);
        setIsAutoPlaying(false);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + 3) % 3);
        setIsAutoPlaying(false);
    };

    const currentSlideData = slides[currentSlide];
    console.log(loadUser)
    return (
        <div
            ref={containerRef}
            className="min-h-screen text-white overflow-x-hidden"
            style={{ backgroundColor: "var(--app-bg-page)" }}
        >
            {/* Header for unauthenticated users */}
            {!loadUser && !isAuthenticated && <Header homepage={true} />}
            {/* Multi-layer Parallax Background */}
            <div className="fixed inset-0 z-0">
                {/* Layer 1 */}
                <motion.div style={{ y: layer1Y }} className="absolute inset-0">
                    <div
                        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
                        style={{ background: "var(--app-accent-soft)" }}
                    />
                    <div
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
                        style={{ background: "var(--app-bg-surface)" }}
                    />
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-5"
                        style={{ background: "var(--app-bg-tile)" }}
                    />
                </motion.div>

                {/* Layer 2 - Grid pattern */}
                <motion.div style={{ y: layer2Y }} className="absolute inset-0 opacity-5">
                    <div
                        className="absolute inset-0 bg-center"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='80' height='80' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 80 0 L 0 0 0 80' fill='none' stroke='white' stroke-width='0.5' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`,
                        }}
                    />
                </motion.div>

                {/* Layer 3 - Floating dots */}
                <motion.div style={{ y: layer3Y }} className="absolute inset-0">
                    <div
                        className="absolute top-1/3 left-1/3 w-2 h-2 rounded-full opacity-30"
                        style={{ background: "var(--app-accent)" }}
                    />
                    <div
                        className="absolute top-2/3 right-1/3 w-3 h-3 rounded-full opacity-30"
                        style={{ background: "var(--app-text-muted)" }}
                    />
                    <div
                        className="absolute bottom-1/3 left-1/2 w-1 h-1 rounded-full opacity-30"
                        style={{ background: "var(--app-text-secondary)" }}
                    />
                    <div
                        className="absolute top-1/2 right-1/2 w-2 h-2 rounded-full opacity-30"
                        style={{ background: "var(--app-success)" }}
                    />
                </motion.div>

                {/* Layer 4 - Borders */}
                <motion.div style={{ y: layer4Y }} className="absolute inset-0">
                    <div
                        className="absolute top-0 left-0 w-full h-px"
                        style={{ background: "linear-gradient(90deg, transparent, var(--app-border-subtle), transparent)" }}
                    />
                    <div
                        className="absolute bottom-0 left-0 w-full h-px"
                        style={{ background: "linear-gradient(90deg, transparent, var(--app-border-subtle), transparent)" }}
                    />
                    <div
                        className="absolute top-0 left-0 w-px h-full"
                        style={{ background: "linear-gradient(0deg, transparent, var(--app-border-subtle), transparent)" }}
                    />
                    <div
                        className="absolute top-0 right-0 w-px h-full"
                        style={{ background: "linear-gradient(0deg, transparent, var(--app-border-subtle), transparent)" }}
                    />
                </motion.div>
            </div>

            {/* Hero Section with Slider */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-2 sm:px-6 lg:px-8">
                <motion.div style={{ scale: heroScale }} className="w-full max-w-7xl mx-auto mb-14 ">
                    <div className="relative">
                        {/* Main Slider Card */}
                        <div
                            ref={sliderRef}
                            className="relative rounded-md overflow-hidden border backdrop-blur-xl transition-all duration-700 cursor-grab active:cursor-grabbing"
                            style={{
                                background: `linear-gradient(135deg, var(--app-bg-surface) 0%, var(--app-bg-tile) 100%)`,
                                borderColor: "var(--app-border-subtle)",
                            }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div className="flex flex-row h-[260px] sm:h-[320px] md:h-[360px] lg:h-[420px]">
                                {/* Left side - Content */}
                                <div
                                    className="flex-1 px-4 py-2 sm:px-6 sm:py-6 lg:px-10 lg:py-10 flex items-center overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentSlide}
                                            initial={{opacity: 0, x: 40}}
                                            animate={{opacity: 1, x: 0}}
                                            exit={{opacity: 0, x: -40}}
                                            transition={{duration: 0.45, ease: [0.25, 0.1, 0.25, 1]}}
                                            className="space-y-3 sm:space-y-4"
                                        >
                                            {/* Title & subtitle */}
                                            <div className="space-y-1 sm:space-y-2">
                                                <h1
                                                    className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
                                                    style={{color: "var(--app-text-primary)"}}
                                                >
                                                    {t(currentSlideData.titleKey)}
                                                </h1>
                                                <p
                                                    className="text-[11px]  w-3/4 sm:w-full sm:text-base md:text-lg lg:text-xl"
                                                    style={{color: "var(--app-text-secondary)"}}
                                                >
                                                    {t(currentSlideData.subtitleKey)}
                                                </p>
                                            </div>

                                            {/* Description */}
                                            <p
                                                className="hidden sm:block text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl line-clamp-4 md:line-clamp-none"
                                                style={{color: "var(--app-text-muted)"}}
                                            >
                                                {t(currentSlideData.descriptionKey)}
                                            </p>

                                            {/* CTA Button */}
                                            <div className="pt-1 pb-4 sm:pb-0 sm:pt-2">
                                                <Button
                                                    size="sm"
                                                    className={`${currentSlideData.ctaClass} text-white border-none px-2 rounded-md py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105`}
                                                    onClick={() => console.log("CTA clicked")}
                                                >
                                                    {loadUser === true ? <Skeleton className={'animate-pulse opacity-60  bg-app-bgTileSoft w-32 h-4 '}><span className={'opacity-0'}>Lorem ipsum dolor sit amet, consectetur adipisicing elit</span></Skeleton> : currentSlideData.cta}
                                                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4"/>
                                                </Button>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Right side - Visual (всегда справа, даже на телефоне) */}
                                <div
                                    className="flex items-center justify-center pr-5 sm:pr-5 lg:pr-10 w-24 sm:w-28 md:w-36 lg:w-48 relative">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentSlide}
                                            initial={{opacity: 0, scale: 0.9}}
                                            animate={{opacity: 1, scale: 1}}
                                            exit={{opacity: 0, scale: 1.05}}
                                            transition={{duration: 0.45, ease: [0.25, 0.1, 0.25, 1]}}
                                            className="relative"
                                        >
                                            <div
                                                className="absolute -top-6 -left-3 w-12 h-12 rounded-full opacity-15"
                                                style={{background: "var(--app-accent-soft)"}}
                                            />
                                            <div
                                                className="absolute -bottom-4 -right-3 w-10 h-10 rounded-full opacity-10"
                                                style={{background: "var(--app-bg-tile)"}}
                                            />
                                            <div
                                                className="absolute top-3 right-2 w-8 h-8 rounded-full opacity-10"
                                                style={{background: "var(--app-success-soft)"}}
                                            />

                                            <div
                                                className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-2xl flex items-center justify-center bg-gradient-to-br ${currentSlideData.iconBg} shadow-2xl`}
                                            >
                                                <currentSlideData.icon
                                                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-white"/>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Minimal pagination dots */}
                            <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
                                {slides.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`transition-all duration-300 ${
                                            index === currentSlide
                                                ? "w-10 scale-110"
                                                : "w-3 hover:w-6 hover:scale-110"
                                        } h-3 rounded-full`}
                                        style={{
                                            background:
                                                index === currentSlide
                                                    ? "var(--app-accent)"
                                                    : "var(--app-text-muted)",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Trust indicators */}
                        <motion.div
                            initial={{opacity: 0, y: 30}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.6, duration: 0.5}}
                            className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{opacity: 0, y: 20}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.7 + index * 0.1, duration: 0.5}}
                                    className="text-center"
                                >
                                    <div className="flex items-center justify-center mb-3">
                                        <stat.icon
                                            className="w-6 h-6 mr-2"
                                            style={{color: "var(--app-accent)"}}
                                        />
                                        <div
                                            className="text-3xl lg:text-4xl font-bold"
                                            style={{color: "var(--app-text-primary)"}}
                                        >
                                            {stat.value}
                                        </div>
                                    </div>
                                    <div style={{color: "var(--app-text-secondary)"}}>
                                        {t(stat.labelKey)}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <motion.section
                style={{opacity: contentOpacity, y: featuresY}}
                className="relative z-10 py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        className="text-center mb-16"
                    >
                        <h2
                            className="text-4xl lg:text-5xl font-bold mb-6"
                            style={{color: "var(--app-text-primary)"}}
                        >
                            {t("whyChoose")}{" "}
                            <span className="text-app-accent">AragonTrade</span>
                        </h2>
                        <p
                            className="text-xl max-w-3xl mx-auto"
                            style={{color: "var(--app-text-secondary)"}}
                        >
                            {t("experienceFutureDescription")}
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card
                                    className={`h-full border transition-all duration-300 hover:scale-105 ${feature.borderColor}`}
                                    style={{ background: "var(--app-bg-surface)" }}
                                >
                                    <CardContent className="p-8">
                                        <div
                                            className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.gradient}`}
                                        >
                                            <feature.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h3
                                            className="text-2xl font-bold mb-4"
                                            style={{ color: "var(--app-text-primary)" }}
                                        >
                                            {t(feature.titleKey)}
                                        </h3>
                                        <p style={{ color: "var(--app-text-muted)" }}>
                                            {t(feature.descriptionKey)}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* How It Works Section */}
            <motion.section
                style={{ opacity: contentOpacity, y: howItWorksY }}
                className="relative z-10 py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2
                            className="text-4xl lg:text-5xl font-bold mb-6"
                            style={{ color: "var(--app-text-primary)" }}
                        >
                            {t("howItWorksTitle")}
                        </h2>
                        <p
                            className="text-xl max-w-3xl mx-auto"
                            style={{ color: "var(--app-text-secondary)" }}
                        >
                            {t("howItWorksSubtitle")}
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {howItWorksSteps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div
                                    className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                    style={{ background: "var(--app-accent)" }}
                                >
                                    {step.step}
                                </div>
                                <h3
                                    className="text-xl font-bold mb-3"
                                    style={{ color: "var(--app-text-primary)" }}
                                >
                                    {t(step.titleKey)}
                                </h3>
                                <p style={{ color: "var(--app-text-muted)" }}>
                                    {t(step.descKey)}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Education Section */}
            <motion.section
                style={{ opacity: contentOpacity, y: educationY }}
                className="relative z-10 py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2
                            className="text-4xl lg:text-5xl font-bold mb-6"
                            style={{ color: "var(--app-text-primary)" }}
                        >
                            {t("educationBlockTitle")}
                        </h2>
                        <p
                            className="text-xl max-w-3xl mx-auto"
                            style={{ color: "var(--app-text-secondary)" }}
                        >
                            {t("educationBlockDesc")}
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {educationItems.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card
                                    className="h-full border transition-all duration-300 hover:scale-105"
                                    style={{
                                        background: "var(--app-bg-surface)",
                                        borderColor: "var(--app-border-subtle)",
                                    }}
                                >
                                    <CardContent className="p-8 text-center">
                                        <div
                                            className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center"
                                            style={{ background: "var(--app-accent-soft)" }}
                                        >
                                            <item.icon
                                                className="w-8 h-8"
                                                style={{ color: "var(--app-accent)" }}
                                            />
                                        </div>
                                        <h3
                                            className="text-xl font-bold mb-3"
                                            style={{ color: "var(--app-text-primary)" }}
                                        >
                                            {t(item.titleKey)}
                                        </h3>
                                        <p style={{ color: "var(--app-text-muted)" }}>
                                            {t(item.descKey)}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* CTA Section */}
            <motion.section
                style={{ opacity: contentOpacity, y: ctaY }}
                className="relative z-10 py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            >
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-3xl p-12 sm:p-16 text-center border backdrop-blur-sm"
                        style={{
                            background: "var(--app-bg-surface)",
                            borderColor: "var(--app-border-subtle)",
                        }}
                    >
                        <h2
                            className="text-4xl font-bold mb-6"
                            style={{ color: "var(--app-text-primary)" }}
                        >
                            {t("readyToStart")}{" "}
                            <span className="text-app-accent">{t("tradingJourney")}</span>
                        </h2>
                        <p
                            className="text-xl mb-8 max-w-2xl mx-auto"
                            style={{ color: "var(--app-text-secondary)" }}
                        >
                            {t("joinThousandsSuccessful")}
                        </p>
                        <Button
                            size="lg"
                            className="px-8 mx-auto w-full sm:px-12 py-5 text-xl font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                            style={{
                                background: "var(--app-accent)",
                                color: "white",
                            }}
                        >
                            {t("createFreeAccount")}
                            <ArrowUpRight className="ml-2 w-6 h-6" />
                        </Button>
                    </motion.div>
                </div>
            </motion.section>
            {/* Chat button for authenticated users */}
            {!loadUser && isAuthenticated && <ChatButton />}
        </div>
    );
}
