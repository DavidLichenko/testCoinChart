import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/prisma/prisma-client"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { type, amount, status, withdrawMethod, cryptoAddress, cryptoNetwork, depositFrom } = body

        // Validate input
        if (!type || !amount || !status || !withdrawMethod) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const order = await prisma.orders.create({
            data: {
                userId: session.user.id,
                type,
                amount,
                status,
                withdrawMethod,
                cryptoAddress,
                cryptoNetwork,
                depositFrom,
            },
        })
        const currentBalance = await prisma.balances.findFirst({
            where:{
                userId:session.user.id
            },
            select:{
                usd:true,
            }
        })

        const changeBalance = await prisma.balances.update({
            where: {
                userId:session.user.id
            },
            data:{
                usd: parseFloat(currentBalance.usd) - amount
            }
        })
        return NextResponse.json({ order })
    } catch (error) {
        console.error("Error creating order:", error)
        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
            { status: 500 },
        )
    }
}

