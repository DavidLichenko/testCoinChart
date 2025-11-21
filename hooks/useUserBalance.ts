"use client"

import { useEffect, useState } from "react"
import { pusherClient } from "@/lib/pusher-client"

interface AdminBalanceResponse {
    userId: string
    totalBalance: number
}

export function useUserBalance(userId?: string) {
    const [balance, setBalance] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) return

        let channel: any

        const fetchBalance = async () => {
            try {
                setLoading(true)
                const res = await fetch(`/api/admin/users/${userId}/balance`)
                if (res.ok) {
                    const data: AdminBalanceResponse = await res.json()
                    setBalance(data.totalBalance)
                }
            } catch (e) {
                console.error("Error fetching admin user balance:", e)
            } finally {
                setLoading(false)
            }
        }

        fetchBalance()

        // Подписка на тот же канал, что и у юзера
        channel = pusherClient.subscribe(`user-${userId}`)
        const handler = (payload: { totalBalance: number }) => {
            setBalance(payload.totalBalance)
        }
        channel.bind("balance-update", handler)

        return () => {
            if (channel) {
                channel.unbind("balance-update", handler)
                pusherClient.unsubscribe(`user-${userId}`)
            }
        }
    }, [userId])

    return { balance, loading }
}
