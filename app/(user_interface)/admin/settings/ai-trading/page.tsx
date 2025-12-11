"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AdminSettingsLayout } from "@/components/admin/settings-layout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, Loader2 } from "lucide-react";
import { toast } from "@/components/toast";
import { tickerMeta } from "@/data/ticker-meta";
import type { TickerMeta, TickerCategory } from "@/data/ticker-meta";
import { TickerAvatar } from "@/components/ticker-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AiTicker {
  id: string;
  symbol: string;
  isActive: boolean;
}

export default function AITradingSettingsPage() {
  const [aiTickers, setAiTickers] = useState<AiTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TickerCategory | "all">("all");
  const [showEnabledOnly, setShowEnabledOnly] = useState(true); // Default true
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Page state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  // Enabled tickers set
  const [enabledSymbols, setEnabledSymbols] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAiTickers();
  }, []);

  const fetchAiTickers = async () => {
    try {
      // Fetch AI trading tickers configuration from ADMIN endpoint
      const aiRes = await fetch("/api/admin/ai-trading-tickers");
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiTickers(aiData);
        
        // Set enabled symbols based on AI-enabled tickers
        const enabled = new Set<string>(
          aiData.filter((t: AiTicker) => t.isActive).map((t: AiTicker) => t.symbol)
        );
        setEnabledSymbols(enabled);
      }
    } catch (error) {
      console.error("Error fetching AI tickers:", error);
      toast({
        title: "❌ Error",
        description: "Failed to load AI tickers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = useCallback(async (symbol: string) => {
    setUpdating(symbol);

    try {
      const existingAiTicker = aiTickers.find((t) => t.symbol === symbol);
      const currentEnabled = enabledSymbols.has(symbol);

      if (existingAiTicker) {
        // Update existing
        const res = await fetch(`/api/admin/ai-trading-tickers/${existingAiTicker.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !currentEnabled }),
        });

        if (res.ok) {
          setAiTickers((prev) =>
            prev.map((t) =>
              t.symbol === symbol ? { ...t, isActive: !currentEnabled } : t
            )
          );
          
          // Update enabled symbols
          setEnabledSymbols((prev) => {
            const newSet = new Set(prev);
            if (currentEnabled) {
              newSet.delete(symbol);
            } else {
              newSet.add(symbol);
            }
            return newSet;
          });
        }
      } else {
        // Create new
        const res = await fetch("/api/admin/ai-trading-tickers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, isActive: true, priority: 0 }),
        });

        if (res.ok) {
          const newTicker = await res.json();
          setAiTickers((prev) => [...prev, newTicker]);
          setEnabledSymbols((prev) => new Set([...prev, symbol]));
        }
      }

      toast({
        title: "✅ Success",
        description: `${symbol} AI trading ${!currentEnabled ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to update ticker",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  }, [aiTickers, enabledSymbols]);

  // Filter tickers by search query and category
  const filteredTickers = useMemo(() => {
    let filtered = tickerMeta;
    
    // Show enabled only filter
    if (showEnabledOnly) {
      filtered = filtered.filter(t => enabledSymbols.has(t.symbol));
    }
    
    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.symbol.toLowerCase().includes(query) ||
          t.fullName?.toLowerCase().includes(query) ||
          t.showName?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [searchQuery, categoryFilter, showEnabledOnly, enabledSymbols]);

  // Pagination
  const totalPages = Math.ceil(filteredTickers.length / ITEMS_PER_PAGE);
  const paginatedTickers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTickers, currentPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, showEnabledOnly]);

  return (
    <AdminSettingsLayout
      title="AI Trading Tickers"
      description="Configure tickers available for AI-powered automated trading"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by symbol or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a1a2e] border-purple-500/30"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as TickerCategory | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-[#1a1a2e] border-purple-500/30">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
                <SelectItem value="stocks">Stocks</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="indices">Indices</SelectItem>
                <SelectItem value="commodities">Commodities</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-slate-400 whitespace-nowrap">
              {enabledSymbols.size} / {tickerMeta.length} enabled
            </div>
          </div>
          
          {/* Show Enabled Only Toggle */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a1a2e] border border-purple-500/30">
            <Switch
              checked={showEnabledOnly}
              onCheckedChange={setShowEnabledOnly}
              className="data-[state=checked]:bg-purple-600"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">
                Show enabled tickers only
              </p>
              <p className="text-xs text-slate-400">
                {showEnabledOnly ? `Showing ${filteredTickers.length} enabled tickers` : "Showing all tickers"}
              </p>
            </div>
          </div>
        </div>

        {/* Tickers List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        ) : filteredTickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-slate-400">No tickers found</p>
            {searchQuery && (
              <p className="text-xs text-slate-500 mt-2">
                Try a different search term
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="bg-[#0b0b14] border border-[#252537] rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-800">
                {paginatedTickers.map((ticker) => {
                  const isEnabled = enabledSymbols.has(ticker.symbol);
                  const isUpdating = updating === ticker.symbol;
                  
                  return (
                    <div
                      key={ticker.symbol}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <TickerAvatar
                          symbol={ticker.symbol}
                          category={ticker.category}
                          baseCurrency={ticker.baseCurrency}
                          quoteCurrency={ticker.quoteCurrency}
                          size={32}
                          icon={ticker.icon}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-100">
                            {ticker.showName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {ticker.fullName}
                          </div>
                        </div>
                        <div className="ml-auto">
                          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                            {ticker.category.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleToggle(ticker.symbol)}
                          disabled={isUpdating}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages} ({filteredTickers.length} tickers)
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Info Card */}
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="text-violet-300 text-sm">
              <p className="font-semibold mb-2">💡 How AI Trading Works:</p>
              <ul className="list-disc list-inside space-y-1 text-violet-200/80">
                <li>Use the switch to enable/disable tickers for AI trading</li>
                <li>AI will randomly select from enabled tickers when analyzing</li>
                <li>Verified users automatically get AI trading access</li>
                <li>Analysis time: 5-10 seconds per trade</li>
                <li>Filter by category and search to quickly find tickers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminSettingsLayout>
  );
}
