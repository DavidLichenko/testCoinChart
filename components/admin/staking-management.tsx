"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Percent,
  Coins,
  Clock,
  Activity
} from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AssetDto = {
  symbol: string;
  name: string;
  type: "FIAT" | "CRYPTO" | "METAL" | "COMMODITY";
  isStakable: boolean;
};

type StakingPlan = {
  id: string;
  name: string;
  assetSymbol: string;
  duration: number;
  apr: number;
  minAmount: number;
  isActive: boolean;
  asset: {
    symbol: string;
    name: string;
  };
};

type StakingPosition = {
  id: string;
  userId: string;
  user: {
    email: string;
    name: string | null;
  };
  assetSymbol: string;
  amount: number;
  planId: string;
  plan: {
    name: string;
  };
  startedAt: string;
  endsAt: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

export default function StakingManagement() {
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [assets, setAssets] = useState<AssetDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StakingPlan | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    assetSymbol: "",
    duration: 30,
    apr: 5,
    minAmount: 10,
    isActive: true,
  });

  // Fetch staking data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch staking plans
      const plansRes = await fetch("/api/staking/plans");
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }
      
      // Fetch staking positions
      const positionsRes = await fetch("/api/staking/positions");
      if (positionsRes.ok) {
        const positionsData = await positionsRes.json();
        setPositions(positionsData.positions || []);
      }
      
      // Fetch assets
      const assetsRes = await fetch("/api/admin/wallets/assets");
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setAssets(assetsData.assets || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load staking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const url = editingPlan 
        ? `/api/admin/staking/plans/${editingPlan.id}`
        : "/api/admin/staking/plans";
        
      const method = editingPlan ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${editingPlan ? "update" : "create"} staking plan`);
      }
      
      toast.success(`Staking plan ${editingPlan ? "updated" : "created"} successfully`);
      setDialogOpen(false);
      setEditingPlan(null);
      setFormData({
        name: "",
        assetSymbol: "",
        duration: 30,
        apr: 5,
        minAmount: 10,
        isActive: true,
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Error ${editingPlan ? "updating" : "creating"} staking plan`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit plan
  const handleEditPlan = (plan: StakingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      assetSymbol: plan.assetSymbol,
      duration: plan.duration,
      apr: plan.apr,
      minAmount: plan.minAmount,
      isActive: plan.isActive,
    });
    setDialogOpen(true);
  };

  // Handle delete plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this staking plan?")) return;
    
    try {
      setLoading(true);
      
      const res = await fetch(`/api/admin/staking/plans/${planId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete staking plan");
      }
      
      toast.success("Staking plan deleted successfully");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error deleting staking plan");
    } finally {
      setLoading(false);
    }
  };

  // Filter plans based on search
  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(search.toLowerCase()) ||
    plan.assetSymbol.toLowerCase().includes(search.toLowerCase())
  );

  // Get stakable assets
  const stakableAssets = assets.filter(asset => asset.isStakable);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-sky-500 shadow-lg shadow-purple-500/30">
              <Activity className="h-4 w-4 text-white" />
            </span>
            <span>Staking Management</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage staking plans and user positions.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search plans..."
              className="pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="gap-2"
                onClick={() => {
                  setEditingPlan(null);
                  setFormData({
                    name: "",
                    assetSymbol: "",
                    duration: 30,
                    apr: 5,
                    minAmount: 10,
                    isActive: true,
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                New Plan
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Edit Staking Plan" : "Create Staking Plan"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs text-slate-400">
                    Plan Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Flexible Staking"
                    className="h-9 text-sm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assetSymbol" className="text-xs text-slate-400">
                    Asset
                  </Label>
                  <Select
                    value={formData.assetSymbol}
                    onValueChange={(value) => handleSelectChange("assetSymbol", value)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {stakableAssets.map((asset) => (
                        <SelectItem key={asset.symbol} value={asset.symbol}>
                          {asset.symbol} · {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-xs text-slate-400">
                      Duration (days)
                    </Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apr" className="text-xs text-slate-400">
                      APR (%)
                    </Label>
                    <Input
                      id="apr"
                      name="apr"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.apr}
                      onChange={handleInputChange}
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minAmount" className="text-xs text-slate-400">
                    Minimum Amount
                  </Label>
                  <Input
                    id="minAmount"
                    name="minAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minAmount}
                    onChange={handleInputChange}
                    className="h-9 text-sm"
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-600"
                  />
                  <Label htmlFor="isActive" className="text-sm text-slate-300">
                    Active Plan
                  </Label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-950/90 border-slate-800/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500/10 p-2">
                <Coins className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Plans</p>
                <p className="text-xl font-semibold text-slate-50">{plans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-950/90 border-slate-800/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Positions</p>
                <p className="text-xl font-semibold text-slate-50">
                  {positions.filter(p => p.status === "ACTIVE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-950/90 border-slate-800/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Percent className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg APR</p>
                <p className="text-xl font-semibold text-slate-50">
                  {plans.length > 0 
                    ? (plans.reduce((sum, plan) => sum + plan.apr, 0) / plans.length).toFixed(1) 
                    : "0.0"}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-950/90 border-slate-800/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg Duration</p>
                <p className="text-xl font-semibold text-slate-50">
                  {plans.length > 0 
                    ? Math.round(plans.reduce((sum, plan) => sum + plan.duration, 0) / plans.length) 
                    : "0"} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Staking Plans Table */}
      <Card className="bg-slate-950/90 border-slate-800/80">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Staking Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {search ? "No plans found matching your search." : "No staking plans created yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="pb-3 font-normal">Plan</th>
                    <th className="pb-3 font-normal">Asset</th>
                    <th className="pb-3 font-normal">Duration</th>
                    <th className="pb-3 font-normal">APR</th>
                    <th className="pb-3 font-normal">Min Amount</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => (
                    <motion.tr
                      key={plan.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-slate-800/50 hover:bg-slate-900/50"
                    >
                      <td className="py-3">
                        <div className="font-medium text-slate-200">{plan.name}</div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300">{plan.assetSymbol}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-slate-300">{plan.duration} days</div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-emerald-400">{plan.apr}%</div>
                      </td>
                      <td className="py-3">
                        <div className="text-slate-300">{plan.minAmount} {plan.assetSymbol}</div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          plan.isActive 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-slate-700/50 text-slate-400"
                        }`}>
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Active Positions */}
      <Card className="bg-slate-950/90 border-slate-800/80">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Recent Staking Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {positions.filter(p => p.status === "ACTIVE").length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No active staking positions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="pb-3 font-normal">User</th>
                    <th className="pb-3 font-normal">Asset</th>
                    <th className="pb-3 font-normal">Amount</th>
                    <th className="pb-3 font-normal">Plan</th>
                    <th className="pb-3 font-normal">Started</th>
                    <th className="pb-3 font-normal">Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {positions
                    .filter(p => p.status === "ACTIVE")
                    .slice(0, 5)
                    .map((position) => (
                      <tr key={position.id} className="border-b border-slate-800/50">
                        <td className="py-3">
                          <div className="font-medium text-slate-200">
                            {position.user.name || position.user.email}
                          </div>
                          <div className="text-xs text-slate-500">
                            {position.user.email}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="font-mono text-slate-300">{position.assetSymbol}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-300">{position.amount} {position.assetSymbol}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-300">{position.plan.name}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-300">
                            {new Date(position.startedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-300">
                            {position.endsAt 
                              ? new Date(position.endsAt).toLocaleDateString()
                              : "Flexible"}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}