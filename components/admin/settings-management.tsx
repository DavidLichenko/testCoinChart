"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/toast"
import { 
  Settings, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Copy, 
  Check, 
  Coins, 
  Cpu, 
  Wallet,
  Star,
  TrendingUp,
  Loader2,
  Gift,
  ArrowUpCircle
} from "lucide-react"
import { hasOwnerAccess } from "@/lib/admin-access"
import { useAuth } from "@/components/auth-provider"
import { useTickers } from "@/hooks/market-data"
import { TickerAvatar } from "@/components/ticker-avatar"

interface DepositAddress {
  id: string
  network: string
  address: string
  qrCodeUrl?: string
}

interface StakingPlan {
  id: string
  name: string
  assetSymbol: string
  duration: number
  apr: number
  minAmount: number
  isActive: boolean
}

interface AITradingTicker {
  id: string
  symbol: string
  isActive: boolean
  priority: number
}

interface Asset {
  symbol: string
  name: string
  type: string
}

interface ReferralReward {
  id: string
  action: string
  actionLabel: string
  rewardAmount: number
  rewardCurrency: string
  threshold: number | null
  isActive: boolean
  description: string | null
}

interface WithdrawalLimit {
  id: string
  method: string
  minAmount: number
  maxAmount: number | null
  dailyLimit: number | null
  monthlyLimit: number | null
  fee: number
  feePercent: number | null
  processingTime: string | null
  isActive: boolean
}

const cryptoOptions: Record<string, string[]> = {
  BTC: ["Bitcoin"],
  ETH: ["ERC20"],
  USDT: ["ERC20", "TRC20", "BEP20"],
  USDC: ["ERC20", "TRC20", "BEP20"],
  BNB: ["BEP20"],
  XRP: ["XRP"],
  ADA: ["Cardano"],
  SOL: ["Solana"],
  DOGE: ["Dogecoin"],
}

