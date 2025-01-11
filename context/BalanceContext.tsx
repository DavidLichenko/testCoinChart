"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface BalanceContextType {
    balance: number;
    isLoading: boolean;
    error: string | null;
    setBalanceUser: (balance: number, userId: string) => void;
}

export const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session, status } = useSession();
    const [balance, setBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBalance = async () => {
        try {
            const response = await fetch(`/api/balance/${session.user.id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch balance");
            }
            const data = await response.json();
            console.log("Fetched balance data:", data);
            setBalance(data.usd);
        } catch (error: any) {
            console.error("Error fetching balance:", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Custom method to update balance for a specific user
    const setBalanceUser = async (newBalance: number, userId: string) => {
        try {
            const response = await fetch(`/api/balance/${userId}`, {
                method: "PUT", // Assuming you implement a PUT endpoint for updates
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ usd: newBalance }),
            });

            if (!response.ok) {
                throw new Error("Failed to update balance");
            }

            setBalance(newBalance); // Update context state
        } catch (error: any) {
            console.error("Error updating balance:", error);
            setError(error.message);
        }
    };

    useEffect(() => {
        if (status === "loading" || !session?.user?.id) {
            return;
        }

        fetchBalance();
    }, [session, status]);

    return (
        <BalanceContext.Provider value={{ balance, isLoading, error, setBalanceUser }}>
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
