'use client'

import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      socket = io('https://web-production-2d590.up.railway.app', {
        path: '/socket.io',
        transports: ['websocket'],
        withCredentials: true,
      })
    }

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      if (socket) {
        socket.off('connect')
        socket.off('disconnect')
      }
    }
  }, [])

  return socket
}

