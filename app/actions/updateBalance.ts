'use server';

import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';

export async function updateBalance(userId: string, newBalance: number) {
    await prisma.user.update({
        where: { id: userId },
        data: { TotalBalance: newBalance },
    });

    await pusherServer.trigger(`user-${userId}`, 'balance-update', {
        totalBalance: newBalance,  // <--- изменил поле
    });
}
