import React from 'react';
import AdminSidebar from "@/components/AdminSidebar";
import Link from "next/link"
import {NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport, navigationMenuTriggerStyle} from "@/components/ui/navigation-menu";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Checkbox} from "@/components/ui/checkbox";
const agents = [
    {
        fullname: "Olaf Arbi",
        email: "olafarbi@gmail.com",
        status: "Admin",
    },
    {
        fullname: "Arturo",
        email: "arturo@gmail.com",
        status: "Worker",
    },
]
const Page = () => {
    return (
        <AdminSidebar>
            <div className="w-[80%] h-full min-h-screen mx-auto mt-20">
                <div className="flex justify-between items-center gap-12">
                    <div className={'flex justify-center items-center mt-12 mb-6'}>
                        <div>
                            <Input
                                className='flex w-48 h-9'
                                placeholder={'Search Agents...'}/>
                        </div>
                    </div>
                    <span className={'font-mono'}>Total leads: {agents.length}</span>
                </div>
                <div className="flex-col gap-12">
                    <div className="mx-2 py-2">Agents</div>
                    <Table title={'Leads'}>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Checkbox/></TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agents.map((lead, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium"><Checkbox id="terms"/></TableCell>
                                    <TableCell className="font-medium">{index}</TableCell>
                                    <TableCell height={'80px'}>{lead.fullname}</TableCell>
                                    <TableCell>{lead.email}</TableCell>
                                    <TableCell>{lead.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminSidebar>
    );
};

export default Page;