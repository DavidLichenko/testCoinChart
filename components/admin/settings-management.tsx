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
import { hasAdminAccess, hasOwnerAccess } from "@/lib/admin-access"
import { useAuth } from "@/components/auth-provider"

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
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<DepositAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<DepositAddress | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  
  // Add access control check
  useEffect(() => {
    if (!hasOwnerAccess(user)) {
      setAccessDenied(true)
    }
  }, [user])
  
  // If access is denied, show an error message
  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100">
        Access denied. Only owners can access settings.
      </div>
    )
  }
  
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          Deposit Address Settings
        </h2>
        <Dialog open={dialogOpen} onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) {
            setEditingAddress(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAddress(null)} className="text-sm sm:text-base w-full sm:w-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{editingAddress ? 'Edit' : 'Add New'} Deposit Address</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveChanges}>
              <div className="grid gap-3 sm:gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-sm">Token</Label>
                  <Select value={selectedToken} onValueChange={handleTokenChange}>
                    <SelectTrigger id="token" className="text-sm">
                      <SelectValue placeholder="Select a token" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Object.keys(cryptoOptions).map(token => (
                        <SelectItem key={token} value={token} className="text-sm">{token}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedToken && (
                  <div className="space-y-2">
                    <Label htmlFor="network" className="text-sm">Network</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger id="network" className="text-sm">
                        <SelectValue placeholder="Select a network" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {cryptoOptions[selectedToken].map(network => (
                          <SelectItem key={network} value={network} className="text-sm">{network}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm">Address</Label>
                  <Input id="address" name="address" value={addressInput} onChange={(e) => setAddressInput(e.target.value)} required className="text-sm" />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="w-full sm:w-auto text-sm">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto text-sm">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="p-4">
          <CardTitle className="text-base sm:text-lg">Configured Addresses</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {loading ? (
            <p className="text-sm">Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <p className="text-gray-400 text-center py-4 text-sm">No deposit addresses configured yet.</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-900/50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm sm:text-base">{addr.network}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs sm:text-sm text-gray-400 font-mono break-all">{addr.address}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAddress(addr);
                        setDialogOpen(true);
                      }}
                      className="text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs sm:text-sm"
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