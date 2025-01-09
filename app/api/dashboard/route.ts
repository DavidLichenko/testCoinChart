"use server";

import {prisma} from "@/prisma/prisma-client";

import { NextResponse } from 'next/server';
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions)

    const user = session.user;
    try {
        const users = await prisma.user.findMany({
            where: {
              id:  user.id,
            },
            include: {
                balance: true,
                trade_transaction: true,
            },
        });

        const totalBalance = users.reduce(
            (acc, user) => acc + (user.TotalBalance || 0),
            0
        );

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const revenueData = await prisma.orders.findMany({
            where: {
                createdAt: {
                    gte: lastMonth,
                },
                status: 'SUCCESSFUL',
            },
            select: {
                amount: true,
                createdAt: true,
            },
        });

        const revenueByMonth = revenueData.reduce((acc, order) => {
            const month = new Date(order.createdAt).toLocaleString('default', {
                month: 'short',
            });
            acc[month] = (acc[month] || 0) + order.amount;
            return acc;
        }, {});

        const moneyInWork = await prisma.trade_Transaction.aggregate({
            where: {
                status: 'OPEN',
            },
            _sum: {
                volume: true,
            },
        });

        const balanceChange = 10; // Mocked value

        return NextResponse.json({
            totalBalance,
            balanceChange,
            moneyInWork: moneyInWork._sum.volume || 0,
            revenueData: Object.keys(revenueByMonth).map((month) => ({
                month,
                revenue: revenueByMonth[month],
            })),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
