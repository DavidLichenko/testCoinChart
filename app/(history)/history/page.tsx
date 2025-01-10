'use client'

import { useState, useEffect } from 'react'
import { TradeHistoryTable } from '@/components/trade-history-table'
import { TradeTransactions } from "@/actions/form"

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([])

    const fetchTransactions = async () => {
        const data = await TradeTransactions()
        setTransactions(data)
    }

    useEffect(() => {
        fetchTransactions()
    }, [])

    return (
        <div className="container mx-auto p-4">
            <TradeHistoryTable data={transactions} refreshTransactions={fetchTransactions} />
        </div>
    )
}