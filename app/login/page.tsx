"use client"
import React from 'react';
import {signIn} from "next-auth/react"

const Page = () => {
    return (
        <div>
            <button onClick={()=> signIn("google",  {callbackUrl:"/"})}>
                Continue with Google
            </button>
        </div>
    );
};

export default Page;