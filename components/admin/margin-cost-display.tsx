"use client";

import { useState, useEffect } from "react";

interface MarginCostDisplayProps {
  ticker: string;
  volume: number;
  leverage: number;
  openPrice: number;
}

export function MarginCostDisplay({ ticker, volume, leverage, openPrice }: MarginCostDisplayProps) {
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate margin cost
  const marginCost = (volume * openPrice) / leverage;

  // Fetch current market price
  const fetchMarketPrice = async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // This is a simplified approach - in a real app, you'd connect to a market data API
      // For demo purposes, we'll simulate a price fetch
      const response = await fetch(`/api/market/price?symbol=${ticker}`);
      
      if (response.ok) {
        const data = await response.json();
        setMarketPrice(data.price);
      } else {
        // Simulate with a random price for demo
        const simulatedPrice = openPrice * (0.95 + Math.random() * 0.1);
        setMarketPrice(simulatedPrice);
      }
    } catch (err) {
      // Simulate with a random price for demo
      const simulatedPrice = openPrice * (0.95 + Math.random() * 0.1);
      setMarketPrice(simulatedPrice);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketPrice();
  }, [ticker]);

  // Calculate P&L
  const currentPL = marketPrice ? ((marketPrice - openPrice) * volume) : null;

  return (
    <div className="rounded-xl bg-slate-900/60 p-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Margin Details</h4>
        <button 
          onClick={fetchMarketPrice}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Margin Cost:</span>
          <span className="font-medium">${marginCost.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">Position Size:</span>
          <span>${(volume * openPrice).toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-400">Open Price:</span>
          <span>{openPrice.toFixed(5)}</span>
        </div>
        
        {marketPrice && (
          <div className="flex justify-between">
            <span className="text-slate-400">Current Price:</span>
            <span>{marketPrice.toFixed(5)}</span>
          </div>
        )}
        
        {currentPL !== null && (
          <div className={`flex justify-between ${currentPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className="text-slate-400">P&L:</span>
            <span className="font-medium">
              {(currentPL >= 0 ? '+' : '')}${currentPL.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-rose-400">
          {error}
        </div>
      )}
    </div>
  );
}