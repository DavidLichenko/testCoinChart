export interface MarketData {
  ticker: string
  price: number
  timestamp: string
  high: number
  low: number
  volume: number
  prevClose: number
  change: number
  changePercent: number
}

export interface SearchResult {
  ticker: string
  name: string
  description: string
}

// Add any missing types
export interface MarketSocketHookResult {
  data: Record<string, MarketData>
  error: string | null
  isConnected: boolean
}

