'use server';

import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';

export async function updateBalance(userId: string, newBalance: number) {
    // Get user's bonusBalanced
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bonusBalanced: true },
    });

    await prisma.user.update({
        where: { id: userId },
        data: { TotalBalance: newBalance },
    });

    await pusherServer.trigger(`user-${userId}`, 'balance-update', {
        totalBalance: newBalance,
        bonusBalanced: user?.bonusBalanced || 0,
    });
}
