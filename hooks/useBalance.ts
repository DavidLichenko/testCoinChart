import { useEffect, useState, useCallback } from "react"
import { pusherClient } from "@/lib/pusher-client"

type BalanceResponse = {
  userId: string
  totalBalance: number
}

// --- Глобальные переменные ---
let balanceStore = 0
let profitStore = 0
const listeners: Set<(balance: number, profit: number) => void> = new Set()

const updateAndNotify = () => {
  listeners.forEach(listener => listener(balanceStore, profitStore))
}

// --- Функция получения баланса ---
async function fetchInitialBalance() {
  try {
    const res = await fetch("/api/user/balance")

    if (res.status === 401) {
      // пользователь не авторизован → сбрасываем всё
      balanceStore = 0
      profitStore = 0
      updateAndNotify()
      return
    }

    if (!res.ok) throw new Error("Failed to fetch balance")

    const data: BalanceResponse = await res.json()
    balanceStore = data.totalBalance

    // Подписка на Pusher после получения userId
    const channel = pusherClient.subscribe(`user-${data.userId}`)
    channel.bind("balance-update", (data: { totalBalance: number }) => {
      balanceStore = data.totalBalance
      updateAndNotify()
    })

    updateAndNotify()
  } catch (err) {
    console.error("Error fetching balance:", err)
  }
}

// --- Запрашиваем баланс сразу при загрузке страницы ---
if (typeof window !== "undefined") {
  fetchInitialBalance()
}

// --- Сам хук ---
export function useBalance() {
  const [balance, setBalance] = useState(balanceStore)
  const [liveProfit, setLiveProfit] = useState(profitStore)

  useEffect(() => {
    const onUpdate = (newBalance: number, newProfit: number) => {
      setBalance(newBalance)
      setLiveProfit(newProfit)
    }
    listeners.add(onUpdate)

    // Первичная синхронизация
    onUpdate(balanceStore, profitStore)

    return () => {
      listeners.delete(onUpdate)
    }
  }, [])

  const setProfit = useCallback((profit: number) => {
    profitStore = profit
    updateAndNotify()
  }, [])

  return { balance, liveProfit, setLiveProfit: setProfit }
}
export async function refetchBalance() {
  await fetchInitialBalance()
}