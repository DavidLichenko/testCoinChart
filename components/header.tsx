'use client'
import React, {useEffect, useState} from 'react';
import Notifications from "@/components/notifications";
import Messages from "@/components/messages";
import NavItem from "@/components/nav-item";
import {AnimatePresence} from "framer-motion";
import {Button} from "@/components/ui/button";
import {Plus, User} from "lucide-react";
import Link from "next/link";
import {DepositModal} from "@/components/deposit-modal";
import {useAuth} from "@/components/auth-provider";
import Script from "next/script";

const Header = () => {
    const [balance, setBalance] = useState(0) // Mock: userBalance?.usd || 0

    // Fetch user balance
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await fetch("/api/user/balance")
                if (response.ok) {
                    const data = await response.json()
                    setBalance(data.totalBalance)
                }
            } catch (error) {
                console.error("Error fetching balance:", error)
            }
        }
        fetchBalance()
    }, [])

    const [depositModalOpen, setDepositModalOpen] = useState(false)
    return (
        <>
            {/* Smartsupp Live Chat script */}
            <Script id="smartsupp-chat" strategy="afterInteractive">
                {`
          var _smartsupp = _smartsupp || {};
          _smartsupp.key = '27fb236d0033ef4f42527031ce371e32b77ce821';
          window.smartsupp||(function(d) {
            var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
            s=d.getElementsByTagName('script')[0];c=d.createElement('script');
            c.type='text/javascript';c.charset='utf-8';c.async=true;
            c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
          })(document);
        `}
            </Script>

            {/* NoScript fallback */}
            <noscript>
                Powered by{' '}
                <a href="https://www.smartsupp.com" target="_blank" rel="noopener noreferrer">
                    Smartsupp
                </a>
            </noscript>
            <AnimatePresence>
                <div className="header hidden lg:flex px-12  mx-auto bg-background  items-center justify-between py-2">
                    <div className="logo text-xl uppercase tracking-wide">
                        AragonTrade
                    </div>
                    <div className="route capitalize text-sm flex items-center justify-center gap-6">
                        <NavItem/>
                    </div>
                    <div className="profile flex items-center justify-center gap-6">
                        {/*<Notifications />*/}
                        {/*<Messages />*/}
                        <div className="flex items-center space-x-4">
                                <Button className="bg-green-600 hover:bg-green-700"
                                        onClick={() => setDepositModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2"/>
                                    Deposit
                                </Button>
                            <div className="text-right">
                                <div className="text-sm text-gray-400">Balance</div>
                                <div className="text-lg font-semibold text-green-400">${balance.toLocaleString()}</div>
                            </div>
                            <Link href="/profile">
                                <Button variant="ghost" size="sm" className="p-2">
                                    <User className="w-5 h-5"/>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
                <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
            </AnimatePresence>
        </>
    );
};

export default Header;