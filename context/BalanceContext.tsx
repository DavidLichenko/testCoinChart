"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react"; // For getting user session (userId)
import { useRouter } from "next/navigation";

interface BalanceContextType {
    balance: number;
    isLoading: boolean;
    error: string | null;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session, status } = useSession(); // To get the user session and userId
    const [balance, setBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Don't fetch balance if the user is not authenticated
        if (status === "loading" || !session?.user?.id) {
            return;
        }

        const fetchBalance = async () => {
            try {
                const response = await fetch(`/api/balance/${session.user.id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch balance");
                }
                const data = await response.json();
                setBalance(data.usd);
            } catch (error) {
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
    }, [session, status]); // Re-run if session changes or status changes

    return (
        <BalanceContext.Provider value={{ balance, isLoading, error }}>
            {children}
        </BalanceContext.Provider>
    );
};

export const useBalance = (): BalanceContextType => {
    const context = useContext(BalanceContext);
    if (!context) {
        throw new Error("useBalance must be used within a BalanceProvider");
    }
    return context;
};
