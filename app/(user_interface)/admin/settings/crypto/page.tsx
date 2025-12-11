"use client";

import { useState, useEffect } from "react";
import { AdminSettingsLayout } from "@/components/admin/settings-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Plus, Pencil, Trash2, Loader2, Copy, Check } from "lucide-react";
import { toast } from "@/components/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DepositAddress {
  id: string;
  assetSymbol: string | null;
  network: string;
  address: string;
  label: string | null;
  createdAt: string;
}

export default function CryptoSettingsPage() {
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DepositAddress | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    assetSymbol: "BTC",
    network: "Bitcoin",
    address: "",
    label: "",
  });

  const networks = [
    "Bitcoin",
    "Ethereum (ERC20)",
    "Tron (TRC20)",
    "Binance Smart Chain (BEP20)",
    "Polygon",
    "Arbitrum",
    "Optimism",
  ];

  const cryptoAssets = [
    "BTC",
    "ETH",
    "USDT",
    "USDC",
    "BNB",
    "SOL",
    "XRP",
    "MATIC",
  ];

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/admin/deposit-addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: "✅ Copied",
      description: "Address copied to clipboard",
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        assetSymbol: formData.assetSymbol || null,
        network: formData.network,
        address: formData.address,
        label: formData.label || null,
      };

      const url = editingAddress
        ? `/api/admin/deposit-addresses/${editingAddress.id}`
        : "/api/admin/deposit-addresses";
      const method = editingAddress ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: "✅ Success",
          description: `Address ${editingAddress ? "updated" : "created"} successfully`,
        });
        setIsDialogOpen(false);
        setEditingAddress(null);
        resetForm();
        fetchAddresses();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      assetSymbol: "BTC",
      network: "Bitcoin",
      address: "",
      label: "",
    });
  };

  const handleEdit = (address: DepositAddress) => {
    setEditingAddress(address);
    setFormData({
      assetSymbol: address.assetSymbol || "BTC",
      network: address.network,
      address: address.address,
      label: address.label || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`/api/admin/deposit-addresses/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "✅ Success",
          description: "Address deleted successfully",
        });
        fetchAddresses();
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminSettingsLayout
      title="Crypto Addresses"
      description="Manage deposit addresses for different cryptocurrency networks"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Deposit Addresses</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingAddress(null);
                  resetForm();
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0b0b14] border-[#252537] text-white">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit" : "Add"} Deposit Address
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetSymbol">Asset</Label>
                    <Select
                      value={formData.assetSymbol}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assetSymbol: value })
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a2e] border-purple-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                        {cryptoAssets.map((asset) => (
                          <SelectItem key={asset} value={asset}>
                            {asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="network">Network</Label>
                    <Select
                      value={formData.network}
                      onValueChange={(value) =>
                        setFormData({ ...formData, network: value })
                      }
                    >
                      <SelectTrigger className="bg-[#1a1a2e] border-purple-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                        {networks.map((network) => (
                          <SelectItem key={network} value={network}>
                            {network}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    required
                    placeholder="Enter wallet address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="bg-[#1a1a2e] border-purple-500/30 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Label (optional)</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Main BTC Wallet"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    className="bg-[#1a1a2e] border-purple-500/30"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingAddress ? "Update" : "Add"} Address</>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : addresses.length === 0 ? (
          <Card className="border-[#252537] bg-[#0b0b14]">
            <CardContent className="py-12 text-center">
              <Wallet className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">
                No deposit addresses configured. Add your first address above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {addresses.map((addr) => (
              <Card key={addr.id} className="border-[#252537] bg-[#0b0b14]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-400" />
                      <span className="text-white">
                        {addr.assetSymbol || "Multi"} - {addr.network}
                      </span>
                    </div>
                    {addr.label && (
                      <span className="text-xs text-slate-400">{addr.label}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-300 font-mono">
                      {addr.address}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(addr.address)}
                    >
                      {copiedAddress === addr.address ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(addr)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(addr.id)}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminSettingsLayout>
  );
}
