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
            <div className={'flex w-full justify-start md:justify-end overflow-visible'}>
              <div className={'relative w-36 min-h-[60px] md:min-h-[40px]'}>
                <motion.button
                    className={'hover:cursor-pointer relative flex justify-start md:justify-end w-full'}
                    variants={variants}
                    onTap={() => setIsCollapse(!collapse)}
                >
                  <div className={"block w-full"}>
                    <motion.span
                        initial={{ opacity: 0.5 }}
                        animate={collapse ? {opacity:1, top:isMobile ? -50 : -40} : {opacity: 0}}
                        className="block h-full items-start relative text-app-muted font-bold mb-1 text-[13px] text-start md:text-end uppercase">{t("language")}
                    </motion.span>
                    <motion.span
                        className="hidden md:block h-full items-end relative text-app-muted font-bold mb-1 text-[13px] text-start md:text-end uppercase"
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
                      className={'absolute left-0 md:left-auto md:right-0 flex gap-2 rounded-sm p-2 justify-start items-center w-36 bg-[#11111f] uppercase font-bold text-[12px] hover:cursor-pointer z-10'}>
                    <ES className={'w-5 h-5 shrink-0'}/>
                    <span className="truncate">{t('spanish')}</span>
                  </motion.div>

                  <motion.div
                      variants={variants}
                      initial={lang === "en" ? "selected" : "hidden"}
                      animate={lang === "en" ? "selected" : "hidden"}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      onClick={()=>{
                        if(!collapse)  {
                          setLang("en")
                          setIsCollapse(!collapse)
                        }
                      }}
                      className={'absolute left-0 md:left-auto md:right-0 flex gap-2 rounded-sm p-2 justify-start w-36 items-center bg-[#11111f] uppercase font-bold text-[12px] hover:cursor-pointer z-10'}>
                    <US className={'w-5 h-5 shrink-0'}/>
                    <span className="truncate">{t('english')}</span>
                  </motion.div>

                </motion.button>
              </div>
            </div>
          </div>


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
