// app/api/user/favorite-tickers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {requireAuth} from "@/lib/auth-utils";

export async function GET() {
    const userId = await requireAuth()
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.favoriteTicker.findMany({
        where: { userId: userId },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
        favorites.map((f) => ({ symbol: f.symbol })),
    );
}

export async function POST(req: Request) {
    const userId = await requireAuth()
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol } = await req.json();
    if (!symbol) {
        return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    await prisma.favoriteTicker.upsert({
        where: {
            userId_symbol: {
                userId: userId,
                symbol,
            },
        },
        create: {
            userId: userId,
            symbol,
        },
        update: {},
    });

    return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
    const userId = await requireAuth()
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol } = await req.json();
    if (!symbol) {
        return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    await prisma.favoriteTicker.deleteMany({
        where: {
            userId: userId,
            symbol,
        },
    });

    return NextResponse.json({ ok: true });
}
