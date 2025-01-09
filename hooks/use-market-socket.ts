'use client'

import { useEffect, useState } from 'react'
import { MarketData, MarketSocketHookResult } from '@/types/market'
import io, { Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useMarketSocket(symbols: string[]): MarketSocketHookResult {
  const [data, setData] = useState<Record<string, MarketData>>({})
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      socket = io({
        path: '/api/market-socket',
      })
    }

    function onConnect() {
      setIsConnected(true)
      socket?.emit('subscribe', symbols)
    }

    function onMarketData(message: any) {
      setData(prev => ({
        ...prev,
        [message.ticker]: {
          ticker: message.ticker,
          price: message.price,
          timestamp: message.timestamp,
          high: message.high,
          low: message.low,
          volume: message.volume,
          prevClose: message.prevClose,
          change: message.price - message.prevClose,
          changePercent: ((message.price - message.prevClose) / message.prevClose) * 100
        }
      }))
    }

    function onConnectError(err: Error) {
      console.error('Connection error:', err)
      setError('Failed to connect to the server. Please try again later.')
      setIsConnected(false)
    }

    function onDisconnect() {
      setIsConnected(false)
      setError('Disconnected from the server')
    }

    socket.on('connect', onConnect)
    socket.on('market-data', onMarketData)
    socket.on('connect_error', onConnectError)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket?.off('connect', onConnect)
      socket?.off('market-data', onMarketData)
      socket?.off('connect_error', onConnectError)
      socket?.off('disconnect', onDisconnect)
    }
  }, [symbols])

  return { data, error, isConnected }
}

