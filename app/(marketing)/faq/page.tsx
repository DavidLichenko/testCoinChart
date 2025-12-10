"use client"

import { motion } from "framer-motion"
import { HelpCircle, ShieldCheck, Wallet, Bot, BarChart3 } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion"

export default function FAQPage() {
    const { t } = useI18n()

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#050012] via-[#08001a] to-[#050012] px-3 py-6 sm:px-6 lg:px-10">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:gap-8">
                {/* Hero */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-4 text-center lg:text-left"
                >
                    <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-purple-200">
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>{t("faq.badge")}</span>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-balance text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                            {t("faq.title")}
                        </h1>
                        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
                            {t("faq.subtitle")}
                        </p>
                    </div>
                </motion.section>

                {/* Быстрые блоки */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.35 }}
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <Card className="border-slate-800/80 bg-slate-950/80">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                                <BarChart3 className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-sm">{t("faq.stats.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs text-slate-300">
                            <p>{t("faq.stats.item1")}</p>
                            <p>{t("faq.stats.item2")}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-950/80">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                                <Wallet className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-sm">{t("faq.deposits.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs text-slate-300">
                            <p>{t("faq.deposits.item1")}</p>
                            <p>{t("faq.deposits.item2")}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-950/80">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
                                <Bot className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-sm">{t("faq.ai.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs text-slate-300">
                            <p>{t("faq.ai.item1")}</p>
                            <p>{t("faq.ai.item2")}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-950/80 lg:col-span-1 sm:col-span-2">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-sm">{t("faq.security.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs text-slate-300">
                            <p>{t("faq.security.item1")}</p>
                            <p>{t("faq.security.item2")}</p>
                        </CardContent>
                    </Card>
                </motion.section>

                {/* Основной FAQ */}
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.35 }}
                >
                    <Card className="border-slate-800/80 bg-slate-950/90">
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-base sm:text-lg">
                                {t("faq.section.generalTitle")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <Accordion type="single" collapsible className="space-y-1">
                                {/* Общие вопросы */}
                                <AccordionItem value="what-is-platform">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.whatIsPlatform.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.whatIsPlatform.a")}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="is-trading-risky">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.isTradingRisky.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.isTradingRisky.a")}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="which-markets">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.whichMarkets.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.whichMarkets.a")}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Депозиты / вывод */}
                                <AccordionItem value="min-deposit">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.minDeposit.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.minDeposit.a")}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="how-long-withdraw">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.howLongWithdraw.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.howLongWithdraw.a")}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Безопасность */}
                                <AccordionItem value="is-balance-safe">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.isBalanceSafe.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.isBalanceSafe.a")}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* AI Trading */}
                                <AccordionItem value="how-ai-works">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.howAIWorks.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.howAIWorks.a")}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="ai-guarantee">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.aiGuarantee.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.aiGuarantee.a")}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Поддержка */}
                                <AccordionItem value="support">
                                    <AccordionTrigger className="text-left text-sm text-slate-100">
                                        {t("faq.questions.support.q")}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-slate-300">
                                        {t("faq.questions.support.a")}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </motion.section>
            </div>
        </div>
    )
}

/**
 * i18n keys (en пример, ты подставишь свои переводы):
 *
 * faq.badge
 * faq.title
 * faq.subtitle
 *
 * faq.stats.title
 * faq.stats.item1
 * faq.stats.item2
 *
 * faq.deposits.title
 * faq.deposits.item1
 * faq.deposits.item2
 *
 * faq.ai.title
 * faq.ai.item1
 * faq.ai.item2
 *
 * faq.security.title
 * faq.security.item1
 * faq.security.item2
 *
 * faq.section.generalTitle
 *
 * faq.questions.whatIsPlatform.q
 * faq.questions.whatIsPlatform.a
 *
 * faq.questions.isTradingRisky.q
 * faq.questions.isTradingRisky.a
 *
 * faq.questions.whichMarkets.q
 * faq.questions.whichMarkets.a
 *
 * faq.questions.minDeposit.q
 * faq.questions.minDeposit.a
 *
 * faq.questions.howLongWithdraw.q
 * faq.questions.howLongWithdraw.a
 *
 * faq.questions.isBalanceSafe.q
 * faq.questions.isBalanceSafe.a
 *
 * faq.questions.howAIWorks.q
 * faq.questions.howAIWorks.a
 *
 * faq.questions.aiGuarantee.q
 * faq.questions.aiGuarantee.a
 *
 * faq.questions.support.q
 * faq.questions.support.a
 */
