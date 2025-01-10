"use client"
import React, {useEffect, useState} from 'react';
import {Sidebar} from "@/components/sidebar";
import {Button} from "@nextui-org/react";
import {UserSettingsModal} from "@/components/user-settings-modal";
import {GetCurrentData, GetSession, GetUserBalance} from "@/actions/form";
import {Skeleton} from "@/components/ui/skeleton";


const HeaderMobile = () => {
    const [currentUserData,setCurrentUserData] = useState({})
    const [userBalance,setUserBalance] = useState(null)
    const [loading,setIsLoading] = useState(true)
    const [ses,setSes] = useState(false)
    async function currentSeesion() {
        const session = await GetSession()
        if (!session) {
            return
        }
        setCurrentUserData(await GetCurrentData())
        const getBalance = await GetUserBalance()
        setUserBalance(getBalance.usd)
        setSes(true)
        setIsLoading(false)
    }

    useEffect(() => {
        currentSeesion()
    }, []);
    return (
        <>
            {!ses ? <></> :
                <>
                    {loading ? <Skeleton className={'h-screen w-full block md:hidden '}><span className={'opacity-0'}>0</span></Skeleton> :
                        <>
                            <div
                                className="flex justify-between md:hidden  fixed top-0 z-[9000] w-full items-center border-b border-border bg-sidebar  px-8 py-2">
                                <div className={'flex gap-4 items-center justify-center'}>
                                    <Sidebar/>
                                    <Button className='text-md font-bold  bg-sidebar-accent'>
                                        <div className='flex flex-col'>
                                            <div className='flex flex-row items-center justify-between w-full'>
                                                {userBalance ?
                                                    <span className={'text-md'}>$ {userBalance}</span> :
                                                    <span className={'text-md'}>$0.00</span>
                                                }
                                            </div>
                                        </div>
                                    </Button>
                                </div>
                                <div className="flex gap-4 items-center">
                                    {userBalance ?
                                        <UserSettingsModal totalAmount={userBalance} totalDeposit={0} totalProfit={0}
                                                           userData={currentUserData}/> :
                                        <UserSettingsModal totalAmount={0} totalDeposit={0} totalProfit={0} userData={{}}/>
                                    }
                                </div>

                            </div>
                            <div className={'h-16 block md:hidden'}></div>
                        </>
                    }
                </>
            }
        </>
    );
};

export default HeaderMobile;