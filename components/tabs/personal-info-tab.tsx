"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {Pencil, Settings} from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import {useEffect, useState} from "react";
import {Label} from "@/components/ui/label";
export default function PersonalInfoTab({userData}) {
  const [openChangeName, setOpenChangeName] = useState(false)
  const [userName,setUserName] = useState('')
  useEffect(() => {
    setUserName(userData ? userData.email.split('@')[0] : '')
  }, [userData]);
  return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm sm:text-base">


              <div className={'flex items-center'}><strong className="inline-block w-24">Name:</strong>{userData.name ? userData.name : userData.email.split('@')[0]} <div className={'ml-12 rounded-lg opacity-70 hover:opacity-100 hover:cursor-pointer transition-all'}>

                <Dialog>
                  <DialogTrigger>
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change name:</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input id="name" value={userName} onInput={(el) => {setUserName(el.target.value)}} defaultValue={userName} className="col-span-3"/>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save changes</Button>
                    </DialogFooter>
                  </DialogContent>

                </Dialog>

              </div>
              </div>
              <p><strong className="inline-block w-24">Email:</strong>{userData.email}</p>
              <p><strong className="inline-block w-24">Address:</strong> 123 Main St</p>
              <p><strong className="inline-block w-24">City:</strong> New York</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Button>Change Photo</Button>
          </CardContent>
        </Card>
      </div>
  )
}

