'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditTransactionDialog } from './edit-transaction-dialog'

export function UserTradeTransactions({ transactions, userId }) {
  const [localTransactions, setLocalTransactions] = useState(transactions)
  const [editingTransaction, setEditingTransaction] = useState(null)

  const handleTransactionUpdate = (updatedTransaction) => {
    setLocalTransactions(prev =>
        prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    )
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle>Trade Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Leverage</TableHead>
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
                    <TableCell>{transaction.leverage}x</TableCell>
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
        </CardContent>
      </Card>
  )
}

