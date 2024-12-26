import React, {ReactNode} from 'react';
import Logo from "@/components/Logo";
import Link from "next/link";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Image from 'next/image'
import Support from '@/components/images/support.png'
import Safe from '@/components/images/safe.png'
import Create from '@/components/images/create.png'
import Login from '@/components/images/login.png'
import Manage from '@/components/images/manage.png'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import GetStartedBtn from "@/components/GetStartedBtn";
import {TfiArrow} from "react-icons/tfi";
import {ArrowLeft} from "lucide-react";
import {BiRightArrowAlt} from "react-icons/bi";



function StatsCard({title, icon,  helperText, linkText, link, colorLink, className} : {
                       title: string;
                       icon: ReactNode;
                       helperText: string;
                       className: string;
                       linkText:string;
                       link:string;
                       colorLink:string;

                   }
) {
    return <Card className={className}>
        <CardHeader className="flex flex-col items-center justify-center px-10">
            <CardTitle className="text-2xl font-bold text-center">
                <Image
                    // @ts-ignore
                    src={icon} className={'mb-10 mx-auto'} alt={''} />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground pt-2 ">{helperText}</p>
            <Link href={link}>
                <p className={`flex arrow-class gap-2 justify-center items-center text-sm text-${colorLink}-500 font-bold pt-5 text-left hover:text-${colorLink}-300 transition-colors duration-200`}>
                    {linkText}
                    <BiRightArrowAlt style={{ height: 24, width:24 }}/>
                </p>

            </Link>
        </CardContent>
    </Card>
}

