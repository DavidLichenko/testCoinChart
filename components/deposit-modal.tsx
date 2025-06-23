"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle as CardTitleUI } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Copy, Check, Wallet, ArrowLeft, Loader2 } from "lucide-react"
import { useBalance } from "@/hooks/useBalance";
import QRCode from "react-qr-code";

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DepositAddress {
  id: string
  network: string
  address: string
}

// Group addresses by a common "token" symbol.
// Allows for multiple networks under one token, e.g., USDT (ERC20), USDT (TRC20)
const groupAddressesByToken = (addresses: DepositAddress[]) => {
  const grouped: { [key: string]: DepositAddress[] } = {}
  addresses.forEach(addr => {
    const symbol = addr.network.split(' ')[0]; // 'Bitcoin' -> 'Bitcoin', 'USDT (ERC20)' -> 'USDT'
    if (!grouped[symbol]) {
      grouped[symbol] = []
    }
    grouped[symbol].push(addr)
  })
  return grouped
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [addresses, setAddresses] = useState<DepositAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [step, setStep] = useState<'token' | 'network' | 'address'>('token')
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [selectedAddress, setSelectedAddress] = useState<DepositAddress | null>(null)
  const { toast } = useToast()
  
  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setStep('token')
      setSelectedToken('')
      setSelectedAddress(null)
      fetchAddresses()
    }
  }, [open])

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/deposit-addresses")
      if (response.ok) {
        setAddresses(await response.json())
      } else {
        toast({ title: "Error", description: "Could not load deposit addresses.", variant: "destructive"})
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"})
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast({ title: "Copied!", description: `Address copied to clipboard.`})
    setTimeout(() => setCopiedAddress(null), 2000)
  }
  
  const generateQrCodeUrl = (address: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(address)}`;
  }

  const groupedAddresses = groupAddressesByToken(addresses);
  const selectedNetworks = selectedToken ? groupedAddresses[selectedToken] : [];

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin" /></div>
    }

    if (step === 'token') {
      return (
        <div>
          <Label className={'my-1'}>Select Token</Label>
          <Select onValueChange={(value) => { setSelectedToken(value); setStep('network'); }}>
            <SelectTrigger><SelectValue placeholder="Choose a token..." /></SelectTrigger>
            <SelectContent>
              {Object.keys(groupedAddresses).map(token => (
                <SelectItem key={token} value={token}>{token}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (step === 'network') {
      return (
        <div>
          <Label className={'my-1'}>Select Network</Label>
          <Select defaultValue={()=> selectedNetworks[0].network } onValueChange={(value) => { setSelectedAddress(JSON.parse(value)); setStep('address'); }}>
            <SelectTrigger><SelectValue placeholder="Choose a network..." /></SelectTrigger>
            <SelectContent>
              {selectedNetworks.map(addr => (
                <SelectItem key={addr.id} value={JSON.stringify(addr)}>{addr.network}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (step === 'address' && selectedAddress) {
      return (
        <Card className="bg-gray-800 border-gray-700 text-center">
          <CardHeader>
            <CardTitleUI>{selectedAddress.network} Deposit</CardTitleUI>
            <CardDescription>Only send {selectedAddress.network} to this address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center p-2 bg-white rounded-lg">
              <QRCode
                value={selectedAddress.address}
                size={128}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
              />
            </div>
            <div className="mt-4 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> Only send {selectedToken} via the {selectedAddress.network} network.
                Sending assets via other networks may result in the loss of your funds.
                <br />
                Average delivery time: 1-20 minutes.
              </p>
            </div>
            <div className="relative">
              <Input
                id="deposit-address"
                value={selectedAddress.address}
                readOnly
                className="pr-10 font-mono text-xs"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7"
                onClick={() => handleCopyToClipboard(selectedAddress.address)}
              >
                {copiedAddress === selectedAddress.address ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
       <div className="text-center text-gray-400 h-48 flex flex-col justify-center items-center">
         <p>No deposit methods available.</p>
         <p className="text-xs mt-1">Please contact support for assistance.</p>
       </div>
    )
  }
  
  const handleBack = () => {
    if (step === 'address') setStep('network');
    if (step === 'network') setStep('token');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              Deposit Funds
            </DialogTitle>
            {step !== 'token' && (
              <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            )}
          </div>
        </DialogHeader>
        <div className="py-4 min-h-[200px]">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
