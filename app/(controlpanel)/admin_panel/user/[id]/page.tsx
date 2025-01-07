'use client'
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group"
import React, {useEffect, useState} from "react";
import Image from "next/image";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

import {
    addComments,
    getComments,
    GetUserBalanceById,
    GetUserById,
    GetUserTransById,
    updateDataAboutUser, updateDataAboutUserBalace
} from "@/actions/form";
import {Skeleton} from "@/components/ui/skeleton";
import {Label} from "@/components/ui/label";
import {DeleteIcon} from "lucide-react";
import {index} from "d3-array";
import { Switch } from "@/components/ui/switch";
import {toast} from "@/components/ui/use-toast";

export default  function Page({
                                  params,
                              }: {
    params: Promise<{ id: string }>
}) {
    // @ts-ignore
    const id = (params).id
    const [userImage, setUserImage] = useState<any>('')

    const [userMainData,setUserMainData] = useState({})
    const [userTransData,setUserTransData] = useState({})
    const [userBalanceData,setUserBalanceData] = useState({})
    const [userBalance, setUserBalance] = useState(0)
    const [count, setCount] = useState(0)
    const [userVerifData, setUserVerifData] = useState({})
    const [isLoading,setLoading] = useState<boolean>(true)
    const [userCryptoAddress, setUserCryptoAddress] = useState("")
    const [depositMessage, setDepositMessage] = useState("")
    const [comments,setComments] = useState([])
    const [withdrawError, setWithdrawError] = useState("")
    const [isVerif, setIsVerif] = useState(false)
    const [canWithdraw, setCanWithdraw] = useState(false)
    const [blocked, setBlocked] = useState(false)
    const [currentComment,setCurrentComment] = useState('')
    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '')
        setUserBalance(parseFloat(value))
    }
    useEffect(() => {
        const getUserData = async() => {
            const user_main = await GetUserById(id)
            const user_trans = await GetUserTransById(id)
            const user_balance = await GetUserBalanceById(id)
            const user_comments = await getComments(id)
            setUserMainData(user_main)
// @ts-ignore
            setComments(user_comments.messages ? user_comments.messages : [])
            setUserTransData(user_trans)
            setUserBalanceData(user_balance)
            setUserBalance(user_balance.usd)
            setIsVerif(user_main.isVerif)
            setCanWithdraw(user_main.can_withdraw)
            setBlocked(user_main.blocked)
            setUserCryptoAddress(user_main.user_crypto_address)
            setWithdrawError(user_main.withdraw_error)
            setDepositMessage(user_main.deposit_message)
            setLoading(false)
        }
        getUserData()

        return () => {
            setLoading(true)
        }
    },[count])
    console.log(userMainData)
    // console.log(comments)
    const AccountImage = () => {
        return (
            <>
                {
                    userImage !== ''
                        ? <><Image alt={'userImage'} src={userImage} width={256} height={256} /></>
                        : <div className="flex items-center justify-center  text-md bg-secondary border-1 border-border"><Skeleton className={'w-32 h-32 mx-auto flex items-center justify-center'}><span className={'opacity-20 h-full w-full'}>NO PHOTO :(</span></Skeleton></div>
                }

            </>
        )
    }
    const items = [
        {
            title: "User",
            url: '/',
            baseUrl:'/admin_panel/user/'

        },
        {
            title: "Transaction",
            url: '/transactions',
            baseUrl:'/admin_panel/user/'

        },
        {
            title: "Verification",
            url: "/verification",
            baseUrl:'/admin_panel/user/'

        },
        {
            title: "Live Chat",
            url: "/livechat",
            baseUrl:'/admin_panel/user/'

        },
        {
            title: "Settings",
            url: "/admin_panel/settings",
            baseUrl:'/admin_panel/user/'

        }
    ]
    const addComment = (message) => {
        if (message == '') return false
        const newComment = {
            date:new Date().toLocaleString(),
            message:message,
        }
        comments.push(newComment)

        addComments(id,comments)
        setCurrentComment('')
        setCount(count + 1)

    }
    const deleteComment = (message) => {
        const removeComment = (value, index, arr) => {
            if (value == message) {
                arr.splice(index, 1)
                return true
            }
            return false
        }
        comments.filter(removeComment)
        addComments(id,comments)
        setCount(count + 1)

    }
    // (user_crypto_address, deposit_message, withdraw_error, isVerif, can_withdraw, blocked, id)
    async function saveUser() {
        const updateData = await updateDataAboutUser(userCryptoAddress, depositMessage, withdrawError, isVerif, canWithdraw, blocked, id)
        const updateDataBalance = await updateDataAboutUserBalace(userBalance,id)
        toast({
            title: "Success",
            description: "Saved successfully!",

        })
    }
    return (
        <div className="h-screen">
            <header className='flex w-[80%] mx-auto h-[10vh] justify-center items-center'>
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem className='flex gap-12'>
                            {items.map((item, index) => (
                                <Link href={'' + item.baseUrl  + id + item.url} legacyBehavior passHref key={index}>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                        {item.title}
                                    </NavigationMenuLink>
                                </Link>
                            ))}

                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </header>
            <main className="main w-[85%] mx-auto h-[70vh] overflow-y-auto p-12 border-border border-4 rounded-lg">
                <div className='flex w-full justify-between'>
                    <div className="flex gap-12">
                        <div className="flex flex-col justify-start items-center gap-12">
                            <div className={'flex flex-col gap-4'}>
                                <Label htmlFor="street_adress">Street Address</Label>

                                <Input alt={'Street Address'} disabled={true} id="street_adress"
                                    // @ts-ignore
                                       value={userVerifData ? userVerifData.street_adress : ''}
                                       title={'Street Address'}/>
                            </div>
                            <div className={'flex flex-col gap-4'}>
                                <Label htmlFor="city">City</Label>
                                <Input alt={'City'} id="city" disabled={true}
                                    // @ts-ignore
                                       value={userVerifData ? userVerifData.city : ''}
                                       title={'City'}/>
                            </div>
                            <div className={'flex flex-col gap-4'}>
                                <Label htmlFor="zip_code">Zip Code</Label>
                                <Input alt={'Street Address'} disabled={true} id="zip_code"
                                    // @ts-ignore
                                       value={Object.keys(userVerifData).length !== 0 ? userVerifData.zip_code : ''}
                                       title={'Zip Code'}/>
                            </div>
                        </div>
                        <div className="flex flex-col justify-start items-center gap-12">
                            <div className={'flex flex-col gap-4'}>
                                <Label htmlFor="name">Name</Label>
                                <Input alt={'ame'} disabled={true} id="name"
                                    // @ts-ignore
                                       value={Object.keys(userMainData).length !== 0 ? userMainData.name : ''}
                                       title={'Name'}/>
                            </div>
                            <div className={'flex flex-col gap-4'}>
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input alt={'Last Name'} disabled={true} id="last_name"
                                    // @ts-ignore
                                       value={Object.keys(userMainData).length !== 0 ? userMainData.name : ''}
                                       title={'Last Name'}/>
                            </div>
                            <div className={'flex flex-col gap-4'}>
                                <Label htmlFor="email">Email</Label>
                                <Input alt={'Email'} disabled={true} id="email"
                                    // @ts-ignore
                                       value={Object.keys(userMainData).length !== 0 ? userMainData.email : ''}
                                       title={'Email'}/>
                            </div>
                        </div>

                    </div>
                    <div className='card bg-background'>
                        <Card className="border-border border-4 bg-background">
                            <CardContent className="overflow-visible p-2 bg-background">
                                <AccountImage/>
                            </CardContent>
                        </Card>
                        <div className={'flex w-full justify-center mt-12 mx-auto text-xl'}>$ {userBalance}</div>

                    </div>

                    {/*<div className='h-1/2 text-xl flex flex-col gap-12'>*/}
                    {/*    <div className={'flex gap-6 items-center justify-center'}>*/}
                    {/*        <span>Total balance:</span>*/}
                    {/*        <Input  className='uppercase flex w-32' title={'Total Balance'} alt={'Total Balance'} value={userBalance} onChange={(e)=>{*/}
                    {/*            setUserBalance(e.target.value)*/}
                    {/*        }}/>$*/}
                    {/*        <Button variant={'outline'}><TiTick/></Button>*/}
                    {/*    </div>*/}
                    {/*    <span className='uppercase flex w-full'>Email: {isLoading ? <Skeleton className={'w-60'}><span className="w-60 h-12 opacity-0">0</span></Skeleton> : userMainData.email}</span>*/}

                    {/*    <span></span>*/}
                    {/*</div>*/}
                    {/*<div className='card bg-background'>*/}
                    {/*    <Card className="p-6 border-border border-4 bg-background">*/}
                    {/*        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start  bg-background">*/}
                    {/*            <h4 className="font-bold text-large">Dovid Lichenko</h4>*/}
                    {/*        </CardHeader>*/}
                    {/*        <CardBody className="overflow-visible py-4 bg-background">*/}
                    {/*            <AccountImage width={128} height={128}/>*/}
                    {/*        </CardBody>*/}
                    {/*    </Card>*/}
                    {/*</div>*/}
                </div>
                <div className="flex w-full mt-10 h-full gap-12">
                    <Card className="w-2/4 h-full">
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardTitle>User Information</CardTitle>
                                <Button type={'submit'} onClick={()=>{
                                    saveUser()
                                }}>Save</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="userBalance">User Balance</Label>
                                    <Input
                                        id="userBalance"
                                        value={userBalance}
                                        onChange={handleBalanceChange}
                                        placeholder="Enter balance"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="userCryptoAddress">User Crypto Address</Label>
                                    <Input
                                        id="userCryptoAddress"
                                        value={userCryptoAddress}
                                        onChange={(e) => setUserCryptoAddress(e.target.value)}
                                        placeholder="Enter crypto address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="depositMessage">Deposit Message</Label>
                                    <Input
                                        id="depositMessage"
                                        value={depositMessage}
                                        onChange={(e) => setDepositMessage(e.target.value)}
                                        placeholder="Enter deposit message"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="withdrawError">Withdraw Error</Label>
                                    <Input
                                        id="withdrawError"
                                        value={withdrawError}
                                        onChange={(e) => setWithdrawError(e.target.value)}
                                        placeholder="Enter withdraw error"
                                    />
                                </div>
                                <div className="flex flex-col gap-12 !mt-12">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="isVerif">Is Verified</Label>
                                        <Switch
                                            id="isVerif"
                                            checked={isVerif}
                                            onCheckedChange={setIsVerif}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="canWithdraw">Can Withdraw</Label>
                                        <Switch
                                            id="canWithdraw"
                                            checked={canWithdraw}
                                            onCheckedChange={setCanWithdraw}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="blocked">Blocked</Label>
                                        <Switch
                                            id="blocked"
                                            checked={blocked}
                                            onCheckedChange={setBlocked}
                                        />
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                    <div className="comments w-2/4 flex gap-4 flex-col">
                        <Label htmlFor="comments">Comments</Label>
                        <div className="flex gap-4">
                            <Input value={currentComment} onChange={(e) => {
                                setCurrentComment(e.target.value)
                                console.log(currentComment)

                            }
                            } id={'comments'} placeholder={'Enter comments'}/>
                            <Button onClick={() => {
                                addComment(currentComment)
                            }}>Enter</Button>
                        </div>
                        <div
                            className="max-h-full overflow-y-scroll w-full flex flex-col gap-12 mt-6 border-border border-2 rounded-lg p-12">
                            {
                                comments.length > 0 ? comments.map(({date, message}, index)=>(
                                        <div key={index} className={'flex w-full justify-between gap-12'}>
                                            <span>{message}</span>
                                            <div className='flex gap-4'>
                                                <span>{date}</span>
                                                <Button onClick={()=>{
                                                    deleteComment(comments[index])
                                                }}><DeleteIcon key={index} width={24} height={24}/></Button>
                                            </div>
                                        </div>
                                    )) :
                                    <span>No comments here</span>
                            }
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}