import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    const { content, userId, imageUrl, isSupportMessage } = await request.json();

    const message = await prisma.message.create({
        data: {
            content,
            userId,
            imageUrl,
            isSupportMessage, // Indicates if the message is from support
        },
    });

    return NextResponse.json(message, { status: 201 });
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const messages = await prisma.message.findMany({
        where: { userId },
        include: { user: true },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
}
