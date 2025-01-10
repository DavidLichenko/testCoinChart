'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from "@/prisma/prisma-client"
import { getForexDateRange, isForexMarketOpen } from "@/utils/dateUtils"

async function getCurrentPrice(ticker: string, type: 'IEX' | 'Crypto' | 'Forex'): Promise<number> {
  switch (type) {
    case 'IEX':
      const iexResponse = await fetch(`https://srv677099.hstgr.cloud/api/stocks/${ticker}/candlesticks/`)
      const iexData = await iexResponse.json()
      return parseFloat(iexData.data[iexData.data.length - 1].close)
    case 'Crypto':
      const cryptoResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${ticker.toUpperCase()}`)
      const cryptoData = await cryptoResponse.json()
      return parseFloat(cryptoData.price)
    case 'Forex':
      if (!isForexMarketOpen()) {
        throw new Error('Forex market is currently closed')
      }
      const { start_date, end_date } = getForexDateRange('minute')
      const forexResponse = await fetch(
          `https://marketdata.tradermade.com/api/v1/timeseries?currency=${ticker}&api_key=FvZ0U8fmsqsqsH95WU3b&start_date=${start_date}&end_date=${end_date}&format=records&interval=minute`
      )
      const forexData = await forexResponse.json()
      if (forexData.quotes && forexData.quotes.length > 0) {
        return parseFloat(forexData.quotes[forexData.quotes.length - 1].close)
      } else {
        throw new Error('No recent forex data available')
      }
    default:
      throw new Error('Unsupported instrument type')
  }
}

function calculateProfit(transaction: any, currentPrice: number): number {
  const openPrice = transaction.openIn
  const volume = transaction.volume
  const leverage = transaction.leverage

  if (transaction.type === 'BUY') {
    return (currentPrice - openPrice) * volume * leverage
  } else {
    return (openPrice - currentPrice) * volume * leverage
  }
}

export async function closeAllTransactions() {
  const currentDate = new Date()

  try {
    const openTransactions = await prisma.trade_Transaction.findMany({
      where: { status: 'OPEN' },
    })

    for (const transaction of openTransactions) {
      const currentPrice = await getCurrentPrice(transaction.ticker, transaction.assetType)
      const profit = calculateProfit(transaction, currentPrice)

      await prisma.trade_Transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CLOSE',
          endAt: currentDate,
          closeIn: currentPrice,
          profit: profit,
        }
      })

      await prisma.balances.update({
        where: { userId: transaction.userId },
        data: {
          usd: {
            increment: transaction.volume + profit,
          },
        },
      })
    }

    revalidatePath('/transactions')
    return { success: true, message: 'All open transactions have been closed.' }
  } catch (error) {
    console.error('Failed to close all transactions:', error)
    return { success: false, message: 'Failed to close all transactions.' }
  }
}

export async function closeTransaction(id: string) {
  const currentDate = new Date()

  try {
    const transaction = await prisma.trade_Transaction.findUnique({
      where: { id: id },
    })

    if (!transaction || transaction.status === 'CLOSE') {
      return { success: false, message: 'Transaction not found or already closed.' }
    }

    const currentPrice = await getCurrentPrice(transaction.ticker, transaction.assetType)
    const profit = calculateProfit(transaction, currentPrice)

    const updatedTransaction = await prisma.trade_Transaction.update({
      where: { id: id },
      data: {
        status: 'CLOSE',
        endAt: currentDate,
        closeIn: currentPrice,
        profit: profit,
      }
    })

    await prisma.balances.update({
      where: { userId: transaction.userId },
      data: {
        usd: {
          increment: transaction.volume + profit,
        },
      },
    })

    revalidatePath('/transactions')
    return { success: true, message: 'Transaction has been closed.', transaction: updatedTransaction }
  } catch (error) {
    console.error('Failed to close transaction:', error)
    return { success: false, message: 'Failed to close transaction.' }
  }
}

