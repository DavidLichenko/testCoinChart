"use client";

import { useState, useEffect } from "react";
import { AdminSettingsLayout } from "@/components/admin/settings-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpCircle, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WithdrawalLimit {
  id: string;
  method: string;
  minAmount: number;
  maxAmount: number | null;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  fee: number;
  feePercent: number | null;
  processingTime: string | null;
  isActive: boolean;
}

export default function WithdrawalSettingsPage() {
  const [limits, setLimits] = useState<WithdrawalLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<WithdrawalLimit | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    method: "CARD",
    minAmount: "10",
    maxAmount: "",
    dailyLimit: "",
    monthlyLimit: "",
    fee: "0",
    feePercent: "",
    processingTime: "1-3 business days",
    isActive: true,
  });

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const res = await fetch("/api/withdrawal/limits");
      if (res.ok) {
        const data = await res.json();
        setLimits(data);
      }
    } catch (error) {
      console.error("Error fetching limits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        method: formData.method,
        minAmount: parseFloat(formData.minAmount),
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        dailyLimit: formData.dailyLimit ? parseFloat(formData.dailyLimit) : null,
        monthlyLimit: formData.monthlyLimit ? parseFloat(formData.monthlyLimit) : null,
        fee: parseFloat(formData.fee),
        feePercent: formData.feePercent ? parseFloat(formData.feePercent) : null,
        processingTime: formData.processingTime || null,
        isActive: formData.isActive,
      };

      const url = editingLimit
        ? `/api/withdrawal/limits/${editingLimit.id}`
        : "/api/withdrawal/limits";
      const method = editingLimit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: "✅ Success",
          description: `Withdrawal limit ${editingLimit ? "updated" : "created"} successfully`,
        });
        setIsDialogOpen(false);
        setEditingLimit(null);
        resetForm();
        fetchLimits();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to save withdrawal limit",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      method: "CARD",
      minAmount: "10",
      maxAmount: "",
      dailyLimit: "",
      monthlyLimit: "",
      fee: "0",
      feePercent: "",
      processingTime: "1-3 business days",
      isActive: true,
    });
  };

  const handleEdit = (limit: WithdrawalLimit) => {
    setEditingLimit(limit);
    setFormData({
      method: limit.method,
      minAmount: limit.minAmount.toString(),
      maxAmount: limit.maxAmount?.toString() || "",
      dailyLimit: limit.dailyLimit?.toString() || "",
      monthlyLimit: limit.monthlyLimit?.toString() || "",
      fee: limit.fee.toString(),
      feePercent: limit.feePercent?.toString() || "",
      processingTime: limit.processingTime || "",
      isActive: limit.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this limit?")) return;

    try {
      const res = await fetch(`/api/withdrawal/limits/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "✅ Success",
          description: "Limit deleted successfully",
        });
        fetchLimits();
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to delete limit",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminSettingsLayout
      title="Withdrawal Limits"
      description="Configure withdrawal limits, fees, and processing times"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Withdrawal Methods</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingLimit(null);
                  resetForm();
                }}
                className="bg-gradient-to-r from-orange-600 to-orange-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Limit
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0b0b14] border-[#252537] text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLimit ? "Edit" : "Create"} Withdrawal Limit
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, method: value })
                    }
                  >
                    <SelectTrigger className="bg-[#1a1a2e] border-purple-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="CRYPTO">Crypto</SelectItem>
                      <SelectItem value="BANK">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minAmount">Min Amount</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      step="0.01"
                      required
                      value={formData.minAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, minAmount: e.target.value })
                      }
                      className="bg-[#1a1a2e] border-purple-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAmount">Max Amount (optional)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      step="0.01"
                      value={formData.maxAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxAmount: e.target.value })
                      }
                      className="bg-[#1a1a2e] border-purple-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyLimit">Daily Limit (optional)</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      step="0.01"
                      value={formData.dailyLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, dailyLimit: e.target.value })
                      }
                      className="bg-[#1a1a2e] border-purple-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyLimit">Monthly Limit (optional)</Label>
                    <Input
                      id="monthlyLimit"
                      type="number"
                      step="0.01"
                      value={formData.monthlyLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, monthlyLimit: e.target.value })
                      }
                      className="bg-[#1a1a2e] border-purple-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fee">Fixed Fee</Label>
                    <Input
                      id="fee"
                      type="number"
                      step="0.01"
                      required
                      value={formData.fee}
                      onChange={(e) =>
                        setFormData({ ...formData, fee: e.target.value })
                      }
                      className="bg-[#1a1a2e] border-purple-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feePercent">Fee Percent (optional)</Label>
                    <Input
                      id="feePercent"
                      type="number"
                      step="0.01"
                      value={formData.feePercent}
                      onChange={(e) =>
                        setFormData({ ...formData, feePercent: e.target.value })
                      }
                      className="bg-[#1a1a2e] border-purple-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processingTime">Processing Time</Label>
                  <Input
                    id="processingTime"
                    placeholder="e.g., 1-3 business days"
                    value={formData.processingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, processingTime: e.target.value })
                    }
                    className="bg-[#1a1a2e] border-purple-500/30"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
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
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingLimit ? "Update" : "Create"} Limit</>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          </div>
        ) : limits.length === 0 ? (
          <Card className="border-[#252537] bg-[#0b0b14]">
            <CardContent className="py-12 text-center">
              <ArrowUpCircle className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">
                No withdrawal limits configured. Create your first limit above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {limits.map((limit) => (
              <Card key={limit.id} className="border-[#252537] bg-[#0b0b14]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-5 w-5 text-orange-400" />
                      <span className="text-white">{limit.method}</span>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        limit.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {limit.isActive ? "Active" : "Inactive"}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min Amount:</span>
                      <span className="font-semibold text-white">${limit.minAmount}</span>
                    </div>
                    {limit.maxAmount && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Amount:</span>
                        <span className="font-semibold text-white">${limit.maxAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fee:</span>
                      <span className="font-semibold text-white">
                        ${limit.fee}
                        {limit.feePercent && ` + ${limit.feePercent}%`}
                      </span>
                    </div>
                    {limit.dailyLimit && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Daily Limit:</span>
                        <span className="font-semibold text-white">${limit.dailyLimit}</span>
                      </div>
                    )}
                    {limit.processingTime && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Processing:</span>
                        <span className="font-semibold text-white">{limit.processingTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(limit)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(limit.id)}
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
