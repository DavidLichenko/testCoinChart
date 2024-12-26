"use server";

import {prisma} from "@/prisma/prisma-client";
import yahooFinance from "yahoo-finance2";
import { getServerSession } from "next-auth"
import {authOptions} from "@/lib/auth";


const arraySearchData: string[] = [];
export async function getSearchData(el) {
    // console.log(el)
    if (!el){
        return []
    }
    const headers = {
        'Authorization': 'Token 5c5398add0e123606bb40277f4cb66352b386185',
        'Content-Type': 'application/json'
    };
    const url = `https://api.tiingo.com/tiingo/utilities/search/${el}`

    const response = await fetch(url,{ headers: headers })

    return await response.json();
}




let price = '';

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
export async function CreateTradeTransaction(status,type,takeProfit,profit,ticker,leverage,openIn,closeIn,stopLoss,volume) {
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
            ticker:ticker,
            leverage:parseFloat(leverage),
            openIn:parseFloat(openIn),
            openInA:parseFloat(openIn),
            closeIn:parseFloat(closeIn),
            stopLoss:parseFloat(stopLoss),
            volume:volume,
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
export async function GetUserBalanceById(id) {
    return await prisma.balances.findUnique({
        where: {
            userId:id
        }
    })
}
export async function GetUserTransById(id) {
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
export async function addComments(id,messages) {
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
export async function getComments(id) {
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
export async function updateDataAboutUserBalace(balance, id) {
    await prisma.balances.update({
        where:{
            userId: id,
        },
        data: {
            usd:balance
        }
    })
}
export async function UpdateUserBalance(profit) {
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