export default function SettingsManagement() {
  const { user } = useAuth()
  const { tickers } = useTickers()
  const [accessDenied, setAccessDenied] = useState(false)
  const [activeTab, setActiveTab] = useState<"staking" | "ai-trading" | "crypto-addresses" | "referral-rewards" | "withdrawal-limits">("staking")
  
  // Staking Plans
  const [stakingPlans, setStakingPlans] = useState<StakingPlan[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loadingStaking, setLoadingStaking] = useState(true)
  const [stakingDialogOpen, setStakingDialogOpen] = useState(false)
  const [editingStakingPlan, setEditingStakingPlan] = useState<StakingPlan | null>(null)
  const [stakingForm, setStakingForm] = useState({
    name: "",
    assetSymbol: "",
    duration: "30",
    apr: "",
    minAmount: "",
    isActive: true,
  })

  // AI-Trading
  const [aiTickers, setAiTickers] = useState<AITradingTicker[]>([])
  const [loadingAI, setLoadingAI] = useState(true)
  const [aiSearchTerm, setAiSearchTerm] = useState("")
  const [favoriteTickers, setFavoriteTickers] = useState<Set<string>>(new Set())

  // Crypto Addresses
  const [addresses, setAddresses] = useState<DepositAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<DepositAddress | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({
    selectedToken: "",
    selectedNetwork: "",
    address: "",
  })

  // Referral Rewards
  const [referralRewards, setReferralRewards] = useState<ReferralReward[]>([])
  const [loadingRewards, setLoadingRewards] = useState(true)
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<ReferralReward | null>(null)
  const [rewardForm, setRewardForm] = useState({
    action: "",
    actionLabel: "",
    rewardAmount: "",
    rewardCurrency: "USD",
    threshold: "",
    isActive: true,
    description: "",
  })

  // Withdrawal Limits
  const [withdrawalLimits, setWithdrawalLimits] = useState<WithdrawalLimit[]>([])
  const [loadingLimits, setLoadingLimits] = useState(true)
  const [limitDialogOpen, setLimitDialogOpen] = useState(false)
  const [editingLimit, setEditingLimit] = useState<WithdrawalLimit | null>(null)
  const [limitForm, setLimitForm] = useState({
    method: "",
    minAmount: "",
    maxAmount: "",
    dailyLimit: "",
    monthlyLimit: "",
    fee: "",
    feePercent: "",
    processingTime: "",
    isActive: true,
  })

  useEffect(() => {
    if (!hasOwnerAccess(user)) {
      setAccessDenied(true)
    }
  }, [user])
  
  useEffect(() => {
    if (accessDenied) return
    fetchStakingPlans()
    fetchAssets()
    fetchAITickers()
    fetchAddresses()
    fetchFavoriteTickers()
    fetchReferralRewards()
    fetchWithdrawalLimits()
  }, [accessDenied])

  const fetchWithdrawalLimits = async () => {
    setLoadingLimits(true)
    try {
      const res = await fetch("/api/admin/withdrawal-limits")
      if (res.ok) {
        const data = await res.json()
        setWithdrawalLimits(data)
      }
    } catch (e) {
      console.error("Error fetching withdrawal limits:", e)
    } finally {
      setLoadingLimits(false)
    }
  }

  const fetchReferralRewards = async () => {
    setLoadingRewards(true)
    try {
      const res = await fetch("/api/admin/referral-rewards")
      if (res.ok) {
        const data = await res.json()
        setReferralRewards(data)
      }
    } catch (e) {
      console.error("Error fetching referral rewards:", e)
    } finally {
      setLoadingRewards(false)
    }
  }

  const fetchFavoriteTickers = async () => {
    try {
      const res = await fetch("/api/trades/favorite-tickers")
      if (res.ok) {
        const data = await res.json()
        setFavoriteTickers(new Set(data.map((t: any) => t.symbol)))
      }
    } catch (e) {
      console.error("Error fetching favorite tickers:", e)
    }
  }

  const fetchStakingPlans = async () => {
    setLoadingStaking(true)
    try {
      const res = await fetch("/api/admin/staking-plans")
      if (res.ok) {
        const data = await res.json()
        setStakingPlans(data)
      }
    } catch (e) {
      console.error("Error fetching staking plans:", e)
    } finally {
      setLoadingStaking(false)
    }
  }

  const fetchAssets = async () => {
    try {
      // Fetch assets from wallet (user's available assets)
      const walletRes = await fetch("/api/wallet/assets")
      if (walletRes.ok) {
        const walletData = await walletRes.json()
        // Get unique asset symbols from wallet
        const walletSymbols = new Set(walletData.map((a: any) => a.symbol))
        
        // Fetch all assets from admin API
        const adminRes = await fetch("/api/admin/assets")
        if (adminRes.ok) {
          const adminData = await adminRes.json()
          // Filter to only assets that exist in wallet
          setAssets(adminData.filter((a: Asset) => 
            a.type === "CRYPTO" && walletSymbols.has(a.symbol)
          ))
        }
      }
    } catch (e) {
      console.error("Error fetching assets:", e)
    }
  }

  const fetchAITickers = async () => {
    setLoadingAI(true)
    try {
      const res = await fetch("/api/admin/ai-trading-tickers")
      if (res.ok) {
        const data = await res.json()
        setAiTickers(data)
      }
    } catch (e) {
      console.error("Error fetching AI tickers:", e)
    } finally {
      setLoadingAI(false)
    }
  }

  const fetchAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const res = await fetch("/api/admin/deposit-addresses")
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
      }
    } catch (e) {
      console.error("Error fetching addresses:", e)
    } finally {
      setLoadingAddresses(false)
    }
  }
  
  const handleSaveStakingPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingStakingPlan
        ? `/api/admin/staking-plans/${editingStakingPlan.id}`
        : "/api/admin/staking-plans"
      const method = editingStakingPlan ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stakingForm.name,
          assetSymbol: stakingForm.assetSymbol,
          duration: Number(stakingForm.duration),
          apr: Number(stakingForm.apr),
          minAmount: Number(stakingForm.minAmount),
          isActive: stakingForm.isActive,
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: `Staking plan ${editingStakingPlan ? "updated" : "created"} successfully`,
        })
        fetchStakingPlans()
        setStakingDialogOpen(false)
        setEditingStakingPlan(null)
        setStakingForm({
          name: "",
          assetSymbol: "",
          duration: "30",
          apr: "",
          minAmount: "",
          isActive: true,
        })
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save staking plan",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStakingPlan = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this staking plan?")) return
    try {
      const res = await fetch(`/api/admin/staking-plans/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ title: "Success", description: "Staking plan deleted successfully" })
        fetchStakingPlans()
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete staking plan",
        variant: "destructive",
      })
    }
  }

  const handleToggleAITicker = async (symbol: string) => {
    const existing = aiTickers.find((t) => t.symbol === symbol)
    try {
      if (existing) {
        const res = await fetch(`/api/admin/ai-trading-tickers/${existing.id}`, {
          method: "DELETE",
        })
        if (res.ok) {
          setAiTickers((prev) => prev.filter((t) => t.id !== existing.id))
        }
      } else {
        const res = await fetch("/api/admin/ai-trading-tickers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, isActive: true, priority: 0 }),
        })
        if (res.ok) {
          const newTicker = await res.json()
          setAiTickers((prev) => [...prev, newTicker])
        }
      }
    } catch (e) {
      console.error("Error toggling AI ticker:", e)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    const network = `${addressForm.selectedToken} (${addressForm.selectedNetwork})`
    const url = editingAddress 
      ? `/api/admin/deposit-addresses/${editingAddress.id}` 
      : "/api/admin/deposit-addresses"
    const method = editingAddress ? "PATCH" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, address: addressForm.address }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: `Address ${editingAddress ? "updated" : "added"} successfully`,
        })
        fetchAddresses()
        setAddressDialogOpen(false)
        setEditingAddress(null)
        setAddressForm({ selectedToken: "", selectedNetwork: "", address: "" })
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return
    try {
      const res = await fetch(`/api/admin/deposit-addresses/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ title: "Success", description: "Address deleted successfully" })
        fetchAddresses()
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      })
    }
  }

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const filteredAITickers = tickers.filter((ticker) => {
    if (aiSearchTerm) {
      const term = aiSearchTerm.toLowerCase()
      return (
        ticker.symbol.toLowerCase().includes(term) ||
        ticker.showName.toLowerCase().includes(term)
      )
    }
    return true
  })

  // Sort AI tickers: favorites first, then by priority, then alphabetically
  const sortedAITickers = [...filteredAITickers].sort((a, b) => {
    const aIsAI = aiTickers.some((t) => t.symbol === a.symbol)
    const bIsAI = aiTickers.some((t) => t.symbol === b.symbol)
    const aIsFavorite = favoriteTickers.has(a.symbol)
    const bIsFavorite = favoriteTickers.has(b.symbol)

    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    if (aIsAI && !bIsAI) return -1
    if (!aIsAI && bIsAI) return 1

    const aPriority = aiTickers.find((t) => t.symbol === a.symbol)?.priority || 0
    const bPriority = aiTickers.find((t) => t.symbol === b.symbol)?.priority || 0
    if (aPriority !== bPriority) return bPriority - aPriority

    return a.showName.localeCompare(b.showName)
  })

  if (accessDenied) {
  return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100">
        Access denied. Only owners can access settings.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-400" />
            Platform Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage staking plans, AI-trading tickers, and crypto addresses
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 bg-slate-900/50 rounded-t-lg p-1">
        <button
          onClick={() => setActiveTab("staking")}
          className={`px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${
            activeTab === "staking"
              ? "bg-slate-800 text-slate-100 shadow-sm"
              : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          <Coins className="inline h-4 w-4 mr-2" />
          Staking Plans
        </button>
        <button
          onClick={() => setActiveTab("ai-trading")}
          className={`px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${
            activeTab === "ai-trading"
              ? "bg-slate-800 text-slate-100 shadow-sm"
              : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          <Cpu className="inline h-4 w-4 mr-2" />
          AI-Trading
        </button>
        <button
          onClick={() => setActiveTab("crypto-addresses")}
          className={`px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${
            activeTab === "crypto-addresses"
              ? "bg-slate-800 text-slate-100 shadow-sm"
              : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          <Wallet className="inline h-4 w-4 mr-2" />
          Crypto Addresses
        </button>
        <button
          onClick={() => setActiveTab("referral-rewards")}
          className={`px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${
            activeTab === "referral-rewards"
              ? "bg-slate-800 text-slate-100 shadow-sm"
              : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          <Gift className="inline h-4 w-4 mr-2" />
          Referral Rewards
        </button>
        <button
          onClick={() => setActiveTab("withdrawal-limits")}
          className={`px-4 py-2.5 text-sm font-medium transition-all rounded-lg ${
            activeTab === "withdrawal-limits"
              ? "bg-slate-800 text-slate-100 shadow-sm"
              : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
          }`}
        >
          <ArrowUpCircle className="inline h-4 w-4 mr-2" />
          Withdrawal Limits
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Staking Plans Tab */}
          {activeTab === "staking" && (
            <Card className="border-slate-800 bg-slate-950/80 rounded-lg">
              <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Coins className="h-4 w-4 text-slate-300" />
                  Staking Plans
                </CardTitle>
                <Dialog
                  open={stakingDialogOpen}
                  onOpenChange={(open) => {
                    setStakingDialogOpen(open)
                    if (!open) {
                      setEditingStakingPlan(null)
                      setStakingForm({
                        name: "",
                        assetSymbol: "",
                        duration: "30",
                        apr: "",
                        minAmount: "",
                        isActive: true,
                      })
                    }
                  }}
                >
          <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingStakingPlan(null)
                        setStakingForm({
                          name: "",
                          assetSymbol: "",
                          duration: "30",
                          apr: "",
                          minAmount: "",
                          isActive: true,
                        })
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Staking Plan
            </Button>
          </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-slate-800">
            <DialogHeader>
                      <DialogTitle>
                        {editingStakingPlan ? "Edit" : "Create"} Staking Plan
                      </DialogTitle>
            </DialogHeader>
                    <form onSubmit={handleSaveStakingPlan} className="space-y-4">
                      <div>
                        <Label>Plan Name</Label>
                        <Input
                          value={stakingForm.name}
                          onChange={(e) =>
                            setStakingForm({ ...stakingForm, name: e.target.value })
                          }
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Asset</Label>
                        <Select
                          value={stakingForm.assetSymbol}
                          onValueChange={(v) =>
                            setStakingForm({ ...stakingForm, assetSymbol: v })
                          }
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">
                              All Assets (Default Plan)
                            </SelectItem>
                            {assets.map((asset) => (
                              <SelectItem key={asset.symbol} value={asset.symbol}>
                                {asset.symbol} - {asset.name}
                              </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                        {stakingForm.assetSymbol === "ALL" && (
                          <p className="text-xs text-slate-400 mt-1">
                            This will create a default staking plan for all assets in the wallet
                          </p>
                        )}
                </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Duration (days)</Label>
                          <Input
                            type="number"
                            value={stakingForm.duration}
                            onChange={(e) =>
                              setStakingForm({ ...stakingForm, duration: e.target.value })
                            }
                            required
                            min="1"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>APR (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={stakingForm.apr}
                            onChange={(e) =>
                              setStakingForm({ ...stakingForm, apr: e.target.value })
                            }
                            required
                            min="0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Minimum Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={stakingForm.minAmount}
                          onChange={(e) =>
                            setStakingForm({ ...stakingForm, minAmount: e.target.value })
                          }
                          required
                          min="0"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Active</Label>
                        <Switch
                          checked={stakingForm.isActive}
                          onCheckedChange={(v) =>
                            setStakingForm({ ...stakingForm, isActive: v })
                          }
                        />
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit">Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingStaking ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : stakingPlans.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No staking plans configured. Create your first plan above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stakingPlans.map((plan) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-white">{plan.name}</h3>
                            <Badge
                              variant={plan.isActive ? "default" : "secondary"}
                              className={
                                plan.isActive
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-slate-700 text-slate-400"
                              }
                            >
                              {plan.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-slate-400">
                            <div>
                              <span className="text-slate-500">Asset:</span> {plan.assetSymbol}
                            </div>
                            <div>
                              <span className="text-slate-500">Duration:</span> {plan.duration} days
                            </div>
                            <div>
                              <span className="text-slate-500">APR:</span> {plan.apr}%
                            </div>
                            <div>
                              <span className="text-slate-500">Min Amount:</span> {plan.minAmount}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingStakingPlan(plan)
                              setStakingForm({
                                name: plan.name,
                                assetSymbol: plan.assetSymbol,
                                duration: plan.duration.toString(),
                                apr: plan.apr.toString(),
                                minAmount: plan.minAmount.toString(),
                                isActive: plan.isActive,
                              })
                              setStakingDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStakingPlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI-Trading Tab */}
          {activeTab === "ai-trading" && (
            <Card className="border-slate-800 bg-slate-950/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-slate-300" />
                  AI-Trading Tickers
                </CardTitle>
                <p className="mt-2 text-sm text-slate-400">
                  Select tickers that will be used by AI-trading system. Favorites are shown first.
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search tickers..."
                    value={aiSearchTerm}
                    onChange={(e) => setAiSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                {loadingAI ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {sortedAITickers.map((ticker) => {
                      const isAI = aiTickers.some((t) => t.symbol === ticker.symbol)
                      const isFavorite = favoriteTickers.has(ticker.symbol)
                      return (
                        <motion.div
                          key={ticker.symbol}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center justify-between rounded-lg border p-3 ${
                            isAI
                              ? "border-slate-500/50 bg-slate-950/30"
                              : "border-slate-800 bg-slate-900/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isFavorite && (
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 shrink-0" />
                            )}
                            <TickerAvatar
                              symbol={ticker.symbol}
                              category={ticker.category}
                              baseCurrency={ticker.baseCurrency}
                              quoteCurrency={ticker.quoteCurrency}
                              size={32}
                              icon={ticker.icon}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-white truncate">
                                {ticker.showName}
                              </div>
                              <div className="text-xs text-slate-400 truncate">
                                {ticker.symbol}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={isAI}
                            onCheckedChange={() => handleToggleAITicker(ticker.symbol)}
                            className="data-[state=checked]:bg-slate-600"
                          />
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Crypto Addresses Tab */}
          {activeTab === "crypto-addresses" && (
            <Card className="border-slate-800 bg-slate-950/80">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-slate-300" />
                  Crypto Addresses
                </CardTitle>
                <Dialog
                  open={addressDialogOpen}
                  onOpenChange={(open) => {
                    setAddressDialogOpen(open)
                    if (!open) {
                      setEditingAddress(null)
                      setAddressForm({ selectedToken: "", selectedNetwork: "", address: "" })
                    }
                  }}
                >
          <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingAddress(null)
                        setAddressForm({ selectedToken: "", selectedNetwork: "", address: "" })
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Address
            </Button>
          </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-slate-800">
            <DialogHeader>
                      <DialogTitle>
                        {editingAddress ? "Edit" : "Add"} Crypto Address
                      </DialogTitle>
            </DialogHeader>
                    <form onSubmit={handleSaveAddress} className="space-y-4">
                      <div>
                        <Label>Token</Label>
                        <Select
                          value={addressForm.selectedToken}
                          onValueChange={(v) =>
                            setAddressForm({
                              ...addressForm,
                              selectedToken: v,
                              selectedNetwork: "",
                            })
                          }
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                          <SelectContent>
                            {Object.keys(cryptoOptions).map((token) => (
                              <SelectItem key={token} value={token}>
                                {token}
                              </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                      {addressForm.selectedToken && (
                        <div>
                          <Label>Network</Label>
                          <Select
                            value={addressForm.selectedNetwork}
                            onValueChange={(v) =>
                              setAddressForm({ ...addressForm, selectedNetwork: v })
                            }
                            required
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                            <SelectContent>
                              {cryptoOptions[addressForm.selectedToken].map((network) => (
                                <SelectItem key={network} value={network}>
                                  {network}
                                </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                      <div>
                        <Label>Address</Label>
                        <Input
                          value={addressForm.address}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, address: e.target.value })
                          }
                          required
                          className="mt-1 font-mono"
                        />
                </div>
                      <DialogFooter>
                <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                </DialogClose>
                        <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </CardHeader>
              <CardContent>
                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
          ) : addresses.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No crypto addresses configured. Add your first address above.
                  </div>
          ) : (
                  <div className="space-y-3">
              {addresses.map((addr) => (
                      <motion.div
                        key={addr.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                      >
                  <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white mb-1">{addr.network}</div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-slate-400 font-mono break-all">
                              {addr.address}
                            </code>
                      <Button
                        variant="ghost"
                        size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleCopyAddress(addr.address)}
                      >
                        {copiedAddress === addr.address ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                                <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                        <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                              const [token, network] = addr.network.split(" ")
                              setEditingAddress(addr)
                              setAddressForm({
                                selectedToken: token || "",
                                selectedNetwork: network?.replace(/[()]/g, "") || "",
                                address: addr.address,
                              })
                              setAddressDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAddress(addr.id)}
                    >
                            <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                      </motion.div>
                    ))}
                </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Referral Rewards Tab */}
          {activeTab === "referral-rewards" && (
            <Card className="border-slate-800 bg-slate-950/80">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-slate-300" />
                  Referral Rewards
                </CardTitle>
                <Dialog
                  open={rewardDialogOpen}
                  onOpenChange={(open) => {
                    setRewardDialogOpen(open)
                    if (!open) {
                      setEditingReward(null)
                      setRewardForm({
                        action: "",
                        actionLabel: "",
                        rewardAmount: "",
                        rewardCurrency: "USD",
                        threshold: "",
                        isActive: true,
                        description: "",
                      })
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingReward(null)
                        setRewardForm({
                          action: "",
                          actionLabel: "",
                          rewardAmount: "",
                          rewardCurrency: "USD",
                          threshold: "",
                          isActive: true,
                          description: "",
                        })
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Reward
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-slate-800">
                    <DialogHeader>
                      <DialogTitle>
                        {editingReward ? "Edit" : "Create"} Referral Reward
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        try {
                          const url = editingReward
                            ? `/api/admin/referral-rewards/${editingReward.id}`
                            : "/api/admin/referral-rewards"
                          const method = editingReward ? "PATCH" : "POST"

                          const res = await fetch(url, {
                            method,
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: rewardForm.action,
                              actionLabel: rewardForm.actionLabel,
                              rewardAmount: Number(rewardForm.rewardAmount),
                              rewardCurrency: rewardForm.rewardCurrency,
                              threshold: rewardForm.threshold ? Number(rewardForm.threshold) : null,
                              isActive: rewardForm.isActive,
                              description: rewardForm.description || null,
                            }),
                          })

                          if (res.ok) {
                            toast({
                              title: "Success",
                              description: `Reward ${editingReward ? "updated" : "created"} successfully`,
                            })
                            fetchReferralRewards()
                            setRewardDialogOpen(false)
                          }
                        } catch (e) {
                          toast({
                            title: "Error",
                            description: "Failed to save reward",
                            variant: "destructive",
                          })
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label>Action Type</Label>
                        <Select
                          value={rewardForm.action}
                          onValueChange={(v) =>
                            setRewardForm({ ...rewardForm, action: v })
                          }
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SIGNUP">User Signs Up</SelectItem>
                            <SelectItem value="FIRST_DEPOSIT">First Deposit</SelectItem>
                            <SelectItem value="DEPOSIT_THRESHOLD">Deposit Threshold</SelectItem>
                            <SelectItem value="FIRST_TRADE">First Trade</SelectItem>
                            <SelectItem value="TRADE_VOLUME">Trade Volume</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Action Label</Label>
                        <Input
                          value={rewardForm.actionLabel}
                          onChange={(e) =>
                            setRewardForm({ ...rewardForm, actionLabel: e.target.value })
                          }
                          required
                          placeholder="e.g., User signs up"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Reward Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={rewardForm.rewardAmount}
                            onChange={(e) =>
                              setRewardForm({ ...rewardForm, rewardAmount: e.target.value })
                            }
                            required
                            min="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Currency</Label>
                          <Select
                            value={rewardForm.rewardCurrency}
                            onValueChange={(v) =>
                              setRewardForm({ ...rewardForm, rewardCurrency: v })
                            }
                            required
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {(rewardForm.action === "DEPOSIT_THRESHOLD" ||
                        rewardForm.action === "TRADE_VOLUME") && (
                        <div>
                          <Label>Threshold</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={rewardForm.threshold}
                            onChange={(e) =>
                              setRewardForm({ ...rewardForm, threshold: e.target.value })
                            }
                            required
                            min="0"
                            placeholder="e.g., 500"
                            className="mt-1"
                          />
                        </div>
                      )}
                      <div>
                        <Label>Description (optional)</Label>
                        <Input
                          value={rewardForm.description}
                          onChange={(e) =>
                            setRewardForm({ ...rewardForm, description: e.target.value })
                          }
                          placeholder="Additional details about this reward"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Active</Label>
                        <Switch
                          checked={rewardForm.isActive}
                          onCheckedChange={(v) =>
                            setRewardForm({ ...rewardForm, isActive: v })
                          }
                        />
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit">Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingRewards ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : referralRewards.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No referral rewards configured. Create your first reward above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referralRewards.map((reward) => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-white">{reward.actionLabel}</h3>
                            <Badge
                              variant={reward.isActive ? "default" : "secondary"}
                              className={
                                reward.isActive
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-slate-700 text-slate-400"
                              }
                            >
                              {reward.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-slate-400">
                            <div>
                              <span className="text-slate-500">Reward:</span>{" "}
                              {reward.rewardCurrency === "EUR" ? "€" : "$"}
                              {reward.rewardAmount.toFixed(2)}
                            </div>
                            {reward.threshold && (
                              <div>
                                <span className="text-slate-500">Threshold:</span>{" "}
                                {reward.rewardCurrency === "EUR" ? "€" : "$"}
                                {reward.threshold.toFixed(2)}
                              </div>
                            )}
                            {reward.description && (
                              <div className="col-span-2">
                                <span className="text-slate-500">Description:</span>{" "}
                                {reward.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingReward(reward)
                              setRewardForm({
                                action: reward.action,
                                actionLabel: reward.actionLabel,
                                rewardAmount: reward.rewardAmount.toString(),
                                rewardCurrency: reward.rewardCurrency,
                                threshold: reward.threshold?.toString() || "",
                                isActive: reward.isActive,
                                description: reward.description || "",
                              })
                              setRewardDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to delete this reward?"))
                                return
                              try {
                                const res = await fetch(
                                  `/api/admin/referral-rewards/${reward.id}`,
                                  { method: "DELETE" }
                                )
                                if (res.ok) {
                                  toast({
                                    title: "Success",
                                    description: "Reward deleted successfully",
                                  })
                                  fetchReferralRewards()
                                }
                              } catch (e) {
                                toast({
                                  title: "Error",
                                  description: "Failed to delete reward",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                </div>
                      </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
          )}

          {/* Withdrawal Limits Tab */}
          {activeTab === "withdrawal-limits" && (
            <Card className="border-slate-800 bg-slate-950/80">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-slate-300" />
                  Withdrawal Limits
                </CardTitle>
                <Dialog
                  open={limitDialogOpen}
                  onOpenChange={(open) => {
                    setLimitDialogOpen(open)
                    if (!open) {
                      setEditingLimit(null)
                      setLimitForm({
                        method: "",
                        minAmount: "",
                        maxAmount: "",
                        dailyLimit: "",
                        monthlyLimit: "",
                        fee: "",
                        feePercent: "",
                        processingTime: "",
                        isActive: true,
                      })
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingLimit(null)
                        setLimitForm({
                          method: "",
                          minAmount: "",
                          maxAmount: "",
                          dailyLimit: "",
                          monthlyLimit: "",
                          fee: "",
                          feePercent: "",
                          processingTime: "",
                          isActive: true,
                        })
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Limit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-950 border-slate-800 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingLimit ? "Edit" : "Create"} Withdrawal Limit
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        try {
                          const url = editingLimit
                            ? `/api/admin/withdrawal-limits/${editingLimit.id}`
                            : "/api/admin/withdrawal-limits"
                          const method = editingLimit ? "PATCH" : "POST"

                          const res = await fetch(url, {
                            method,
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              method: limitForm.method,
                              minAmount: Number(limitForm.minAmount),
                              maxAmount: limitForm.maxAmount ? Number(limitForm.maxAmount) : null,
                              dailyLimit: limitForm.dailyLimit ? Number(limitForm.dailyLimit) : null,
                              monthlyLimit: limitForm.monthlyLimit ? Number(limitForm.monthlyLimit) : null,
                              fee: Number(limitForm.fee),
                              feePercent: limitForm.feePercent ? Number(limitForm.feePercent) : null,
                              processingTime: limitForm.processingTime || null,
                              isActive: limitForm.isActive,
                            }),
                          })

                          if (res.ok) {
                            toast({
                              title: "Success",
                              description: `Limit ${editingLimit ? "updated" : "created"} successfully`,
                            })
                            fetchWithdrawalLimits()
                            setLimitDialogOpen(false)
                          }
                        } catch (e) {
                          toast({
                            title: "Error",
                            description: "Failed to save limit",
                            variant: "destructive",
                          })
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label>Method</Label>
                        <Select
                          value={limitForm.method}
                          onValueChange={(v) =>
                            setLimitForm({ ...limitForm, method: v })
                          }
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CARD">Card</SelectItem>
                            <SelectItem value="CRYPTO">Crypto</SelectItem>
                          </SelectContent>
                        </Select>
    </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={limitForm.minAmount}
                            onChange={(e) =>
                              setLimitForm({ ...limitForm, minAmount: e.target.value })
                            }
                            required
                            min="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Max Amount (optional)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={limitForm.maxAmount}
                            onChange={(e) =>
                              setLimitForm({ ...limitForm, maxAmount: e.target.value })
                            }
                            min="0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Daily Limit (optional)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={limitForm.dailyLimit}
                            onChange={(e) =>
                              setLimitForm({ ...limitForm, dailyLimit: e.target.value })
                            }
                            min="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Monthly Limit (optional)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={limitForm.monthlyLimit}
                            onChange={(e) =>
                              setLimitForm({ ...limitForm, monthlyLimit: e.target.value })
                            }
                            min="0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Fixed Fee</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={limitForm.fee}
                            onChange={(e) =>
                              setLimitForm({ ...limitForm, fee: e.target.value })
                            }
                            required
                            min="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Fee Percent (optional)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={limitForm.feePercent}
                            onChange={(e) =>
                              setLimitForm({ ...limitForm, feePercent: e.target.value })
                            }
                            min="0"
                            max="100"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Processing Time (optional)</Label>
                        <Input
                          value={limitForm.processingTime}
                          onChange={(e) =>
                            setLimitForm({ ...limitForm, processingTime: e.target.value })
                          }
                          placeholder="e.g., 1-3 business days"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Active</Label>
                        <Switch
                          checked={limitForm.isActive}
                          onCheckedChange={(v) =>
                            setLimitForm({ ...limitForm, isActive: v })
                          }
                        />
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button type="submit">Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingLimits ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : withdrawalLimits.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No withdrawal limits configured. Create your first limit above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawalLimits.map((limit) => (
                      <motion.div
                        key={limit.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-white">{limit.method}</h3>
                            <Badge
                              variant={limit.isActive ? "default" : "secondary"}
                              className={
                                limit.isActive
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-slate-700 text-slate-400"
                              }
                            >
                              {limit.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-slate-400">
                            <div>
                              <span className="text-slate-500">Min:</span> {limit.minAmount}
                              {limit.maxAmount && (
                                <span> • Max: {limit.maxAmount}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-500">Fee:</span> {limit.fee}
                              {limit.feePercent && ` + ${limit.feePercent}%`}
                            </div>
                            {limit.dailyLimit && (
                              <div>
                                <span className="text-slate-500">Daily:</span> {limit.dailyLimit}
                              </div>
                            )}
                            {limit.monthlyLimit && (
                              <div>
                                <span className="text-slate-500">Monthly:</span> {limit.monthlyLimit}
                              </div>
                            )}
                            {limit.processingTime && (
                              <div className="col-span-2">
                                <span className="text-slate-500">Processing:</span> {limit.processingTime}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingLimit(limit)
                              setLimitForm({
                                method: limit.method,
                                minAmount: limit.minAmount.toString(),
                                maxAmount: limit.maxAmount?.toString() || "",
                                dailyLimit: limit.dailyLimit?.toString() || "",
                                monthlyLimit: limit.monthlyLimit?.toString() || "",
                                fee: limit.fee.toString(),
                                feePercent: limit.feePercent?.toString() || "",
                                processingTime: limit.processingTime || "",
                                isActive: limit.isActive,
                              })
                              setLimitDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to delete this limit?"))
                                return
                              try {
                                const res = await fetch(
                                  `/api/admin/withdrawal-limits/${limit.id}`,
                                  { method: "DELETE" }
                                )
                                if (res.ok) {
                                  toast({
                                    title: "Success",
                                    description: "Limit deleted successfully",
                                  })
                                  fetchWithdrawalLimits()
                                }
                              } catch (e) {
                                toast({
                                  title: "Error",
                                  description: "Failed to delete limit",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
