// app/api/trade/favorite-tickers/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ symbols: [] })

    const favorites = await prisma.favoriteTicker.findMany({
        where: { userId: user.id },
    })

    return NextResponse.json({ symbols: favorites.map((f) => f.symbol) })
}

export async function POST(req: NextRequest) {
    const user = await getCurrentUser()
    if (!user) return new NextResponse("Unauthorized", { status: 401 })

    const { symbol } = await req.json()

    const existing = await prisma.favoriteTicker.findUnique({
        where: {
            userId_symbol: {
                userId: user.id,
                symbol,
            },
        },
    })

    if (existing) {
        await prisma.favoriteTicker.delete({ where: { id: existing.id } })
    } else {
        await prisma.favoriteTicker.create({
            data: { userId: user.id, symbol },
        })
    }

    return NextResponse.json({ ok: true })
}
