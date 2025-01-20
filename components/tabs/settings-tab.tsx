import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {Send} from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import {updateUserPassword} from "@/actions/form";
import { useToast } from "@/components/ui/use-toast"


const formSchema = z.object({
    password: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export default function SettingsTab() {
    const [currency, setCurrency] = useState('USD')
    const [language, setLanguage] = useState('EN')
    const { toast } = useToast()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })
    const updatePassword = async (password) => {
        await updateUserPassword(password)
        toast({
            title: 'Success',
            description: 'Password changed successfully',
        })
    }
    function onSubmit(values: z.infer<typeof formSchema>) {
        if (values.password === values.confirmPassword) {
            updatePassword(values.password)
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 h-full">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-6 grid gap-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}  className=" grid gap-6">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} className="w-full" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} className="w-full mb-4" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full mt-4">Change Password</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/*<Select value={currency} onValueChange={setCurrency}>*/}
                        {/*    <SelectTrigger className="w-full border-background border-2">*/}
                        {/*        <SelectValue placeholder="Select currency"/>*/}
                        {/*    </SelectTrigger>*/}
                        {/*    <SelectContent>*/}
                        {/*        <SelectItem value="USD">🇺🇸 USD</SelectItem>*/}
                        {/*        <SelectItem value="EUR">🇪🇺 EUR</SelectItem>*/}
                        {/*    </SelectContent>*/}
                        {/*</Select>*/}
                        {/*<Select value={language} onValueChange={setLanguage}>*/}
                        {/*    <SelectTrigger className="w-full bg-background">*/}
                        {/*        <SelectValue placeholder="Select language"/>*/}
                        {/*    </SelectTrigger>*/}
                        {/*    <SelectContent>*/}
                        {/*        <SelectItem value="EN">🇬🇧 English</SelectItem>*/}
                        {/*        <SelectItem value="SP">🇪🇸 Spanish</SelectItem>*/}
                        {/*    </SelectContent>*/}
                        {/*</Select>*/}
                        <div className={'block sm:hidden'}>
                            <ThemeSwitcher/>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}

