// app/page.tsx
'use client'
import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import React, {useEffect, useState} from "react";
import HeroImg from "@/components/images/welcome/intro-img.webp"
import BuiltIn from "@/components/images/welcome/profits-platform.webp"
import AssetsTrade from "@/components/images/welcome/profits-weekends.webp"
import ProfitProtection from "@/components/images/welcome/profits-protection.webp"
import InstantDeposit from "@/components/images/welcome/profits-instant.webp"
import CustomerSupport from "@/components/images/welcome/profits-support.webp"
import FreeAnalytic from "@/components/images/welcome/download.webp"
import LiveTrading from "@/components/images/welcome/download (1).webp"
import TradeInvest from "@/components/images/welcome/bonus-image.webp"
import Webinars from "@/components/images/welcome/goals-webinars.webp"
import {useMediaQuery} from "react-responsive";



export default function Home() {
    // const isMobile = useMediaQuery({maxWidth: 768})
    const [isMobile,setIsMobile] = useState(false);
    useEffect(() => {
        if(window.innerWidth <= 768) {
            setIsMobile(true);
        }
    }, []);
    return (
        <>
            <nav
                className="flex justify-between items-center border-b border-border h-16 bg-gradient-to-b from-custom-950 to-custom-900 px-8 py-4 fixed w-full top-0 z-50">
                <div className="flex gap-2 items-center ">
                    <Logo/>
                    <div className={'text-2xl font-bold'}>
                        <span className={'block md:hidden'}>AT</span>
                        <span className={'hidden md:block'}>Aragon Trade</span>
                    </div>
                </div>
                <div className="flex gap-2 items-center ">
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
                </div>
            </nav>
            <div className="bg-background">

                {/* Hero Section */}
                <section className="bg-secondary  h-full  py-16 mt-16">
                    <div
                        className="container flex md:flex-row flex-col mx-auto items-center  justify-center gap-12 text-white text-center">
                        <div className={'flex flex-col md:w-2/3 '}>
                            <h1 className="text-7xl font-bold text-left max-smart:text-5xl  md:w-2/3">Haz que tu dinero trabaje para ti</h1>
                            <p className="mt-8 font-medium md:mt-4 text-xl w-1/2 text-pretty max-smart:w-full text-left">
                                Empieza desde $100 y maximiza tus ingresos con nuestras condiciones únicas.
                            </p>
                            <Link href={'/sign-up'}
                                className="mt-6 hidden md:block w-[200px] px-3 py-2 bg-white text-blue-900 font-bold rounded-md hover:bg-gray-100">
                                EMPEZAR TRADING
                            </Link>
                        </div>
                        <div>
                            <Image width={512} height={512} alt={''} src={HeroImg}/>
                        </div>
                        <Link href={'/sign-up'}
                            className="mt-6 block md:hidden w-[200px] px-3 py-2 bg-white text-blue-900 font-bold rounded-md hover:bg-gray-100">
                            EMPEZAR TRADING
                        </Link>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 px-4 bg-foreground">
                    <div className="container">
                        <h2 className="text-2xl md:text-6xl  font-bold text-background text-left md:text-center">Disfruta de tus mayores beneficios con nosotros</h2>
                        <p className="mt-4 text-md md:text-4xl text-left md:text-center text-background font-medium">
                            Ofrecemos condiciones de mercado líderes para maximizar tu experiencia de trading.
                        </p>
                        <div className="grid  h-[70vh]  grid-cols-2 grid-rows-5 md:h-full md:grid-cols-4 md:grid-rows-2 gap-2 md:gap-8 mt-10  mx-auto text-background">
                            <div className="col-span-2 md:col-span-1 md:row-span-2 bg-white  md:max-h-full px-5 py-4 md:py-10 rounded-lg flex items-center md:items-stretch flex-row-reverse md:flex-col md:justify-between">
                                <h3 className="flex-1  text-md max-smart:text-small md:text-xl  font-medium ">Plataformas de trading todo en uno</h3>
                                <div className="text-md mb-0 md:mb-4 flex flex-1  md:items-end md:justify-end"><Image  className={'md:relative -bottom-4'} width={isMobile ? 60 :128} height={isMobile ? 60 :128} alt={''} src={BuiltIn}/></div>
                            </div>
                            <div className="row-start-2 col-span-2 md:row-start-auto md:col-span-2 bg-white md:max-h-full px-5 py-4 md:py-10 rounded-lg flex items-center md:items-stretch  flex-row-reverse md:flex-col md:justify-between">
                                <h3 className="flex-1 text-md max-smart:text-small md:text-xl text-pretty w-[50%] font-medium">Activos para operar los fines de semana</h3>
                                <div className="text-4xl mb-0 md:mb-4 flex flex-1 md:items-end md:justify-end"> <Image className={'md:relative -bottom-10'} width={isMobile ? 60 : 96} height={isMobile ? 60 : 96} alt={''} src={AssetsTrade}/></div>
                            </div>
                            <div
                                className="row-span-2 row-start-3 md:row-span-full md:col-start-2 md:row-start-2 bg-white  px-5 py-4 md:py-10 gap-2 rounded-lg flex flex-col justify-between">

                                <h3 className="flex-1 text-md max-smart:text-small md:text-xl font-medium ">Depósitos {isMobile && <br/>} instantáneos</h3>
                                <div className="text-4xl mb-3 md:mb-4 flex flex-1 items-end justify-end"><Image className={'md:relative -bottom-8'} width={isMobile ? 48 : 96} height={isMobile ? 48 : 96} alt={''} src={InstantDeposit}/>
                                </div>
                            </div>
                            <div
                                className="row-span-2 row-start-3 md:row-span-full md:col-span-2 md:col-start-3 md:row-start-2 bg-white px-5 py-4 md:py-10 rounded-lg flex flex-col justify-between">
                                <h3 className="flex-1 text-md max-smart:text-small md:text-xl font-medium">Soporte al cliente 24/7</h3>
                                <div className="text-4xl mb-0 md:mb-4 flex flex-1 items-end justify-end"><Image className={'md:relative -bottom-14 -right-8'} width={isMobile ? 64 : 128} height={isMobile ? 64 : 128} alt={''}
                                                                                                                src={CustomerSupport}/>
                                </div>

                            </div>
                            <div
                                className="col-span-2 row-start-5 md:col-span-full md:col-start-4 md:row-start-1 bg-white px-5 py-4 md:py-10 rounded-lg flex items-center md:items-stretch flex-row md:flex-col  h-full justify-between">
                                <h3 className="flex-1 text-md max-smart:text-small md:text-xl font-medium ">Protección contra saldos negativos</h3>
                                <div className="text-4xl mb-0 mt-4 md:mt-0 md:mb-0 flex flex-1 justify-end items-center md:items-end md:justify-end"><Image className={'relative -right-5 md:-bottom-14 md:-right-10'} width={isMobile ? 96 : 128} height={isMobile ? 96 : 128} alt={''}
                                                                                                                                                            src={ProfitProtection}/>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <Link href={'/sign-up'} className="px-6 py-3 bg-blue-900 text-white font-bold rounded-md hover:bg-blue-800">
                                EMPEZAR TRADING
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Backup Section */}
                <section className="py-16 px-4 bg-foreground text-secondary">
                    <div className="container">
                        <h2 className="text-6xl font-bold text-center max-smart:text-5xl">Logra tus objetivos con nuestro respaldo</h2>
                        <p className="mt-4 text-center text-foreground">
                            Proporcionamos los recursos y herramientas que necesitas para llevar tu trading al siguiente
                            nivel.
                        </p>
                        <div className="grid grid-cols-1 grid-rows-3 md:grid-cols-2 md:grid-rows-2 gap-8 mt-10 mx-auto">
                            <div className="md:row-span-1 bg-white px-5 py-10 rounded-lg flex flex-col  gap-4 text-left">
                                <h3 className="text-4xl font-semibold  md:w-1/2 ">Sesiones de trading en vivo</h3>
                                <p className="mt-2 text-xl text-gray-600 font-medium  md:w-1/2">Únete a nuestros expertos en tiempo real.</p>
                                <div className="text-4xl mb-4 flex flex-1 items-center justify-center md:mt-0 mt-7"><Image width={256} height={256} alt={''}
                                                                                                              src={FreeAnalytic}/></div>
                            </div>
                            <div className="md:row-span-1  bg-white px-5 py-10 rounded-lg flex flex-col gap-4 text-left">
                                <h3 className="text-4xl font-semibold  md:w-1/2">Análisis gratuitos</h3>
                                <p className="mt-2 text-xl text-gray-600 font-medium  md:w-1/2">Accede a análisis detallados y material educativo.</p>
                                <div className="text-4xl mb-4 flex flex-1 items-center justify-center"><Image width={256} height={256} alt={''}
                                                                                                              src={LiveTrading}/></div>
                            </div>

                            <div className="md:col-span-2 md:row-start-2 md:h-2/3 flex md:flex-row flex-col items-center md:justify-center bg-white p-5 rounded-lg text-left">
                                <div className="flex flex-col">
                                    <h3 className="text-4xl font-semibold mb-4 md:mb-0 md:w-1/2">Seminarios web regulares</h3>
                                    <p className="mt-2 text-xl text-gray-600 font-medium md:w-1/2">Vea videos educativos con expertos del mercado en
                                        nuestro canal de YouTube.</p>
                                </div>
                                <div className="text-4xl mb-4 md:mt-0 mt-14"><Image width={512} height={512} alt={''} src={Webinars}/></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Promotion Section */}
                <section className="py-16 px-4 bg-secondary">
                    <div className="container flex md:flex-row flex-col mx-auto items-center  justify-center gap-12 text-white text-center">
                        <div className={'flex flex-col md:w-2/3'}>
                            <h1 className="text-7xl font-bold text-left md:w-2/3 max-smart:text-5xl">Opera más de lo que invertiste</h1>
                            <p className="mt-4 text-xl md:w-1/2 max-smart:w-full text-pretty text-left">
                                Aplica un bono del 50% a cada depósito y maximiza tu potencial de inversión.
                            </p>
                            <Link href={'/sign-up'}
                                className="mt-6 w-[200px] font-bold px-3 py-2 bg-white text-blue-900 rounded-md hover:bg-gray-100">
                                TRADEA CON BONOS
                            </Link>
                        </div>
                        <div>
                            <Image width={512} height={512} alt={''} src={TradeInvest}/>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
