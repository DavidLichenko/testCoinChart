"use client"
import { signOut } from "next-auth/react";
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
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
  UserCircleIcon,
  MessageSquare
} from 'lucide-react'
import CryptoDeposit from "@/components/crypto-deposit"
import { WithdrawForm } from "@/components/withdraw-form"
import {RiProfileFill} from "react-icons/ri";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {useRouter} from "next/navigation";
import UserChat from "@/components/tabs/live-chat-tab";

const menuItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Funds", href: "/funds", icon: Wallet },
]

const bottomItems = [
  { name: "Log out", href: "/logout", icon: LogOut },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const router = useRouter()
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
              className="w-80 p-0 bg-sidebar border-r-border"
          >
            <SheetTitle className="hidden">
              <VisuallyHidden.Root>x</VisuallyHidden.Root>
            </SheetTitle>
            <SheetHeader className="p-4 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" className="text-xl font-bold">
                  {/*EN <Globe className="ml-2 h-4 w-4" />*/}
                  Aragon Trade
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
            <div className="flex flex-col h-full justify-between">
              <div className="flex-1 py-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800"
                        onClick={() => setOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3"/>
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
                  <Upload className="h-5 w-5 mr-3"/>
                  Deposit
                </button>
                <button
                    className="w-full flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800"
                    onClick={() => {
                      setOpen(false)
                      setShowWithdraw(true)
                    }}
                >
                  <Download className="h-5 w-5 mr-3"/>
                  Withdraw
                </button>
                <button
                    className="w-full flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800"
                    onClick={() => {
                      setOpen(false)
                      setShowChat(true)
                    }}
                >
                  <MessageSquare className="h-5 w-5 mr-3"/>
                  Live Chat
                </button>
              </div>
              <div className="border-t border-gray-800">


                {bottomItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href === '/logout' ? '#' : item.href}
                        className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800"
                        onClick={() => {
                          if (item.href === '/logout') {
                            setOpen(false)
                            signOut({redirect: false}).then(() => {
                              router.push("/welcome");
                              location.reload();
                            });
                          } else {
                            setOpen(false)
                          }
                        }
                        }
                    >
                      <item.icon className="h-5 w-5 mr-3"/>
                      {item.name}
                    </Link>
                ))}

              </div>
              <div className="p-10 border-t border-gray-800">

              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
          <DialogContent className="sm:max-w-[425px] bg-sidebar text-gray-100 border-gray-800">
            <DialogHeader>
              <DialogTitle>
                <span className="sr-only">Deposit Funds</span> {/* Visually hidden for accessibility */}
              </DialogTitle>
            </DialogHeader>
            <CryptoDeposit />
          </DialogContent>
        </Dialog>

        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="sm:max-w-[425px] flex flex-col  h-5/6 p-0 bg-sidebar text-gray-100 border-gray-800">
            {/*<DialogHeader>*/}
            {/*  <DialogTitle>*/}
            {/*    <span className="sr-only">Live Chat</span> /!* Visually hidden for accessibility *!/*/}
            {/*  </DialogTitle>*/}
            {/*</DialogHeader>*/}
            <UserChat />
          </DialogContent>
        </Dialog>


        <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
          <DialogContent className="sm:max-w-[425px] p-0 bg-sidebar text-gray-100 border-gray-800">
            <DialogHeader>
              <DialogTitle>
                <span className="sr-only">Withdraw Funds</span> {/* Visually hidden for accessibility */}
              </DialogTitle>
            </DialogHeader>
            <WithdrawForm />
          </DialogContent>
        </Dialog>
      </>
  )
}

