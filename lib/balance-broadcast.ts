// lib/balance-broadcast.ts
import { getUserBalanceData } from "@/lib/user-balance"
import { pusherServer } from "@/lib/pusher-server"

export async function broadcastUserBalance(userId: string) {
    const data = await getUserBalanceData(userId)

    await pusherServer.trigger(`user-${userId}`, "balance-update", {
        userId,
        balance: data.balance,
        liveProfit: data.liveProfit,
        details: data.details,
    })

    return data
}
