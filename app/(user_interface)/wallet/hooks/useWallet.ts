"use client";

import useSWR from "swr";
import {fetcher} from "./fetcher";

export type WalletSummary = {
    totalBalance: number;
    ownFunds: number;
    creditBalance: number;
    availableToTrade: number;
    baseCurrency: string;
};

export type WalletAsset = {
    symbol: string;
    name: string;
    balance: number;
    ownBalance: number;
    creditBalance: number;
    price: number;
    change24h: number;
    totalValue: number;
};

export type WalletTransaction = {
    id: string;
    userId: string;
    assetSymbol: string;
    type: string;
    status: string;
    amount: number;
    fromUserId?: string | null;
    toUserId?: string | null;
    txHash?: string | null;
    metadata?: any;
    createdAt: string;
};

export type StakingPlan = {
    id: string;
    name: string;
    assetSymbol: string;
    duration: number;
    apr: number;
    minAmount: number;
    isActive: boolean;
    asset: {
        symbol: string;
        name: string;
        isStakable: boolean;
    };
};

export function useWallet() {
    const {
        data: summary,
        error: summaryError,
        isLoading: summaryLoading,
        mutate: mutateSummary
    } = useSWR<WalletSummary>("/api/wallet/summary", fetcher);

    const {
        data: assets,
        error: assetsError,
        isLoading: assetsLoading,
        mutate: mutateAssets
    } = useSWR<WalletAsset[]>("/api/wallet/assets", fetcher);

    const {
        data: transactions,
        error: txError,
        isLoading: txLoading,
        mutate: mutateTransactions
    } = useSWR<WalletTransaction[]>("/api/wallet/transactions", fetcher);

    const {
        data: stakingPlans,
        error: stakingError,
        isLoading: stakingLoading
    } = useSWR<StakingPlan[]>("/api/wallet/staking-plans", fetcher);

    const isLoading =
        summaryLoading || assetsLoading || txLoading || stakingLoading;

    const isError = summaryError || assetsError || txError || stakingError;

    async function refreshAll() {
        await Promise.all([
            mutateSummary(),
            mutateAssets(),
            mutateTransactions()
        ]);
    }

    return {
        summary,
        assets,
        transactions,
        stakingPlans,
        isLoading,
        isError,
        refreshAll
    };
}
