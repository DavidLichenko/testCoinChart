'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LayoutDashboardIcon as Dashboard, User, Wallet, Shield, MessageCircle, Settings } from 'lucide-react'
import { MobileTabContent } from './mobile-tab-content'
import DashboardTab from './tabs/dashboard-tab'
import PersonalInfoTab from './tabs/personal-info-tab'
import WithdrawalTab from './tabs/withdrawal-tab'
import VerificationTab from './tabs/verification-tab'
import LiveChatTab from './tabs/live-chat-tab'
import SettingsTab from './tabs/settings-tab'
import {WithdrawForm} from "@/components/withdraw-form";

export function UserSettingsModal({totalAmount, totalProfit, totalDeposit, userData}) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobile, setIsMobile] = useState(false)
  const [mobileContentOpen, setMobileContentOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (isMobile) {
      setMobileContentOpen(true)
    }
  }

  const tabContent = {
    dashboard: { title: 'Dashboard', content: <DashboardTab totalAmount={totalAmount} totalProfit={totalProfit} totalDeposit={totalDeposit} /> },
    withdrawal: { title: 'Withdrawal', content: <WithdrawalTab /> },
    verification: { title: 'Verification', content: <VerificationTab /> },
    livechat: { title: 'Live Chat', content: <LiveChatTab /> },
    settings: { title: 'Settings', content: <SettingsTab /> },
  }

  return (
      <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">User Settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] bg-sidebar w-full h-[30vh] sm:h-[90vh] p-4 sm:p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle>User Settings</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto max-h-[calc(90vh-4rem)]">
              <Tabs defaultValue="dashboard" value={activeTab} onValueChange={handleTabChange} className="w-full h-full">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-4 py-2 sticky top-0 h-full sm:h-auto bg-background z-10 shadow-sm">
                  <TabsTrigger value="dashboard" className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm my-2">
                    <Dashboard className="h-12 w-12 my-2 sm:h-4 sm:w-4 sm:my-0" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm my-2">
                    <User className="h-12 w-12 my-2 sm:h-4 sm:w-4 sm:my-0" />
                    <span>Personal</span>
                  </TabsTrigger>
                  <TabsTrigger value="withdrawal" className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm my-2">
                    <Wallet className="h-12 w-12 my-2 sm:h-4 sm:w-4 sm:my-0" />
                    <span>Withdrawal</span>
                  </TabsTrigger>
                  <TabsTrigger value="verification" className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm my-2">
                    <Shield className="h-12 w-12 my-2 sm:h-4 sm:w-4 sm:my-0" />
                    <span>Verification</span>
                  </TabsTrigger>
                  <TabsTrigger value="livechat" className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm my-2">
                    <MessageCircle className="h-12 w-12 my-2 sm:h-4 sm:w-4 sm:my-0" />
                    <span>Live Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex flex-col items-center justify-center p-2 text-xs sm:text-sm my-2">
                    <Settings className="h-12 w-12 my-2 sm:h-4 sm:w-4 sm:my-0" />
                    <span>Settings</span>
                  </TabsTrigger>
                </TabsList>
                {!isMobile && (
                    <>
                      <TabsContent value="dashboard">
                        <DashboardTab totalAmount={totalAmount} totalProfit={totalProfit} totalDeposit={totalDeposit}/>
                      </TabsContent>
                      <TabsContent value="personal">
                        <PersonalInfoTab userData={userData} />
                      </TabsContent>
                      <TabsContent value="withdrawal">
                        <WithdrawForm />
                      </TabsContent>
                      <TabsContent value="verification">
                        <VerificationTab />
                      </TabsContent>
                      <TabsContent value="livechat">
                        <LiveChatTab />
                      </TabsContent>
                      <TabsContent value="settings">
                        <SettingsTab />
                      </TabsContent>
                    </>
                )}
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
        {isMobile && (
            <MobileTabContent
                isOpen={mobileContentOpen}
                onClose={() => setMobileContentOpen(false)}
                title={tabContent[activeTab as keyof typeof tabContent].title}
            >
              {tabContent[activeTab as keyof typeof tabContent].content}
            </MobileTabContent>
        )}
      </>
  )
}

