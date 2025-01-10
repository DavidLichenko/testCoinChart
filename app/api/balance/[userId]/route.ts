import { NextResponse } from "next/server";
import {prisma} from "@/prisma/prisma-client";

export async function GET(req: Request, { params }: { params: { userId: string } }) {
    const { userId } = params;

    if (!userId || typeof userId !== "string") {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    try {
        const balance = await prisma.balances.findUnique({
            where: { userId },
        });

        if (!balance) {
            return NextResponse.json({ error: "Balance not found" }, { status: 404 });
        }
        console.log(balance)
        return NextResponse.json({ usd: balance.usd });
    } catch (error) {
        console.error("Error fetching balance:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
