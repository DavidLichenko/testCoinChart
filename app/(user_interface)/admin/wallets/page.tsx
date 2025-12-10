"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  CreditCard, 
  ArrowUpDown, 
  Plus, 
  Minus, 
  Settings, 
  RefreshCw,
  Search,
  Activity,
  Coins,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import toast from "react-hot-toast";

// Dynamically import components to reduce initial bundle size
const WalletsManagement = dynamic(() => import("@/components/admin/wallets-management"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64"><RefreshCw className="animate-spin h-8 w-8 text-purple-500" /></div>
});

export default function AdminWalletsPage() {
  const [activeView, setActiveView] = useState<'overview' | 'management'>('management');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050215] via-[#120423] to-[#050215] text-slate-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-sky-500 shadow-lg shadow-purple-500/30">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              Admin Wallet Management
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage user wallets, balances, and currency preferences in real-time
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveView('management')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === 'management'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80'
              }`}
            >
              <Wallet className="h-4 w-4" />
              Wallet Management
            </button>
            
            <button
              onClick={() => setActiveView('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === 'overview'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80'
              }`}
            >
              <Activity className="h-4 w-4" />
              System Overview
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Users</p>
              <p className="text-2xl font-bold mt-1">1,248</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <UsersIcon />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Assets</p>
              <p className="text-2xl font-bold mt-1">$24.8M</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Coins className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Trades</p>
              <p className="text-2xl font-bold mt-1">1,842</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Pending Actions</p>
              <p className="text-2xl font-bold mt-1">24</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-rose-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeView === 'management' ? (
          <motion.div
            key="management"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <WalletsManagement />
          </motion.div>
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              System Overview
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Currency Distribution */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Currency Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>USD</span>
                      <span>64%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '64%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>EUR</span>
                      <span>36%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '36%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>User deposits processed</span>
                    <span className="ml-auto text-slate-400">2 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    <span>New trading position opened</span>
                    <span className="ml-auto text-slate-400">15 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <XCircle className="h-4 w-4 text-rose-400" />
                    <span>Withdrawal request pending</span>
                    <span className="ml-auto text-slate-400">1 hour ago</span>
                  </div>
                </div>
              </div>
              
              {/* Asset Performance */}
              <div className="lg:col-span-2 bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-medium mb-3">Top Performing Assets</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="py-2 text-left">Asset</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">24h Change</th>
                        <th className="py-2 text-right">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-800">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <span className="text-amber-400">₿</span>
                            </div>
                            <div>
                              <div className="font-medium">Bitcoin</div>
                              <div className="text-slate-400 text-xs">BTC</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">$43,256.78</td>
                        <td className="py-3 text-right text-green-400">+2.4%</td>
                        <td className="py-3 text-right">$2.4B</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <span className="text-purple-400">Ξ</span>
                            </div>
                            <div>
                              <div className="font-medium">Ethereum</div>
                              <div className="text-slate-400 text-xs">ETH</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">$2,345.67</td>
                        <td className="py-3 text-right text-green-400">+1.8%</td>
                        <td className="py-3 text-right">$1.2B</td>
                      </tr>
                      <tr>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <span className="text-blue-400">$</span>
                            </div>
                            <div>
                              <div className="font-medium">US Dollar</div>
                              <div className="text-slate-400 text-xs">USD</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">$1.00</td>
                        <td className="py-3 text-right text-slate-400">0.0%</td>
                        <td className="py-3 text-right">$-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple SVG icons for stats cards
function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
  );
}