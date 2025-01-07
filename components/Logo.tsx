import React from 'react';
import Link from "next/link";
import Image from "next/image";
import LogoImg from "@/components/images/logo.png"

function Logo ()  {
    return (
    <>
        <Image height={32} width={32} alt={'logo'} src={LogoImg}/>
    </>
    )
};

export default Logo;