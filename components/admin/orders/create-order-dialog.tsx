'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
    email: z.string().email(),
    type: z.enum(['DEPOSIT', 'WITHDRAW']),
    amount: z.number().positive(),
    status: z.enum(['PENDING', 'SUCCESSFUL', 'CANCELLED']),
    depositFrom: z.string().optional(),
    withdrawMethod: z.string().optional(),
    bankName: z.string().optional(),
    cryptoAddress: z.string().optional(),
    cryptoNetwork: z.string().optional(),
    cardNumber: z.string().optional(),
})

const SPANISH_BANKS = [
    'Santander',
    'Caixa Bank',
    'Abanca',
    'BBVA',
    'ING',
    'Sabadell',
    'Eurocaja',
    'Cajamar'
]

const CRYPTO_NETWORKS = {
    BTC: ['Bitcoin'],
    ETH: ['ERC20'],
    USDT: ['ERC20', 'TRC20']
}

interface CreateOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (order: any) => void
}

export function CreateOrderDialog({
                                      open,
                                      onOpenChange,
                                      onSuccess,
                                  }: CreateOrderDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [users, setUsers] = useState<{ id: string; email: string }[]>([])
    const { toast } = useToast()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'DEPOSIT',
            status: 'PENDING',
        },
    })

    const watchType = form.watch('type')
    const watchWithdrawMethod = form.watch('withdrawMethod')
    const watchDepositFrom = form.watch('depositFrom')

    useEffect(() => {
        if (open) {
            fetchUsers()
        }
    }, [open])

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users?role=USER')
            if (!response.ok) throw new Error('Failed to fetch users')
            const data = await response.json()
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
            toast({
                title: "Error",
                description: "Failed to fetch users",
                variant: "destructive",
            })
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true)
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create order')
            }

            toast({
                title: 'Success',
                description: 'Order created successfully',
            })
            form.reset()
            onSuccess(data.order)
            onOpenChange(false)
        } catch (error) {
            console.error('Error in onSubmit:', error)
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create order',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>User Email</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select user email" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.email}>
                                                    {user.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select order type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="DEPOSIT">Deposit</SelectItem>
                                            <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {watchType === 'DEPOSIT' && (
                            <FormField
                                control={form.control}
                                name="depositFrom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deposit From</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select deposit source" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BTC">BTC</SelectItem>
                                                <SelectItem value="ETH">ETH</SelectItem>
                                                <SelectItem value="USDT">USDT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {watchType === 'WITHDRAW' && (
                            <FormField
                                control={form.control}
                                name="withdrawMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Withdraw Method</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select withdrawal method" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Bank">Bank</SelectItem>
                                                <SelectItem value="Crypto">Crypto</SelectItem>
                                                <SelectItem value="Card">Card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {watchType === 'WITHDRAW' && watchWithdrawMethod === 'Bank' && (
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank Name</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select bank" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SPANISH_BANKS.map((bank) => (
                                                    <SelectItem key={bank} value={bank}>
                                                        {bank}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {watchType === 'WITHDRAW' && watchWithdrawMethod === 'Crypto' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="cryptoAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Crypto Address</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter crypto address" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cryptoNetwork"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Network</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select network" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {watchDepositFrom && CRYPTO_NETWORKS[watchDepositFrom as keyof typeof CRYPTO_NETWORKS]?.map((network) => (
                                                        <SelectItem key={network} value={network}>
                                                            {network}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {watchType === 'WITHDRAW' && watchWithdrawMethod === 'Card' && (
                            <FormField
                                control={form.control}
                                name="cardNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Card Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter card number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select order status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Order'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

