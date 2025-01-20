"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function CreditCardForm() {
    const [amount, setAmount] = useState("")
    const [cardholderName, setCardholderName] = useState("")
    const [cardNumber, setCardNumber] = useState("")
    const [expiryDate, setExpiryDate] = useState("")
    const [cvv, setCvv] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const validateForm = () => {
        if (!amount || !cardholderName || !cardNumber || !expiryDate || !cvv) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive",
            })
            return false
        }
        return true
    }

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            const response = await fetch("/api/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "WITHDRAW",
                    status: "PENDING",
                    amount: Number.parseFloat(amount),
                    withdrawMethod: "CreditCard",
                    cardholderName,
                    cardNumber,
                    expiryDate,
                    cvv,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to process withdrawal")
            }

            toast({
                title: "Withdrawal Request Submitted",
                description: `Your withdrawal of $${amount} has been submitted for processing.`,
            })

            // Reset form
            setAmount("")
            setCardholderName("")
            setCardNumber("")
            setExpiryDate("")
            setCvv("")
        } catch (error) {
            console.error("Error processing withdrawal:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to process withdrawal. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleWithdraw} className="space-y-4 p-6">
            <div className="space-y-2">
                <Label htmlFor="amount" className="text-custom-100">
                    Amount
                </Label>
                <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-custom-900 border-custom-800 text-custom-100"
                />
                <p className="text-xs text-custom-400">Recommended: $ 0.00 • Min: $ 0.00 • Max: $ 0.00</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="cardholderName" className="text-custom-100">
                    Cardholder Name
                </Label>
                <Input
                    id="cardholderName"
                    placeholder="John Doe"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="bg-custom-900 border-custom-800 text-custom-100"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="cardNumber" className="text-custom-100">
                    Card Number
                </Label>
                <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="bg-custom-900 border-custom-800 text-custom-100"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="expiryDate" className="text-custom-100">
                        Expiry Date
                    </Label>
                    <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="bg-custom-900 border-custom-800 text-custom-100"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-custom-100">
                        CVV
                    </Label>
                    <Input
                        id="cvv"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="bg-custom-900 border-custom-800 text-custom-100"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Withdraw"}
                </Button>
            </div>
        </form>
    )
}

