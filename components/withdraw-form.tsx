"use client"

import { useState } from "react"
import { CreditCard, Building2, Bitcoin } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CreditCardForm } from "./withdraw/credit-card-form"
import { BankTransferForm } from "./withdraw/bank-transfer-form"
import { CryptoForm } from "./withdraw/crypto-form"

export function WithdrawForm() {
  return (
    <Card className="w-full max-w-md mx-auto bg-custom-950 border-custom-800">
      <Tabs defaultValue="credit-card" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-custom-900">
          <TabsTrigger value="credit-card" className="data-[state=active]:bg-custom-800">
            <div className="flex flex-col items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Credit Card</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="bank" className="data-[state=active]:bg-custom-800">
            <div className="flex flex-col items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Bank Connect</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="crypto" className="data-[state=active]:bg-custom-800">
            <div className="flex flex-col items-center gap-2">
              <Bitcoin className="h-4 w-4" />
              <span>Crypto</span>
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="credit-card">
          <CreditCardForm />
        </TabsContent>
        <TabsContent value="bank">
          <BankTransferForm />
        </TabsContent>
        <TabsContent value="crypto">
          <CryptoForm />
        </TabsContent>
      </Tabs>
    </Card>
  )
}

