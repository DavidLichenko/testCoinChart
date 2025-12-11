"use client";

import { useState, useEffect } from "react";
import { AdminSettingsLayout } from "@/components/admin/settings-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Coins, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StakingPlan {
  id: string;
  assetSymbol: string | null;
  durationDays: number;
  apr: number;
  minAmount: number;
  isActive: boolean;
  createdAt: string;
}

export default function StakingSettingsPage() {
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StakingPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    assetSymbol: "",
    durationDays: "30",
    apr: "5",
    minAmount: "100",
    isActive: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/staking-plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (error) {
      console.error("Error fetching staking plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        assetSymbol: formData.assetSymbol || null,
        durationDays: parseInt(formData.durationDays),
        apr: parseFloat(formData.apr),
        minAmount: parseFloat(formData.minAmount),
        isActive: formData.isActive,
      };

      const url = editingPlan
        ? `/api/admin/staking-plans/${editingPlan.id}`
        : "/api/admin/staking-plans";
      const method = editingPlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          title: "✅ Success",
          description: `Staking plan ${editingPlan ? "updated" : "created"} successfully`,
        });
        setIsDialogOpen(false);
        setEditingPlan(null);
        setFormData({
          assetSymbol: "",
          durationDays: "30",
          apr: "5",
          minAmount: "100",
          isActive: true,
        });
        fetchPlans();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to save staking plan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plan: StakingPlan) => {
    setEditingPlan(plan);
    setFormData({
      assetSymbol: plan.assetSymbol || "",
      durationDays: plan.durationDays.toString(),
      apr: plan.apr.toString(),
      minAmount: plan.minAmount.toString(),
      isActive: plan.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staking plan?")) return;

    try {
      const res = await fetch(`/api/admin/staking-plans/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "✅ Success",
          description: "Staking plan deleted successfully",
        });
        fetchPlans();
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to delete staking plan",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminSettingsLayout
      title="Staking Plans"
      description="Manage staking plans and APR rates for different crypto assets"
    >
      <div className="space-y-6">
        {/* Add Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Active Staking Plans</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingPlan(null);
                  setFormData({
                    assetSymbol: "",
                    durationDays: "30",
                    apr: "5",
                    minAmount: "100",
                    isActive: true,
                  });
                }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Staking Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0b0b14] border-[#252537] text-white">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit" : "Create"} Staking Plan
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assetSymbol">Asset Symbol (leave empty for all assets)</Label>
                  <Input
                    id="assetSymbol"
                    placeholder="e.g., BTC, ETH (or leave empty)"
                    value={formData.assetSymbol}
                    onChange={(e) =>
                      setFormData({ ...formData, assetSymbol: e.target.value })
                    }
                    className="bg-[#1a1a2e] border-purple-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="durationDays">Duration (days)</Label>
                    <Input
                      id="durationDays"
                      type="number"
                      required
                      value={formData.durationDays}
                      onChange={(e) =>
                        setFormData({ ...formData, durationDays: e.target.value })
                      }
                      className="bg-[#1a1a2e] border-purple-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apr">APR (%)</Label>
                    <Input
                      id="apr"
                      type="number"
                      step="0.01"
                      required
                      value={formData.apr}
                      onChange={(e) =>
                        setFormData({ ...formData, apr: e.target.value })
                      }
                      className="bg-[#1a1a2e] border-purple-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minAmount">Minimum Amount</Label>
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
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingPlan ? "Update" : "Create"} Plan</>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plans List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : plans.length === 0 ? (
          <Card className="border-[#252537] bg-[#0b0b14]">
            <CardContent className="py-12 text-center">
              <Coins className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">
                No staking plans configured. Create your first plan above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-[#252537] bg-[#0b0b14]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-emerald-400" />
                      <span className="text-white">
                        {plan.assetSymbol || "All Assets"}
                      </span>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        plan.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Duration</p>
                      <p className="font-semibold text-white">{plan.durationDays} days</p>
                    </div>
                    <div>
                      <p className="text-slate-500">APR</p>
                      <p className="font-semibold text-emerald-400">{plan.apr}%</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Minimum Amount</p>
                      <p className="font-semibold text-white">{plan.minAmount}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(plan)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(plan.id)}
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
