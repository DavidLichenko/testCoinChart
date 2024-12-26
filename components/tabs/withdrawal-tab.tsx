import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {Card, CardContent} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

export default function WithdrawalTab() {
    const [amount, setAmount] = useState('')

    return (
        <div className={'flex flex-col h-full gap-4'}>
            <Card>
                <CardContent className="p-4">
                    <Input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full"
                    />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 h-full">
                    <Tabs defaultValue="crypto" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 gap-4  bg-background mb-12">
                            <TabsTrigger value="crypto" className="text-xs border-border border-3 bg-background sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-background py-2">Crypto</TabsTrigger>
                            <TabsTrigger value="bank" className="text-xs border-border border-3 bg-background sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-background py-2">Bank</TabsTrigger>
                            <TabsTrigger value="card" className="text-xs border-border border-3 bg-background sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-background py-2">Card</TabsTrigger>
                        </TabsList>
                        <TabsContent value="crypto" className="mt-2">Crypto withdrawal options</TabsContent>
                        <TabsContent value="bank" className="mt-2">Bank withdrawal options</TabsContent>
                        <TabsContent value="card" className="mt-2">Card withdrawal options</TabsContent>
                    </Tabs>
                    <Button className="w-full">Confirm Withdrawal</Button>
                </CardContent>
            </Card>
        </div>
    )
}

