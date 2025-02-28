"use server";
import { headers } from "next/headers";
import {prisma} from "@/prisma/prisma-client";
import yahooFinance from "yahoo-finance2";
import { getServerSession } from "next-auth"
import {authOptions} from "@/lib/auth";


// export const CheckAuth = async() => {
//     const session = await getServerSession(authOptions)
//     // console.log(session)
//     const pathname = headerList.get("x-current-path");
//     // const user = session.user;
//     // const userId : string = user.id;
//     console.log(pathname)
//     if (!session && pathname !== '/welcome' && pathname !== '/sign-in' && pathname !== '/sign-up') {
//         redirect("/welcome");
//     }
//     return session
// }


export async function GetSession() {
    return await getServerSession(authOptions)

}
export async function currentUsedRole() {
    const session = await getServerSession(authOptions)
    const user = session.user;
    return user.role;
}
export async function TradeTransactions() {
    const session = await getServerSession(authOptions)
    const user = session.user;
    const userId : string = user.id;
    const transactions = await prisma.trade_Transaction.findMany({
        where:{
            userId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    return transactions.length > 0 ? transactions : []

}
export async function getOrders() {
    const session = await getServerSession(authOptions)
    const user = session.user;
    const userId : string = user.id;
    const orders = await prisma.orders.findMany({
        where:{
            userId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    })
    return orders.length > 0 ? orders : []
}
export async function GetStockData(ticker:string) {
    let result;
    try {
        result = await yahooFinance.chart(ticker, {period1: '2024-12-10', interval:"1m"});
    } catch (error) {
        result = error;
        console.log(result)
    }
    return await result
}
export async function GetWebSocketStockData(ticker:string) {
    let result;
    try {
        result = await yahooFinance.quote(ticker);
    } catch (error) {
        result = error;
        console.log(result)
    }
    return await result
}
export async function CreateTradeTransaction(status: string, type: any, takeProfit: string | number | null, profit: null, margin:any, ticker: string, leverage: string | number, openIn: string | number, closeIn: string | null, stopLoss: string | number | null, volume: number, assetType:any) {
    const session = await getServerSession(authOptions)

    const user = session.user;
    const curStatus = status ? "OPEN" : "CLOSE"
    const userId : string = user.id;
    const userCreateTransaction = await prisma.trade_Transaction.create({
        // @ts-ignore
        data: {
            userId: userId,
            takeProfit:parseFloat(takeProfit),
            status:curStatus,
            type:type,
            profit:profit,
            margin:margin,
            ticker:ticker,
            leverage:parseFloat(leverage),
            openIn:parseFloat(openIn),
            openInA:parseFloat(openIn),
            closeIn:parseFloat(closeIn),
            stopLoss:parseFloat(stopLoss),
            volume:volume,
            assetType:assetType
        }
    })

}
export async function updateUserPassword(password) {
    const session = await getServerSession(authOptions)
    const user = session.user;
    const userId : string = user.id;
    const changePass = await prisma.user.update({
        where:{
            userId:userId,
        },
        data: {
            password:password
        }
    })
}
export async function GetChats() {
    return await prisma.user.findMany({
        where:{
            role: 'USER'
        }
    })
}
export async function GetTradeTransaction(ticker) {
    const session = await getServerSession(authOptions)

    const user = session.user;
    const getTradeTransaction = await prisma.trade_Transaction.findMany({
        where:{userId:user.id, ticker:ticker, status:"OPEN"}
    })
    if (getTradeTransaction) {
        return await getTradeTransaction
    } else {
        return false
    }
}
export async function UpdateTradeTransaction(closeIn,profit,trans_id) {
    const session = await getServerSession(authOptions)

    // const user = session.user;
    await prisma.trade_Transaction.update({
        where:{
            id:trans_id,
        },
        data:{
            status:'CLOSE',
            profit:parseFloat(profit),
            closeIn:parseFloat(closeIn.toString()),
        }
    })
}
export async function GetCurrentUser() {
    const session = await getServerSession(authOptions)

    const user = session.user;
    const UserRole =  await prisma.user.findUnique({
        where: {
            id:user.id
        },
        select:{
            role:true
        }
    })
    return UserRole
}
export async function GetCurrentData() {
    const session = await getServerSession(authOptions)
    const user = session.user;
    const UserData =  await prisma.user.findUnique({
        where: {
            id:user.id
        }
    })
    return UserData
}
export async function GetCurrentRole() {
    const session = await getServerSession(authOptions)

    const user = session.user;
    const UserRole =  await prisma.user.findUnique({
        where: {
            id:user.id
        },
        select:{
            role:true
        }
    })
    return UserRole
}
export async function GetAllUsers() {
    return await prisma.user.findMany()
}
export async function GetUserById(id) {
    return await prisma.user.findUnique({
        where: {
            id:id
        }
    })
}
export async function GetUserBalanceById(id: any) {
    return await prisma.balances.findUnique({
        where: {
            userId:id
        }
    })
}
export async function GetUserTransById(id: any) {
    const getTradeTransaction = await prisma.trade_Transaction.findMany({
        where: {
            userId:id
        }
    })
    if (getTradeTransaction) {
        return await getTradeTransaction
    } else {
        return false
    }
}
export async function GetUserActiveTrans() {
    const session = await getServerSession(authOptions)

    const user = session.user;
    const getTradeTransaction = await prisma.trade_Transaction.findMany({
        where: {
            userId:user.id,
            status: "OPEN",
        }
    })
    if (getTradeTransaction) {
        return await getTradeTransaction
    } else {
        return false
    }
}
export async function addComments(id: any, messages: any) {
    console.log(messages)
    const updatedMessages = await prisma.comments.update({
        where: {
            userId:id,
        },
        data:{
            messages:messages
        }
    })
    if(updatedMessages) {
        console.log(messages)
    }
}
export async function getComments(id: any) {
    const getUserComments = await prisma.comments.findFirst({
        where: {
            userId:id,
        }
    })
    if (getUserComments) {
        return getUserComments
    } else {
        return false
    }
}
export async function GetUserBalance() {
    const session = await getServerSession(authOptions)

    const user = session.user;

    return await prisma.balances.findUnique({
        where: {
            userId: user.id
        }
    })
}
export async function updateDataAboutUser(user_crypto_address, deposit_message, withdraw_error, isVerif, can_withdraw, blocked, id) {
    await prisma.user.update({
        where: {
            id:id,
        },
        data: {
            user_crypto_address:user_crypto_address,
            deposit_message:deposit_message,
            withdraw_error:withdraw_error,
            blocked:blocked,
            isVerif:isVerif,
            can_withdraw:can_withdraw,
        }
    })
}
export async function updateDataAboutUserBalace(balance: any, id: any) {
    await prisma.balances.update({
        where:{
            userId: id,
        },
        data: {
            usd:balance
        }
    })
}
export async function UpdateUserBalance(profit: string | number) {
    const session = await getServerSession(authOptions)

    const user = session.user;
    await prisma.balances.update({
        where:{
            userId: user.id
        },
        data: {
            usd:parseFloat(profit)
        }
    })
}

interface NetworkAddress {
    address: string
}

export async function getNetworkAddress(token: string, network: string): Promise<NetworkAddress> {
    // Simulated database fetch - replace with your actual Prisma query
    // const address = await prisma.networkAddresses.findFirst({
    //   where: {
    //     token,
    //     network,
    //   },
    // });

    // For demonstration, returning mock addresses
    const addresses = {
        btc: { bitcoin: "bc1qjmqf6v7e2aluhrgxq5v6tdcg70augnpswxuhh6" },
        eth: { erc20: "0xF71Fba1730A9c868e927cc5C86bD7A2088F2FF73" },
        usdt: {
            erc20: "0xF71Fba1730A9c868e927cc5C86bD7A2088F2FF73",
            trc20: "TQdmfNtZtTMkWd91bvUwSmhSGXsvTxcTJH"
        }
    }

    return {
        address: addresses[token as keyof typeof addresses]?.[network as keyof typeof addresses[keyof typeof addresses]] || ""
    }
}

export async function getDashboard() {
    const session = await getServerSession(authOptions)

    const userId = session.user.id;
    try {
        const orders = await prisma.orders.findMany({
            where: { userId },
        });

        const totalBalance = await prisma.balances.findUnique({
            where:{ userId }
        })

        const trades = await prisma.trade_Transaction.findMany({
            where: { userId },
        });

        const totalRevenue = orders.length > 0
            ? orders.reduce((total, order) => total + order.amount, 0)
            : 0;

// Calculate totalProfit only if trades are not empty
        const totalProfit = trades.length > 0
            ? trades.reduce((total, trade) => total + (trade.profit || 0), 0)
            : 0;

// Calculate moneyInWork only if trades are not empty
        const moneyInWork = trades.length > 0
            ? trades.reduce((total, trade) => total + (trade.profit || 0), 0)
            : 0;// Assuming this is the total profit in open trades


        // Calculate last month's revenue and profit for chart
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1); // First day of the last month
        const lastMonthEnd = new Date(lastMonthStart);
        lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
        lastMonthEnd.setDate(0); // Last day of the last month

        const lastMonthOrders = await prisma.orders.findMany({
            where: {
                userId,
                createdAt: {
                    gte: lastMonthStart,
                    lte: lastMonthEnd,
                },
            },
        });

        const lastMonthTrades = await prisma.trade_Transaction.findMany({
            where: {
                userId,
                createdAt: {
                    gte: lastMonthStart,
                    lte: lastMonthEnd,
                },
            },
        });

        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + order.amount, 0);
        const lastMonthProfit = lastMonthTrades.reduce((total, trade) => total + (trade.profit || 0), 0);

        const calculatePreviousBalance = (trades: any, totalBalance: number) => {
            const previousBalance = trades
                .filter((trade) => typeof trade.profit === 'number') // Exclude null profits
                .reduce((total: number, trade) => total - (trade.profit || 0), totalBalance); // Initial value is a number

            const profitChange = previousBalance !== 0
                ? ((totalBalance - previousBalance) / previousBalance) * 100
                : 0;

            return { previousBalance, profitChange };
        };

// Example usage:
        const { previousBalance, profitChange } = calculatePreviousBalance(trades, totalBalance.usd);

        // Prepare data to send to frontend
        const data = {
            totalBalance: totalBalance.usd,
            totalRevenue,
            totalProfit,
            moneyInWork,
            lastMonthRevenue,
            lastMonthProfit,
            profitChange,
            orders,
            trades,
            revenueDataLastMonth: lastMonthRevenue, // This can be passed to the chart component on the frontend
        };

        return data;
    } catch (error) {
        console.error(error);
    }
}
