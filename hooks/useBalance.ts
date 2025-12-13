import { useEffect, useState, useCallback } from "react"
import { pusherClient } from "@/lib/pusher-client"

type BalanceResponse = {
  userId: string
  totalBalance: number
  bonusBalanced?: number
}

// --- Глобальные переменные ---
let balanceStore = 0
let profitStore = 0
let bonusBalancedStore = 0
const listeners: Set<(balance: number, profit: number, bonusBalanced: number) => void> = new Set()

const updateAndNotify = () => {
  listeners.forEach(listener => listener(balanceStore, profitStore, bonusBalancedStore))
}

// --- Функция получения баланса ---
async function fetchInitialBalance() {
  try {
    const res = await fetch("/api/user/balance")

    if (res.status === 401) {
      // пользователь не авторизован → сбрасываем всё
      balanceStore = 0
      profitStore = 0
      bonusBalancedStore = 0
      updateAndNotify()
      return
    }

    if (!res.ok) throw new Error("Failed to fetch balance")

    const data: BalanceResponse = await res.json()
    balanceStore = data.totalBalance
    bonusBalancedStore = data.bonusBalanced || 0

    // Подписка на Pusher после получения userId
    const channel = pusherClient.subscribe(`user-${data.userId}`)
    channel.bind("balance-update", (data: { totalBalance: number; bonusBalanced?: number }) => {
      balanceStore = data.totalBalance
      bonusBalancedStore = data.bonusBalanced || 0
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
  const [bonusBalanced, setbonusBalanced] = useState(bonusBalancedStore)

  useEffect(() => {
    const onUpdate = (newBalance: number, newProfit: number, newbonusBalanced: number) => {
      setBalance(newBalance)
      setLiveProfit(newProfit)
      setbonusBalanced(newbonusBalanced)
    }
    listeners.add(onUpdate)

    // Первичная синхронизация
    onUpdate(balanceStore, profitStore, bonusBalancedStore)

    return () => {
      listeners.delete(onUpdate)
    }
  }, [])

  const setProfit = useCallback((profit: number) => {
    profitStore = profit
    updateAndNotify()
  }, [])

  return { balance, liveProfit, bonusBalanced, setLiveProfit: setProfit, refetchBalance }
}

export async function refetchBalance() {
  await fetchInitialBalance()
}