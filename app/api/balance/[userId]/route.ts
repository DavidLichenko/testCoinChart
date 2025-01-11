import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/prisma/prisma-client";

// Fetch balance for a specific user
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const { userId } = params;

    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    try {
        const balance = await prisma.balances.findUnique({
            where: { userId },
        });

        if (!balance) {
            return NextResponse.json({ error: "Balance not found" }, { status: 404 });
        }

        return NextResponse.json({ usd: balance.usd });
    } catch (error) {
        console.error("Error fetching balance:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Update balance for a specific user
export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
    const { userId } = params;
    const body = await req.json();
    const { usd } = body;

    if (!userId || typeof usd !== "number") {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    try {
        const updatedBalance = await prisma.balances.update({
            where: { userId },
            data: { usd },
        });

        return NextResponse.json({ usd: updatedBalance.usd });
    } catch (error) {
        console.error("Error updating balance:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
