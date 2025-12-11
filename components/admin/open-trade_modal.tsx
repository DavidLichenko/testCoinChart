"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Search, Star, StarOff, X, Loader2 } from "lucide-react";

import type { MarketTicker } from "@/hooks/market-data";
import { TickerAvatar } from "@/components/ticker-avatar";
import {
  tickerMetaMap,
  type TickerCategory,
} from "@/data/ticker-meta";
import { useAuth } from "@/components/auth-provider";
import { useBalance } from "@/hooks/useBalance";

type UserOption = {
  id: string;
  email: string;
  name: string | null;
  // если захочешь — можешь сюда потом добавить baseCurrency
  // baseCurrency?: "USD" | "EUR";
};

interface OpenTradeAdminDialogProps {
  openTradeOpen: boolean;
  setOpenTradeOpen: (open: boolean) => void;
  users: UserOption[];
  tickers: MarketTicker[];
  onTradeAdded?: () => void;
}

export default function OpenTradeAdminDialog({
                                               openTradeOpen,
                                               setOpenTradeOpen,
                                               users,
                                               tickers,
                                               onTradeAdded,
                                             }: OpenTradeAdminDialogProps) {
  const { user: currentUser } = useAuth();
  const { details: balanceDetails } = useBalance();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedTickerSymbol, setSelectedTickerSymbol] = useState<string>("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [volume, setVolume] = useState<string>("0.10");
  const [leverage, setLeverage] = useState<string>("100");
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);

  // === favorites ===
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // === ticker select state ===
  const [tickerSearch, setTickerSearch] = useState("");
  const [tickerDropdownOpen, setTickerDropdownOpen] = useState(false);
  const [tickerVisibleLimit, setTickerVisibleLimit] = useState(10);
  const tickerListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const loadFavorites = async () => {
      try {
        setLoadingFavorites(true);
        const res = await fetch("/api/user/favorite-tickers", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: { symbol: string }[] = await res.json();
        setFavoriteSymbols(data.map((f) => f.symbol));
      } catch (e) {
        console.error("Error loading favorite tickers", e);
      } finally {
        setLoadingFavorites(false);
      }
    };
    loadFavorites();
  }, [currentUser]);

  // сброс формы при закрытии
  useEffect(() => {
    if (!openTradeOpen) {
      setSelectedUserId("");
      setSelectedTickerSymbol("");
      setSide("BUY");
      setVolume("0.10");
      setLeverage("100");
      setAiEnabled(false);
      setTickerSearch("");
      setTickerDropdownOpen(false);
      setTickerVisibleLimit(10);
    }
  }, [openTradeOpen]);

  // сброс лимита при смене фильтра/поиска
  useEffect(() => {
    setTickerVisibleLimit(10);
  }, [tickerSearch, favoriteSymbols.length, tickers.length]);

  const toggleFavorite = async (symbol: string) => {
    const isFav = favoriteSymbols.includes(symbol);
    const prev = favoriteSymbols;
    const next = isFav ? prev.filter((s) => s !== symbol) : [...prev, symbol];

    setFavoriteSymbols(next);

    try {
      const res = await fetch("/api/user/favorite-tickers", {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) {
        // rollback
        setFavoriteSymbols(prev);
      }
    } catch (err) {
      console.error("Error toggling favorite ticker", err);
      setFavoriteSymbols(prev);
    }
  };

  const sortedTickers = (() => {
    const favSet = new Set(favoriteSymbols);
    const fav = tickers.filter((t) => favSet.has(t.symbol));
    const rest = tickers.filter((t) => !favSet.has(t.symbol));
    return [...fav, ...rest];
  })();

  const filteredTickers = (() => {
    const q = tickerSearch.trim().toLowerCase();
    if (!q) return sortedTickers;

    return sortedTickers.filter((t) => {
      const meta = tickerMetaMap.get(t.symbol.toUpperCase());
      const showName =
          (t as any).showName || meta?.showName || t.symbol;
      const fullName =
          (t as any).fullName || meta?.fullName || "";
      return (
          t.symbol.toLowerCase().includes(q) ||
          showName.toLowerCase().includes(q) ||
          fullName.toLowerCase().includes(q)
      );
    });
  })();

  const handleTickerScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = target;
        const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

        if (distanceToBottom < 64) {
          setTickerVisibleLimit((prev) =>
              Math.min(prev + 10, filteredTickers.length),
          );
        }
      },
      [filteredTickers.length],
  );

  const selectedTicker = tickers.find((t) => t.symbol === selectedTickerSymbol);

  const canSubmit =
      !submitting &&
      !!selectedUserId &&
      !!selectedTickerSymbol &&
      !!volume &&
      !!leverage &&
      Number(volume) > 0 &&
      Number(leverage) > 0;

  // === preview margin ===
  const numericVolume = Number(volume) || 0;
  const numericLeverage = Number(leverage) || 0;
  const currentPrice = (() => {
    if (!selectedTicker) return 0;
    const p = Number(
        (selectedTicker as any).bid ??
        (selectedTicker as any).price ??
        0,
    );
    return Number.isFinite(p) ? p : 0;
  })();

  let rawMarginUsd = 0;
  if (numericVolume > 0 && numericLeverage > 0 && currentPrice > 0) {
    const notional = numericVolume * currentPrice;
    rawMarginUsd = notional / numericLeverage;
  }

  const baseCurrency =
      balanceDetails?.baseCurrency === "USD" ? "USD" : "EUR";
  const eurUsdRate = balanceDetails?.eurUsdRate && balanceDetails.eurUsdRate > 0
      ? balanceDetails.eurUsdRate
      : undefined;

  let primaryCurrency = baseCurrency;
  let primaryMargin = rawMarginUsd;
  let secondaryMargin: number | null = null;
  let secondaryCurrency: "USD" | "EUR" | null = null;

  if (rawMarginUsd > 0) {
    if (baseCurrency === "EUR" && eurUsdRate) {
      // rawMarginUsd считаем как USD
      primaryMargin = rawMarginUsd / eurUsdRate;
      secondaryMargin = rawMarginUsd;
      secondaryCurrency = "USD";
    } else if (baseCurrency === "USD" && eurUsdRate) {
      // primary = USD, secondary = EUR
      primaryMargin = rawMarginUsd;
      secondaryMargin = rawMarginUsd / eurUsdRate;
      secondaryCurrency = "EUR";
    } else {
      primaryMargin = rawMarginUsd;
      secondaryMargin = null;
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);

      // важно: aiEnabled отправляем в бэкенд
      const res = await fetch("/api/admin/trades/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          ticker: selectedTickerSymbol,
          type: side,
          volume: Number(volume),
          leverage: Number(leverage),
          aiEnabled, // <-- вот тут
        }),
      });

      if (!res.ok) {
        console.error("Failed to open trade");
        return;
      }

      onTradeAdded?.();
      setOpenTradeOpen(false);
    } catch (e) {
      console.error("Error opening trade", e);
    } finally {
      setSubmitting(false);
    }
  };

  // ========== RENDER ==========

  return (
      <Dialog open={openTradeOpen} onOpenChange={setOpenTradeOpen}>
        <DialogContent className="max-h-[90vh] w-[96vw] max-w-xl overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl">
          <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <DialogHeader className="flex flex-row items-start justify-between gap-2 border-b border-border/70 bg-background/60 px-5 py-4">
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Open new trade
                </DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose user, ticker and parameters. Margin preview is estimated.
                </p>
              </div>
              <DialogClose asChild>
                <button className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </DialogHeader>

            <div className="space-y-4 px-5 py-4 text-sm text-foreground">
              {/* USER SELECT */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">User</Label>
                <Select
                    value={selectedUserId}
                    onValueChange={(v) => setSelectedUserId(v)}
                >
                  <SelectTrigger className="h-11 w-full rounded-lg border border-input bg-background text-sm">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 border border-border bg-card text-sm">
                    {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex flex-col">
                        <span className="font-medium">
                          {u.name || u.email}
                        </span>
                            <span className="text-[11px] text-muted-foreground">
                          {u.email}
                        </span>
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TICKER SELECT с поиском + избранным + lazy load */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">
                  Ticker
                </Label>
                <div className="relative">
                  <button
                      type="button"
                      onClick={() =>
                          setTickerDropdownOpen((prev) => !prev)
                      }
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-sm"
                  >
                    {selectedTicker ? (
                        <div className="flex min-w-0 items-center gap-3">
                          {(() => {
                            const meta =
                                tickerMetaMap.get(
                                    selectedTicker.symbol.toUpperCase(),
                                ) || undefined;
                            const category: TickerCategory =
                                (selectedTicker.category as
                                    | TickerCategory
                                    | undefined) ??
                                (meta?.category as
                                    | TickerCategory
                                    | undefined) ??
                                "other";

                            return (
                                <TickerAvatar
                                    symbol={selectedTicker.symbol}
                                    category={category}
                                    baseCurrency={
                                        selectedTicker.baseCurrency ??
                                        meta?.baseCurrency
                                    }
                                    quoteCurrency={
                                        selectedTicker.quoteCurrency ??
                                        meta?.quoteCurrency
                                    }
                                    icon={
                                        selectedTicker.icon ??
                                        meta?.icon
                                    }
                                    size={26}
                                />
                            );
                          })()}
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {(selectedTicker as any).showName ||
                                  tickerMetaMap.get(
                                      selectedTicker.symbol.toUpperCase(),
                                  )?.showName ||
                                  selectedTicker.symbol}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {(selectedTicker as any).fullName ||
                                  tickerMetaMap.get(
                                      selectedTicker.symbol.toUpperCase(),
                                  )?.fullName ||
                                  selectedTicker.symbol}
                            </div>
                          </div>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                      Select ticker
                    </span>
                    )}
                    <span className="ml-2 whitespace-nowrap text-[11px] text-muted-foreground">
                    {favoriteSymbols.length > 0 && "★ favorites on top"}
                  </span>
                  </button>

                  {tickerDropdownOpen && (
                      <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl border border-border bg-background shadow-xl">
                        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <input
                              className="h-8 flex-1 border-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                              placeholder="Search ticker (symbol / name)…"
                              value={tickerSearch}
                              onChange={(e) => setTickerSearch(e.target.value)}
                          />
                          {loadingFavorites && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>

                        <div
                            ref={tickerListRef}
                            onScroll={handleTickerScroll}
                            className="max-h-72 overflow-y-auto py-1"
                        >
                          {filteredTickers.length === 0 && (
                              <div className="px-3 py-3 text-center text-[11px] text-muted-foreground">
                                No tickers match your search.
                              </div>
                          )}

                          {filteredTickers
                              .slice(0, tickerVisibleLimit)
                              .map((t) => {
                                const meta =
                                    tickerMetaMap.get(
                                        t.symbol.toUpperCase(),
                                    ) || undefined;
                                const category: TickerCategory =
                                    (t.category as
                                        | TickerCategory
                                        | undefined) ??
                                    (meta?.category as
                                        | TickerCategory
                                        | undefined) ??
                                    "other";

                                const isFav =
                                    favoriteSymbols.includes(t.symbol);

                                const showName =
                                    (t as any).showName ||
                                    meta?.showName ||
                                    t.symbol;
                                const fullName =
                                    (t as any).fullName ||
                                    meta?.fullName ||
                                    t.symbol;

                                return (
                                    <button
                                        key={t.symbol}
                                        type="button"
                                        onClick={() => {
                                          setSelectedTickerSymbol(t.symbol);
                                          setTickerDropdownOpen(false);
                                        }}
                                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted/60"
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        <TickerAvatar
                                            symbol={t.symbol}
                                            category={category}
                                            baseCurrency={
                                                t.baseCurrency ??
                                                meta?.baseCurrency
                                            }
                                            quoteCurrency={
                                                t.quoteCurrency ??
                                                meta?.quoteCurrency
                                            }
                                            icon={t.icon ?? meta?.icon}
                                            size={24}
                                        />
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                    <span className="truncate font-medium text-foreground">
                                      {showName}
                                    </span>
                                            <Badge className="rounded-full border border-border/60 bg-muted/80 px-1.5 text-[9px] text-muted-foreground">
                                              {t.symbol}
                                            </Badge>
                                          </div>
                                          <div className="truncate text-[10px] text-muted-foreground">
                                            {fullName}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(t.symbol);
                                          }}
                                          className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                          title={
                                            isFav
                                                ? "Remove from favorites"
                                                : "Add to favorites"
                                          }
                                      >
                                        {isFav ? (
                                            <Star className="h-4 w-4 fill-current" />
                                        ) : (
                                            <StarOff className="h-4 w-4" />
                                        )}
                                      </button>
                                    </button>
                                );
                              })}
                        </div>
                      </div>
                  )}
                </div>
              </div>

              {/* SIDE + VOLUME + LEVERAGE */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">
                    Side
                  </Label>
                  <div className="flex rounded-lg border border-input bg-background p-1">
                    <button
                        type="button"
                        onClick={() => setSide("BUY")}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                            side === "BUY"
                                ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                                : "text-muted-foreground"
                        }`}
                    >
                      Buy
                    </button>
                    <button
                        type="button"
                        onClick={() => setSide("SELL")}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                            side === "SELL"
                                ? "border border-rose-500/40 bg-rose-500/15 text-rose-400"
                                : "text-muted-foreground"
                        }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">
                    Volume
                  </Label>
                  <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      className="h-11 rounded-lg border border-input bg-background text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">
                    Leverage
                  </Label>
                  <Input
                      type="number"
                      min={1}
                      step={10}
                      value={leverage}
                      onChange={(e) => setLeverage(e.target.value)}
                      className="h-11 rounded-lg border border-input bg-background text-sm"
                  />
                </div>
              </div>

              {/* MARGIN PREVIEW */}
              {rawMarginUsd > 0 && (
                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-3.5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Estimated margin
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Based on current price and leverage.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">
                        {primaryMargin.toFixed(2)}{" "}
                        <span className="text-xs text-muted-foreground">
                      {primaryCurrency}
                    </span>
                      </div>
                      {secondaryMargin !== null && secondaryCurrency && (
                          <div className="text-[11px] text-muted-foreground">
                            ≈ {secondaryMargin.toFixed(2)}{" "}
                            {secondaryCurrency}
                          </div>
                      )}
                    </div>
                  </div>
              )}

              {/* AI ENABLED */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3.5 py-3">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    AI assistant for this trade
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    If enabled, AI can later monitor / manage this position
                    (depending on your backend logic).
                  </p>
                </div>
                <Switch
                    checked={aiEnabled}
                    onCheckedChange={(v) => setAiEnabled(!!v)}
                />
              </div>

              {/* ACTIONS */}
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <DialogClose asChild>
                  <Button
                      type="button"
                      variant="outline"
                      className="h-10 flex-1 rounded-lg border border-border bg-background text-sm sm:flex-none sm:px-5"
                      disabled={submitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="h-10 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-5"
                >
                  {submitting && (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  Open trade
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
  );
}
