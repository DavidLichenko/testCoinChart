"use client";

import {useCallback, useEffect, useMemo, useState} from "react";

// ---- Типы под твой API ----

// Из /api/staking/plans
export type StakingPlanDto = {
    id: string;
    name: string;
    assetSymbol: string;
    duration: number; // дни
    apr: number;
    minAmount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    asset: {
        symbol: string;
        name: string;
        decimals: number;
        type: string; // AssetType2
    };
};

// Из /api/staking/positions
export type StakingPositionDto = {
    id: string;
    userId: string;
    assetSymbol: string;
    amount: number;
    planId: string;
    rewardRate: number;
    startedAt: string;
    endsAt: string | null;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
    lastRewardAt: string | null;
    asset: {
        symbol: string;
        name: string;
        decimals: number;
        type: string;
    };
    plan: StakingPlanDto;
};

export type StakingErrorCode =
    | "BAD_REQUEST"
    | "INVALID_PLAN"
    | "ASSET_NOT_STAKABLE"
    | "AMOUNT_BELOW_MIN"
    | "INSUFFICIENT_BALANCE"
    | "NOT_FOUND"
    | "ALREADY_CLOSED"
    | "STAKING_PLANS_ERROR"
    | "STAKING_POSITIONS_ERROR"
    | "STAKING_OPEN_ERROR"
    | "STAKING_CLOSE_ERROR"
    | "UNAUTHORIZED"
    | string;

type UseStakingOptions = {
    // если нужно сразу фильтровать планы по конкретному активу
    assetSymbol?: string | null;
};

type OpenStakePayload = {
    assetSymbol: string;
    planId: string;
    amount: number;
};

export function useStaking(options?: UseStakingOptions) {
    const assetSymbol = options?.assetSymbol ?? null;

    const [plans, setPlans] = useState<StakingPlanDto[]>([]);
    const [positions, setPositions] = useState<StakingPositionDto[]>([]);

    const [loadingPlans, setLoadingPlans] = useState(false);
    const [loadingPositions, setLoadingPositions] = useState(false);
    const [mutating, setMutating] = useState(false);

    const [errorCode, setErrorCode] = useState<StakingErrorCode | null>(null);

    // ---- FETCH PLANS ----
    const fetchPlans = useCallback(async () => {
        try {
            setLoadingPlans(true);
            setErrorCode(null);

            const params = assetSymbol ? `?assetSymbol=${encodeURIComponent(assetSymbol)}` : "";
            const res = await fetch(`/api/staking/plans${params}`);

            const json = await res.json();
            if (!json.success) {
                setErrorCode(json.error || "STAKING_PLANS_ERROR");
                return;
            }

            setPlans(json.plans || []);
        } catch (err) {
            console.error("useStaking.fetchPlans error:", err);
            setErrorCode("STAKING_PLANS_ERROR");
        } finally {
            setLoadingPlans(false);
        }
    }, [assetSymbol]);

    // ---- FETCH POSITIONS ----
    const fetchPositions = useCallback(async () => {
        try {
            setLoadingPositions(true);
            setErrorCode(null);

            const res = await fetch("/api/staking/positions");
            const json = await res.json();

            if (!json.success) {
                setErrorCode(json.error || "STAKING_POSITIONS_ERROR");
                return;
            }

            setPositions(json.positions || []);
        } catch (err) {
            console.error("useStaking.fetchPositions error:", err);
            setErrorCode("STAKING_POSITIONS_ERROR");
        } finally {
            setLoadingPositions(false);
        }
    }, []);

    // ---- Общий refresh ----
    const refreshAll = useCallback(async () => {
        await Promise.all([fetchPlans(), fetchPositions()]);
    }, [fetchPlans, fetchPositions]);

    // ---- Авто-подгрузка при маунте / смене assetSymbol ----
    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    // ---- Деривативы ----
    const activePositions = useMemo(
        () => positions.filter((p) => p.status === "ACTIVE"),
        [positions],
    );

    const totalStakedByAsset = useMemo(() => {
        const map = new Map<string, number>();
        for (const p of activePositions) {
            const prev = map.get(p.assetSymbol) ?? 0;
            map.set(p.assetSymbol, prev + p.amount);
        }
        return map;
    }, [activePositions]);

    const totalStakedAll = useMemo(
        () =>
            activePositions.reduce((acc, p) => acc + p.amount, 0),
        [activePositions],
    );

    const loading = loadingPlans || loadingPositions;
    const hasActivePositions = activePositions.length > 0;

    // ---- Открытие стейкинга ----
    const openStake = useCallback(
        async (payload: OpenStakePayload) => {
            try {
                setMutating(true);
                setErrorCode(null);

                const res = await fetch("/api/staking/open", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const json = await res.json();

                if (!json.success) {
                    setErrorCode(json.error || "STAKING_OPEN_ERROR");
                    return { success: false as const, error: json.error as StakingErrorCode };
                }

                // позиция создана — обновляем списки
                await refreshAll();

                // тут можно ещё диспатчить glow
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("wallet-balance-glow"));
                }

                return { success: true as const, data: json };
            } catch (err) {
                console.error("useStaking.openStake error:", err);
                setErrorCode("STAKING_OPEN_ERROR");
                return { success: false as const, error: "STAKING_OPEN_ERROR" as StakingErrorCode };
            } finally {
                setMutating(false);
            }
        },
        [refreshAll],
    );

    // ---- Закрытие стейкинга ----
    const closeStake = useCallback(
        async (positionId: string) => {
            try {
                setMutating(true);
                setErrorCode(null);

                const res = await fetch("/api/staking/close", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ positionId }),
                });

                const json = await res.json();

                if (!json.success) {
                    setErrorCode(json.error || "STAKING_CLOSE_ERROR");
                    return { success: false as const, error: json.error as StakingErrorCode };
                }

                await refreshAll();

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("wallet-balance-glow"));
                }

                return { success: true as const, data: json };
            } catch (err) {
                console.error("useStaking.closeStake error:", err);
                setErrorCode("STAKING_CLOSE_ERROR");
                return { success: false as const, error: "STAKING_CLOSE_ERROR" as StakingErrorCode };
            } finally {
                setMutating(false);
            }
        },
        [refreshAll],
    );

    return {
        // raw
        plans,
        positions,

        // derived
        activePositions,
        totalStakedByAsset,
        totalStakedAll,
        hasActivePositions,

        // state
        loading,
        loadingPlans,
        loadingPositions,
        mutating,
        errorCode,

        // actions
        refreshAll,
        fetchPlans,
        fetchPositions,
        openStake,
        closeStake,
    };
}
