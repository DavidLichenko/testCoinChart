import { useEffect, useState, useCallback } from "react";
import { pusherClient } from "@/lib/pusher-client";

type BalanceResponse = {
    userId: string;
    totalBalance: number;
    bonusBalanced?: number;
};

type Listener = (balance: number, profit: number, bonusBalanced: number) => void;

let balanceStore = 0;
let profitStore = 0;
let bonusBalancedStore = 0;

let currentUserId: string | null = null;
let subscribedChannel: ReturnType<typeof pusherClient.subscribe> | null = null;

let initPromise: Promise<void> | null = null;
let inFlightFetch: Promise<void> | null = null;

const listeners = new Set<Listener>();

const notify = () => {
    for (const l of listeners) l(balanceStore, profitStore, bonusBalancedStore);
};

const resetStore = () => {
    balanceStore = 0;
    profitStore = 0;
    bonusBalancedStore = 0;
    notify();
};

const unsubscribeIfNeeded = () => {
    if (!subscribedChannel || !currentUserId) return;

    // важно: bind'ы снимаем, иначе будет дублирование на HMR/рефетчах
    subscribedChannel.unbind("balance-update");
    pusherClient.unsubscribe(`user-${currentUserId}`);

    subscribedChannel = null;
};

const ensureSubscribed = (userId: string) => {
    // если уже подписаны на этого пользователя — ничего не делаем
    if (currentUserId === userId && subscribedChannel) return;

    // если подписаны на другого — отписываемся
    if (currentUserId && currentUserId !== userId) {
        unsubscribeIfNeeded();
    }

    currentUserId = userId;
    subscribedChannel = pusherClient.subscribe(`user-${userId}`);

    subscribedChannel.bind(
        "balance-update",
        (payload: { totalBalance: number; bonusBalanced?: number }) => {
            balanceStore = payload.totalBalance;
            bonusBalancedStore = payload.bonusBalanced ?? 0;
            notify();
        }
    );
};

async function fetchInitialBalanceInternal(): Promise<void> {
    if (typeof window === "undefined") return;

    // не допускаем параллельных fetch'ей
    if (inFlightFetch) return inFlightFetch;

    inFlightFetch = (async () => {
        try {
            const res = await fetch("/api/user/balance", { cache: "no-store" });

            if (res.status === 401) {
                // logout/не авторизован — чистим стейт и отписываемся
                unsubscribeIfNeeded();
                currentUserId = null;
                resetStore();
                return;
            }

            if (!res.ok) throw new Error("Failed to fetch balance");

            const data: BalanceResponse = await res.json();

            balanceStore = data.totalBalance;
            bonusBalancedStore = data.bonusBalanced ?? 0;

            ensureSubscribed(data.userId);
            notify();
        } catch (err) {
            console.error("Error fetching balance:", err);
        } finally {
            inFlightFetch = null;
        }
    })();

    return inFlightFetch;
}

// Инициализация строго один раз на клиенте
function ensureInitOnce() {
    if (typeof window === "undefined") return;
    if (!initPromise) {
        initPromise = fetchInitialBalanceInternal();
    }
}

// --- публичное API ---
export async function refetchBalance() {
    // рефетч не должен создавать дополнительные подписки
    await fetchInitialBalanceInternal();
}

export function useBalance() {
    ensureInitOnce();

    const [balance, setBalance] = useState(balanceStore);
    const [liveProfit, setLiveProfitState] = useState(profitStore);
    const [bonusBalanced, setBonusBalanced] = useState(bonusBalancedStore);

    useEffect(() => {
        const onUpdate: Listener = (b, p, bb) => {
            setBalance(b);
            setLiveProfitState(p);
            setBonusBalanced(bb);
        };

        listeners.add(onUpdate);

        // синхронизируемся сразу
        onUpdate(balanceStore, profitStore, bonusBalancedStore);

        return () => {
            listeners.delete(onUpdate);
            // специально НЕ отписываемся от pusher тут,
            // потому что это глобальный store и может быть другой компонент слушает.
        };
    }, []);

    const setProfit = useCallback((profit: number) => {
        profitStore = profit;
        notify();
    }, []);

    return {
        balance,
        liveProfit,
        bonusBalanced,
        setLiveProfit: setProfit,
        refetchBalance,
    };
}
