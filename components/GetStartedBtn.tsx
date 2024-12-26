import React from 'react';
import {Button} from "@/components/ui/button";

function GetStartedBtn({variant, colors='bg-gradient-to-r from-indigo-700 to-indigo-500'} : {
    variant?: any;
    colors?:string
}) {
    return (
        <Button variant={variant ? variant : 'default'} className={`w-36 h-12 ${colors} text-white`}>
            Get Started
        </Button>
    );
}

export default GetStartedBtn;