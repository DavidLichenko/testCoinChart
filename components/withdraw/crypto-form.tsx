"use client"

import { useState } from "react"
import { Bitcoin, EclipseIcon as Ethereum, DollarSign } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

  const token = tokens.find(t => t.id === selectedToken)

  return (
    <div className="space-y-4 p-6">
      <div className="space-y-2">
        <Label className="text-custom-100">Amount</Label>
        <Input 
          type="number" 
          placeholder="0.00"
          className="bg-custom-900 border-custom-800 text-custom-100"
        />
        <p className="text-xs text-custom-400">
          Recommended: $ 0.00 • Min: $ 0.00 • Max: $ 0.00
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-custom-100">Select Currency</Label>
        <Select onValueChange={setSelectedToken}>
          <SelectTrigger className="bg-custom-900 border-custom-800 text-custom-100">
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent className="bg-custom-900 border-custom-800">
            <SelectGroup>
              {tokens.map((token) => (
                <SelectItem 
                  key={token.id} 
                  value={token.id}
                  className="text-custom-100"
                >
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
          <Label className="text-custom-100">Select Network</Label>
          <Select onValueChange={setSelectedNetwork}>
            <SelectTrigger className="bg-custom-900 border-custom-800 text-custom-100">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent className="bg-custom-900 border-custom-800">
              <SelectGroup>
                {token.networks.map((network) => (
                  <SelectItem 
                    key={network.id} 
                    value={network.id}
                    className="text-custom-100"
                  >
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
          <Label className="text-custom-100">Wallet Address</Label>
          <Input 
            placeholder="Enter wallet address"
            className="bg-custom-900 border-custom-800 text-custom-100"
          />
        </div>
      )}

      <div className="space-y-4">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          Withdraw
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-custom-100 mb-4">Withdrawal History</h3>
        <div className="rounded-lg bg-custom-900/50 p-4 text-custom-300 text-center">
          You don`&apos;`t have any withdrawal history
        </div>
      </div>
    </div>
  )
}

