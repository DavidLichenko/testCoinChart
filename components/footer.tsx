"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe2,
} from "lucide-react";
import {useI18n} from "@/components/i18n-provider";
import { US, ES } from 'country-flag-icons/react/3x2'
import { useState } from "react";
import {useIsMobile} from "@/hooks/use-mobile";

export function Footer() {
  const { t, lang, setLang } = useI18n();
  const [collapse, setIsCollapse] = useState(true)
  const isMobile = useIsMobile();
  const variants = {
    selected: collapse ? { opacity: 1, transform: "scale(1.1)", zIndex: 20, bottom:0 } : { opacity: 1, transform: "scale(1)", zIndex: 20, bottom:0 },
    hidden: collapse ? { opacity: 0.6, transform: "scale(1)",  zIndex: 0, bottom:13} : { opacity: 1, transform: "scale(1)",  zIndex: 0, bottom:50}
  }

  return (
      <footer className="pt-10 z-20 border-t border-[#17172b] bg-app-bgDeep text-slate-300">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-3 py-8 sm:px-4 sm:py-10 md:px-6 lg:px-8 lg:py-12">
          {/* TOP: logo + short nav */}
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center ">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#11111f]">
                {/* твой логотип */}
                <img
                    src="/logo.png"
                    alt="Aragon Trade"
                    className="h-7 w-7 object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                  ARAGON TRADE
                </p>
                <p className="text-[11px] text-slate-500">
                  Multi-asset trading platform
                </p>
              </div>
            </div>
            <div className={'flex w-full justify-start md:justify-end'}>
              <motion.button
                  className={'hover:cursor-pointer relative flex justify-start md:justify-end mt-10 w-36 h-full'}
                  variants={variants}
                  onTap={() => setIsCollapse(!collapse)}
              >
                <div className={"block mt-12 md:mt-0"}>
                  <motion.span
                      initial={{ opacity: 0.5 }}
                      animate={collapse ? {opacity:1, top:isMobile ? -60 : -40} : {opacity: 0}}
                      className="block h-full items-start relative text-app-muted font-bold mb-1 text-[13px] text-start md:text-end uppercase">{t("language")}
                  </motion.span>
                  <motion.span
                      className="hidden md:block  h-full items-end relative text-app-muted font-bold mb-1 text-[13px] text-start md:text-end uppercase"
                      initial={{ opacity: 0 }}
                      animate={!collapse ? {opacity:1, top:-120} : {opacity: 0}}
                  >{t("select")}</motion.span>
                </div>
                <motion.div
                    variants={variants}
                    initial={lang === "es" ? "selected" : "hidden"}
                    animate={lang === "es" ? "selected" : "hidden"}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    onClick={()=>{
                      if(!collapse)  {
                        setLang("es")
                        setIsCollapse(!collapse)
                      }
                    }}
                    className={'absolute flex gap-2 rounded-sm p-2 justify-start items-center w-36 bg-[#11111f] uppercase font-bold text-[12px]  hover:cursor-pointer'}>
                  <ES className={'w-5 h-5'}/>
                  {t('spanish')}
                </motion.div>

                <motion.div
                    variants={variants}
                    initial={lang === "en" ? "selected" : "hidden"}
                    animate={lang === "en" ? "selected" : "hidden"}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    // exit={!collapse && lang == "es" ? "hidden" : "selected" }
                    onClick={()=>{
                      if(!collapse)  {
                        setLang("en")
                        setIsCollapse(!collapse)
                      }
                    }}
                    className={'absolute flex gap-2 rounded-sm p-2 justify-start w-36 items-center bg-[#11111f] uppercase font-bold text-[12px]   hover:cursor-pointer '}>
                  <US className={'w-5 h-5'}/>
                  {t('english')}
                </motion.div>

              </motion.button>
            </div>
            {/*<div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">*/}
            {/*  <Link href="/status" className="hover:text-slate-200">*/}
            {/*    Status*/}
            {/*  </Link>*/}
            {/*  <span className="h-3 w-px bg-slate-700/70" />*/}
            {/*  <Link href="/docs" className="hover:text-slate-200">*/}
            {/*    API & Docs*/}
            {/*  </Link>*/}
            {/*  <span className="h-3 w-px bg-slate-700/70" />*/}
            {/*  <Link href="/support" className="hover:text-slate-200">*/}
            {/*    Support*/}
            {/*  </Link>*/}
            {/*</div>*/}
          </div>

          {/* MIDDLE: highlight cards (как у референса, но под трейдинг) */}
          {/*<div className="grid gap-3 md:grid-cols-3">*/}
          {/*  /!* Telegram / updates *!/*/}
          {/*  /!*<Link*!/*/}
          {/*  /!*    href="/community"*!/*/}
          {/*  /!*    className="group flex flex-col justify-between rounded-sm border border-[#272744] bg-[radial-gradient(circle_at_top,#2e1065_0,transparent_55%),radial-gradient(circle_at_bottom_right,#0f766e_0,transparent_60%)] px-4 py-4 text-xs transition hover:border-violet-500/60 hover:bg-[#070716]"*!/*/}
          {/*  /!*>*!/*/}
          {/*  /!*  <div className="flex items-center justify-between gap-3">*!/*/}
          {/*  /!*    <div className="flex items-center gap-2">*!/*/}
          {/*  /!*      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black/30">*!/*/}
          {/*  /!*        <Send className="h-4 w-4 text-violet-300" />*!/*/}
          {/*  /!*      </div>*!/*/}
          {/*  /!*      <div>*!/*/}
          {/*  /!*        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200">*!/*/}
          {/*  /!*          Community*!/*/}
          {/*  /!*        </p>*!/*/}
          {/*  /!*        <p className="text-[11px] text-slate-300">*!/*/}
          {/*  /!*          Join our Telegram for market updates & releases.*!/*/}
          {/*  /!*        </p>*!/*/}
          {/*  /!*      </div>*!/*/}
          {/*  /!*    </div>*!/*/}
          {/*  /!*    <ArrowUpRight className="h-3.5 w-3.5 text-violet-200 opacity-60 group-hover:opacity-100" />*!/*/}
          {/*  /!*  </div>*!/*/}
          {/*  /!*</Link>*!/*/}

          {/*  /!* Mobile / web app hint *!/*/}
          {/*  <div className="flex flex-col justify-between rounded-sm border border-[#272744] bg-[radial-gradient(circle_at_top,#1d4ed8_0,transparent_55%),radial-gradient(circle_at_bottom_left,#0f172a_0,transparent_60%)] px-4 py-4 text-xs">*/}
          {/*    <div className="mb-2 flex items-center gap-2">*/}
          {/*      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black/30">*/}
          {/*        <Smartphone className="h-4 w-4 text-sky-300" />*/}
          {/*      </div>*/}
          {/*      <div>*/}
          {/*        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200">*/}
          {/*          Cross-platform*/}
          {/*        </p>*/}
          {/*        <p className="text-[11px] text-slate-200">*/}
          {/*          Trade from desktop or mobile browser, no installs required.*/}
          {/*        </p>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*    <p className="text-[10px] text-slate-400">*/}
          {/*      Add <span className="text-slate-200">app.aragon.trade</span> to*/}
          {/*      your home screen for 1-tap access.*/}
          {/*    </p>*/}
          {/*  </div>*/}

          {/*  /!* Security / regulation card *!/*/}
          {/*  <div className="flex flex-col justify-between rounded-sm border border-[#272744] bg-[radial-gradient(circle_at_top,#15803d_0,transparent_55%),radial-gradient(circle_at_bottom_left,#020617_0,transparent_60%)] px-4 py-4 text-xs">*/}
          {/*    <div className="mb-2 flex items-center gap-2">*/}
          {/*      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black/30">*/}
          {/*        <ShieldCheck className="h-4 w-4 text-emerald-300" />*/}
          {/*      </div>*/}
          {/*      <div>*/}
          {/*        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-200">*/}
          {/*          Security*/}
          {/*        </p>*/}
          {/*        <p className="text-[11px] text-slate-200">*/}
          {/*          Segregated client funds, strict risk controls, encryption by*/}
          {/*          default.*/}
          {/*        </p>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*    <p className="text-[10px] text-slate-400">*/}
          {/*      Read more in{" "}*/}
          {/*      <Link*/}
          {/*          href="/security"*/}
          {/*          className="text-emerald-300 underline-offset-2 hover:underline"*/}
          {/*      >*/}
          {/*        our security overview*/}
          {/*      </Link>*/}
          {/*      .*/}
          {/*    </p>*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/* LINK COLUMNS */}
          <div className="grid grid-cols-2 gap-6 border-t border-[#17172b] pt-6 text-[11px] text-slate-400 md:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* About + socials */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Platform
              </p>
              <p className="max-w-sm text-[11px] leading-relaxed text-slate-500">
                Aragon Trade provides multi-asset CFD trading with deep liquidity,
                fast execution and institutional-grade risk management tools.
              </p>

              {/*<div className="flex flex-wrap items-center gap-2 pt-1">*/}
              {/*  <Link*/}
              {/*      href="https://twitter.com"*/}
              {/*      target="_blank"*/}
              {/*      className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#0b0b16] text-slate-300 hover:bg-[#151527] hover:text-white"*/}
              {/*  >*/}
              {/*    <Twitter className="h-3.5 w-3.5" />*/}
              {/*  </Link>*/}
              {/*  <Link*/}
              {/*      href="https://instagram.com"*/}
              {/*      target="_blank"*/}
              {/*      className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#0b0b16] text-slate-300 hover:bg-[#151527] hover:text-white"*/}
              {/*  >*/}
              {/*    <Instagram className="h-3.5 w-3.5" />*/}
              {/*  </Link>*/}
              {/*  <Link*/}
              {/*      href="/community"*/}
              {/*      className="flex h-7 items-center gap-1 rounded-sm bg-[#0b0b16] px-2 text-[11px] text-slate-300 hover:bg-[#151527] hover:text-white"*/}
              {/*  >*/}
              {/*    <Send className="h-3.5 w-3.5" />*/}
              {/*    <span>Telegram</span>*/}
              {/*  </Link>*/}
              {/*</div>*/}
            </div>

            {/* Trading */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Trading
              </p>
              <ul className="space-y-1">
                <li>
                  <Link href="/market" className="hover:text-slate-200">
                    Trading terminal
                  </Link>
                </li>
                <li>
                  <Link href="/wallet" className="hover:text-slate-200">
                    Wallet & balances
                  </Link>
                </li>
                <li>
                  <Link href="/profile/transactions" className="hover:text-slate-200">
                    Transactions history
                  </Link>
                </li>
                <li>
                  <Link href="/profile/referrals" className="hover:text-slate-200">
                    Referral program
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Company
              </p>
              <ul className="space-y-1">
                <li>
                  <Link href="/about" className="hover:text-slate-200">
                    About Aragon
                  </Link>
                </li>
                <li>
                  <Link href="/fees" className="hover:text-slate-200">
                    Fees & conditions
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-slate-200">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-slate-200">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Legal
              </p>
              <ul className="space-y-1">
                <li>
                  <Link href="/terms" className="hover:text-slate-200">
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-slate-200">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link href="/aml-kyc" className="hover:text-slate-200">
                    AML / KYC
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* BOTTOM STRIP */}
          <div className="flex flex-col gap-3 border-t border-[#17172b] pt-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl leading-relaxed">
              Trading CFDs and other leveraged products involves a high level of
              risk and may not be suitable for all investors. You can lose more
              than your initial investment. Do not trade with funds you cannot
              afford to lose.
            </p>

            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-end">
              <div className="flex items-center gap-2">
                <Globe2 className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-400">
                © {new Date().getFullYear()} Aragon Trade. All rights reserved.
              </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
  );
}
