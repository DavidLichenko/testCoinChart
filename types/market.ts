export type MarketType = 'Forex' | 'Crypto' | 'IEX'

export interface Market {
  symbol: string
  price: number // New field to represent the price
  volume: number
  change: number
  type: MarketType
  flag1: string
  flag2: string
}
