"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function CreditCardForm() {
  return (
    <div className="space-y-4 p-6">
      <div className="space-y-2">
        <Label className="text-custom-100">Amount</Label>
        <Input 
          type="number" 
          placeholder="0.00"
          className="bg-custom-900 border-custom-800 text-custom-100"
        />
        <p className="text-xs text-custom-400">
          Recommended: $ 0.00 • Min: $ 0.00 • Max: $ 0.00
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-custom-100">Cardholder Name</Label>
        <Input 
          placeholder="John Doe"
          className="bg-custom-900 border-custom-800 text-custom-100"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-custom-100">Card Number</Label>
        <Input 
          placeholder="1234 5678 9012 3456"
          className="bg-custom-900 border-custom-800 text-custom-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-custom-100">Expiry Date</Label>
          <Input 
            placeholder="MM/YY"
            className="bg-custom-900 border-custom-800 text-custom-100"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-custom-100">CVV</Label>
          <Input 
            placeholder="123"
            className="bg-custom-900 border-custom-800 text-custom-100"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          Withdraw
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-custom-100 mb-4">Withdrawal History</h3>
        <div className="rounded-lg bg-custom-900/50 p-4 text-custom-300 text-center">
          You don`&apos;`t have any withdrawal history
        </div>
      </div>
    </div>
  )
}

