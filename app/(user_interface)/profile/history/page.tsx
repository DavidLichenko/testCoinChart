"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import {
  FileText,
  Search,
  Calendar,
  Download,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

interface Transaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "TRADE" | "REFERRAL";
  status: "SUCCESSFUL" | "PENDING" | "FAILED" | "CANCELLED";
  amount: number;
  currency: string;
  date: string;
  description: string;
  reference?: string;
}

export default function ProfileHistoryPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/user/transactions");
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
          setFilteredTransactions(data);
        } else {
          throw new Error("Failed to fetch transactions");
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: t("error"),
          description: t("couldNotLoadTransactionHistory"),
          variant: "destructive" as any,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [t]);

  useEffect(() => {
    let result = [...transactions];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.description.toLowerCase().includes(term) ||
          (tx.reference && tx.reference.toLowerCase().includes(term))
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      result = result.filter((tx) => tx.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter((tx) => tx.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredTransactions(result);
  }, [transactions, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return {
          icon: <ArrowUp className="h-4 w-4" />,
          color: "text-emerald-400",
          bgColor: "bg-emerald-500/20",
        };
      case "WITHDRAW":
        return {
          icon: <ArrowDown className="h-4 w-4" />,
          color: "text-rose-400",
          bgColor: "bg-rose-500/20",
        };
      case "TRADE":
        return {
          icon: <ArrowUpDown className="h-4 w-4" />,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
        };
      case "REFERRAL":
        return {
          icon: <ArrowUp className="h-4 w-4" />,
          color: "text-violet-400",
          bgColor: "bg-violet-500/20",
        };
      default:
        return {
          icon: <FileText className="h-4 w-4" />,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
        };
    }
  };

  const getStatusVariant = (status: string) => {
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

  const handleExport = () => {
    toast({
      title: t("exportInitiated"),
      description: t("exportInProgress"),
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-800 rounded animate-pulse" />
        </div>
        
        {/* Filters skeleton */}
        <div className="h-24 bg-slate-900/60 border border-slate-800/60 rounded-2xl animate-pulse" />
        
        {/* Table skeleton */}
        <div className="h-[500px] bg-slate-900/60 border border-slate-800/60 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t("transactionHistory")}</h1>
        <p className="text-gray-500 mt-1">{t("viewYourCompleteTransactionHistory")}</p>
      </div>

      <div className="space-y-6">
        {/* Filters and Controls */}
        <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  <Input
                    placeholder={t("searchTransactions")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full pl-10 md:w-64 border-gray-800 bg-gray-900/70 text-sm rounded-xl shadow-inner"
                  />
                </div>

                {/* Type Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-10 w-full md:w-40 border-gray-800 bg-gray-900/70 text-sm rounded-xl">
                    <SelectValue placeholder={t("filterByType")} />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-gray-900 rounded-xl">
                    <SelectItem value="all">{t("allTypes")}</SelectItem>
                    <SelectItem value="DEPOSIT">{t("deposits")}</SelectItem>
                    <SelectItem value="WITHDRAW">{t("withdrawals")}</SelectItem>
                    <SelectItem value="TRADE">{t("trades")}</SelectItem>
                    <SelectItem value="REFERRAL">{t("referrals")}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 w-full md:w-40 border-gray-800 bg-gray-900/70 text-sm rounded-xl">
                    <SelectValue placeholder={t("filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-gray-900 rounded-xl">
                    <SelectItem value="all">{t("allStatus")}</SelectItem>
                    <SelectItem value="SUCCESSFUL">{t("successful")}</SelectItem>
                    <SelectItem value="PENDING">{t("pending")}</SelectItem>
                    <SelectItem value="FAILED">{t("failed")}</SelectItem>
                    <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 w-full md:w-40 border-gray-800 bg-gray-900/70 text-sm rounded-xl">
                    <SelectValue placeholder={t("sortBy")} />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-gray-900 rounded-xl">
                    <SelectItem value="date">{t("date")}</SelectItem>
                    <SelectItem value="amount">{t("amount")}</SelectItem>
                    <SelectItem value="type">{t("type")}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="h-10 border-gray-800 bg-gray-900/70 text-xs hover:border-violet-500/60 hover:bg-violet-500/20 rounded-xl"
                >
                  {sortOrder === "asc" ? (
                    <>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      {t("ascending")}
                    </>
                  ) : (
                    <>
                      <ArrowDown className="mr-2 h-4 w-4" />
                      {t("descending")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List with Fixed Height and Scroll */}
        <Card className="bg-gray-900/60 border-gray-800/60 h-[500px] rounded-2xl backdrop-blur-2xl shadow-lg flex-1 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold">
              <FileText className="h-5 w-5 text-violet-400" />
              {t("transactions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col h-[300px]">
            {filteredTransactions.length > 0 ? (
              <div className="overflow-hidden flex-1 flex flex-col h-full">
                <div className="overflow-y-auto flex-1 rounded-lg h-full border border-gray-800/60 bg-gray-950/50">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-900 z-10">
                      <tr className="border-b border-gray-800 text-left text-gray-500">
                        <th className="pb-3 font-medium text-sm px-4">{t("date")}</th>
                        <th className="pb-3 font-medium text-sm px-4">{t("type")}</th>
                        <th className="pb-3 font-medium text-sm px-4">{t("description")}</th>
                        <th className="pb-3 font-medium text-sm px-4 text-right">{t("amount")}</th>
                        <th className="pb-3 font-medium text-sm px-4">{t("status")}</th>
                        <th className="pb-3 font-medium text-sm px-4">{t("UUID")}</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredTransactions.map((transaction) => {
                        const typeConfig = getTypeConfig(transaction.type);
                        return (
                          <tr
                            key={transaction.id}
                            className="border-t border-gray-800/60 text-gray-300 hover:bg-gray-900/70 transition-colors"
                          >
                            <td className="py-4 px-4 text-gray-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(transaction.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeConfig.bgColor}`}
                                >
                                  {typeConfig.icon}
                                </div>
                                <span className="font-medium">
                                  {t(transaction.type.toLowerCase())}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-400 max-w-xs truncate">
                              {transaction.description}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className={`font-bold ${typeConfig.color}`}>
                                {transaction.type === "WITHDRAW" ? "-" : "+"}
                                {transaction.amount.toLocaleString()} {transaction.currency}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant={getStatusVariant(transaction.status)} className="rounded-full">
                                {t(transaction.status.toLowerCase())}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-gray-500">
                              {transaction.id}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-700" />
                <h3 className="mt-4 text-xl font-medium text-gray-400">
                  {t("noTransactionsFound")}
                </h3>
                <p className="mt-2 text-gray-600">
                  {t("tryAdjustingYourFilters")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {/*<div className="grid gap-4 md:grid-cols-3">*/}
        {/*  <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg hover:shadow-emerald-500/15 transition-all duration-300">*/}
        {/*    <CardContent className="p-5">*/}
        {/*      <div className="flex items-center justify-between">*/}
        {/*        <div>*/}
        {/*          <div className="text-sm text-gray-500">{t("totalDeposits")}</div>*/}
        {/*          <div className="text-2xl font-bold text-emerald-400 mt-1">*/}
        {/*            ${transactions*/}
        {/*              .filter(t => t.type === "DEPOSIT" && t.status === "SUCCESSFUL")*/}
        {/*              .reduce((sum, t) => sum + t.amount, 0)*/}
        {/*              .toLocaleString()}*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/30 shadow-lg shadow-emerald-500/15">*/}
        {/*          <ArrowUp className="h-6 w-6 text-emerald-400" />*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*  */}
        {/*  <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg hover:shadow-rose-500/15 transition-all duration-300">*/}
        {/*    <CardContent className="p-5">*/}
        {/*      <div className="flex items-center justify-between">*/}
        {/*        <div>*/}
        {/*          <div className="text-sm text-gray-500">{t("totalWithdrawals")}</div>*/}
        {/*          <div className="text-2xl font-bold text-rose-400 mt-1">*/}
        {/*            ${transactions*/}
        {/*              .filter(t => t.type === "WITHDRAW" && t.status === "SUCCESSFUL")*/}
        {/*              .reduce((sum, t) => sum + t.amount, 0)*/}
        {/*              .toLocaleString()}*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/30 shadow-lg shadow-rose-500/15">*/}
        {/*          <ArrowDown className="h-6 w-6 text-rose-400" />*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*  */}
        {/*  <Card className="bg-gray-900/60 border-gray-800/60 rounded-2xl backdrop-blur-2xl shadow-lg hover:shadow-violet-500/15 transition-all duration-300">*/}
        {/*    <CardContent className="p-5">*/}
        {/*      <div className="flex items-center justify-between">*/}
        {/*        <div>*/}
        {/*          <div className="text-sm text-gray-500">{t("netBalance")}</div>*/}
        {/*          <div className="text-2xl font-bold text-gray-300 mt-1">*/}
        {/*            ${(*/}
        {/*              transactions*/}
        {/*                .filter(t => t.type === "DEPOSIT" && t.status === "SUCCESSFUL")*/}
        {/*                .reduce((sum, t) => sum + t.amount, 0) -*/}
        {/*              transactions*/}
        {/*                .filter(t => t.type === "WITHDRAW" && t.status === "SUCCESSFUL")*/}
        {/*                .reduce((sum, t) => sum + t.amount, 0)*/}
        {/*            ).toLocaleString()}*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/30 shadow-lg shadow-violet-500/15">*/}
        {/*          <ArrowUpDown className="h-6 w-6 text-violet-400" />*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*</div>*/}
      </div>
    </div>
  );
}