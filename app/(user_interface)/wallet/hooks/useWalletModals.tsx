"use client";

import {createContext, useCallback, useContext, useMemo, useState} from "react";

type WalletModalsState = {
    depositOpen: boolean;
    withdrawOpen: boolean;
    transferOpen: boolean;
    exchangeOpen: boolean;
    stakeOpen: boolean;
    addAssetOpen: boolean;

    // опционально: контекст для выбранного актива
    activeAssetSymbol?: string | null;
};

type WalletModalsContextType = WalletModalsState & {
    openDeposit: (symbol?: string) => void;
    openWithdraw: (symbol?: string) => void;
    openTransfer: (symbol?: string) => void;
    openExchange: (fromSymbol?: string) => void;
    openStake: (symbol?: string) => void;
    openAddAsset: () => void;
    closeAll: () => void;
};

const WalletModalsContext = createContext<WalletModalsContextType | null>(null);

export function WalletModalsProvider({
                                         children
                                     }: {
    children: React.ReactNode;
}) {
    const [state, setState] = useState<WalletModalsState>({
        depositOpen: false,
        withdrawOpen: false,
        transferOpen: false,
        exchangeOpen: false,
        stakeOpen: false,
        addAssetOpen: false,
        activeAssetSymbol: null
    });

    const closeAll = useCallback(() => {
        setState((prev) => ({
            ...prev,
            depositOpen: false,
            withdrawOpen: false,
            transferOpen: false,
            exchangeOpen: false,
            stakeOpen: false,
            addAssetOpen: false,
            activeAssetSymbol: null
        }));
    }, []);

    const openDeposit = useCallback((symbol?: string) => {
        setState({
            depositOpen: true,
            withdrawOpen: false,
            transferOpen: false,
            exchangeOpen: false,
            stakeOpen: false,
            addAssetOpen: false,
            activeAssetSymbol: symbol ?? null
        });
    }, []);

    const openWithdraw = useCallback((symbol?: string) => {
        setState({
            depositOpen: false,
            withdrawOpen: true,
            transferOpen: false,
            exchangeOpen: false,
            stakeOpen: false,
            addAssetOpen: false,
            activeAssetSymbol: symbol ?? null
        });
    }, []);

    const openTransfer = useCallback((symbol?: string) => {
        setState({
            depositOpen: false,
            withdrawOpen: false,
            transferOpen: true,
            exchangeOpen: false,
            stakeOpen: false,
            addAssetOpen: false,
            activeAssetSymbol: symbol ?? null
        });
    }, []);

    const openExchange = useCallback((fromSymbol?: string) => {
        setState({
            depositOpen: false,
            withdrawOpen: false,
            transferOpen: false,
            exchangeOpen: true,
            stakeOpen: false,
            addAssetOpen: false,
            activeAssetSymbol: fromSymbol ?? null
        });
    }, []);

    const openStake = useCallback((symbol?: string) => {
        setState({
            depositOpen: false,
            withdrawOpen: false,
            transferOpen: false,
            exchangeOpen: false,
            stakeOpen: true,
            addAssetOpen: false,
            activeAssetSymbol: symbol ?? null
        });
    }, []);

    const openAddAsset = useCallback(() => {
        setState({
            depositOpen: false,
            withdrawOpen: false,
            transferOpen: false,
            exchangeOpen: false,
            stakeOpen: false,
            addAssetOpen: true,
            activeAssetSymbol: null
        });
    }, []);

    const value = useMemo<WalletModalsContextType>(
        () => ({
            ...state,
            openDeposit,
            openWithdraw,
            openTransfer,
            openExchange,
            openStake,
            openAddAsset,
            closeAll
        }),
        [state, openDeposit, openWithdraw, openTransfer, openExchange, openStake, openAddAsset, closeAll]
    );

    return (
        <WalletModalsContext.Provider value={value}>
            {children}
        </WalletModalsContext.Provider>
    );
}

export function useWalletModals() {
    const ctx = useContext(WalletModalsContext);
    if (!ctx) {
        throw new Error("useWalletModals must be used within WalletModalsProvider");
    }
    return ctx;
}
