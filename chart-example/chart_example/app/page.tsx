'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { fetchCandles } from '@/lib/api';
import { WebSocketClient } from '@/lib/websocket';
import { ChartCandleData, TickerData } from '@/lib/types';
import TickerSelector from '@/components/TickerSelector';
import PriceDisplay from '@/components/PriceDisplay';

const CandlestickChart = dynamic(() => import('@/components/CandlestickChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[650px] bg-[#181a20] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-[#2b3139] border-t-[#f0b90b] rounded-full animate-spin"></div>
        <div className="text-[#848e9c]">Loading chart...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedTicker, setSelectedTicker] = useState('EURUSD');
  const [chartData, setChartData] = useState<ChartCandleData[]>([]);
  const [currentTickerData, setCurrentTickerData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsClient] = useState(() => new WebSocketClient());
  const [timeframe, setTimeframe] = useState('5m');
  const [drawingMode, setDrawingMode] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, { bid: number; ask: number; change: number }>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Convert timeframe to seconds
  const getTimeframeSeconds = (tf: string): number => {
    const map: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400
    };
    return map[tf] || 300;
  };

  // Load chart data
  const loadChartData = useCallback(async (symbol: string, tf: string) => {
    setLoading(true);
    try {
      const tfParam = tf.replace('m', 'M').replace('h', 'H').replace('d', 'D');
      const candles = await fetchCandles(symbol, tfParam);
      const formattedData: ChartCandleData[] = candles.map(candle => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
      setChartData(formattedData);
    } catch (error) {
      console.error('Error loading chart data:', error);
      const sampleData = generateSampleData(tf);
      setChartData(sampleData);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSampleData = (tf: string): ChartCandleData[] => {
    const data: ChartCandleData[] = [];
    let basePrice = 1.15;
    const now = Math.floor(Date.now() / 1000);
    const interval = getTimeframeSeconds(tf);
    const count = 100;
    
    for (let i = count; i >= 0; i--) {
      const time = now - i * interval;
      const open = basePrice + (Math.random() - 0.5) * 0.01;
      const close = open + (Math.random() - 0.5) * 0.01;
      const high = Math.max(open, close) + Math.random() * 0.005;
      const low = Math.min(open, close) - Math.random() * 0.005;
      
      data.push({ time, open, high, low, close });
      basePrice = close;
    }
    
    return data;
  };

  const handleTickerChange = useCallback((ticker: string) => {
    setSelectedTicker(ticker);
    loadChartData(ticker, timeframe);
  }, [loadChartData, timeframe]);

  const handleTimeframeChange = useCallback((tf: string) => {
    setTimeframe(tf);
    loadChartData(selectedTicker, tf);
  }, [loadChartData, selectedTicker]);

  useEffect(() => {
    loadChartData(selectedTicker, timeframe);
    wsClient.connect();
    
    const unsubscribe = wsClient.subscribe((tickerData: TickerData) => {
      // Update live prices for all tickers
      if (tickerData.bid > 0) {
        setLivePrices(prev => {
          const prevPrice = prev[tickerData.symbol]?.bid || tickerData.bid;
          const change = ((tickerData.bid - prevPrice) / prevPrice) * 100;
          
          return {
            ...prev,
            [tickerData.symbol]: {
              bid: tickerData.bid,
              ask: tickerData.ask,
              change: change
            }
          };
        });
      }
      
      if (tickerData.symbol === selectedTicker) {
        setCurrentTickerData(tickerData);
        
        // Update chart with real-time bid/ask data
        if (tickerData.bid > 0 && tickerData.time > 0) {
          setChartData(prev => {
            const lastCandle = prev[prev.length - 1];
            if (!lastCandle) return prev;
            
            const interval = getTimeframeSeconds(timeframe);
            const candleTime = Math.floor(tickerData.time / interval) * interval;
            const midPrice = (tickerData.bid + tickerData.ask) / 2;
            
            if (lastCandle.time === candleTime) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...lastCandle,
                high: Math.max(lastCandle.high, midPrice),
                low: Math.min(lastCandle.low, midPrice),
                close: midPrice,
              };
              return updated;
            } else if (candleTime > lastCandle.time) {
              return [...prev, {
                time: candleTime,
                open: midPrice,
                high: midPrice,
                low: midPrice,
                close: midPrice,
              }];
            }
            return prev;
          });
        }
      }
    });
    
    return () => {
      unsubscribe();
      wsClient.disconnect();
    };
  }, [selectedTicker, timeframe, loadChartData, wsClient]);

  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="bg-[#181a20] border-b border-[#2b3139] flex-shrink-0 z-30 shadow-xl">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#f0b90b] via-[#f8d12f] to-[#ffd700] rounded-xl flex items-center justify-center shadow-lg shadow-[#f0b90b]/20 transition-transform hover:scale-110 active:scale-95">
                <span className="text-black font-bold text-base sm:text-xl">B</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white">Trading Platform</h1>
                <p className="text-xs text-[#848e9c] hidden lg:block">Professional Trading Tools</p>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-[#2b3139] rounded-lg transition-all active:scale-95"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="px-3 py-2 text-xs sm:text-sm text-[#848e9c] hover:text-white transition-colors hidden md:block">
              Markets
            </button>
            <button className="px-3 py-2 text-xs sm:text-sm text-[#848e9c] hover:text-white transition-colors hidden md:block">
              Trade
            </button>
            <button className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#f0b90b] to-[#f8d12f] hover:from-[#f8d12f] hover:to-[#ffd700] text-black text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:shadow-[#f0b90b]/30 active:scale-95">
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      {/* Price Ticker Bar - Hidden on mobile */}
      <div className="hidden sm:block">
        <PriceDisplay tickerData={currentTickerData} symbol={selectedTicker} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Symbol Selector */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-72 sm:w-80 lg:w-80 xl:w-96
          bg-[#181a20] border-r border-[#2b3139] shadow-2xl lg:shadow-none
          transform transition-all duration-300 ease-out
          lg:transform-none
          ${
            isMobileMenuOpen 
              ? 'translate-x-0' 
              : '-translate-x-full lg:translate-x-0'
          }
        `}>
          <div className="h-full flex flex-col">
            <TickerSelector
              selectedTicker={selectedTicker}
              onTickerChange={(ticker) => {
                handleTickerChange(ticker);
                setIsMobileMenuOpen(false);
              }}
              livePrices={livePrices}
            />
          </div>
        </div>

        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Center - Chart */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Price Display */}
          <div className="sm:hidden bg-gradient-to-r from-[#181a20] to-[#1e2329] border-b border-[#2b3139] px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#848e9c] font-medium mb-1">{selectedTicker}</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {currentTickerData ? currentTickerData.bid.toFixed(5) : '---'}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-[#0ecb81] rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-[#0ecb81] rounded-full animate-ping"></div>
                  </div>
                  <span className="text-xs text-[#0ecb81] font-semibold">LIVE</span>
                </div>
                {currentTickerData && (
                  <div className="text-xs text-[#848e9c]">
                    Spread: {(currentTickerData.ask - currentTickerData.bid).toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="bg-gradient-to-r from-[#181a20] to-[#1e2329] border-b border-[#2b3139] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide shadow-md">
            <div className="flex items-center gap-1.5 min-w-max">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap transform active:scale-95 ${
                    timeframe === tf
                      ? 'bg-[#f0b90b] text-black shadow-lg shadow-[#f0b90b]/30 scale-105'
                      : 'text-[#848e9c] hover:text-white hover:bg-[#2b3139] hover:scale-105'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => setDrawingMode(!drawingMode)}
                className={`p-2 rounded-lg transition-all transform active:scale-95 ${
                  drawingMode 
                    ? 'bg-[#f0b90b]/20 text-[#f0b90b] shadow-lg shadow-[#f0b90b]/20' 
                    : 'text-[#848e9c] hover:text-white hover:bg-[#2b3139]'
                }`} 
                title="Drawing Tools"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button className="p-2 text-[#848e9c] hover:text-white hover:bg-[#2b3139] rounded-lg transition-all transform active:scale-95 hidden sm:block" title="Indicators">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </button>
              <button className="p-2 text-[#848e9c] hover:text-white hover:bg-[#2b3139] rounded-lg transition-all transform active:scale-95 hidden sm:block" title="Fullscreen">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 bg-[#181a20] overflow-hidden">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-[#2b3139] border-t-[#f0b90b] rounded-full animate-spin"></div>
                  <div className="text-[#848e9c] text-sm">Loading market data...</div>
                </div>
              </div>
            ) : (
              <CandlestickChart data={chartData} timeframe={timeframe} enableDrawing={drawingMode} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
