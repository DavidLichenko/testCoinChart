"use client"
import React, {useEffect, useState} from 'react';
import {Sidebar} from "@/components/sidebar";
import {Button} from "@/components/ui/button";
import {UserSettingsModal} from "@/components/user-settings-modal";
import {GetCurrentData, GetSession, GetUserBalance} from "@/actions/form";
import {Skeleton} from "@/components/ui/skeleton";
import { useBalance } from "@/context/BalanceContext";
import {Loader, LoaderCircle, LoaderIcon, Settings} from "lucide-react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/ui/dialog";
import SettingsTab from "@/components/tabs/settings-tab";

const HeaderMobile = () => {
    const [currentUserData,setCurrentUserData] = useState({})
    const [userBalance,setUserBalance] = useState(null)
    const { balance, isLoading } = useBalance();
    const [loading,setIsLoading] = useState(true)
    const [ses,setSes] = useState(false)
    const [showSettings,setShowSettings] = useState(false)
    async function currentSeesion() {
        const session = await GetSession()
        if (!session) {
            return
        }
        setCurrentUserData(await GetCurrentData())
        setSes(true)
        setIsLoading(false)
    }

    useEffect(() => {
        currentSeesion()
    }, [isLoading]);
    return (
        <>
                    <div
                        className="fixed top-0 block md:hidden left-0 right-0 z-50 bg-sidebar border-t border-custom-400">
                        <div className="flex h-16 w-full gap-6 px-8 items-center justify-between">
                            <div className={'flex gap-4 items-center justify-center'}>
                                <Sidebar/>
                                <Button className='text-md font-bold  bg-sidebar-accent'>
                                    <div className='flex flex-col'>
                                        <div className='flex flex-row items-center justify-between w-full'>
                                            <span className={'text-md'}> {loading ? <Skeleton className={'w-8 h-2 flex items-center justify-center'}><LoaderCircle className={'animate-spin'} /></Skeleton>: '$ ' + balance.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </Button>
                            </div>
                            <div className="flex gap-4 items-center">
                                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Settings className="h-4 w-4" />
                                            <span className="sr-only">User Settings</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] flex flex-col  h-5/6 p-0 bg-sidebar text-gray-100 border-gray-800">
                                        {/*<DialogHeader>*/}
                                        {/*  <DialogTitle>*/}
                                        {/*    <span className="sr-only">Live Chat</span> /!* Visually hidden for accessibility *!/*/}
                                        {/*  </DialogTitle>*/}
                                        {/*</DialogHeader>*/}
                                        <SettingsTab />
                                    </DialogContent>
                                </Dialog>
                                {/*{userBalance ?*/}
                                {/*    <UserSettingsModal totalAmount={balance} totalDeposit={0} totalProfit={0}*/}
                                {/*                       userData={currentUserData}/> :*/}
                                {/*    <UserSettingsModal totalAmount={0} totalDeposit={0} totalProfit={0} userData={{}}/>*/}
                                {/*}*/}
                            </div>

                        </div>
                        {/*<div className="h-16 block md:hidden"></div>*/}
                    </div>
        </>
    );
};

export default HeaderMobile;