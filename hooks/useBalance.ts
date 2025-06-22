import { useEffect, useState, useCallback } from "react"
import { pusherClient } from "@/lib/pusher-client";

type BalanceResponse = {
    userId: string
    totalBalance: number
}

// Keep a single instance of the balance state globally
let balanceStore = 0;
let profitStore = 0;
const listeners: Set<(balance: number, profit: number) => void> = new Set();

const updateAndNotify = () => {
    listeners.forEach(listener => listener(balanceStore, profitStore));
}

async function fetchInitialBalance() {
    try {
        const res = await fetch("/api/user/balance")
        if (!res.ok) throw new Error("Failed to fetch balance")
        const data: BalanceResponse = await res.json()
        balanceStore = data.totalBalance;
        
        // Subscribe to Pusher after getting userId
        const channel = pusherClient.subscribe(`user-${data.userId}`)
        channel.bind("balance-update", (data: { totalBalance: number }) => {
            balanceStore = data.totalBalance;
            updateAndNotify();
        })

        updateAndNotify();
    } catch (err) {
        console.error("Error fetching balance:", err)
    }
}

// Fetch balance once when the app loads
if (typeof window !== 'undefined') {
    fetchInitialBalance();
}

export function useBalance() {
    const [balance, setBalance] = useState(balanceStore)
    const [liveProfit, setLiveProfit] = useState(profitStore)

    useEffect(() => {
        const onUpdate = (newBalance: number, newProfit: number) => {
            setBalance(newBalance);
            setLiveProfit(newProfit);
        };
        listeners.add(onUpdate);
        
        // Initial sync
        onUpdate(balanceStore, profitStore);

        return () => {
            listeners.delete(onUpdate);
        };
    }, [])

    const setProfit = useCallback((profit: number) => {
        profitStore = profit;
        updateAndNotify();
    }, []);

    return { balance, liveProfit, setLiveProfit: setProfit }
}
