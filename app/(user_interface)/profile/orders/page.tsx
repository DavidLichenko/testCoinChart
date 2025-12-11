"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { useBalance } from "@/hooks/useBalance";
import {
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  Gift,
  Wallet,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast";
import { AnimatedNumber } from "@/components/animated-number";

interface Order {
  id: string;
  type: "DEPOSIT" | "WITHDRAW";
  status: string;
  amount: number;
  createdAt: string;
  depositFrom?: string;
  withdrawMethod?: string;
  cryptoAddress?: string;
  cryptoNetwork?: string;
  cardNumber?: string;
  metadata?: any;
}

export default function ProfileOrdersPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { details } = useBalance();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [hasCredit, setHasCredit] = useState(false);

  useEffect(() => {
    if (details) {
      setHasCredit((details.creditLimit || 0) > 0);
    }
  }, [details]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/orders");
        if (!response.ok) throw new Error("Failed to fetch orders");

        const data: Order[] = await response.json();
        // Filter: only DEPOSIT, WITHDRAW, REFERRAL_BONUS, CREDIT_GRANT
        const filtered = data.filter(order => {
          if (order.type === "DEPOSIT" || order.type === "WITHDRAW") return true;
          // Check metadata for referral bonus or credit
          if (order.metadata) {
            const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
            if (meta.type === "REFERRAL_BONUS" || meta.type === "CREDIT_GRANT") return true;
          }
          return false;
        });
        setOrders(filtered);
        setFilteredOrders(filtered);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: t("error"),
          description: t("admin.failedToLoadOrders") || "Failed to load orders",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [t]);

  useEffect(() => {
    let result = [...orders];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((order) => {
        const idMatch = order.id.toLowerCase().includes(q);
        const methodMatch = order.depositFrom?.toLowerCase().includes(q) || 
                          order.withdrawMethod?.toLowerCase().includes(q);
        return idMatch || methodMatch;
      });
    }

    if (statusFilter !== "ALL") {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (typeFilter !== "ALL") {
      if (typeFilter === "DEPOSIT") {
        result = result.filter((order) => order.type === "DEPOSIT");
      } else if (typeFilter === "WITHDRAW") {
        result = result.filter((order) => order.type === "WITHDRAW");
      } else if (typeFilter === "REFERRAL") {
        result = result.filter((order) => {
          const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
          return meta?.type === "REFERRAL_BONUS";
        });
      } else if (typeFilter === "CREDIT") {
        result = result.filter((order) => {
          const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
          return meta?.type === "CREDIT_GRANT";
        });
      }
    }

    result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter, typeFilter]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SUCCESSFUL":
      case "COMPLETED":
        return "default";
      case "PENDING":
      case "PROCESSING":
        return "secondary";
      case "FAILED":
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getOrderType = (order: Order) => {
    if (order.type === "DEPOSIT") return t("deposit");
    if (order.type === "WITHDRAW") return t("withdrawal");
    const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
    if (meta?.type === "REFERRAL_BONUS") return t("referralBonus") || "Referral Bonus";
    if (meta?.type === "CREDIT_GRANT") return t("creditGrant") || "Credit Grant";
    return order.type;
  };

  const getOrderIcon = (order: Order) => {
    if (order.type === "DEPOSIT") return <ArrowDownRight className="h-4 w-4 text-emerald-400" />;
    if (order.type === "WITHDRAW") return <ArrowUpRight className="h-4 w-4 text-rose-400" />;
    const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
    if (meta?.type === "REFERRAL_BONUS") return <Gift className="h-4 w-4 text-violet-400" />;
    if (meta?.type === "CREDIT_GRANT") return <Wallet className="h-4 w-4 text-blue-400" />;
    return <CreditCard className="h-4 w-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-500" />
          <p className="mt-3 text-xs text-slate-400">{t("loadingOrders") || "Loading orders..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-full flex-col gap-6 px-3 py-6 sm:px-4 sm:py-8 lg:px-0 lg:py-0">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-sm border border-slate-900 bg-slate-950/80 px-3 py-1.5">
          <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            {t("orders") || "Orders"}
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            {t("orderHistory") || "Order History"}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            {t("orderHistoryDescription") || "View your deposit, withdrawal, referral bonus, and credit transactions"}
          </p>
        </div>
      </header>

      {/* Filters + content */}
      <Card className="rounded-sm border border-slate-900 bg-[#050511] shadow-[0_22px_60px_rgba(0,0,0,0.85)]">
        <CardContent className="space-y-6 p-4 sm:p-6 lg:p-7">
          {/* Filters row */}
          <div className="flex flex-col gap-4 border-b border-slate-900 pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder={t("searchOrders") || "Search orders..."}
                  className="h-10 rounded-sm border-slate-800 bg-slate-950/90 pl-9 text-xs text-slate-50 placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[130px] rounded-sm border-slate-800 bg-slate-950/90 text-xs text-slate-100">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-slate-800 bg-slate-950 text-xs text-slate-50">
                  <SelectItem value="ALL">{t("allStatus") || "All Status"}</SelectItem>
                  <SelectItem value="SUCCESSFUL">{t("successful")}</SelectItem>
                  <SelectItem value="COMPLETED">{t("completed") || "Completed"}</SelectItem>
                  <SelectItem value="PENDING">{t("pending")}</SelectItem>
                  <SelectItem value="PROCESSING">{t("processing")}</SelectItem>
                  <SelectItem value="FAILED">{t("failed")}</SelectItem>
                  <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-[130px] rounded-sm border-slate-800 bg-slate-950/90 text-xs text-slate-100">
                  <SelectValue placeholder={t("type")} />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-slate-800 bg-slate-950 text-xs text-slate-50">
                  <SelectItem value="ALL">{t("allTypes") || "All Types"}</SelectItem>
                  <SelectItem value="DEPOSIT">{t("deposit")}</SelectItem>
                  <SelectItem value="WITHDRAW">{t("withdraw")}</SelectItem>
                  <SelectItem value="REFERRAL">{t("referralBonus") || "Referral Bonus"}</SelectItem>
                  {hasCredit && <SelectItem value="CREDIT">{t("credit") || "Credit"}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          {filteredOrders.length > 0 ? (
            <>
              {/* Mobile: cards */}
              <div className="block max-h-[540px] space-y-3 overflow-y-auto pr-0.5 md:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-sm border border-slate-900 bg-slate-950/90 px-3 py-3.5 text-xs text-slate-100"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                      <Badge
                        variant={getStatusBadgeVariant(order.status)}
                        className="rounded-full px-2 py-0.5 text-[10px]"
                      >
                        {order.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getOrderIcon(order)}
                        <span className="text-xs capitalize text-slate-100">
                          {getOrderType(order)}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          order.type === "WITHDRAW"
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {order.type === "WITHDRAW" ? "-" : "+"}
                        <AnimatedNumber
                          value={order.amount}
                          maximumFractionDigits={2}
                          minimumFractionDigits={2}
                        />
                        {" "}{details?.baseCurrency || "USD"}
                      </span>
                    </div>

                    {(order.depositFrom || order.withdrawMethod || order.cryptoAddress) && (
                      <div className="mt-2 space-y-1">
                        {order.depositFrom && (
                          <p className="text-[11px] text-slate-400">
                            {t("from") || "From"}: {order.depositFrom}
                          </p>
                        )}
                        {order.withdrawMethod && (
                          <p className="text-[11px] text-slate-400">
                            {t("method")}: {order.withdrawMethod}
                          </p>
                        )}
                        {order.cryptoAddress && (
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            Address: {order.cryptoAddress}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden max-h-[540px] overflow-hidden rounded-sm border border-slate-900 bg-slate-950/70 md:block">
                <div className="max-h-[540px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-950/95">
                      <tr className="border-b border-slate-900 text-left text-[11px] uppercase tracking-[0.12em] text-slate-400">
                        <th className="px-5 py-3.5">{t("date")}</th>
                        <th className="px-5 py-3.5">{t("type")}</th>
                        <th className="px-5 py-3.5">{t("amount")}</th>
                        <th className="px-5 py-3.5">{t("status")}</th>
                        <th className="px-5 py-3.5">{t("details") || "Details"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order, idx) => (
                        <tr
                          key={order.id}
                          className={`border-t text-slate-200 transition-colors hover:bg-slate-900/75 ${
                            idx % 2 === 0
                              ? "bg-slate-950/80"
                              : "bg-slate-950/60"
                          }`}
                        >
                          <td className="whitespace-nowrap px-5 py-3.5 align-top text-[11px] text-slate-300">
                            {new Date(order.createdAt).toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5 align-top">
                            <div className="flex items-center gap-2">
                              {getOrderIcon(order)}
                              <span className="text-xs capitalize text-slate-100">
                                {getOrderType(order)}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 align-top">
                            <span
                              className={`text-xs font-semibold ${
                                order.type === "WITHDRAW"
                                  ? "text-rose-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {order.type === "WITHDRAW" ? "-" : "+"}
                              <AnimatedNumber
                                value={order.amount}
                                maximumFractionDigits={2}
                                minimumFractionDigits={2}
                              />
                              {" "}{details?.baseCurrency || "USD"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 align-top">
                            <Badge
                              variant={getStatusBadgeVariant(order.status)}
                              className="rounded-full px-2 py-0.5 text-[10px]"
                            >
                              {order.status}
                            </Badge>
                          </td>

                          <td className="px-5 py-3.5 align-top">
                            <div className="max-w-md space-y-1">
                              {order.depositFrom && (
                                <p className="text-xs text-slate-300">
                                  {t("from") || "From"}: {order.depositFrom}
                                </p>
                              )}
                              {order.withdrawMethod && (
                                <p className="text-xs text-slate-300">
                                  {t("method")}: {order.withdrawMethod}
                                </p>
                              )}
                              {order.cryptoAddress && (
                                <p className="text-xs text-slate-300 font-mono truncate">
                                  {order.cryptoNetwork}: {order.cryptoAddress}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-slate-500">
              <CreditCard className="mx-auto mb-4 h-9 w-9 text-slate-700" />
              <div className="text-sm font-medium">{t("noOrdersFound") || "No orders found"}</div>
              <div className="mt-2 text-xs">{t("tryAdjustingFilters")}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

