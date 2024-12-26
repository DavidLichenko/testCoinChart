'use client'
import React, {useEffect, useState} from 'react';
import {Button, Card, CardBody, Input, Select, SelectItem, Tab, Tabs} from "@nextui-org/react";
import {
    MdAccountBox, MdAdd, MdAddAPhoto, MdAddBox, MdAttachment, MdBalance, MdBarChart, MdCompareArrows,
    MdDashboard,
    MdEditCalendar, MdEuroSymbol, MdHdrPlus,
    MdHistory,
    MdImportExport,
    MdLocalMall, MdMoney,
    MdNewspaper, MdPeople, MdPlusOne, MdSavings,
    MdSearch, MdSettings, MdSupervisorAccount, MdVerified,
    MdViewList, MdWallet
} from "react-icons/md";
import {Skeleton} from "@/components/ui/skeleton";
import {Ping} from "@uiball/loaders";

import {IoMdCash} from "react-icons/io";
import {getSession} from "next-auth/react";
function ModalAccount({show, accountImg}) {
    const [loading,setLoading] = useState(false);
    const [email,setEmail] = useState("");
    const [id,setId] = useState('');
    const [user,setUser] = useState(null)
    async function currentSeesion() {
        const session = await getSession()
        if(!user) {
            setUser(session.user)
        }
    }
    useEffect(() => {
        currentSeesion()
        if(user) {
            setEmail(user.email)
            setId(user.id)
            setLoading(false)
        }
    }, [user]);






    return (
        <div className={`bg-background absolute top-0 w-full h-full left-0 z-[1000] ${show ? '' : 'hidden'}`}>
            <div className='flex flex-row h-full'>
                <div className="flex flex-col items-center justify-center h-full w-full">
                    <Tabs classNames={{
                        tabList:'bg-background p-0 w-[20vw] h-full overflow-y-auto',
                        tab: 'h-full p-0 w-[20vw]',
                        tabContent:'w-[20vw]',
                        wrapper:'w-full h-full p-0 pb-3',
                        panel:'pl-0 pr-3'
                    }}
                          aria-label="Options"  disabledKeys={["deposit"]} radius='none' color={'secondary'} defaultSelectedKey={2} isVertical={true}>
                        <Tab key='deposit' className='deposit_tab w-full h-full opacity-100' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center py-6 px-4">
                                <div className='flex flex-col mb-12'>
                                    {accountImg}

                                </div>
                                <div className='flex flex-col justify-center items-center gap-3 w-full h-full mx-auto'>
                                    <span className='text-muted-foreground text-wrap break-all'>#503953</span>
                                    <span className='text-primary text-xl'>{email}</span>
                                </div>
                                <div>
                                    <Button
                                        className='text-center text-xl my-12 text-primary px-8 py-3 font-bold transition-all bg-background border-secondary hover:bg-secondary'
                                        disableRipple={true} radius='none' size={'lg'} color='primary'
                                        variant={'bordered'} startContent={<IoMdCash/>} title='Deposit'>Deposit</Button>

                                </div>
                            </div>
                        }>
                        </Tab>
                        <Tab className='w-full h-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center  py-6 px-4  hover:cursor-pointer">
                                <MdDashboard size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Dashboard</div>
                            </div>
                        }>
                            <Card radius='none'  className='bg-popover border-border h-full border-2 p-0'>
                                <CardBody  className='h-full py-3 px-0'>
                                    <div
                                        className="flex flex-col h-full w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <p className='text-xl font-bold text-center mx-auto w-full py-6'>Dashboard</p>
                                        <div className="flex flex-row w-[90%] mx-auto mt-12 mb-12 bg-secondary rounded-md">
                                            <div className="grid-cols-2 grid grid-rows-2 gap-6 items-start justify-start h-full w-[45%]">
                                                <div className="flex flex-col p-10">
                                                    <h2 className="text-xl mb-4">Total Amount</h2>
                                                    <span className='text-primary text-xl'>$0.00</span>
                                                    <span className='text-muted-foreground'>$0.00</span>
                                                </div>
                                                <div className="flex flex-col p-10">
                                                    <h2 className="text-xl mb-4">Total Profit</h2>
                                                    <span className='text-primary text-xl'>$0.00</span>
                                                    <span className='text-muted-foreground'>$0.00</span>

                                                </div>
                                                <div className="flex flex-col p-10">
                                                    <h2 className="text-xl mb-4">Total Deposits</h2>
                                                    <span className='text-primary text-xl'>$0.00</span>
                                                    <span className='text-muted-foreground'>$0.00</span>
                                                </div>
                                                <div className="flex flex-col p-10">
                                                    <h2 className="text-xl mb-4">Total Deposits</h2>
                                                    <span className='text-primary text-xl'>$0.00</span>
                                                    <span className='text-muted-foreground'>$0.00</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col w-[45%] p-10 items-center justify-start">
                                                <h2 className="text-xl mb-4">Success Rate</h2>
                                                <span className='text-primary text-xl'>$0.00</span>
                                            </div>
                                        </div>
                                        <div
                                            className="flex flex-row gap-12 items-center justify-center w-[90%] mx-auto my-12 h-full">
                                            <div className="p-10 shadow-md shadow-orange-600 flex-col flex w-full">
                                                <div className="top currency gap-6 flex flex-row justify-between">
                                                    <div className="flex flex-row">
                                                        <div className="symbol_zoom symbol-BTC"></div>
                                                        <div className="flex flex-col ml-4">
                                                            <span className="text-muted-foreground mb-1">Bitcoin</span>
                                                            <span className='text-xl text-primary'>$0.00</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground mb-4">BTC</span>
                                                </div>
                                                <div className="bottom currency flex flex-row justify-between mt-12">
                                                    <div className="mini-chart">
                                                        asdasdasd
                                                    </div>
                                                    <div className="percent">
                                                        0.67%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-10 shadow-md shadow-red-600 flex-col flex w-full">
                                                <div className="top currency gap-6 flex flex-row justify-between">
                                                    <div className="flex flex-row">
                                                        <div className="symbol_zoom symbol-TRX"></div>
                                                        <div className="flex flex-col ml-4">
                                                            <span className="text-muted-foreground mb-1">Tron</span>
                                                            <span className='text-xl text-primary'>$0.00</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground">TRX</span>
                                                </div>
                                                <div className="bottom currency flex flex-row justify-between mt-12">
                                                    <div className="mini-chart">
                                                        asdasdasd
                                                    </div>
                                                    <div className="percent">
                                                        0.67%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-10 shadow-md shadow-blue-600 flex-col flex w-full">
                                                <div className="top currency gap-6 flex flex-row justify-between">
                                                    <div className="flex flex-row">
                                                        <div className="symbol_zoom symbol-SOL"></div>
                                                        <div className="flex flex-col ml-4">
                                                            <span className="text-muted-foreground mb-1">Solana</span>
                                                            <span className='text-xl text-primary'>$0.00</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground">SOL</span>
                                                </div>
                                                <div className="bottom currency flex flex-row justify-between mt-12">
                                                    <div className="mini-chart">
                                                        asdasdasd
                                                    </div>
                                                    <div className="percent">
                                                        0.67%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-10 shadow-md shadow-yellow-600 flex-col flex w-full">
                                                <div className="top currency gap-6 flex flex-row justify-between">
                                                    <div className="flex flex-row">
                                                        <div className="symbol_zoom symbol-BNB"></div>
                                                        <div className="flex flex-col ml-4">
                                                            <span className="text-muted-foreground mb-1">Binance</span>
                                                            <span className='text-xl text-primary'>$0.00</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-muted-foreground">BNB</span>
                                                </div>
                                                <div className="bottom currency flex flex-row justify-between mt-12">
                                                    <div className="mini-chart">
                                                        asdasdasd
                                                    </div>
                                                    <div className="percent">
                                                        0.67%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-12 items-start justify-center min-h-[70vh] w-[90%] mx-auto pt-12 mb-12 bg-secondary">
                                            <div className="flex flex-row gap-6 ml-12 h-full">
                                                <Button className="text-xl" radius={'none'}
                                                        variant={'faded'}>Week</Button>
                                                <Button className="text-xl" radius={'none'}
                                                        variant={'bordered'}>Month</Button>
                                            </div>
                                        </div>
                                        <div className="accounts w-[90%] mx-auto flex flex-col items-start justify-start mb-12">
                                            <div className="flex flex-col items-start-justify-start gap-1 border border-success bg-muted rounded-md py-10 pl-5 pr-5 w-[33.3%]">
                                                <div className="flex flex-row">
                                                    <span className='symbol_zoom symbol-USD mr-5'></span>
                                                    <span>USD Account</span>
                                                </div>
                                                <span className={'mt-2'}>Balance</span>
                                                <span>$0.00</span>
                                                <span className='text-small text-blue-600'>$0.00</span>
                                                <span>Leverage</span>
                                                <span className='text-small'>1:10</span>
                                                <span>Credit</span>
                                                <span className='text-small'>$0.00</span>
                                                <Button radius={'none'} color={'success'} disableRipple={true} className={'text-xl text-foreground mt-10'}>Trade Now</Button>
                                            </div>
                                        </div>
                                        <div className="totals flex flex-row gap-12 items-start justify-start w-[90%] mx-auto">
                                            <div className="total_balance items-center justify-center gap-6 p-10 flex flex-row bg-secondary">
                                                <MdEuroSymbol size={64}/>
                                                <div className="flex flex-col">
                                                    <span className='text-md mb-3'>Total Balance</span>
                                                    <span className='text-xl'>$0.00</span>
                                                    <span className='text-small'>$0.00</span>
                                                    <span></span>
                                                </div>
                                            </div>
                                            <div className="total_pnl  items-center justify-center gap-6 p-10 flex flex-row bg-secondary mb-12">
                                                <MdCompareArrows size={64} className={'rotate-90'}/>
                                                <div className="flex flex-col">
                                                    <span className='text-md mb-3'>Total PNL</span>
                                                    <div className="flex flex-row items-center gap-2 justify-center">
                                                        <span className="symbol symbol-USD"></span>
                                                        <span className='text-xl text-success'>0.00</span>
                                                    </div>
                                                    <span className='text-small'>$0.00</span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab className='w-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center py-6 px-4 hover:cursor-pointer">
                                <MdAccountBox size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Personal Information</div>
                            </div>
                        }>
                            <Card radius='none' className='bg-popover border-border h-full border-2'>
                                <CardBody className='py-3 px-0'>
                                    <div
                                        className="flex flex-col h-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <div className="w-[90%] mx-auto">
                                            <p className='text-xl font-bold text-center mx-auto w-full py-6'>Personal
                                                Information</p>
                                            <div
                                                className="flex flex-row gap-12 items-center justify-center w-full mt-20 mx-auto">
                                                <div className="text-md w-full">
                                                    Email
                                                    <div className="text-xl mt-10">
                                                        <Input variant={"underlined"} placeholder={'Email'} radius={'none'}
                                                               title={'Email'} value={email} disabled={true}/>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className="flex flex-row gap-12 items-center justify-center w-full mt-20 mx-auto">
                                                <div className="text-md w-full">
                                                    Address
                                                    <div className="text-xl mt-10">
                                                        <Input variant={"underlined"} placeholder={'Email'} radius={'none'}
                                                               title={'Email'} value={email} disabled={true}/>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row justify-between items-center w-full  mt-20">
                                                <p className={'font-mono text-sm text-muted-foreground'}>Account created on
                                                    25.10.2024 22:31:41</p>
                                                <Button disableRipple={true} radius={'none'} variant={'ghost'}
                                                        color={'primary'}>Save Changes</Button>
                                            </div>
                                            <div className="flex flex-col w-full mt-20">
                                                <h2 className={'text-2xl'}>Profile Photo</h2>
                                                <div className="flex flex-row items-center justify-start gap-12">
                                                    <div className="w-[50%] h-[360px] flex justify-center items-center mt-20 border-border border-2">
                                                        <div className={'p-14 rounded-full bg-muted'}>

                                                            <MdAddAPhoto size={64} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* <div className="flex flex-col items-center justify-center h-full w-full">
                                        </div> */}
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab className='w-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                                <MdWallet size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Withdrawal</div>
                            </div>
                        }>
                            <Card radius='none' className='bg-popover border-border h-full border-2'>
                                <CardBody>
                                    <div
                                        className="flex flex-col h-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <div className="w-[90%] mx-auto">
                                            <p className='text-xl font-bold text-center mx-auto w-full py-6'>Withdraw</p>

                                            <div
                                                className="flex flex-row items-center justify-center gap-12 mx-auto pt-20 h-full">

                                                <Input variant='underlined'  placeholder='Amount'/>

                                                <Select
                                                    defaultSelectedKeys={['btc']}
                                                    variant='underlined'
                                                    className="bg-background"
                                                    radius='none'

                                                    classNames={{
                                                        mainWrapper: 'bg-background',
                                                        base: 'bg-background',
                                                        innerWrapper: 'bg-background',
                                                        listbox: 'bg-backround',
                                                        helperWrapper: 'bg-background',
                                                        listboxWrapper: 'bg-background',
                                                        popoverContent: 'bg-background',
                                                        label: 'bg-background',
                                                    }}>
                                                    <SelectItem key={'btc'}>BTC</SelectItem>
                                                    <SelectItem key={'eth'}>ETH</SelectItem>
                                                    <SelectItem key={'usdt'}>USDT</SelectItem>
                                                    <SelectItem key={'card'}>Credit Card</SelectItem>
                                                </Select>
                                            </div>
                                                <Button variant={'ghost'}
                                                        color={'primary'}
                                                        className='mt-20'
                                                        radius='none'
                                                        disableRipple={true}>
                                                    Send Request
                                                </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab className='w-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                                <MdVerified size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Verification</div>
                            </div>
                        }>
                            <Card radius='none'  className='bg-popover border-border h-full border-2'>
                                <CardBody>
                                    <div
                                        className="flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <p className='text-xl font-bold text-center mx-auto w-full py-6'>Verification</p>
                                        <div className="flex flex-col mt-12 items-center justify-center h-full w-full">
                                            <div className="flex flex-row flex-wrap gap-12 justify-center w-full h-full">
                                                <div
                                                    className="verif verif_id h-64 w-96 flex justify-center items-center bg-secondary border-muted-foreground border-2">
                                                    <div className={'p-10 rounded-full bg-muted-foreground'}>

                                                        <MdAddAPhoto size={64}/>
                                                    </div>
                                                </div>
                                                <div
                                                    className="verif verif_id_back h-64 w-96 flex justify-center items-center bg-secondary border-muted-foreground border-2">
                                                    <div className={'p-10 rounded-full bg-muted-foreground'}>

                                                        <MdAddAPhoto size={64}/>
                                                    </div>
                                                </div>
                                                <div
                                                    className="verif verif_residence h-64 w-96 flex justify-center items-center bg-secondary border-muted-foreground border-2">
                                                    <div className={'p-10 rounded-full bg-muted-foreground'}>

                                                        <MdAddAPhoto size={64}/>
                                                    </div>
                                                </div>
                                                <div
                                                    className="verif verif_credit_card_front h-64 w-96 flex justify-center items-center bg-secondary border-muted-foreground border-2">
                                                    <div className={'p-10 rounded-full bg-muted-foreground'}>

                                                        <MdAddAPhoto size={64}/>
                                                    </div>
                                                </div>
                                                <div
                                                    className="verif verif_credit_card_back h-64 w-96 flex justify-center items-center bg-secondary border-muted-foreground border-2">
                                                    <div className={'p-10 rounded-full bg-muted-foreground'}>

                                                        <MdAddAPhoto size={64}/>
                                                    </div>
                                                </div>
                                                <div
                                                    className="verif verif_selfie h-64 w-96 flex justify-center items-center bg-secondary border-muted-foreground border-2">
                                                    <div className={'p-10 rounded-full bg-muted-foreground'}>

                                                        <MdAddAPhoto size={64}/>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={'flex flex-col justify-start w-[83.4%] mt-12  h-full'}>
                                            <h2>List of uploaded documents</h2>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab className='w-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                                <MdSupervisorAccount size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Accounts</div>
                            </div>
                        }>
                            <Card radius='none'  className='bg-popover border-border h-full border-2'>
                                <CardBody>
                                    <div
                                        className="flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <p className='text-xl font-bold text-center mx-auto w-full py-6'>Trading History</p>
                                        <div className="flex flex-col items-center justify-center h-full w-full">
                                            <MdHistory size={64}/>
                                            <p className="text-muted-foreground text-xl w-[70%] flex text-center items-center justify-center text-mono mx-auto">
                                                You don`t have any closed deals yet</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab className='w-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                                <MdPeople size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Live Chat</div>
                            </div>
                        }>
                            <Card radius='none'  className='bg-popover border-border h-full border-2'>
                                <CardBody>
                                    <div
                                        className="flex flex-col h-full w-full items-end relative justify-end pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <p className='text-xl font-bold text-center mx-auto w-full py-6'>Live Chat</p>
                                        <div className="flex flex-col gap-2 items-center justify-between h-full w-full">
                                            <div className="bg-background border-b-1 border-muted-foreground w-full h-full">
                                                asdasd
                                            </div>
                                            <div className={'flex flex-row justify-between items-center gap-6 h-32 w-full'}>
                                                <MdAttachment size={32} className={'-rotate-45'}/>
                                                <Input radius={'none'} placeholder={'Send Message'} variant={'faded'} classNames={{
                                                    input:'bg-background',
                                                    inputWrapper:'bg-background',
                                                }}/>
                                                <Button radius={'none'} variant={'solid'} color={'primary'} >Send</Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab className='w-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                                <MdSavings size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Savings</div>
                            </div>
                        }>
                            <Card radius='none'  className='bg-popover border-border h-full border-2'>
                                <CardBody>
                                    <div
                                        className="flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <p className='text-xl font-bold text-center mx-auto w-full py-6'>Trading History</p>
                                        <div className="flex flex-col items-center justify-center h-full w-full">
                                            <MdHistory size={64}/>
                                            <p className="text-muted-foreground text-xl w-[70%] flex text-center items-center justify-center text-mono mx-auto">
                                                You don`t have any closed deals yet</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab className='w-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                                <MdBarChart size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Trade</div>
                            </div>
                        }>
                            <Card radius='none'  className='bg-popover border-border h-full border-2'>
                                <CardBody>
                                    <div
                                        className="flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <p className='text-xl font-bold text-center mx-auto w-full py-6'>Trading History</p>
                                        <div className="flex flex-col items-center justify-center h-full w-full">
                                            <MdHistory size={64}/>
                                            <p className="text-muted-foreground text-xl w-[70%] flex text-center items-center justify-center text-mono mx-auto">
                                                You don`t have any closed deals yet</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                        <Tab className='w-full' title={
                            <div
                                className="flex flex-col w-full h-full justify-center items-center  py-6 px-4 hover:cursor-pointer">
                                <MdSettings size={32}/>
                                <div className='text-center pt-2 uppercase text-pretty'>Settings</div>
                            </div>
                        }>
                            <Card radius='none'  className='bg-popover border-border h-full border-2'>
                                <CardBody>
                                    <div
                                        className="flex flex-col h-[80vh] w-full items-start relative justify-start pt-2 overscroll-x-none overscroll-y-auto overflow-x-hidden overflow-y-auto">
                                        <p className='text-xl font-bold text-center mx-auto w-full py-6'>Settings</p>
                                        <div className="flex flex-col items-center justify-center h-full w-full">
                                            <div className="flex flex-row gap-6 mt-12 w-[95%] h-full">
                                                <div className="flex flex-col gap-6 w-[50%]">
                                                    <h2 className={'text-xl mb-10'}>Update Password</h2>
                                                    <Input radius={'none'} placeholder={'Current Password'} variant={'underlined'} classNames={{
                                                        input:'bg-background',
                                                        inputWrapper:'bg-background',
                                                    }}/>
                                                    <Input radius={'none'} placeholder={'New Password'} variant={'underlined'} classNames={{
                                                        input:'bg-background',
                                                        inputWrapper:'bg-background',
                                                    }}/>
                                                    <Input radius={'none'} placeholder={'Confirm new password'} variant={'underlined'} classNames={{
                                                        input:'bg-background',
                                                        inputWrapper:'bg-background',
                                                    }}/>
                                                    <Button disableRipple={true} variant={'solid'} color={'success'}>Change Password</Button>
                                                </div>
                                                <div className="flex flex-col gap-6 w-[50%]">
                                                    <h2 className={'text-xl mb-10'}>Update Password</h2>
                                                    <Input radius={'none'} placeholder={'Current Password'}
                                                           variant={'underlined'} classNames={{
                                                        input: 'bg-background',
                                                        inputWrapper: 'bg-background',
                                                    }}/>
                                                    <Input radius={'none'} placeholder={'New Password'}
                                                           variant={'underlined'} classNames={{
                                                        input: 'bg-background',
                                                        inputWrapper: 'bg-background',
                                                    }}/>
                                                    <Input radius={'none'} placeholder={'Confirm new password'}
                                                           variant={'underlined'} classNames={{
                                                        input: 'bg-background',
                                                        inputWrapper: 'bg-background',
                                                    }}/>
                                                    <Button disableRipple={true} variant={'solid'} color={'success'}>Change
                                                        Password</Button>
                                                </div>
                                            </div>
                                            <div className={'flex flex-col justify-start w-[95%] items-start'}>
                                                <span className={'mb-6'}>Dashboard Currency</span>
                                                <div className="flex flex-row flex-wrap gap-y-4 w-[65%] gap-x-8 justify-start">
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary' >
                                                        AUD
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary' >
                                                        BTC
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary'>
                                                        CAD
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary'>
                                                        CHF
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary'>
                                                        ETH
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary'>
                                                        EUR
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary'>
                                                        GBR
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary'>
                                                        PLN
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary'>
                                                        RUB
                                                    </Button>
                                                    <Button disableRipple={true} variant={'solid'} className='bg-secondary'>
                                                        USD
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Tab>
                    </Tabs>
                </div>
                {/*                    <div className="flex flex-col items-center justify-center w-3/4">*/}
                {/*asdasdasdasdasd*/}
                {/*                    </div>*/}
            </div>
        </div>
    );
}

export default ModalAccount;