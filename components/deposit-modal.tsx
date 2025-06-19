"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CRYPTO_TOKENS = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
  { symbol: "USDT", name: "Tether", icon: "₮" },
  { symbol: "USDC", name: "USD Coin", icon: "◎" },
  { symbol: "BNB", name: "Binance Coin", icon: "◆" },
  { symbol: "ADA", name: "Cardano", icon: "₳" },
  { symbol: "SOL", name: "Solana", icon: "◉" },
  { symbol: "XRP", name: "Ripple", icon: "✕" },
]

const NETWORKS = {
  BTC: [{ name: "Bitcoin", fee: "~$2-5", time: "10-60 min" }],
  ETH: [
    { name: "Ethereum", fee: "~$5-20", time: "2-5 min" },
    { name: "Polygon", fee: "~$0.01", time: "1-2 min" },
    { name: "Arbitrum", fee: "~$0.5", time: "1-2 min" },
  ],
  USDT: [
    { name: "Ethereum (ERC20)", fee: "~$5-20", time: "2-5 min" },
    { name: "Tron (TRC20)", fee: "~$1", time: "1-2 min" },
    { name: "BSC (BEP20)", fee: "~$0.5", time: "1-2 min" },
    { name: "Polygon", fee: "~$0.01", time: "1-2 min" },
  ],
  USDC: [
    { name: "Ethereum (ERC20)", fee: "~$5-20", time: "2-5 min" },
    { name: "Polygon", fee: "~$0.01", time: "1-2 min" },
    { name: "Solana", fee: "~$0.01", time: "1-2 min" },
  ],
  BNB: [{ name: "BSC (BEP20)", fee: "~$0.5", time: "1-2 min" }],
  ADA: [{ name: "Cardano", fee: "~$0.5", time: "2-5 min" }],
  SOL: [{ name: "Solana", fee: "~$0.01", time: "1-2 min" }],
  XRP: [{ name: "Ripple", fee: "~$0.01", time: "1-2 min" }],
}

const MOCK_ADDRESSES = {
  BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ETH: "0x742d35Cc6634C0532925a3b8D4C2C4e4C8b4C4C4",
  USDT: "0x742d35Cc6634C0532925a3b8D4C2C4e4C8b4C4C4",
  USDC: "0x742d35Cc6634C0532925a3b8D4C2C4e4C8b4C4C4",
  BNB: "bnb1xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ADA: "addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  SOL: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  XRP: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<"token" | "network" | "address">("token")
  const [loading, setLoading] = useState(false)

  const handleTokenSelect = (token: string) => {
    setSelectedToken(token)
    setSelectedNetwork("")
    setStep("network")
  }

  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network)
    setStep("address")
  }

  const handleCopyAddress = async () => {
    if (selectedToken && MOCK_ADDRESSES[selectedToken as keyof typeof MOCK_ADDRESSES]) {
      await navigator.clipboard.writeText(MOCK_ADDRESSES[selectedToken as keyof typeof MOCK_ADDRESSES])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConfirmDeposit = async () => {
    if (!amount || !selectedToken || !selectedNetwork) return

    setLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DEPOSIT",
          amount: Number.parseFloat(amount),
          depositFrom: "Crypto",
          cryptoAddress: MOCK_ADDRESSES[selectedToken as keyof typeof MOCK_ADDRESSES],
          cryptoNetwork: selectedNetwork,
        }),
      })

      if (response.ok) {
        // Close modal and refresh page
        handleClose()
        window.location.reload()
      }
    } catch (error) {
      console.error("Error creating deposit:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === "network") {
      setStep("token")
      setSelectedToken("")
    } else if (step === "address") {
      setStep("network")
      setSelectedNetwork("")
    }
  }

  const handleClose = () => {
    setStep("token")
    setSelectedToken("")
    setSelectedNetwork("")
    setAmount("")
    setCopied(false)
    onOpenChange(false)
  }

  const selectedTokenData = CRYPTO_TOKENS.find((t) => t.symbol === selectedToken)
  const availableNetworks = selectedToken ? NETWORKS[selectedToken as keyof typeof NETWORKS] || [] : []
  const selectedNetworkData = availableNetworks.find((n) => n.name === selectedNetwork)

  // Generate QR code URL for the address
  const generateQRCode = (address: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}&bgcolor=FFFFFF&color=000000`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Deposit Crypto</span>
            {step !== "token" && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="ml-auto">
                ← Back
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === "token" && "Select the cryptocurrency you want to deposit"}
            {step === "network" && "Choose the network for your deposit"}
            {step === "address" && "Send your crypto to this address"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Token Selection */}
          {step === "token" && (
            <div className="space-y-3">
              <Label>Select Token</Label>
              <Select onValueChange={handleTokenSelect}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select a token" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {CRYPTO_TOKENS.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">{token.icon}</span>
                        <span>
                          {token.name} ({token.symbol})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2: Network Selection */}
          {step === "network" && selectedTokenData && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{selectedTokenData.icon}</span>
                <div>
                  <div className="font-semibold">{selectedTokenData.symbol}</div>
                  <div className="text-sm text-gray-400">{selectedTokenData.name}</div>
                </div>
              </div>

              <Label>Select Network</Label>
              <Select onValueChange={handleNetworkSelect}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select a network" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {availableNetworks.map((network) => (
                    <SelectItem key={network.name} value={network.name}>
                      <div className="flex flex-col">
                        <span>{network.name}</span>
                        <span className="text-xs text-gray-400">
                          Fee: {network.fee} • Time: {network.time}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 3: Address Display */}
          {step === "address" && selectedTokenData && selectedNetworkData && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{selectedTokenData.icon}</span>
                <div>
                  <div className="font-semibold">{selectedTokenData.symbol}</div>
                  <Badge variant="secondary" className="text-xs">
                    {selectedNetwork}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount (USD)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to deposit"
                  className="bg-gray-700 border-gray-600"
                />
              </div>

              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4 space-y-4">
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center mb-4 p-2">
                      <img
                        src={
                          generateQRCode(MOCK_ADDRESSES[selectedToken as keyof typeof MOCK_ADDRESSES]) ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt="QR Code"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML =
                              '<div class="flex items-center justify-center w-full h-full text-gray-800"><QrCode class="w-24 h-24" /></div>'
                          }
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-400 mb-2">Deposit Address</p>
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                      <p className="font-mono text-sm break-all">
                        {MOCK_ADDRESSES[selectedToken as keyof typeof MOCK_ADDRESSES]}
                      </p>
                    </div>
                    <Button
                      onClick={handleCopyAddress}
                      className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                      disabled={copied}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Network:</span>
                        <span>{selectedNetwork}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fee:</span>
                        <span>{selectedNetworkData.fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time:</span>
                        <span>{selectedNetworkData.time}</span>
                      </div>
                      {amount && (
                        <div className="flex justify-between font-semibold">
                          <span className="text-gray-400">Amount:</span>
                          <span>${Number.parseFloat(amount).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleConfirmDeposit}
                    disabled={!amount || loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Processing..." : "Confirm Deposit"}
                  </Button>

                  <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-xs">
                      ⚠️ Only send {selectedTokenData.symbol} to this address on the {selectedNetwork} network. Sending
                      other tokens or using wrong network may result in permanent loss.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
