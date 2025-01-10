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
import validator from "validator";

import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import {useRouter} from "next/navigation";
import Logo from "@/components/Logo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import React from "react";
import {useMediaQuery} from "react-responsive";

const FormSchema = z
    .object({
        email: z.string().min(1, 'Email is required').email('Invalid email'),
        number: z.string().refine(validator.isMobilePhone),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must have than 8 characters'),
        confirmPassword: z.string().min(1, 'Password confirmation is required'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Password do not match',
    });

const SignUpForm = () => {
    const isMobile = useMediaQuery({maxWidth: 768})
    const router = useRouter()

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
            number:null,
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        const response = await fetch('/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: values.email,
                password: values.password,
                number:values.number,
            }),
        })
        if (response.ok) {
            router.push('/sign-in')
        } else {
            console.error('Oops.. some error occurred.')
        }
    };

    return (
        <>
            { isMobile ? <>
                    <div className="flex justify-between items-center border-b border-border h-16 bg-sidebar px-8 py-4 fixed w-full top-0 z-50">
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
                                className='text-white border-border font-bold border-2 rounded-md px-6 py-1 opacity-85 bg-gradient-to-r from-accent-700 to-accent-500 transition-all hover:opacity-100'
                                href="/sign-up">
                                Sign up
                            </Link>
                        </div>
                    </div>
                    <div
                        className="flex flex-col h-screen items-center justify-center mx-auto w-full mt-8  font-bold rounded-lg px-12">
                        <div className="w-full flex items-center justify-center text-2xl my-2">Sign Up</div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>

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
                                        name='number'
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder='+44 7123 456789' {...field} />
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
                                    <FormField
                                        control={form.control}
                                        name='confirmPassword'
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Re-Enter your password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder='Re-Enter your password'
                                                        type='password'
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button className='w-full mt-6' type='submit'>
                                    Sign up
                                </Button>
                            </form>

                            <div className='text-center text-sm text-gray-600 mt-2'>
                                If you don&apos;t have an account, please&nbsp;
                                <Link className='text-blue-500 hover:underline' href='/sign-in'>
                                    Sign in
                                </Link>
                            </div>
                        </Form>
                    </div>

                </> :
                <div className={'h-screen flex-col flex justify-center font-bold'}>
                    <div
                        className="flex justify-between items-center border-b border-border h-16 bg-sidebar px-8 py-4 fixed w-full top-0 z-50">
                        <div className="flex gap-2 items-center ">
                            <Logo/>
                            <h2 className={'text-2xl font-bold'}><p>{isMobile ? "AT" : "Aragon Trade"}</p></h2>
                        </div>
                        <div className="flex gap-2 items-center ">
                            <Link
                                className='text-white border-border font-bold border-2 rounded-md px-6 py-1 transition-all  bg-transparent hover:bg-gray-200 hover:text-background'
                                href="/sign-in">
                                Sign in
                            </Link>
                            <Link
                                className='text-white border-border font-bold border-2 rounded-md px-6 py-1 opacity-85 bg-gradient-to-r from-accent-700 to-accent-500 transition-all hover:opacity-100'
                                href="/sign-up">
                                Sign up
                            </Link>
                        </div>
                    </div>
                    <div
                        className="flex flex-col h-3/6 items-center justify-center mx-auto w-1/3 border-3 border-border rounded-lg px-12">
                        <div className="w-full flex items-center justify-center text-2xl my-2">Sign Up</div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
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
                                        name='number'
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder='+44 7123 456789' {...field} />
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
                                    <FormField
                                        control={form.control}
                                        name='confirmPassword'
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Re-Enter your password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder='Re-Enter your password'
                                                        type='password'
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button className='w-full mt-6' type='submit'>
                                    Sign up
                                </Button>
                            </form>

                            <div className='text-center text-sm text-gray-600 mt-2'>
                                If you don&apos;t have an account, please&nbsp;
                                <Link className='text-blue-500 hover:underline' href='/sign-in'>
                                    Sign in
                                </Link>
                            </div>
                        </Form>
                    </div>
                </div>
            }
        </>
    );

}
export default SignUpForm;