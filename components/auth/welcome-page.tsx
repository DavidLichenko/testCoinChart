"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, BarChart3, Shield, Zap, TrendingUp, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoginForm } from "./login-form"
import { useRouter } from "next/navigation"
import { RegisterForm } from "./register-form"

// ✅ Accept onAuthSuccess prop
export default function WelcomePage({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const router = useRouter()

  const features = [
    {
      icon: BarChart3,
      title: "Advanced Trading",
      description: "Professional trading tools with real-time charts and analytics",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Bank-level security with multi-factor authentication",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Execute trades in milliseconds with our optimized infrastructure",
    },
    {
      icon: TrendingUp,
      title: "Market Analysis",
      description: "AI-powered insights and market predictions",
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "24/7 customer support from trading professionals",
    },
    {
      icon: Star,
      title: "Premium Features",
      description: "Access to exclusive trading strategies and signals",
    },
  ]

  const stats = [
    { label: "Active Traders", value: "50K+" },
    { label: "Daily Volume", value: "$2.5B" },
    { label: "Success Rate", value: "94%" },
    { label: "Countries", value: "150+" },
  ]

  const liveData = [
    { symbol: "BTC/USD", price: "$67,234.56", change: "+2.34%", positive: true },
    { symbol: "ETH/USD", price: "$3,456.78", change: "+1.87%", positive: true },
    { symbol: "AAPL", price: "$196.45", change: "+0.92%", positive: true },
  ]

  const handleRegisterSuccess = () => {
    setShowRegister(false)
    setShowLogin(true)
  }

  const handleLoginSuccess = () => {
    setShowLogin(false)
    onAuthSuccess() // ✅ Call parent handler (this will redirect to /dashboard)
  }

  if (showLogin) {
    return (
        <LoginForm
            onBack={() => setShowLogin(false)}
            onSwitchToRegister={() => {
              setShowLogin(false)
              setShowRegister(true)
            }}
            onSuccess={handleLoginSuccess}
        />
    )
  }

  if (showRegister) {
    return (
        <RegisterForm
            onBack={() => setShowRegister(false)}
            onSwitchToLogin={() => {
              setShowRegister(false)
              setShowLogin(true)
            }}
            onSuccess={handleRegisterSuccess}
        />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 container mx-auto px-4 py-8 lg:py-16">
          {/* Header */}
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-center mb-16"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              ARAGONTRADE
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowLogin(true)}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
              >
                Login
              </Button>
              <Button
                onClick={() => setShowRegister(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Get Started
              </Button>
            </div>
          </motion.header>

          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
            {/* Left Column - Hero Content */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  🚀 Next-Gen Trading Platform
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Trade Smarter,{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Not Harder
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Join thousands of traders using our advanced platform to maximize profits with AI-powered insights,
                  real-time analytics, and professional-grade tools.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => setShowRegister(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6"
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowLogin(true)}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 text-lg px-8 py-6"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl lg:text-3xl font-bold text-purple-400">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Column - Live Trading Stats */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <Card className="bg-gray-900/50 border-purple-500/30 backdrop-blur-xl p-6 h-fit">
                <CardContent className="space-y-6 p-0">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Live Trading Stats</h3>
                    <p className="text-gray-400 text-sm">Real-time market data</p>
                  </div>

                  <div className="space-y-4">
                    {liveData.map((item, index) => (
                      <motion.div
                        key={item.symbol}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                        className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/20"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-white">{item.symbol}</div>
                            <div className="text-2xl font-bold text-white">{item.price}</div>
                          </div>
                          <div className={`text-right ${item.positive ? "text-green-400" : "text-red-400"}`}>
                            <div className="text-lg font-semibold">{item.change}</div>
                            <div className="text-xs">24h</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-center pt-4">
                    <Button
                      onClick={() => setShowRegister(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Join Live Trading
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AragonTrade
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of trading with our cutting-edge platform designed for both beginners and
              professionals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="group"
              >
                <Card className="bg-gray-800/50 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to Start Your{" "}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Trading Journey?
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of successful traders and start building your financial future today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowRegister(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowLogin(true)}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 text-lg px-8 py-6"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
