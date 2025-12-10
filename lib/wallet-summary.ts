// lib/wallet-summary.ts
import {prisma} from "@/lib/prisma";
import {OrderStatus, OrderType, StakingStatus, TradeTransactionStatus} from "@prisma/client";

export type WalletSummary = {
    baseCurrency: "USD" | "EUR";
    tradingBalance: number;        // used in header + equity
    tradingInTrade: number;        // margin in open trades
    walletTotal: number;           // sum of ownBalance across all assets (in user's preferred currency)
    stakingTotal: number;          // sum of active staking positions (in user's preferred currency)
    creditLimit: number;
    creditUsed: number;
    availableForWithdraw: number;  // own funds, not credit, not in trade, not locked, not in pending withdraws
    availableForTrade: number;     // own + free credit - locked - pending withdraws
};

export async function calculateUserWalletSummary(userId: string): Promise<WalletSummary> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            baseCurrency: true,
            walletBalances: {
                select: {
                    assetSymbol: true,
                    ownBalance: true,
                    creditLimit: true,
                    creditUsed: true,
                    locked: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const baseCurrency = user.baseCurrency ?? "EUR";

    const baseWallet =
        user.walletBalances.find((w) => w.assetSymbol === baseCurrency) ??
        user.walletBalances[0];

    // Filter out base currency wallet from crypto assets
    const cryptoWallets = baseWallet 
        ? user.walletBalances.filter(w => w.assetSymbol !== baseCurrency)
        : user.walletBalances;

    let walletTotal = 0;
    if (cryptoWallets.length > 0) {
        try {
            // Get all unique asset symbols (excluding USD/USDT)
            const assetSymbols = [...new Set(cryptoWallets.map(w => w.assetSymbol))];
            
            // Create pairs for Binance API
            const pairs = assetSymbols
                .filter(symbol => symbol !== "USD" && symbol !== "USDT")
                .map(symbol => `${symbol}USDT`);
            
            // Get prices from Binance
            if (pairs.length > 0) {
                const symbolsParam = encodeURIComponent(JSON.stringify(pairs));
                const pricesRes = await fetch(
                    `https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`,
                    { cache: "no-store" }
                );
                
                if (pricesRes.ok) {
                    const pricesData = await pricesRes.json();
                    const priceMap: Record<string, number> = {};
                    
                    // Create price map
                    for (const priceObj of pricesData) {
                        priceMap[priceObj.symbol] = parseFloat(priceObj.price);
                    }
                    
                    // Convert each wallet asset to base currency
                    for (const wallet of cryptoWallets) {
                        if (wallet.assetSymbol === "USD" || wallet.assetSymbol === "USDT") {
                            // Convert USD to base currency
                            if (baseCurrency === "EUR") {
                                const eurUsdPrice = priceMap["EURUSDT"] || 1;
                                walletTotal += wallet.ownBalance / eurUsdPrice;
                            } else {
                                // For USD users, no conversion needed
                                walletTotal += wallet.ownBalance;
                            }
                        } else {
                            // Convert crypto asset to base currency via USDT
                            const pair = `${wallet.assetSymbol}USDT`;
                            const priceInUSDT = priceMap[pair] || 0;
                            
                            if (priceInUSDT > 0) {
                                if (baseCurrency === "EUR") {
                                    const eurUsdPrice = priceMap["EURUSDT"] || 1;
                                    walletTotal += (wallet.ownBalance * priceInUSDT) / eurUsdPrice;
                                } else {
                                    // For USD users
                                    walletTotal += wallet.ownBalance * priceInUSDT;
                                }
                            }
                        }
                    }
                } else {
                    throw new Error("Failed to fetch prices");
                }
            }
        } catch (error) {
            console.warn("Failed to calculate wallet total, using fallback:", error);
            // Fallback: sum all crypto balances directly (less accurate)
            walletTotal = cryptoWallets.reduce(
                (sum, w) => sum + (w.ownBalance || 0),
                0
            );
        }
    }

    // margin in open trades
    const openTradesAgg = await prisma.trade_Transaction.aggregate({
        where: {
            userId,
            status: TradeTransactionStatus.OPEN,
        },
        _sum: { margin: true },
    });

    const tradingInTrade = openTradesAgg._sum.margin || 0;

    // pending withdraw orders (fiat)
    const pendingWithdrawAgg = await prisma.orders.aggregate({
        where: {
            userId,
            status: OrderStatus.PENDING,
            type: OrderType.WITHDRAW,
        },
        _sum: { amount: true },
    });

    const pendingWithdrawAmount = pendingWithdrawAgg._sum.amount || 0;

    // staking sum converted to user's preferred currency
    const activeStaking = await prisma.stakingPosition.findMany({
        where: {
            userId,
            status: StakingStatus.ACTIVE,
        },
        select: {
            amount: true,
            assetSymbol: true,
        },
    });

    // Filter out base currency staking positions
    const cryptoStaking = activeStaking.filter(s => s.assetSymbol !== baseCurrency);

    let stakingTotal = 0;
    if (cryptoStaking.length > 0) {
        try {
            // Get all unique staking asset symbols
            const stakingSymbols = [...new Set(cryptoStaking.map(s => s.assetSymbol))];
            
            // Create pairs for Binance API
            const pairs = stakingSymbols
                .filter(symbol => symbol !== "USD" && symbol !== "USDT")
                .map(symbol => `${symbol}USDT`);
            
            // Get prices from Binance
            if (pairs.length > 0) {
                const symbolsParam = encodeURIComponent(JSON.stringify(pairs));
                const pricesRes = await fetch(
                    `https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`,
                    { cache: "no-store" }
                );
                
                if (pricesRes.ok) {
                    const pricesData = await pricesRes.json();
                    const priceMap: Record<string, number> = {};
                    
                    // Create price map
                    for (const priceObj of pricesData) {
                        priceMap[priceObj.symbol] = parseFloat(priceObj.price);
                    }
                    
                    // Convert each staking position to user's preferred currency
                    for (const stake of cryptoStaking) {
                        if (stake.assetSymbol === "USD" || stake.assetSymbol === "USDT") {
                            // Convert USD to user's preferred currency
                            if (baseCurrency === "EUR") {
                                const eurUsdPrice = priceMap["EURUSDT"] || 1;
                                stakingTotal += stake.amount / eurUsdPrice;
                            } else {
                                // For USD users, no conversion needed
                                stakingTotal += stake.amount;
                            }
                        } else {
                            // Convert crypto asset to user's preferred currency via USDT
                            const pair = `${stake.assetSymbol}USDT`;
                            const priceInUSDT = priceMap[pair] || 0;
                            
                            if (priceInUSDT > 0) {
                                if (baseCurrency === "EUR") {
                                    const eurUsdPrice = priceMap["EURUSDT"] || 1;
                                    stakingTotal += (stake.amount * priceInUSDT) / eurUsdPrice;
                                } else {
                                    // For USD users, USDT ≈ USD
                                    stakingTotal += stake.amount * priceInUSDT;
                                }
                            }
                        }
                    }
                } else {
                    throw new Error("Failed to fetch prices");
                }
            }
        } catch (error) {
            console.warn("Failed to calculate staking total, using fallback:", error);
            // Fallback: sum all crypto staking amounts directly (less accurate)
            stakingTotal = cryptoStaking.reduce(
                (sum, s) => sum + (s.amount || 0),
                0
            );
        }
    }

    let creditLimit = 0;
    let creditUsed = 0;
    let tradingBalance = 0;
    let availableForWithdraw = 0;
    let availableForTrade = 0;

    if (baseWallet) {
        creditLimit = baseWallet.creditLimit || 0;
        creditUsed = baseWallet.creditUsed || 0;

        const own = baseWallet.ownBalance || 0;
        const locked = baseWallet.locked || 0;
        const freeCredit = Math.max(0, creditLimit - creditUsed);

        // то, что используем для Equity в хедере (можешь подправить формулу под себя)
        tradingBalance = own + freeCredit;

        // доступные для вывода: только свои, без кредита,
        // не в сделках, не в pending withdraw, не locked
        availableForWithdraw = Math.max(
            0,
            own - tradingInTrade - locked - pendingWithdrawAmount
        );

        // доступные для открытия сделок: свои + свободный кредит, не locked и не в pending withdraw
        availableForTrade = Math.max(
            0,
            own + freeCredit - locked - pendingWithdrawAmount
        );
    }

    return {
        baseCurrency,
        tradingBalance,
        tradingInTrade,
        walletTotal,
        stakingTotal,
        creditLimit,
        creditUsed,
        availableForWithdraw,
        availableForTrade,
    };
}