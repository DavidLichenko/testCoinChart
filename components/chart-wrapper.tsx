import React, { useMemo } from 'react';
import { AdvancedChartWithDrawings } from './AdvancedChartWithDrawings';

// Type definitions matching your market data
type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Ticker = {
  symbol: string;
  price: number;
  time: number;
  type: string;
  bid?: number;
};

interface ChartWrapperProps {
  candlesBySymbol: Candle[] | Record<string, Candle[]>;
  tickers: Ticker[];
  selectedTicker: Ticker | null;
  timeframeSeconds?: number;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  candlesBySymbol,
  tickers,
  selectedTicker,
  timeframeSeconds = 60,
}) => {
  // Handle the candlesBySymbol structure
  const candles = useMemo(() => {
    return Array.isArray(candlesBySymbol) 
      ? candlesBySymbol 
      : selectedTicker?.symbol 
        ? candlesBySymbol[selectedTicker.symbol] || []
        : [];
  }, [candlesBySymbol, selectedTicker?.symbol]);

  // Memoize tickers to prevent hook reset
  const memoizedTickers = useMemo(() => tickers, [tickers]);

  // Handle the selectedTicker type inconsistency
  const symbol = selectedTicker?.symbol || '';

  // Only render if we have valid data
  if (!symbol || !candles.length) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-background border rounded-lg">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {!symbol ? 'Select a symbol' : 'No data available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdvancedChartWithDrawings
      key={`${symbol}-${timeframeSeconds}`}
      candles={candles}
      liveTickers={memoizedTickers}
      selectedSymbol={symbol}
      timeframeInSeconds={timeframeSeconds}
    />
  );
}; 