function Page() {

    return (
        <div className="flex flex-col min-h-screen min-w-full bg-background max-h-full">
            <nav
                className="flex justify-between items-center border-b border-border h-[120px] bg-background px-8 py-2 fixed w-full top-0">
                <div className="flex gap-4 items-center ">
                    <Logo/>
                </div>
                <div className="flex gap-4 items-center ">
                    <Link
                        className='text-white border-border font-bold border-2 rounded-md px-6 py-1 transition-all  bg-transparent hover:bg-gray-200 hover:text-background'
                        href="/sign-in">
                        Sign in
                    </Link>
                    <Link
                        className='text-white border-border font-bold border-2 rounded-md px-6 py-1 opacity-85 bg-gradient-to-r from-indigo-700 to-indigo-500 transition-all hover:opacity-100'
                        href="/sign-up">
                        Sign up
                    </Link>

                    <div className="flex gap-4 items-center">
                        <ThemeSwitcher/>
                    </div>
                </div>

            </nav>
            <main className="flex first_block flex-grow justify-center w-[100%] h-[100vh] px-20 mt-14">
                <div className="flex items-center justify-center flex-col">
                    <div className="text mx-auto pb-20">
                        <h2 className='text-5xl font-bold leading-relaxed'>
                            We make crypto <br/>
                            clear and simple
                        </h2>

                    </div>
                    <GetStartedBtn/>
                </div>
            </main>
            <main className="flex flex-grow justify-center w-[70%] h-full px-20 my-20 mx-auto">
                <div className="flex flex-col items-center justify-between ">
                    <div className="flex gap-10  flex-grow flex-row cards mx-auto pb-20">

                        <StatsCard title={'Create'}
                            // @ts-ignore
                                   icon={Create} link={'/sign-up'} colorLink={'blue'}
                                   linkText={'Get Started'}
                                   helperText={'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempos Lorem ipsum dolor'}
                                   className="shadow-md shadow-blue-600 transition-all p-5 hover:shadow-xl hover:shadow-blue-600"/>
                        <StatsCard title={'Login'}
                            // @ts-ignore
                                   icon={Login} link={'/sign-in'} colorLink={'purple'}
                                   linkText={'Login'}
                                   helperText={'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempos Lorem ipsum dolor'}
                                   className="shadow-md shadow-purple-600 p-5 transition-all hover:shadow-xl hover:shadow-purple-600"/>
                        <StatsCard title={'Manage'}
                            // @ts-ignore
                                   icon={Manage} link={'/dashboard'} colorLink={'pink'}
                                   linkText={'Dashboard'}
                                   helperText={'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempos Lorem ipsum dolor'}
                                   className="shadow-md shadow-pink-600 p-5 transition-all hover:shadow-xl hover:shadow-pink-600  "/>
                    </div>
                </div>
            </main>
            <main className="flex flex-grow justify-center w-[70%] h-full px-20 my-20 mx-auto">
                <div className="flex flex-col items-center justify-between ">
                    <div className="flex gap-2  flex-grow flex-col items-center mx-auto pb-20">
                        <h2 className='text-5xl w-[70%] font-bold leading-relaxed text-center mx-auto'>
                            A crypto mining platform that invest in you
                        </h2>
                        <p className="text-xl text-center w-[60%] mx-auto text-muted-foreground py-14 ">Lorem ipsum
                            dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempos Lorem ipsum dolor</p>
                        <GetStartedBtn/>
                    </div>
                </div>
            </main>
            <main className="flex flex-grow justify-center w-[70%] h-full px-20 my-20 mx-auto">
                <div className="flex flex-col items-center justify-between ">
                    <div className="flex gap-2  flex-grow flex-row items-center mx-auto pb-20">
                        <div>
                            <Image src={Support} alt={'support'}/>
                        </div>
                        <div className='flex flex-col items-start w-[50%]'>
                            <h2 className='text-5xl  font-bold leading-relaxed text-left mx-auto'>
                                24/7 access to full service customer support
                            </h2>
                            <p className="text-xl text-left  mx-auto text-muted-foreground py-14 ">Lorem ipsum
                                dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempos Lorem ipsum dolor
                            </p>
                            <GetStartedBtn variant={'outline'} colors={'bg-innerhit border-4'}/>
                        </div>
                    </div>
                </div>
            </main>
            <main className="flex flex-grow justify-center w-[70%] h-full px-20 my-20 mx-auto">
                <div className="flex flex-col items-center justify-between ">
                    <div className="flex gap-2  flex-grow flex-col items-center mx-auto pb-20">
                        <h2 className='text-5xl w-[70%] font-bold leading-relaxed text-center mx-auto'>
                            Buy and sell with the lowest fees in the industry
                        </h2>
                        <p className="text-xl text-center w-[60%] mx-auto text-muted-foreground py-14 ">Lorem ipsum
                            dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempos Lorem ipsum dolor sit
                            amet</p>
                    </div>
                    <div className="crypto_tracking bg-gray-800 w-[70%] h-full rounded-md flex flex-col items-center">

                    </div>
                </div>
            </main>
            <main className="flex flex-grow justify-center w-[70%] h-full px-20 my-20 mx-auto">

                <div className="flex gap-2  flex-grow flex-row justify-center items-center mx-auto pb-20">
                    <div className='flex flex-col items-start w-[50%]'>
                        <h2 className='text-5xl  font-bold leading-relaxed text-left mx-auto'>
                            Take your first step into safe, secure crypto investing
                        </h2>
                        <p className="text-xl text-left  mx-auto text-muted-foreground py-14 ">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempos Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempos
                        </p>
                        <GetStartedBtn />
                    </div>
                    <div>
                        <Image src={Safe} alt={'safe'}/>
                    </div>

                </div>
            </main>
            {/*<main className="flex flex-grow w-[70%] mx-auto">*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*        <Image*/}
            {/*            src={Phone}*/}
            {/*            width={500}*/}
            {/*            height={500}*/}
            {/*        />*/}
            {/*        <div className="text">*/}


            {/*            <h2 className='text-3xl font-bold '>*/}
            {/*                Your personal crypto wallet*/}
            {/*            </h2>*/}
            {/*            <h3 className='text-xl font-medium text-muted-foreground'>*/}
            {/*                Its secure and support near about hundred crypto currencies*/}
            {/*            </h3>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</main>*/}
            {/*<main className="flex flex-grow w-[70%] mx-auto">*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*        <Image*/}
            {/*            src={Phone}*/}
            {/*            width={500}*/}
            {/*            height={500}*/}
            {/*        />*/}
            {/*        <div className="text">*/}


            {/*            <h2 className='text-3xl font-bold '>*/}
            {/*                Your personal crypto wallet*/}
            {/*            </h2>*/}
            {/*            <h3 className='text-xl font-medium text-muted-foreground'>*/}
            {/*                Its secure and support near about hundred crypto currencies*/}
            {/*            </h3>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</main>*/}
            {/*<main className="flex flex-grow w-[70%] mx-auto">*/}
            {/*    <div className="flex items-center justify-between">*/}
            {/*        <Image*/}
            {/*            src={Phone}*/}
            {/*            width={500}*/}
            {/*            height={500}*/}
            {/*        />*/}
            {/*        <div className="text">*/}


            {/*            <h2 className='text-3xl font-bold '>*/}
            {/*                Your personal crypto wallet*/}
            {/*            </h2>*/}
            {/*            <h3 className='text-xl font-medium text-muted-foreground'>*/}
            {/*                Its secure and support near about hundred crypto currencies*/}
            {/*            </h3>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</main>*/}
            <footer className="flex justify-between items-center border-t border-border h-[90px] px-8 py-20">
                asdasdasdasdas
            </footer>
        </div>
    );
}

export default Page;