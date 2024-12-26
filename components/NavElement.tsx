import React from 'react';

const NavElement = ({link,text,icon}:{
    link: string,
    text: string,
    icon: React.ReactNode,
}) => {


    return (
            <div className="flex flex-col w-full justify-center items-center  py-6 px-4 hover:bg-border hover:cursor-pointer active:bg-border">
                {icon}
                <div className='text-center pt-2 uppercase text-pretty'>{text}</div>
            </div>
    );
};

export default NavElement;