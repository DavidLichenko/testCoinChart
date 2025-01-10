'use client'

import React, { useState} from 'react';
import HeaderMobile from "@/components/HeaderMobile";
import {MobileNav} from "@/components/mobile-nav";
import TickerTable from "@/components/market-dashboard";

const Page = () => {
    const [currentUserData,setCurrentUserData] = useState({})
    const [userBalance,setUserBalance] = useState(null)
    const [loading,setIsLoading] = useState(true)

    return (
        <>
                <div className={'h-full'}>
                    {/*<HeaderMobile />*/}
                    <div className="flex container h-full mb-12 w-full pt-2 gap-6  flex-col justify-start">
                        {/*<p className={'text-left text-4xl font-bold'}>TRADE</p>*/}
                        <span className={'text-center w-full mx-auto text-2xl pt-2 font-semibold'}>Lista de mercados</span>
                        <TickerTable/>
                    </div>
                    <div className={'content flex flex-col items-start gap-2 justify-center'}>
                        {/*<DashboardPage />*/}
                        {/*<MobileNav/>*/}
                    </div>
                </div>
        </>
    )
}
export default Page;