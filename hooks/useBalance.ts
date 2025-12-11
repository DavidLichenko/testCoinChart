"use client";

import {useCallback, useEffect, useState} from "react";
import {pusherClient} from "@/lib/pusher-client";

export type BalanceDetails = {
  baseCurrency: "USD" | "EUR";

  tradingBalance: number;
  tradingInTrade: number;
  pendingWithdrawAmount: number;
  lockedTrading: number;

  // Internal values are in USD for consistency
  walletTotal: number; // Value in USD
  stakingTotal: number; // Value in USD

  creditBalance: number; // Credit money (like a balance)

  // Available balance for operations
  availableToTrade: number;
  availableToWithdraw:number;
  // Approximate USD value for EUR users
  approxUsd?: number;
  
  // EUR/USD exchange rate for currency conversion
  eurUsdRate?: number;
};

export type BalanceResponse = {
  userId: string;
  balance: number;      // totalEquity in user's preferred currency (EUR/USD)
  liveProfit: number;
  details: BalanceDetails;
};

// --------- Глобальное хранилище ---------
let balanceStore = 0;
let profitStore = 0;
let detailsStore: BalanceDetails | null = null;
let assetsStore: any[] = []; // Store for wallet assets

const listeners = new Set<
    (balance: number, profit: number, details: BalanceDetails | null, assets: any[]) => void
>();

let initialized = false;
let initPromise: Promise<void> | null = null;

const notify = () => {
  listeners.forEach((l) => l(balanceStore, profitStore, detailsStore, assetsStore));
};

const resetStores = () => {
  balanceStore = 0;
  profitStore = 0;
  detailsStore = null;
  assetsStore = [];
};

// --------- Инициализация: первый запрос + Pusher ---------
async function initBalance() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Fetch both balance and wallet assets
      const [balanceRes, assetsRes] = await Promise.all([
        fetch("/api/user/balance", { cache: "no-store" }),
        fetch("/api/wallet/assets", { cache: "no-store" })
      ]);

      if (balanceRes.status === 401 || assetsRes.status === 401) {
        resetStores();
        initialized = true;
        notify();
        return;
      }

      if (!balanceRes.ok) {
        throw new Error("Failed to fetch balance");
      }

      const data: BalanceResponse = await balanceRes.json();
      const assetsData = assetsRes.ok ? await assetsRes.json() : [];

      balanceStore = data.balance || 0;
      profitStore = data.liveProfit || 0;
      detailsStore = data.details || null;
      assetsStore = assetsData || [];

      // Подписка на Pusher-канал пользователя
      const channel = pusherClient.subscribe(`user-${data.userId}`);

      channel.bind(
          "balance-update",
          (payload: {
            balance: number;
            liveProfit?: number;
            details: BalanceDetails;
          }) => {
            balanceStore = payload.balance ?? balanceStore;
            if (typeof payload.liveProfit === "number") {
              profitStore = payload.liveProfit;
            }
            detailsStore = payload.details || null;
            notify();
          }
      );

      // Subscribe to wallet asset updates
      channel.bind(
          "wallet-assets-update",
          (payload: any[]) => {
            assetsStore = payload || [];
            notify();
          }
      );

      initialized = true;
      notify();
    } catch (err) {
      console.error("Error initializing balance:", err);
    }
  })();

  return initPromise;
}

// --------- Внешняя функция: принудительно обновить баланс ---------
export async function refetchBalance() {
  try {
    // Fetch both balance and wallet assets
    const [balanceRes, assetsRes] = await Promise.all([
      fetch("/api/user/balance", { cache: "no-store" }),
      fetch("/api/wallet/assets", { cache: "no-store" })
    ]);

    if (balanceRes.status === 401 || assetsRes.status === 401) {
      resetStores();
      notify();
      return;
    }

    if (!balanceRes.ok) {
      throw new Error("Failed to refetch balance");
    }

    const data: BalanceResponse = await balanceRes.json();
    const assetsData = assetsRes.ok ? await assetsRes.json() : [];

    balanceStore = data.balance || 0;
    profitStore = data.liveProfit || 0;
    detailsStore = data.details || null;
    assetsStore = assetsData || [];

    notify();
  } catch (err) {
    console.error("Error refetching balance:", err);
  }
}

// --------- Хук ---------
export function useBalance() {
  const [balance, setBalance] = useState(balanceStore);
  const [liveProfit, setLiveProfitState] = useState(profitStore);
  const [details, setDetails] = useState<BalanceDetails | null>(detailsStore);
  const [assets, setAssets] = useState<any[]>(assetsStore); // Add assets state

  useEffect(() => {
    initBalance();

    const listener = (
        newBalance: number,
        newProfit: number,
        newDetails: BalanceDetails | null,
        newAssets: any[]
    ) => {
      setBalance(newBalance);
      setLiveProfitState(newProfit);
      setDetails(newDetails);
      setAssets(newAssets); // Update assets state
    };

    listeners.add(listener);

    // синхронизируем сразу текущие значения стора
    listener(balanceStore, profitStore, detailsStore, assetsStore);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  // setLiveProfit — для твоего real-time PnL (например, из чарта/сокета)
  const setLiveProfit = useCallback((profit: number) => {
    profitStore = profit;

    // переcчитаем equity = tradingBalance + liveProfit, если есть details
    if (detailsStore) {
      balanceStore = (detailsStore.tradingBalance || 0) + profit;
    }

    notify();
  }, []);

  return {
    balance,
    liveProfit,
    details,
    assets, // Return assets
    setLiveProfit,
    refetchBalance, // чтобы можно было вызывать напрямую из других модулей
  };
}
