"use client"

import type React from "react"
import {createContext, useContext, useEffect, useState} from "react"
import {usePathname, useRouter} from "next/navigation"
import Header from "@/components/header";
import ChatButton from "./chat/chat-button"
import Loading from "./loading"

interface User {
  id: string
  email: string
  name: string | null
  TotalBalance?: number
  can_withdraw?: boolean
  isVerif?: boolean
  role?: string
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
      const response = await fetch("/api/auth/me")
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
          console.warn("Prevented insertBefore on node with different parent", referenceNode, this)
          return newNode
        }
        return originalInsertBefore.apply(this, arguments as any)
      }
    }
    // -----------------------------------------

    checkAuth()
  }, [])

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/privacy", "/terms", "/news"]
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      // Redirect to login if trying to access protected route
      router.push("/login")
    }
  }, [user, loading, pathname, isPublicRoute, router])

  if (loading) {
    return <Loading />
  }

  // For public routes, render without auth wrapper
  if (!user && isPublicRoute) {
    return <>{children}</>
  }

  // If not logged in and not on public route, show nothing (redirect will happen)
  if (!user) {
    return null
  }

  return (
      <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
        {/* Каркас авторизованной части сайта */}
        <div className="min-h-screen overflow-hidden flex flex-col bg-background text-white">
          {/* Хедер всегда сверху, фиксированной высоты по своему контенту */}
          <Header />

          {/* Основной контент (в т.ч. /wallet и /wallet/staking) растягивается на остаток */}
          <main className="flex-1 flex flex-col !bg-app-bgPage h-full">
            {children}
          </main>

          <ChatButton />
        </div>
      </AuthContext.Provider>
  )
}
