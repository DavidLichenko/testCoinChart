import React from 'react';
import Link from "next/link";

function Logo ()  {
    return <Link href={"/"} className="font-bold text-3xl bg-primary text-transparent bg-clip-text hover:cursor-pointer">
         AragonTrade
     </Link>

};

export default Logo;