"use client"

import { useState } from "react"
import { Bitcoin, EclipseIcon as Ethereum, DollarSign, Copy, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getNetworkAddress } from "@/actions/form"
import { useToast } from "@/components/ui/use-toast"

interface Network {
  id: string
  name: string
}

interface Token {
  id: string
  name: string
  symbol: string
  icon: React.ReactNode
  networks: Network[]
}

const tokens: Token[] = [
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

export default function CryptoDeposit() {
  const { toast } = useToast()
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [address, setAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleNetworkSelect = async (networkId: string) => {
    setIsLoading(true)
    const network = selectedToken?.networks.find((n) => n.id === networkId)
    setSelectedNetwork(network || null)
    
    if (selectedToken && network) {
      try {
        const result = await getNetworkAddress(selectedToken.id, network.id)
        setAddress(result.address)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch network address"
        })
      }
    }
    setIsLoading(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setIsCopied(true)
      toast({
        title: "Address copied",
        description: "The address has been copied to your clipboard"
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy address"
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Deposit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select token to deposit</Label>
          <Select
            onValueChange={(value) => {
              const token = tokens.find((t) => t.id === value)
              setSelectedToken(token || null)
              setSelectedNetwork(null)
              setAddress("")
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {tokens.map((token) => (
                  <SelectItem key={token.id} value={token.id}>
                    <div className="flex items-center gap-2">
                      {token.icon}
                      <span>{token.name}</span>
                      <span className="text-muted-foreground">({token.symbol})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {selectedToken && (
          <div className="space-y-2">
            <Label>Select network</Label>
            <Select onValueChange={handleNetworkSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {selectedToken.networks.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedNetwork && address && (
          <div className="space-y-2">
            <Label>Deposit address</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={address}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-600 dark:text-blue-300">
          By depositing into this contract you accept the terms and conditions of the protocol, including a 2% deposit fee and a 2% early withdraw fee.
        </div>
      </CardContent>
    </Card>
  )
}

