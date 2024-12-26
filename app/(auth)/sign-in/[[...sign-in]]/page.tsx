'use client';

import { useForm } from 'react-hook-form';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Logo from "@/components/Logo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import React from "react";
import {signIn} from "next-auth/react";
import {useRouter} from "next/navigation";

const FormSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must have than 8 characters'),
});

const SignInForm = () => {
    const router = useRouter()
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        const signInData = await signIn('credentials', {
            email: values.email,
            password: values.password,
            redirect: false
        })
        if(signInData?.error) {
            console.log(signInData.error)
        } else {
            router.push('/')
        }
    };

    return (
        <div  className={'h-screen flex-col flex justify-center'}>
            <nav
                className="flex justify-between items-center border-b border-border h-[120px] bg-background px-8 py-2 mb-12 fixed w-full top-0">
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
            <div className="flex flex-col h-3/6 items-center justify-center mx-auto w-1/3 border-3 border-border rounded-lg px-12">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
                        <div className="space-y-2">Sign In</div>
                        <div className='space-y-2'>
                            <FormField
                                control={form.control}
                                name='email'
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder='mail@example.com' {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='password'
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='password'
                                                placeholder='Enter your password'
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button className='w-full mt-6' type='submit'>
                            Sign in
                        </Button>
                    </form>
                    <div className='mx-auto my-4 flex w-full items-center justify-evenly before:mr-4 before:block before:h-px before:flex-grow before:bg-stone-400 after:ml-4 after:block after:h-px after:flex-grow after:bg-stone-400'>
                        or
                    </div>
                    <GoogleSignInButton>Sign in with Google</GoogleSignInButton>
                    <p className='text-center text-sm text-gray-600 mt-2'>
                        If you don&apos;t have an account, please&nbsp;
                        <Link className='text-blue-500 hover:underline' href='/sign-up'>
                            Sign up
                        </Link>
                    </p>
                </Form>
            </div>
        </div>
    );
};

export default SignInForm;