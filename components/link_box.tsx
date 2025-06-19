import React from 'react';
import Link from "next/link";
import {usePathname} from "next/navigation";
import {AnimatePresence, motion} from "framer-motion";
const LinkBox = ({href = '',name = ''}) => {
    const pathname = usePathname()
    return (
        <AnimatePresence>
        <Link
            href={href}
            className={`rounded-3xl relative bg-gradient-to-t px-4 py-2 flex items-center transition-all  justify-center text-md from-gray-900 to-gray-800`}>
            <span className='z-10 relative'>{name}</span>
            {pathname === href ? (
                <motion.div
                transition={{type: "spring", duration: .6}}
                layoutId={'underline'}
                className='absolute rounded-3xl w-full h-full left-0 bottom-0 bg-gradient-to-r from-indigo-900 to-primary'
                ></motion.div>
            ): null}
        </Link>
        </AnimatePresence>
    );
};

export default LinkBox;