"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet as WalletIcon, 
  Search, 
  RefreshCw, 
  ArrowRight, 
  Plus, 
  Minus, 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff,
  Activity,
  Coins,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Hash,
  Globe,
  Euro,
  DollarSign,
  Edit3,
  Save,
  X,
  Settings,
  ArrowUpDown
} from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Types
type WalletBalanceDto = {
  id: string;
  assetSymbol: string;
  ownBalance: number;
  creditLimit: number;
  creditUsed: number;
  locked: number;
  createdAt?: string;
};

type AdminWalletUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  baseCurrency: "USD" | "EUR";
  walletBalances: WalletBalanceDto[];
  createdAt: string;
  isVerif: boolean;
  blocked: boolean;
};

type AssetDto = {
  symbol: string;
  name: string;
  type: "FIAT" | "CRYPTO" | "METAL" | "COMMODITY";
  isEnabled: boolean;
};

type ApiResponse = {
  users: AdminWalletUser[];
  total: number;
  page: number;
  pageSize: number;
  assets: AssetDto[];
};

type TransactionHistoryItem = {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "INTERNAL_TRANSFER" | "EXCHANGE" | "STAKE_LOCK" | "STAKE_UNLOCK" | "STAKE_REWARD";
  amount: number;
  assetSymbol: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  timestamp: string;
  description: string;
};

// Constants
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

// Helper functions
function getAssetIcon(symbol: string) {
  const s = symbol.toUpperCase();
  if (s === "USD" || s === "EUR") return "💵";
  if (s.startsWith("USDT") || s.startsWith("USDC")) return "🟣";
  if (s.startsWith("BTC")) return "₿";
  if (s.startsWith("ETH")) return "◆";
  if (s.startsWith("XAU") || s.startsWith("GOLD")) return "🥇";
  if (s.startsWith("XAG")) return "🥈";
  return "●";
}

function formatMoney(v: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(v || 0);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function roleBadgeClasses(role: string) {
  switch (role) {
    case "OWNER":
      return "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white";
    case "CR_MANAGMENT":
      return "bg-sky-500/10 text-sky-300 border border-sky-500/40";
    case "TEAMLEAD":
      return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
    case "WORKER":
      return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
    default:
      return "bg-slate-800/80 text-slate-300 border border-slate-700/80";
  }
}

function statusBadgeClasses(status: string) {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
    case "BLOCKED":
      return "bg-rose-500/10 text-rose-300 border border-rose-500/40";
    case "PENDING":
      return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
    default:
      return "bg-slate-800/80 text-slate-300 border border-slate-700/80";
  }
}

function transactionTypeBadge(type: string) {
  switch (type) {
    case "DEPOSIT":
      return "bg-green-500/10 text-green-300 border border-green-500/40";
    case "WITHDRAW":
      return "bg-rose-500/10 text-rose-300 border border-rose-500/40";
    case "EXCHANGE":
      return "bg-blue-500/10 text-blue-300 border border-blue-500/40";
    case "STAKE_LOCK":
      return "bg-purple-500/10 text-purple-300 border border-purple-500/40";
    case "STAKE_REWARD":
      return "bg-yellow-500/10 text-yellow-300 border border-yellow-500/40";
    default:
      return "bg-slate-800/80 text-slate-300 border border-slate-700/80";
  }
}

