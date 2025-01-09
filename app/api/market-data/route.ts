import { NextRequest, NextResponse } from 'next/server'
import { FOREX_TICKERS, CRYPTO_TICKERS } from '@/constants/tickers'

export async function GET(req: NextRequest) {
    try {
        const forexQuery = FOREX_TICKERS.join(',').toLowerCase()
        const cryptoQuery = CRYPTO_TICKERS.join(',').toLowerCase()

        const [forexResponse, cryptoResponse] = await Promise.all([
            fetch(`https://api.tiingo.com/tiingo/fx/top?tickers=${forexQuery}&token=5c5398add0e123606bb40277f4cb66352b386185`),
            fetch(`https://api.tiingo.com/tiingo/crypto/top?tickers=${cryptoQuery}&token=5c5398add0e123606bb40277f4cb66352b386185`)
        ])

        const [forexData, cryptoData] = await Promise.all([
            forexResponse.json(),
            cryptoResponse.json()
        ])

        return NextResponse.json({forexData, cryptoData})
    } catch (error) {
        console.error('Error fetching market data:', error)
        return NextResponse.json({error: 'Failed to fetch market data'}, {status: 500})
    }
}