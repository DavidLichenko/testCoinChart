import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: Request) {
    const { userId, newBalance } = await request.json();

    if (!userId || typeof newBalance !== 'number') {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Обновляем баланс в базе
    await prisma.user.update({
        where: { id: userId },
        data: { TotalBalance: newBalance },
    });

    // Триггерим pusher событие
    await pusherServer.trigger(`user-${userId}`, 'balance-update', {
        totalBalance: newBalance,
    });

    return NextResponse.json({ success: true });
}
