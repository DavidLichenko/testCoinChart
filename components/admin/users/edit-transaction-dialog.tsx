'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentPrice, calculateProfit } from '@/lib/price-utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
}

interface EditTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (transaction: Transaction) => void
}

export function EditTransactionDialog({
                                        transaction,
                                        open,
                                        onOpenChange,
                                        onSuccess,
                                      }: EditTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [editedTransaction, setEditedTransaction] = useState<Transaction | null>(null)
  const [changes,setChanges] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (transaction) {
      setEditedTransaction(transaction)
    }
  }, [transaction])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (transaction && open) {
      const fetchPrice = async () => {
        if(transaction.assetType !== 'Crypto' && transaction.assetType !== 'Metal') {
          if (transaction.status === "CLOSE") {
            return transaction.profit
          }
          const response2 = await fetch(
              `/api/profit-market/${transaction.assetType}/${transaction.ticker}`,
          );
          const price = await response2.json();
          setCurrentPrice(price)
        } else {
          if (transaction.status === "CLOSE") {
            return transaction.profit
          }
          const price = await getCurrentPrice(transaction.ticker, transaction.assetType)
          setCurrentPrice(price)
        }
      }
      if (currentPrice && editedTransaction) {
        const profit = calculateProfit(
            editedTransaction.type,
            editedTransaction.openInA,
            currentPrice,
            editedTransaction.volume,
            editedTransaction.leverage
        )
        setEditedTransaction(prev => prev ? {...prev, profit} : null)
      }
      fetchPrice()
      // intervalId = setInterval(fetchPrice, 5000) // Update every 5 seconds
    }

    return () => {

    }
  }, [transaction, open, changes])

  const handleSave = async () => {
    if (!editedTransaction) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${editedTransaction.userId}/transactions/${editedTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTransaction),
      })

      if (!response.ok) {
        throw new Error('Failed to update transaction')
      }

      const updatedTransaction = await response.json()
      onSuccess(updatedTransaction)
      onOpenChange(false)

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      })
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!editedTransaction) return null

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Ticker</Label>
              <Input value={editedTransaction.ticker} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Input value={editedTransaction.type} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Volume</Label>
              <Input
                  type="number"
                  value={editedTransaction.volume}
                  onChange={(e) => {
                    setEditedTransaction(prev => prev ? {...prev, volume: parseFloat(e.target.value)} : null)
                    setChanges(changes + 1)
                  }
                  }
              />
            </div>
            <div className="grid gap-2">
              <Label>Leverage</Label>
              <Input
                  type="number"
                  value={editedTransaction.leverage}
                  onChange={(e) => {
                    setEditedTransaction(prev => prev ? {...prev, leverage: parseInt(e.target.value)} : null)
                    setChanges(changes + 1)
                  }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Open Price</Label>
              <Input
                  type="number"
                  value={editedTransaction.openInA}
                  onChange={(e) => {
                    setEditedTransaction(prev => prev ? {...prev, openInA: parseFloat(e.target.value)} : null)
                    setChanges(changes + 1)
                  }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Current Price</Label>
              <Input value={currentPrice?.toFixed(2) || 'Loading...'} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Current Profit</Label>
              <Input
                  value={editedTransaction.profit ? `$${editedTransaction.profit.toFixed(2)}` : 'Calculating...'}
                  className={editedTransaction.profit && editedTransaction.profit >= 0 ? 'text-green-600' : 'text-red-600'}
                  disabled
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                  value={editedTransaction.status}
                  onValueChange={(value) => {
                    setEditedTransaction(prev => prev ? {...prev, status: value as 'OPEN' | 'CLOSE'} : null)
                    setChanges(changes + 1)
                  }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">OPEN</SelectItem>
                  <SelectItem value="CLOSE">CLOSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  )
}

