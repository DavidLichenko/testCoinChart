import React from 'react';
import Header from "@/components/header";
import TradePage from "@/components/trade-page";
import MobileFooter from "@/components/mobile-footer";

const Page = () => {
    return (
        <>
            <Header/>
            <TradePage />
            <MobileFooter/>
        </>
    );
};

export default Page;