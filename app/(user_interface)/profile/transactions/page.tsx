"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  FileText,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Users,
  Cpu,
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast";

interface Transaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "TRADE" | "REFERRAL";
  status: "SUCCESSFUL" | "PENDING" | "FAILED" | "CANCELLED";
  amount: number;
  currency: string;
  date: string;
  description: string;
  reference?: string;
  aiEnabled?: boolean;
}

type SortField = "date" | "amount";
type SortDirection = "asc" | "desc";

export default function ProfileTransactionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] =
      useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // ---- fetch transactions ----
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/user/transactions");
        if (!response.ok) throw new Error("Failed to fetch transactions");

        const data: Transaction[] = await response.json();
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: t("error"),
          description: t("couldNotLoadTransactions"),
          variant: "destructive" as any,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [t]);

  // ---- filters + sorting ----
  useEffect(() => {
    let result = [...transactions];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((tx) => {
        const inDesc = tx.description.toLowerCase().includes(q);
        const inRef = tx.reference?.toLowerCase().includes(q);
        return inDesc || inRef;
      });
    }

    if (statusFilter !== "ALL") {
      result = result.filter((tx) => tx.status === statusFilter);
    }

    if (typeFilter !== "ALL") {
      result = result.filter((tx) => tx.type === typeFilter);
    }

    result.sort((a, b) => {
      if (sortField === "date") {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      } else {
        return sortDirection === "asc"
            ? a.amount - b.amount
            : b.amount - a.amount;
      }
    });

    setFilteredTransactions(result);
  }, [transactions, searchTerm, statusFilter, typeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStatusBadgeVariant = (status: Transaction["status"]) => {
    switch (status) {
      case "SUCCESSFUL":
        return "default";
      case "PENDING":
        return "secondary";
      case "FAILED":
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowDownRight className="h-3.5 w-3.5 text-emerald-400" />;
      case "WITHDRAW":
        return <ArrowUpRight className="h-3.5 w-3.5 text-rose-400" />;
      case "TRADE":
        return <Activity className="h-3.5 w-3.5 text-sky-400" />;
      case "REFERRAL":
        return <Users className="h-3.5 w-3.5 text-violet-400" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-500" />;
    }
    return sortDirection === "asc" ? (
        <ArrowUp className="ml-1 h-3 w-3 text-slate-300" />
    ) : (
        <ArrowDown className="ml-1 h-3 w-3 text-slate-300" />
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSortField("date");
    setSortDirection("desc");
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-full flex-col gap-6 px-3 py-6 sm:px-4 sm:py-8 lg:px-0 lg:py-0">
        {/* Header skeleton */}
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-slate-800/50 rounded-full animate-pulse" />
            <div className="h-5 w-32 bg-slate-800/50 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-800/50 rounded animate-pulse" />
            <div className="h-4 w-96 bg-slate-800/50 rounded animate-pulse" />
          </div>
        </header>

        {/* Filters skeleton */}
        <Card className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
                <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
                <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-slate-800/50 rounded-xl animate-pulse" />
                <div className="h-9 w-24 bg-slate-800/50 rounded-xl animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="rounded-sm border border-[#17172b] bg-[#060615]/90 shadow-[0_8px_20px_rgba(0,0,0,0.65)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 bg-slate-800/50 rounded-full animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-slate-800/50 rounded animate-pulse" />
                      <div className="h-3 w-48 bg-slate-800/50 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-20 bg-slate-800/50 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-slate-800/50 rounded-full animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
      <div className="mx-auto flex w-full max-w-full flex-col gap-6 px-3 py-6 sm:px-4 sm:py-8 lg:px-0 lg:py-0">
        {/* Header */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[#121426] bg-[#090b1a] px-3 py-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            {t("transactions")}
          </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
              {t("transactionHistory")}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400">
              {t("viewYourTransactionHistory")}
            </p>
          </div>
        </header>

        {/* Filters + content */}
        <Card className="rounded-2xl border border-[#121426] bg-[#090b1a] shadow-[0_22px_60px_rgba(107,33,168,0.25)]">
          <CardContent className="space-y-6 p-4 sm:p-6 lg:p-7">
            {/* Filters row */}
            <div className="flex flex-col gap-4 border-b border-slate-900 pb-5 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                      placeholder={t("searchTransactions")}
                      className="h-10 rounded-2xl border-[#121426] bg-[#0f1126] pl-9 text-xs text-slate-50 placeholder:text-slate-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[130px] rounded-2xl border-[#121426] bg-[#0f1126] text-xs text-slate-100">
                    <SelectValue placeholder={t("status")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-[#121426] bg-[#0f1126] text-xs text-slate-50">
                    <SelectItem value="ALL">{t("all")}</SelectItem>
                    <SelectItem value="SUCCESSFUL">{t("successful")}</SelectItem>
                    <SelectItem value="PENDING">{t("pending")}</SelectItem>
                    <SelectItem value="FAILED">{t("failed")}</SelectItem>
                    <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 w-[130px] rounded-2xl border-[#121426] bg-[#0f1126] text-xs text-slate-100">
                    <SelectValue placeholder={t("type")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-[#121426] bg-[#0f1126] text-xs text-slate-50">
                    <SelectItem value="ALL">{t("all")}</SelectItem>
                    <SelectItem value="DEPOSIT">{t("deposit")}</SelectItem>
                    <SelectItem value="WITHDRAW">{t("withdraw")}</SelectItem>
                    <SelectItem value="TRADE">{t("trade")}</SelectItem>
                    <SelectItem value="REFERRAL">{t("referral")}</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-2xl border-[#121426] bg-[#0f1126] px-3 text-[11px] font-medium text-slate-300 hover:bg-[#090b1a]"
                    onClick={resetFilters}
                >
                  {t("reset") ?? "Reset"}
                </Button>
              </div>
            </div>

            {/* Content: mobile cards + desktop table */}
            {filteredTransactions.length > 0 ? (
                <>
                  {/* Mobile: карточки почти на всю ширину */}
                  <div className="block space-y-3 pr-0.5 md:hidden">
                    {paginatedTransactions.map((tx) => {
                      const isWithdraw = tx.type === "WITHDRAW";
                      return (
                          <div
                              key={tx.id}
                              className={`rounded-2xl border px-3 py-3.5 text-xs ${
                                tx.type === "TRADE" && tx.aiEnabled
                                  ? "border-purple-500/50 bg-gradient-to-br from-[#0f1126] to-[#090b1a] text-slate-100 shadow-[0_0_12px_rgba(107,33,168,0.2)]"
                                  : "border-[#121426] bg-[#090b1a] text-slate-100"
                              }`}
                          >
                            {/* верхняя строка: дата + статус */}
                            <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          {new Date(tx.date).toLocaleString()}
                        </span>
                              <Badge
                                  variant={getStatusBadgeVariant(tx.status)}
                                  className="rounded-full px-2 py-0.5 text-[10px]"
                              >
                                {t(tx.status.toLowerCase())}
                              </Badge>
                            </div>

                            {/* тип + сумма */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {tx.type === "TRADE" && tx.aiEnabled ? (
                                  <Cpu className="h-3.5 w-3.5 text-purple-400" />
                                ) : (
                                  getTypeIcon(tx.type)
                                )}
                                <span className="text-xs capitalize text-slate-100">
                            {tx.type === "TRADE" && tx.aiEnabled ? t("aiTrade") : t(tx.type.toLowerCase())}
                          </span>
                              </div>
                              <span
                                  className={`text-xs font-semibold ${
                                      isWithdraw
                                          ? "text-rose-400"
                                          : tx.type === "DEPOSIT"
                                              ? "text-emerald-400"
                                              : "text-slate-50"
                                  }`}
                              >
                          {isWithdraw ? "-" : ""}
                                {tx.amount.toFixed(2)} {tx.currency}
                        </span>
                            </div>

                            {/* описание */}
                            <div className="mt-2 space-y-1">
                              <p className="text-[11px] text-slate-300">
                                {tx.description}
                              </p>
                              {tx.reference && (
                                  <p className="text-[10px] text-slate-500">
                                    {t("reference")}:{" "}
                                    <span className="font-mono">{tx.reference}</span>
                                  </p>
                              )}
                            </div>
                          </div>
                      );
                    })}
                  </div>

                  {/* Desktop: таблица */}
                  <div className="hidden overflow-hidden rounded-2xl border border-[#121426] bg-[#090b1a] md:block">
                    <div className="max-h-[540px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-950/95">
                        <tr className="border-b border-slate-900 text-left text-[11px] uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-5 py-3.5">
                            <button
                                type="button"
                                className="inline-flex items-center gap-1"
                                onClick={() => handleSort("date")}
                            >
                              <span>{t("date")}</span>
                              {getSortIcon("date")}
                            </button>
                          </th>
                          <th className="px-5 py-3.5">{t("type")}</th>
                          <th className="px-5 py-3.5">
                            <button
                                type="button"
                                className="inline-flex items-center gap-1"
                                onClick={() => handleSort("amount")}
                            >
                              <span>{t("amount")}</span>
                              {getSortIcon("amount")}
                            </button>
                          </th>
                          <th className="px-5 py-3.5">{t("status")}</th>
                          <th className="px-5 py-3.5">{t("description")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedTransactions.map((tx, idx) => {
                          const isWithdraw = tx.type === "WITHDRAW";

                          return (
                              <tr
                                  key={tx.id}
                                  className={`border-t text-slate-200 transition-colors hover:bg-[#2e1a5e] ${
                                      tx.type === "TRADE" && tx.aiEnabled
                                          ? "border-purple-500/50 bg-gradient-to-br from-[#0f1126] to-[#090b1a] shadow-[0_0_12px_rgba(107,33,168,0.2)]"
                                          : idx % 2 === 0
                                          ? "border-[#121426] bg-[#090b1a]"
                                          : "border-[#121426] bg-[#0f1126]"
                                  }`}
                              >
                                {/* DATE */}
                                <td className="whitespace-nowrap px-5 py-3.5 align-top text-[11px] text-slate-300">
                                  {new Date(tx.date).toLocaleString()}
                                </td>

                                {/* TYPE */}
                                <td className="px-5 py-3.5 align-top">
                                  <div className="flex items-center gap-2">
                                    {tx.type === "TRADE" && tx.aiEnabled ? (
                                      <Cpu className="h-3.5 w-3.5 text-purple-400" />
                                    ) : (
                                      getTypeIcon(tx.type)
                                    )}
                                    <span className="text-xs capitalize text-slate-100">
                                  {tx.type === "TRADE" && tx.aiEnabled ? t("aiTrade") : t(tx.type.toLowerCase())}
                                </span>
                                  </div>
                                </td>

                                {/* AMOUNT */}
                                <td className="px-5 py-3.5 align-top">
                              <span
                                  className={`text-xs font-semibold ${
                                      isWithdraw
                                          ? "text-rose-400"
                                          : tx.type === "DEPOSIT"
                                              ? "text-emerald-400"
                                              : "text-slate-100"
                                  }`}
                              >
                                {isWithdraw ? "-" : ""}
                                {tx.amount.toFixed(2)} {tx.currency}
                              </span>
                                </td>

                                {/* STATUS */}
                                <td className="px-5 py-3.5 align-top">
                                  <Badge
                                      variant={getStatusBadgeVariant(tx.status)}
                                      className="rounded-full px-2 py-0.5 text-[10px]"
                                  >
                                    {t(tx.status.toLowerCase())}
                                  </Badge>
                                </td>

                                {/* DESCRIPTION */}
                                <td className="px-5 py-3.5 align-top">
                                  <p className="max-w-md truncate text-xs text-slate-200">
                                    {tx.description}
                                  </p>
                                  {tx.reference && (
                                      <p className="mt-1 text-[10px] text-slate-500">
                                        {t("reference")}:{" "}
                                        <span className="font-mono">
                                    {tx.reference}
                                  </span>
                                      </p>
                                  )}
                                </td>
                              </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-4">
                      <div className="text-xs text-slate-400">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-[#121426] bg-[#0f1126] text-xs disabled:opacity-50"
                        >
                          {t("previous") || "Previous"}
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className={`h-8 w-8 rounded-xl text-xs ${
                                  currentPage === pageNum
                                    ? "bg-purple-600 border-purple-600"
                                    : "border-[#121426] bg-[#0f1126]"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl border-[#121426] bg-[#0f1126] text-xs disabled:opacity-50"
                        >
                          {t("next") || "Next"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
            ) : (
                <div className="py-10 text-center text-slate-500">
                  <FileText className="mx-auto mb-4 h-9 w-9 text-slate-700" />
                  <div className="text-sm font-medium">
                    {t("noTransactionsFound")}
                  </div>
                  <div className="mt-2 text-xs">{t("tryAdjustingFilters")}</div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
