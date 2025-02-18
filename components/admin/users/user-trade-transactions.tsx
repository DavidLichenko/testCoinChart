'use client'

import {useEffect, useState} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditTransactionDialog } from './edit-transaction-dialog'
import { CreateTransactionDialog } from './create-transaction-dialog'
import {calculateProfit} from "@/lib/price-utils";

interface Transaction {
  id: string
  userId: string
  type: 'BUY' | 'SELL'
  volume: number
  margin: number
  leverage: number
  ticker: string
  openInA: number
  profit: number | null
  assetType: 'IEX' | 'Forex' | 'Crypto' | 'Metal'
  status: 'OPEN' | 'CLOSE'
  createdAt: string
}
export function UserTradeTransactions({ transactions, userId }: { transactions: Transaction[], userId: string }) {
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [currentProfit,setCurrentProfit] = useState(0)

  useEffect(() => {
    localTransactions.map((item)=> {
      if(item.status === 'OPEN') {
          if(item.assetType === 'Crypto') {
            const getCurrentProfit = async(type,openInA,volume,leverage,ticker) => {
              const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${ticker.toUpperCase()}`)
              const data = await response.json()
              const price = await data.price
              const profit = calculateProfit(
                  type,
                  openInA,
                  price,
                  volume,
                  leverage
              )
              setCurrentProfit(profit)
              item.profit = profit
            }
            getCurrentProfit(item.type, item.openInA, item.volume, item.leverage, item.ticker)
          } else {
            const getCurrentProfit = async(type,openInA,volume,leverage,ticker) => {
              const response2 = await fetch(
                  `/api/profit-market/${item.assetType}/${ticker}`,
              );
              const price = await response2.json();
              const profit = calculateProfit(
                  type,
                  openInA,
                  price,
                  volume,
                  leverage
              )
              setCurrentProfit(profit)
              item.profit = profit
            }
            getCurrentProfit(item.type, item.openInA, item.volume, item.leverage, item.ticker)
          }
      }
    })
  }, []);
  const handleTransactionUpdate = (updatedTransaction: Transaction) => {
    setLocalTransactions(prev =>
        prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    )
  }

  const handleTransactionCreate = (newTransaction: Transaction) => {
    setLocalTransactions(prev => [newTransaction, ...prev])
  }
  return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Trade Transactions</CardTitle>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Transaction</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Leverage</TableHead>
                <TableHead>Open Price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'BUY' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.ticker}</TableCell>
                    <TableCell>${transaction.volume.toFixed(2)}</TableCell>
                    <TableCell>${transaction.margin.toFixed(2)}</TableCell>
                    <TableCell>{transaction.leverage}x</TableCell>
                    <TableCell>${transaction.openInA.toFixed(2)}</TableCell>
                    <TableCell className={
                      transaction.profit
                          ? transaction.profit >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          : ''
                    }>
                      {transaction.profit
                          ? `$${transaction.profit.toFixed(2)}`
                          : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === 'OPEN' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTransaction(transaction)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>

          <EditTransactionDialog
              transaction={editingTransaction}
              open={!!editingTransaction}
              onOpenChange={(open) => !open && setEditingTransaction(null)}
              onSuccess={handleTransactionUpdate}
          />

          <CreateTransactionDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onSuccess={handleTransactionCreate}
              userId={userId}
          />
        </CardContent>
      </Card>
  )
}