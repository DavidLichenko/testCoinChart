"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Loading from "./loading"

interface User {
  id: string
  email: string
  name: string | null
  TotalBalance?: number
  can_withdraw?: boolean
  isVerif?: boolean
  role?: string
  aiTrading?: boolean // Added for AI Trading feature detection
  baseCurrency?: "USD" | "EUR"
}

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = async () => {
    try {
      // Add cache control and faster timeout
      const response = await fetch("/api/auth/me", {
        cache: "force-cache", // Use browser cache when available
        next: { revalidate: 30 }, // Revalidate every 30 seconds
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      // можно тут же router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const refreshUser = () => {
    checkAuth()
  }

  useEffect(() => {
    // --- Google Translate / DOM patch fix ---
    if (typeof Node === "function" && Node.prototype) {
      const originalRemoveChild = Node.prototype.removeChild
      Node.prototype.removeChild = function (child) {
        if (child?.parentNode !== this) {
          console.warn("Prevented removeChild on non-child node", child, this)
          return child
        }
        return originalRemoveChild.apply(this, arguments as any)
      }

      const originalInsertBefore = Node.prototype.insertBefore
      Node.prototype.insertBefore = function (newNode, referenceNode) {
        if (referenceNode && referenceNode.parentNode !== this) {
          console.warn(
              "Prevented insertBefore on node with different parent",
              referenceNode,
              this
          )
          return newNode
        }
        return originalInsertBefore.apply(this, arguments as any)
      }
    }
    // -----------------------------------------

    checkAuth()
  }, [])

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/privacy", "/terms", "/news", "/forgot-password", "/reset-password"]
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push("/login")
    }
  }, [user, loading, pathname, isPublicRoute, router])

  const value: AuthContextType = {
    user,
    loading,
    logout,
    refreshUser,
  }

  return (
      <AuthContext.Provider value={value}>
        {loading ? (
            <Loading />
        ) : (
            children
        )}
      </AuthContext.Provider>
  )
}
