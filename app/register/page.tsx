"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { RegisterForm } from "@/components/auth/register-form"
import { motion } from "framer-motion"

export default function RegisterPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialReferralCode, setInitialReferralCode] = useState<string>("")

  useEffect(() => {
    if (!loading && user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    // Get referral code from URL params (ref or referralCode)
    const ref = searchParams.get("ref")
    const referralCode = searchParams.get("referralCode")
    if (ref || referralCode) {
      setInitialReferralCode(ref || referralCode || "")
    }
  }, [searchParams])

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
          <RegisterForm
              initialReferralCode={initialReferralCode}
              onSwitchToLogin={() => router.push("/login")}
              onSuccess={async () => {
                // cookie уже стоит после успешной регистрации
                await refreshUser()
                router.push("/")
              }}
          />
        </motion.div>
      </div>
  )
}
