const TIINGO_API_KEY = "5c5398add0e123606bb40277f4cb66352b386185"
const TIINGO_HEADERS = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${TIINGO_API_KEY}`
  }
}

export async function fetchForexData() {
  try {
    const response = await fetch(
      'https://api.tiingo.com/tiingo/fx/top?tickers=eurusd,gbpusd,usdjpy,audusd,usdcad&token=5c5398add0e123606bb40277f4cb66352b386185',
    )
    const data = await response.json()
    return data.map((item: any) => ({
      symbol: item.ticker.toUpperCase(),
      bid: item.bidPrice,
      ask: item.askPrice,
      change: item.percentChange || 0,
      volume: item.volume || 0,
      type: 'Forex' as const,
      flag1: item.ticker.slice(0, 2).toLowerCase(),
      flag2: item.ticker.slice(3, 5).toLowerCase(),
    }))
  } catch (error) {
    console.error('Error fetching Forex data:', error)
    return []
  }
}

export async function fetchCryptoData() {
  try {
    const response = await fetch(
      'https://api.tiingo.com/tiingo/crypto/top?tickers=btcusd,ethusd,xrpusd,ltcusd,bchusd&token=5c5398add0e123606bb40277f4cb66352b386185'
    )
    const data = await response.json()
    return data.map((item: any) => ({
      symbol: item.ticker.toUpperCase(),
      bid: item.bidPrice || item.lastPrice || 0, // Fallback to lastPrice or 0 if bidPrice is not available
      ask: item.askPrice || item.lastPrice || 0, // Fallback to lastPrice or 0 if askPrice is not available
      change: item.percentChange || 0,
      volume: item.volumeNotional || 0,
      type: 'Crypto' as const,
      flag1: item.ticker.slice(0, 3).toLowerCase(),
      flag2: 'us',
    }))
  } catch (error) {
    console.error('Error fetching Crypto data:', error)
    return []
  }
}

export async function fetchIEXData() {
  try {
    const response = await fetch(
      'https://api.tiingo.com/iex?tickers=aapl,msft,googl,amzn,meta&token=5c5398add0e123606bb40277f4cb66352b386185'
    )
    const data = await response.json()
    return data.map((item: any) => ({
      symbol: item.ticker.toUpperCase(),
      bid: item.last,
      ask: item.last,
      change: item.percentChange || 0,
      volume: item.volume || 0,
      type: 'IEX' as const,
      flag1: 'us',
      flag2: 'us',
    }))
  } catch (error) {
    console.error('Error fetching IEX data:', error)
    return []
  }
}

