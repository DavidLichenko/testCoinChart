import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma-client";
import * as z from 'zod'
import validator from "validator";

export const dynamic = 'force-dynamic'

const userSchema = z
    .object({
        email: z.string().min(1, 'Email is required').email('Invalid email'),
        number: z.string().refine(validator.isMobilePhone),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must have than 8 characters'),
    })

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const {email, password, number} = userSchema.parse(body)


        const userId = Math.random().toString(16).slice(2)
        //check if email already exists
        const existingUserByEmail = await prisma.user.findUnique({ where: { email: email } })

        if (existingUserByEmail) {
            return NextResponse.json({user: null, message: "User already exists"})
        }


        const newUser = await prisma.user.create({
            data: {
                id:userId.toString(),
                email,
                password,
                number,
                comments:{
                    create:{

                    }
                },
                verification:{
                    create:{

                    }
                },
                balance:{
                    create:{

                    }
                }

            }
        })

        return NextResponse.json({ user: newUser, message:"User created successfully"})

    } catch (error) {
        return NextResponse.json({ error: error });
    }
}
