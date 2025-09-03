"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { toast } from "@/components/toast";
import { Settings, PlusCircle, Edit, Trash2, Copy, Check } from "lucide-react"

interface DepositAddress {
  id: string
  network: string
  address: string
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
  const [addresses, setAddresses] = useState<DepositAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<DepositAddress | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
  // Form state
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")
  const [addressInput, setAddressInput] = useState<string>("")

  useEffect(() => {
    fetchAddresses()
  }, [])

  useEffect(() => {
    if (editingAddress) {
      const [token, network] = editingAddress.network.split(" ")
      setSelectedToken(token || "")
      setSelectedNetwork(network?.replace(/[()]/g, "") || "")
      setAddressInput(editingAddress.address)
    } else {
      resetFormState()
    }
  }, [editingAddress])

  const resetFormState = () => {
    setSelectedToken("")
    setSelectedNetwork("")
    setAddressInput("")
  }

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/deposit-addresses")
      if (response.ok) {
        const data = await response.json()
        setAddresses(data)
      } else {
        toast({ title: "Error", description: "Failed to fetch deposit addresses.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred while fetching addresses.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }
  
  const handleSaveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const network = `${selectedToken} (${selectedNetwork})`
    const address = addressInput

    if (!selectedToken || !selectedNetwork || !address) {
      toast({ title: "Validation Error", description: "Please select a token, network, and enter an address.", variant: "destructive" })
      return
    }
    
    const url = editingAddress 
      ? `/api/admin/deposit-addresses/${editingAddress.id}` 
      : "/api/admin/deposit-addresses"
    
    const method = editingAddress ? "PATCH" : "POST"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, address }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Address ${editingAddress ? 'updated' : 'added'} successfully.`,
        })
        fetchAddresses()
        setDialogOpen(false)
        setEditingAddress(null)
      } else {
        const errorData = await response.json()
        toast({ title: "Save Failed", description: errorData.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/admin/deposit-addresses/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Success", description: "Address deleted successfully." })
        fetchAddresses()
      } else {
        const errorData = await response.json()
        toast({ title: "Delete Failed", description: errorData.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred while deleting.", variant: "destructive" })
    }
  }

  const handleCopyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleTokenChange = (token: string) => {
    setSelectedToken(token)
    setSelectedNetwork("") // Reset network when token changes
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          Deposit Address Settings
        </h2>
        <Dialog open={dialogOpen} onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) {
            setEditingAddress(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAddress(null)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Edit' : 'Add New'} Deposit Address</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveChanges}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Select value={selectedToken} onValueChange={handleTokenChange}>
                    <SelectTrigger id="token">
                      <SelectValue placeholder="Select a token" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(cryptoOptions).map(token => (
                        <SelectItem key={token} value={token}>{token}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedToken && (
                  <div className="space-y-2">
                    <Label htmlFor="network">Network</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger id="network">
                        <SelectValue placeholder="Select a network" />
                      </SelectTrigger>
                      <SelectContent>
                        {cryptoOptions[selectedToken].map(network => (
                          <SelectItem key={network} value={network}>{network}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={addressInput} onChange={(e) => setAddressInput(e.target.value)} required />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle>Configured Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No deposit addresses configured yet.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{addr.network}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-400 font-mono">{addr.address}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyToClipboard(addr.address)}
                      >
                        {copiedAddress === addr.address ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAddress(addr);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAddress(addr.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 