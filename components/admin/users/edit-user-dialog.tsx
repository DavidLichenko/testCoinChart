'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { updateUser, updateUserBalance } from '@/app/(controlpanel)/admin/users/actions'

const formSchema = z.object({
    email: z.string().email(),
    number: z.string().optional(),
    name: z.string().nullable(),
    role: z.enum(['OWNER', 'ADMIN', 'WORKER', 'USER']),
    status: z.enum(['WRONGNUMBER', 'WRONGINFO', 'CALLBACK', 'LOWPOTENTIAL', 'HIGHPOTENTIAL', 'NOTINTERESTED', 'DEPOSIT', 'TRASH', 'DROP', 'NEW', 'RESIGN', 'COMPLETED']),
    can_withdraw: z.boolean(),
    blocked: z.boolean(),
    isVerif: z.boolean(),
    deposit_message: z.string().nullable(),
    withdraw_error: z.string().nullable(),
    balance: z.number().nullable(),
})

type FormValues = z.infer<typeof formSchema>

interface EditUserDialogProps {
    user: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (user: any) => void
}

export function EditUserDialog({
                                   user,
                                   open,
                                   onOpenChange,
                                   onSuccess,
                               }: EditUserDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    })

    useEffect(() => {
        if (user && open) {
            form.reset({
                email: user.email,
                number: user.number || '',
                name: user.name || '',
                role: user.role || 'USER',
                status: user.status || 'NEW',
                can_withdraw: user.can_withdraw ?? true,
                blocked: user.blocked ?? false,
                isVerif: user.isVerif ?? false,
                deposit_message: user.deposit_message || '',
                withdraw_error: user.withdraw_error || '',
                balance: user.balance?.[0]?.usd ?? user.TotalBalance ?? null,
            })
        }
    }, [user, open, form])

    async function onSubmit(values: FormValues) {
        if (!user) return

        try {
            setIsLoading(true)

            // If only balance is changed, use updateUserBalance
            const isOnlyBalanceChanged = Object.keys(form.formState.dirtyFields).length === 1
                && form.formState.dirtyFields.balance;

            let result;

            if (isOnlyBalanceChanged && values.balance !== null) {
                result = await updateUserBalance(user.id, values.balance);
            } else {
                result = await updateUser(user.id, values);
            }

            if (!result.success) {
                throw new Error(result.error)
            }

            toast({
                title: 'Success',
                description: 'User updated successfully.',
            })
            onSuccess(result.data)
            onOpenChange(false)
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update user',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user details here. Click save when youre done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="USER">User</SelectItem>
                                                <SelectItem value="WORKER">Worker</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="OWNER">Owner</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="CALLBACK">Callback</SelectItem>
                                                <SelectItem value="HIGHPOTENTIAL">High Potential</SelectItem>
                                                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                                                <SelectItem value="TRASH">Trash</SelectItem>
                                                <SelectItem value="DROP">Drop</SelectItem>
                                                <SelectItem value="RESIGN">Resign</SelectItem>
                                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="balance"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Balance (USD)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="can_withdraw"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel>Can Withdraw</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="blocked"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel>Blocked</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isVerif"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel>Verified</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="deposit_message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deposit Message</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="withdraw_error"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Withdraw Error</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save changes'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