export default function WalletsManagement() {
  const [users, setUsers] = useState<AdminWalletUser[]>([]);
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"createdAt" | "email" | "balance">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  // Fetch data
  const fetchData = useCallback(
    async (opts?: { forcePage1?: boolean; forceSearch?: string }) => {
      try {
        setLoading(true);

        const effectivePage = opts?.forcePage1 ? 1 : page;
        const effectiveSearch = opts?.forceSearch !== undefined ? opts.forceSearch : debouncedSearch;

        const params = new URLSearchParams();
        if (effectiveSearch) params.set("q", effectiveSearch);
        params.set("page", String(effectivePage));
        params.set("pageSize", String(PAGE_SIZE));
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
        if (filterRole !== "ALL") params.set("role", filterRole);
        if (filterStatus !== "ALL") params.set("status", filterStatus);

        const res = await fetch(`/api/admin/wallets?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load wallets");
        }

        const data: ApiResponse = await res.json();
        setUsers(data.users);
        setAssets(data.assets);
        setTotal(data.total);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load wallets");
      } finally {
        setLoading(false);
      }
    },
    [page, debouncedSearch, sortBy, sortOrder, filterRole, filterStatus]
  );

  // Initial load and when filters change
  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, sortBy, sortOrder, filterRole, filterStatus, fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setDebouncedSearch(search.trim());
      setPage(1);
      fetchData({ forcePage1: true, forceSearch: search.trim() });
    }
  };

  // Sort users based on current sort settings
  const sortedUsers = (() => {
    return [...users].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "balance":
          const aBalance = a.walletBalances.find(w => w.assetSymbol === a.baseCurrency)?.ownBalance || 0;
          const bBalance = b.walletBalances.find(w => w.assetSymbol === b.baseCurrency)?.ownBalance || 0;
          comparison = aBalance - bBalance;
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  })();

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by email, name, or user ID"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="CR_MANAGMENT">CR Management</SelectItem>
                <SelectItem value="TEAMLEAD">Team Lead</SelectItem>
                <SelectItem value="WORKER">Worker</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchData()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        
        {/* Sort Options */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created At</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="balance">Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Order:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {sortedUsers.map((user) => {
          const totalAssets = user.walletBalances.length;
          
          const mainFiat = user.walletBalances.find((w) =>
            ["USD", "EUR"].includes(w.assetSymbol.toUpperCase())
          ) ?? user.walletBalances[0];

          const mainLabel = mainFiat
            ? `${mainFiat.assetSymbol} · ${formatMoney(mainFiat.ownBalance)}`
            : "No balance";

          const roleClasses = roleBadgeClasses(user.role);
          const status = user.blocked ? "BLOCKED" : user.isVerif ? "VERIFIED" : "PENDING";
          const statusClasses = statusBadgeClasses(status);

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-slate-950/90 border-slate-800/80 shadow-md shadow-slate-950/40 flex flex-col h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex justify-between gap-2 items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-50">
                            {user.name || user.email}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleClasses}`}>
                          {user.role}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClasses}`}>
                          {status}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                          Base: {user.baseCurrency}
                        </span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-3">
                  {/* Main balance row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Main balance</span>
                    <span className="font-medium text-slate-50">
                      {mainLabel}
                    </span>
                  </div>

                  {/* Asset chips */}
                  {totalAssets > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {user.walletBalances.slice(0, 3).map((w) => (
                        <span
                          key={w.id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] text-slate-100 border border-slate-800/80"
                        >
                          <span>{getAssetIcon(w.assetSymbol)}</span>
                          <span className="uppercase text-slate-300">
                            {w.assetSymbol}
                          </span>
                          <span className="font-semibold">
                            {formatMoney(w.ownBalance)}
                          </span>
                        </span>
                      ))}
                      {totalAssets > 3 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] text-slate-100 border border-slate-800/80">
                          +{totalAssets - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Credit info */}
                  {user.walletBalances.some((w) => w.creditLimit > 0) ? (
                    <div className="mt-2 rounded-lg bg-slate-900/80 px-2 py-1.5 text-[11px] space-y-0.5 border border-slate-800/80">
                      <div className="text-slate-300 font-medium mb-1">Credit Balances</div>
                      {user.walletBalances
                        .filter((w) => w.creditLimit > 0)
                        .slice(0, 2)
                        .map((w) => (
                          <div
                            key={w.id}
                            className="flex items-center justify-between"
                          >
                            <span className="text-slate-400">
                              Credit {w.assetSymbol}
                            </span>
                            <span className="text-slate-100">
                              {formatMoney(w.creditUsed)} /{" "}
                              {formatMoney(w.creditLimit)}
                            </span>
                          </div>
                        ))}
                      {user.walletBalances.filter((w) => w.creditLimit > 0).length > 2 && (
                        <div className="text-slate-400 text-center text-[10px] mt-1">
                          +{user.walletBalances.filter((w) => w.creditLimit > 0).length - 2} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 rounded-lg bg-slate-900/80 px-2 py-1.5 text-[11px] border border-slate-800/80 text-slate-500 italic">
                      No credit allocated. Credits can only be used for trading and cannot be withdrawn or transferred.
                    </div>
                  )}

                  {/* Manage button + details */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full justify-between"
                    onClick={() =>
                      setExpandedUserId((prev) =>
                        prev === user.id ? null : user.id
                      )
                    }
                  >
                    {expandedUserId === user.id ? "Collapse" : "Manage wallet"}
                    <ArrowRight className={`h-4 w-4 transition-transform ${expandedUserId === user.id ? "rotate-90" : ""}`} />
                  </Button>

                  <AnimatePresence>
                    {expandedUserId === user.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-slate-800 pt-3"
                      >
                        <UserWalletEdit
                          user={user}
                          assets={assets}
                          onUpdated={() => fetchData()}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {!loading && sortedUsers.length === 0 && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            No users found. Try changing the search query or filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)} - {Math.min(page * PAGE_SIZE, total)} of {total} users
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// User Wallet Edit Component
function UserWalletEdit({
  user,
  assets,
  onUpdated,
}: {
  user: AdminWalletUser;
  assets: AssetDto[];
  onUpdated: () => void;
}) {
  const hasAssets = assets.length > 0;
  
  const fiatAssets = assets.filter((a) => a.type === "FIAT");
  const baseAsset = assets.find((a) => a.symbol === user.baseCurrency);
  
  const defaultAsset =
    baseAsset?.symbol ||
    fiatAssets[0]?.symbol ||
    assets[0]?.symbol ||
    user.baseCurrency;

  // State for wallet adjustments
  const [assetSymbol, setAssetSymbol] = useState(defaultAsset);
  const [balanceDelta, setBalanceDelta] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<string>("");
  const [creditUsed, setCreditUsed] = useState<string>("");
  const [lockedDelta, setLockedDelta] = useState<string>("");
  
  // State for user settings
  const [newBaseCurrency, setNewBaseCurrency] = useState<"USD" | "EUR">(user.baseCurrency);
  const [isVerif, setIsVerif] = useState<boolean>(user.isVerif);
  const [isBlocked, setIsBlocked] = useState<boolean>(user.blocked);
  
  // State for UI
  const [saving, setSaving] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load transaction history
  const loadTransactionHistory = async () => {
    if (showTransactionHistory) return;
    
    setLoadingHistory(true);
    try {
      // Mock data for demonstration
      const mockHistory: TransactionHistoryItem[] = [
        {
          id: "1",
          type: "DEPOSIT",
          amount: 1000,
          assetSymbol: "USD",
          status: "COMPLETED",
          timestamp: "2023-05-15T10:30:00Z",
          description: "Bank transfer deposit"
        },
        {
          id: "2",
          type: "EXCHANGE",
          amount: 500,
          assetSymbol: "BTC",
          status: "COMPLETED",
          timestamp: "2023-05-14T14:22:00Z",
          description: "Exchanged 500 USD to BTC"
        },
        {
          id: "3",
          type: "WITHDRAW",
          amount: 200,
          assetSymbol: "USD",
          status: "PENDING",
          timestamp: "2023-05-13T09:15:00Z",
          description: "Withdrawal to bank account"
        },
        {
          id: "4",
          type: "STAKE_LOCK",
          amount: 1000,
          assetSymbol: "ETH",
          status: "COMPLETED",
          timestamp: "2023-05-12T16:45:00Z",
          description: "Staked ETH for rewards"
        }
      ];
      
      setTransactionHistory(mockHistory);
      setShowTransactionHistory(true);
    } catch (err: any) {
      toast.error("Failed to load transaction history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle wallet adjustment submission
  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAssets) {
      toast.error("No assets configured. Ask owner to configure assets first.");
      return;
    }

    if (!assetSymbol) {
      toast.error("Select an asset first");
      return;
    }

    // Check if at least one field is filled
    const hasChanges = balanceDelta || creditLimit || creditUsed || lockedDelta;
    if (!hasChanges) {
      toast.error("Nothing to save – fill at least one field");
      return;
    }

    try {
      setSaving(true);

      const body: any = {
        userId: user.id,
        assetSymbol,
      };

      if (balanceDelta !== "") {
        body.balanceDelta = Number(balanceDelta);
      }
      if (lockedDelta !== "") {
        body.lockedDelta = Number(lockedDelta);
      }
      if (creditLimit !== "") {
        body.creditLimit = Number(creditLimit);
      }
      if (creditUsed !== "") {
        body.creditUsed = Number(creditUsed);
      }

      const res = await fetch("/api/admin/wallets/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to adjust wallet");
      }

      toast.success("Wallet updated successfully");
      setBalanceDelta("");
      setLockedDelta("");
      setCreditLimit("");
      setCreditUsed("");
      onUpdated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error updating wallet");
    } finally {
      setSaving(false);
    }
  };

  // Handle user settings update
  const handleUpdateUserSettings = async () => {
    try {
      setSaving(true);
      
      const updates: any = {};
      
      if (newBaseCurrency !== user.baseCurrency) {
        updates.baseCurrency = newBaseCurrency;
      }
      
      if (isVerif !== user.isVerif) {
        updates.isVerif = isVerif;
      }
      
      if (isBlocked !== user.blocked) {
        updates.blocked = isBlocked;
      }
      
      if (Object.keys(updates).length === 0) {
        toast.success("No changes to save");
        setSaving(false);
        return;
      }
      
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update user settings");
      }
      
      toast.success("User settings updated");
      onUpdated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error updating user settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs for different sections */}
      <div className="flex rounded-lg bg-slate-900/80 p-1">
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${!showTransactionHistory ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setShowTransactionHistory(false)}
        >
          Wallet Adjustment
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${showTransactionHistory ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={loadTransactionHistory}
        >
          Transaction History
        </button>
      </div>
      
      {!showTransactionHistory ? (
        <>
          {/* Wallet Adjustment Form */}
          <form className="space-y-3 text-xs" onSubmit={handleSubmitAdjustment}>
            {!hasAssets && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200 mb-1">
                No assets available. Make sure base assets (like USD/EUR) exist.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label className="mb-1 block text-[11px] text-slate-400">
                  Asset
                </Label>
                <Select value={assetSymbol} onValueChange={setAssetSymbol} disabled={!hasAssets}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((a) => (
                      <SelectItem key={a.symbol} value={a.symbol}>
                        <div className="flex items-center gap-2">
                          <span>{getAssetIcon(a.symbol)}</span>
                          <span>{a.symbol} · {a.name} ({a.type})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1 block text-[11px] text-slate-400">
                  Balance Change
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.00000001"
                    placeholder="Amount"
                    value={balanceDelta}
                    onChange={(e) => setBalanceDelta(e.target.value)}
                    className="h-8 text-xs pl-8"
                  />
                  <div className="absolute left-2 top-1.5 flex items-center">
                    <Plus className="h-3 w-3 text-green-500" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Positive to add, negative to subtract</p>
              </div>

              <div>
                <Label className="mb-1 block text-[11px] text-slate-400">
                  Locked Change
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.00000001"
                    placeholder="Amount"
                    value={lockedDelta}
                    onChange={(e) => setLockedDelta(e.target.value)}
                    className="h-8 text-xs pl-8"
                  />
                  <div className="absolute left-2 top-1.5 flex items-center">
                    <Lock className="h-3 w-3 text-amber-500" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Funds reserved for trades</p>
              </div>

              <div>
                <Label className="mb-1 block text-[11px] text-slate-400">
                  Credit Limit
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="New limit"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="h-8 text-xs pl-8"
                  />
                  <div className="absolute left-2 top-1.5 flex items-center">
                    <CreditCard className="h-3 w-3 text-blue-500" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Maximum credit available to user</p>
              </div>

              <div>
                <Label className="mb-1 block text-[11px] text-slate-400">
                  Credit Used
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount used"
                    value={creditUsed}
                    onChange={(e) => setCreditUsed(e.target.value)}
                    className="h-8 text-xs pl-8"
                  />
                  <div className="absolute left-2 top-1.5 flex items-center">
                    <TrendingUp className="h-3 w-3 text-purple-500" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Currently borrowed funds</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-[11px]">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-200">Important Notes</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-400">
                    <li>Credit limit adds borrowing capacity to user's account</li>
                    <li>Credit used tracks how much of the limit is currently borrowed</li>
                    <li>Changes are applied instantly and user sees updates in real-time</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              className="w-full mt-2"
              disabled={saving || !hasAssets}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Apply Wallet Changes"
              )}
            </Button>
          </form>

          {/* User Settings */}
          <div className="border-t border-slate-800 pt-3">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-400" />
              User Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Base Currency</Label>
                  <p className="text-[10px] text-slate-500">Preferred display currency</p>
                </div>
                <Select 
                  value={newBaseCurrency} 
                  onValueChange={(value: any) => setNewBaseCurrency(value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        USD
                      </div>
                    </SelectItem>
                    <SelectItem value="EUR">
                      <div className="flex items-center gap-2">
                        <Euro className="h-3 w-3" />
                        EUR
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Verification Status</Label>
                  <p className="text-[10px] text-slate-500">KYC verification</p>
                </div>
                <Switch
                  checked={isVerif}
                  onCheckedChange={setIsVerif}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Account Status</Label>
                  <p className="text-[10px] text-slate-500">Block/unblock account</p>
                </div>
                <Switch
                  checked={!isBlocked}
                  onCheckedChange={(checked) => setIsBlocked(!checked)}
                />
              </div>
              
              <Button
                size="sm"
                className="w-full mt-2"
                disabled={saving}
                onClick={handleUpdateUserSettings}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save User Settings"
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Transaction History */
        <div className="space-y-3">
          {loadingHistory ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {transactionHistory.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-3 bg-slate-900/80 rounded-lg border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${transactionTypeBadge(tx.type)}`}>
                      {tx.type === "DEPOSIT" && <Plus className="h-4 w-4" />}
                      {tx.type === "WITHDRAW" && <Minus className="h-4 w-4" />}
                      {tx.type === "EXCHANGE" && <ArrowUpDown className="h-4 w-4" />}
                      {tx.type === "STAKE_LOCK" && <Lock className="h-4 w-4" />}
                      {tx.type === "STAKE_REWARD" && <TrendingUp className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{tx.description}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {tx.amount > 0 ? "+" : ""}{formatMoney(tx.amount)} {tx.assetSymbol}
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <Badge variant="secondary" className="text-[10px]">
                        {tx.type.replace("_", " ")}
                      </Badge>
                      {tx.status === "COMPLETED" && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {tx.status === "PENDING" && <AlertCircle className="h-3 w-3 text-amber-500" />}
                      {tx.status === "FAILED" && <XCircle className="h-3 w-3 text-rose-500" />}
                    </div>
                  </div>
                </div>
              ))}
              
              {transactionHistory.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No transaction history found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
