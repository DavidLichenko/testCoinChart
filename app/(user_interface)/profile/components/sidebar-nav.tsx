"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Activity,
  FileText,
  Users,
  Shield,
  CreditCard,
  Settings,
  LogOut,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { useBalance } from "@/hooks/useBalance";

const navItems = [
  {
    name: "dashboard",
    href: "/profile/dashboard",
    icon: <Home className="h-4 w-4" />,
  },
  {
    name: "transactions",
    href: "/profile/transactions",
    icon: <Activity className="h-4 w-4" />,
  },
  {
    name: "referrals",
    href: "/profile/referrals",
    icon: <Users className="h-4 w-4" />,
  },
  {
    name: "verification",
    href: "/profile/verification",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    name: "withdraw",
    href: "/profile/withdraw",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    name: "history",
    href: "/profile/history",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    name: "settings",
    href: "/profile/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { t } = useI18n();
  const { balance, liveProfit, details } = useBalance();
  const equity = (balance ?? 0) + (liveProfit ?? 0);
  const currency = details?.baseCurrency ?? "USD";

  return (
      <aside className="flex h-full flex-col">
        {/* основной «бокс» сайдбара */}
        <div className="flex justify-start items-center gap-6 m-2">
          <Link href={'/'} className="rounded-md p-3 bg-app-bgTile bounce"><ArrowLeft className={"w-4 h-4"}/></Link>
          <span className="text-xl font-bold">Profile</span>
        </div>
        <div className="flex h-full flex-col rounded-2xl  bg-app-bgSurface px-3 py-4">
          {/* user / баланс */}
          <div className="rounded-2xl bg-[#090918] px-3 py-3 shadow-md shadow-app-bgDeep backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/60 to-purple-600/60 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(139,92,246,0.65)]">
                {(user?.name || user?.email || "?")
                    .toString()
                    .charAt(0)
                    .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-50">
                  {user?.name || user?.email || "Trader"}
                </div>
                {user?.id && (
                    <div className="text-[11px] text-slate-500">
                      ID: {user.id.slice(0, 6)}
                    </div>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-sm bg-app-bgTile px-3 py-2.5 flex items-center justify-between border border-app-borderStrong">
              <div className={'flex justify-between w-full'}>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    {t("accountBalance") ?? "ACCOUNT BALANCE"}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-semibold text-slate-50">
                  {Number.isFinite(equity) ? equity.toFixed(2) : "0.00"}
                </span>
                    <span className="text-[11px] text-slate-500">{currency}</span>
                  </div>
                  <div className="mt-1 flex flex-col items-baseline gap-1.5">
                    <span className={'text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500'}>{t('Withdrawal')}</span>
                    <div className="gap-1 flex text-lg font-semibold text-slate-50">
                          { details?.availableToWithdraw }
                      <span className="text-[11px] text-slate-500">{currency}</span>
                </div>

                  </div>
                </div>
                <div
                    className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/25 text-violet-200">
                  <Wallet className="h-4 w-4"/>
                </div>
              </div>

            </div>


            <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
                  href="/profile/deposits"
                  className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-gradient-to-r from-violet-600 to-purple-600 px-2.5 py-2 text-[11px] font-semibold text-white transition-transform duration-150 hover:scale-[1.03]"
              >
                <span> {t("deposit") ?? "Deposit"} </span>
              </Link>
              <Link
                  href="/profile/withdraw"
                  className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-[#0b0b18] px-2.5 py-2 text-[11px] font-semibold text-slate-200 border border-[#262644] shadow-[0_8px_24px_rgba(0,0,0,0.8)] transition-transform duration-150 hover:scale-[1.03] hover:border-violet-500/60"
              >
                <span>{t("withdraw") ?? "Withdraw"}</span>
              </Link>
            </div>
          </div>

          {/* навигация */}
          <nav className="mt-4 flex-1 ">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                  <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex transform-gpu items-center justify-between rounded-sm px-2.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150
                  ${
                          isActive
                              ? "z-50 bg-[linear-gradient(135deg,#2b2344,#101020)] border border-violet-500/70 text-slate-50 "
                              : "bg-[#080818] border border-transparent text-slate-400 hover:text-slate-50 hover:border-[#272747] hover:shadow-[0_14px_36px_rgba(0,0,0,0.9)] hover:scale-[1.015]"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* левый индикатор */}
                      <span
                          className={`hidden h-7 w-0.5 rounded-full sm:block transition-colors
                    ${
                              isActive
                                  ? "bg-gradient-to-b from-violet-400 to-fuchsia-400"
                                  : "bg-slate-700/0 group-hover:bg-slate-600/70"
                          }`}
                      />
                      <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors
                    ${
                              isActive
                                  ? "bg-violet-600/25 text-violet-100"
                                  : "group-hover:text-slate-50"
                          }`}
                      >
                        {item.icon}
                      </div>
                      <span className="truncate">{t(item.name)}</span>
                    </div>

                    {/* маленький маркер активного пункта справа */}
                    {isActive && (
                        <span className="h-2 w-2 rounded-full bg-violet-400/90 shadow-[0_0_0_4px_rgba(139,92,246,0.35)]" />
                    )}
                  </Link>
              );
            })}
          </nav>

          {/* logout */}
          <div className="mt-4 pt-2 border-t border-[#141426]">
            <Button
                variant="ghost"
                onClick={logout}
                className="flex w-full transform-gpu items-center justify-start gap-2.5 rounded-xl bg-[#080818] px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-400 border border-[#1c1c33] shadow-[0_10px_30px_rgba(0,0,0,0.9)] transition-all duration-150 hover:bg-rose-600/12 hover:text-rose-100 hover:border-rose-500/60 hover:shadow-[0_0_0_1px_rgba(248,113,113,0.55),0_18px_40px_rgba(0,0,0,0.95)] hover:scale-[1.02]"
            >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg  text-slate-300">
              <LogOut className="h-4 w-4" />
            </span>
              <span className="truncate">{t("logoutLabel")}</span>
            </Button>
          </div>
        </div>
      </aside>
  );
}
