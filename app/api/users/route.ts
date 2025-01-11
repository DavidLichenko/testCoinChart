import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma-client";
import * as z from 'zod'
import validator from "validator";

export const dynamic = 'force-dynamic'

const userSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    number: z.string().refine(validator.isMobilePhone, 'Invalid phone number'),
    password: z.string().min(1, 'Password is required').min(8, 'Password must have at least 8 characters'),
    role: z.enum(['OWNER', 'ADMIN', 'WORKER', 'USER']),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log('Received body:', body);

        const { name, email, password, number, role } = userSchema.parse(body)

        // Check if email already exists
        const existingUserByEmail = await prisma.user.findUnique({ where: { email } })

        if (existingUserByEmail) {
            return NextResponse.json({ user: null, message: "User already exists" }, { status: 400 })
        }
        const userId = Math.random().toString(16).slice(2)
        // Create the user without hashing the password
        const newUser = await prisma.user.create({
            data: {
                id:userId.toString(),
                name,
                email,
                password,
                number,
                role,
                status: 'NEW',
                comments: { create: {} },
                verification: { create: {} },
                balance: { create: { usd: 0 } }
            }
        })

        console.log('Created user:', newUser);

        // Remove password from the response
        const { password: _, ...userWithoutPassword } = newUser

        return NextResponse.json({ user: userWithoutPassword, message: "User created successfully" }, { status: 201 })

    } catch (error) {
        console.error('Error creating user:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        // Log the full error
        console.error('Full error:', JSON.stringify(error, null, 2))
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
    }
}

