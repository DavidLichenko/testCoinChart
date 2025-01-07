"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Home,
  Wallet,
  Upload,
  Download,
  HelpCircle,
  Settings,
  FileUp,
  Sun,
  Apple,
  SmartphoneIcon as Android,
  LogOut,
  Globe,
  X,
  UserCircleIcon
} from 'lucide-react'
import CryptoDeposit from "@/components/crypto-deposit"
import { WithdrawForm } from "@/components/withdraw-form"
import {RiProfileFill} from "react-icons/ri";

const menuItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Funds", href: "/funds", icon: Wallet },
  { name: "Help Center", href: "/help", icon: HelpCircle },
  { name: "Personal Settings", href: "/settings", icon: Settings },
  { name: "Upload documents", href: "/documents", icon: FileUp },
]

const bottomItems = [
  { name: "Light Mode", href: "#", icon: Sun },
  { name: "App for iOS", href: "#", icon: Apple },
  { name: "App for Android", href: "#", icon: Android },
  { name: "Log out", href: "/logout", icon: LogOut },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="top-4 left-4 z-50 text-white hover:text-white"
          >
            <UserCircleIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left" 
          className="w-80 p-0 bg-gray-900 text-gray-100 border-r-gray-800"
        >
          <SheetHeader className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" className="text-blue-500">
                EN <Globe className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="flex-1 py-4">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800"
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
              <button
                className="w-full flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800"
                onClick={() => {
                  setOpen(false)
                  setShowDeposit(true)
                }}
              >
                <Upload className="h-5 w-5 mr-3" />
                Deposit
              </button>
              <button
                className="w-full flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800"
                onClick={() => {
                  setOpen(false)
                  setShowWithdraw(true)
                }}
              >
                <Download className="h-5 w-5 mr-3" />
                Withdraw
              </button>
              
            </div>
            <div className="border-t border-gray-800">
              {bottomItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800"
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="p-6 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-4">Share the app</p>
              <div className="flex gap-4">
                {['twitter', 'linkedin', 'facebook'].map((social) => (
                  <Button
                    key={social}
                    variant="outline"
                    size="icon"
                    className="border-gray-700 text-gray-400 hover:text-gray-300"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-gray-100 border-gray-800">
          <CryptoDeposit />
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="sm:max-w-[425px] p-0 bg-gray-900 text-gray-100 border-gray-800">
          <WithdrawForm />
        </DialogContent>
      </Dialog>
    </>
  )
}

