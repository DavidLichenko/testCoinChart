"use client";

export interface WalletBalance {
  id: string;
  assetSymbol: string;
  ownBalance: number;
  creditLimit: number;
  creditUsed: number;
  locked: number;
  asset: {
    name: string;
    type: string;
  };
}

interface WalletBalanceItemProps {
  balance: WalletBalance;
}

export function WalletBalanceItem({ balance }: WalletBalanceItemProps) {
  // Get asset icon based on symbol
  const getAssetIcon = (symbol: string) => {
    const s = symbol.toUpperCase();
    if (s.startsWith("BTC")) return "₿";
    if (s.startsWith("ETH")) return "Ξ";
    if (s.startsWith("USDT") || s.startsWith("USDC")) return "$";
    if (s.startsWith("EUR")) return "€";
    if (s.startsWith("GBP")) return "£";
    if (s.startsWith("JPY")) return "¥";
    return s.substring(0, 2);
  };

  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-3 hover:bg-slate-900 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-medium">
          {getAssetIcon(balance.assetSymbol)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium">{balance.assetSymbol}</div>
            <div className="text-xs rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">
              {balance.asset.type}
            </div>
          </div>
          <div className="text-xs text-slate-400">{balance.asset.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{balance.ownBalance.toFixed(4)}</div>
        {balance.locked > 0 && (
          <div className="text-xs text-slate-400">
            Locked: {balance.locked.toFixed(4)}
          </div>
        )}
        {balance.creditUsed > 0 && (
          <div className="text-xs text-amber-400">
            Credit: {balance.creditUsed.toFixed(2)}/{balance.creditLimit.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}