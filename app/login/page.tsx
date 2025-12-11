"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { motion } from "framer-motion"

export default function LoginPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
    )
  }

  if (user) {
    return null
  }

  return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-full"
        >
          <LoginForm
              onSwitchToRegister={() => router.push("/register")}
              onSuccess={async () => {
                // 1) сервер уже выставил auth-token
                // 2) обновляем пользователя в контексте
                await refreshUser()
                // 3) теперь Header уже знает, что мы залогинены
                router.push("/")
              }}
          />
        </motion.div>
      </div>
  )
}
