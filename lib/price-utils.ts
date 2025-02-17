const TIINGO_API_KEY = '5c5398add0e123606bb40277f4cb66352b386185'

export async function getCurrentPrice(ticker: string, assetType: 'IEX' | 'Forex' | 'Crypto' | 'Metal'): Promise<number> {
    try {
        switch (assetType) {
            case 'IEX':
            case 'Forex':
                const tiingoResponse = await fetch(`https://api.tiingo.com/${assetType === 'IEX' ? `iex/?tickers=${ticker}&token=${TIINGO_API_KEY}` : `tiingo/fx/top?tickers=${ticker}&token=${TIINGO_API_KEY}`}`)
                const tiingoData = await tiingoResponse.json()
                const price = assetType === 'IEX' ? tiingoData[0].last : tiingoData[0].midPrice
                console.log(price)
                return price

            case 'Crypto':
                const binanceResponse = await fetch(
                    `https://api.binance.com/api/v3/ticker/price?symbol=${ticker}`
                )
                const binanceData = await binanceResponse.json()
                return parseFloat(binanceData.price) || 0

            case 'Metal':
                const marketdataResponse = await fetch(`https://marketdata.tradermade.com/api/v1/live?api_key=FvZ0U8fmsqsqsH95WU3b&currency=${ticker}`)
                const marketdata = await marketdataResponse.json()
                // console.log(marketdata.quotes[0].mid)
                return marketdata.quotes[0].mid

            default:
                throw new Error('Unsupported asset type')
        }
    } catch (error) {
        console.error('Error fetching price:', error)
        return 0
    }
}

export function calculateProfit(
    type: 'BUY' | 'SELL',
    openPrice: number,
    currentPrice: number,
    volume: number,
    leverage: number
): number {
    const difference = type === 'BUY'
        ? currentPrice - openPrice
        : openPrice - currentPrice

    return volume * difference / leverage
}

