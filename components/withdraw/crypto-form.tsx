"use client"

import { useState } from "react"
import { Bitcoin, EclipseIcon as Ethereum, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

const tokens = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    icon: <Bitcoin className="h-4 w-4" />,
    networks: [{ id: "bitcoin", name: "Bitcoin" }],
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    icon: <Ethereum className="h-4 w-4" />,
    networks: [{ id: "erc20", name: "ERC20" }],
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    icon: <DollarSign className="h-4 w-4" />,
    networks: [
      { id: "erc20", name: "ERC20" },
      { id: "trc20", name: "TRC20" },
    ],
  },
]

export function CryptoForm() {
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [address, setAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { toast } = useToast()

  const token = tokens.find((t) => t.id === selectedToken)

  const createWithdraw = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "WITHDRAW",
          status: "PENDING",
          amount: Number.parseFloat(amount),
          withdrawMethod: "Crypto",
          cryptoAddress: address,
          cryptoNetwork: selectedNetwork,
          depositFrom: selectedToken.toUpperCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create withdraw order")
      }

      toast({
        title: "Withdrawal Request Submitted",
        description: `Your withdrawal of ${amount} ${selectedToken.toUpperCase()} has been submitted for processing.`,
      })

      // Reset form
      setSelectedToken("")
      setSelectedNetwork("")
      setAmount("")
      setAddress("")
    } catch (error) {
      console.error("Error creating withdraw order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedToken || !selectedNetwork || !amount || !address) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }
    createWithdraw()
  }

  return (
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-custom-100">
            Amount
          </Label>
          <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-custom-900 border-custom-800 text-custom-100"
          />
          <p className="text-xs text-custom-400">Recommended: $ 0.00 • Min: $ 0.00 • Max: $ 0.00</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token" className="text-custom-100">
            Select Currency
          </Label>
          <Select onValueChange={setSelectedToken} value={selectedToken}>
            <SelectTrigger id="token" className="bg-custom-900 border-custom-800 text-custom-100">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent className="bg-custom-900 border-custom-800">
              <SelectGroup>
                {tokens.map((token) => (
                    <SelectItem key={token.id} value={token.id} className="text-custom-100">
                      <div className="flex items-center gap-2">
                        {token.icon}
                        <span>{token.name}</span>
                        <span className="text-custom-400">({token.symbol})</span>
                      </div>
                    </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {token && (
            <div className="space-y-2">
              <Label htmlFor="network" className="text-custom-100">
                Select Network
              </Label>
              <Select onValueChange={setSelectedNetwork} value={selectedNetwork}>
                <SelectTrigger id="network" className="bg-custom-900 border-custom-800 text-custom-100">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent className="bg-custom-900 border-custom-800">
                  <SelectGroup>
                    {token.networks.map((network) => (
                        <SelectItem key={network.id} value={network.id} className="text-custom-100">
                          {network.name}
                        </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
        )}

        {selectedNetwork && (
            <div className="space-y-2">
              <Label htmlFor="address" className="text-custom-100">
                Wallet Address
              </Label>
              <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter wallet address"
                  className="bg-custom-900 border-custom-800 text-custom-100"
              />
            </div>
        )}

        <div className="space-y-4">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? "Processing..." : "Withdraw"}
          </Button>
        </div>
      </form>
  )
}

