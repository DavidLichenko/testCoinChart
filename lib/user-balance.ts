// lib/user-balance.ts
import {prisma} from "@/lib/prisma";

export async function getUserBalanceData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            baseCurrency: true,
            walletBalances: {
                select: {
                    assetSymbol: true,
                    ownBalance: true,
                    creditBalance: true,
                    locked: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const baseCurrency = (user.baseCurrency || "EUR") as "EUR" | "USD";

    const tradingWallet =
        user.walletBalances.find(
            (w) => w.assetSymbol.toUpperCase() === baseCurrency
        ) ?? {
            assetSymbol: baseCurrency,
            ownBalance: 0,
            creditBalance: 0,
            locked: 0,
        };

    const ownBalance = tradingWallet.ownBalance;
    const creditBalance = tradingWallet.creditBalance;
    const lockedTrading = tradingWallet.locked;
    
    // Trading balance includes own balance + credit balance
    const tradingBalance = ownBalance + creditBalance;

    // OPEN TRADES
    const openTrades = await prisma.trade_Transaction.findMany({
        where: {
            userId,
            status: "OPEN",
        },
        select: {
            margin: true,
            profit: true,
        },
    });

    const tradingInTrade = openTrades.reduce(
        (sum, t) => sum + (t.margin || 0),
        0
    );

    const liveProfit = openTrades.reduce(
        (sum, t) => sum + (t.profit || 0),
        0
    );

    // PENDING WITHDRAW ORDERS
    const pendingWithdrawals = await prisma.orders.findMany({
        where: {
            userId,
            type: "WITHDRAW",
            status: "PENDING",
        },
        select: { amount: true },
    });

    const pendingWithdrawAmount = pendingWithdrawals.reduce(
        (sum, o) => sum + (o.amount || 0),
        0
    );

    // добавляем НОВОЕ:
    const availableToWithdraw = Math.max(
        0,
        ownBalance - tradingInTrade - pendingWithdrawAmount - lockedTrading
    );
    // STAKING
    const activeStaking = await prisma.stakingPosition.findMany({
        where: {
            userId,
            status: "ACTIVE",
        },
        select: {
            amount: true,
            assetSymbol: true,
        },
    });

    // Filter out base currency staking positions
    const cryptoStaking = activeStaking.filter(s => s.assetSymbol !== baseCurrency);

    // Convert staking positions to USD value
    let stakingTotalUsd = 0;
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
                    
                    // Convert each staking position to USD
                    for (const stake of cryptoStaking) {
                        if (stake.assetSymbol === "USD" || stake.assetSymbol === "USDT") {
                            // Already in USD
                            stakingTotalUsd += stake.amount;
                        } else {
                            // Convert crypto asset to USD
                            const pair = `${stake.assetSymbol}USDT`;
                            const priceInUSDT = priceMap[pair] || 0;
                            
                            if (priceInUSDT > 0) {
                                stakingTotalUsd += stake.amount * priceInUSDT;
                            } else {
                                // Fallback to direct addition if price unavailable
                                stakingTotalUsd += stake.amount;
                            }
                        }
                    }
                } else {
                    // Fallback if batch price fetch fails
                    stakingTotalUsd = cryptoStaking.reduce(
                        (sum, s) => sum + (s.amount || 0),
                        0
                    );
                }
            } else {
                // Fallback if no pairs needed
                stakingTotalUsd = cryptoStaking.reduce(
                    (sum, s) => sum + (s.amount || 0),
                    0
                );
            }
        } catch (error) {
            console.warn("Failed to calculate staking total in USD, using fallback:", error);
            // Final fallback
            stakingTotalUsd = cryptoStaking.reduce(
                (sum, s) => sum + (s.amount || 0),
                0
            );
        }
    }

    // Convert all wallet assets to USD value
    let walletTotalUsd = 0;
    if (user.walletBalances.length > 0) {
        try {
            // Get all unique asset symbols (excluding USD/USDT and base currency)
            const assetSymbols = [...new Set(user.walletBalances
                .filter(w => w.assetSymbol !== baseCurrency)
                .map(w => w.assetSymbol)
            )];
            
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
                    
                    // Convert each wallet asset to USD (excluding base currency)
                    for (const wallet of user.walletBalances) {
                        // Skip base currency wallet as it's already counted in tradingBalance
                        if (wallet.assetSymbol === baseCurrency) {
                            continue;
                        }
                        
                        if (wallet.assetSymbol === "USD" || wallet.assetSymbol === "USDT") {
                            // Already in USD
                            walletTotalUsd += wallet.ownBalance;
                        } else {
                            // Convert crypto asset to USD
                            const pair = `${wallet.assetSymbol}USDT`;
                            const priceInUSDT = priceMap[pair] || 0;
                            
                            if (priceInUSDT > 0) {
                                walletTotalUsd += wallet.ownBalance * priceInUSDT;
                            } else {
                                // Fallback to direct addition if price unavailable
                                walletTotalUsd += wallet.ownBalance;
                            }
                        }
                    }
                } else {
                    // Fallback if batch price fetch fails
                    walletTotalUsd = user.walletBalances
                        .filter(w => w.assetSymbol !== baseCurrency)
                        .reduce(
                            (sum, w) => sum + (w.ownBalance || 0),
                            0
                        );
                }
            } else {
                // Fallback if no pairs needed
                walletTotalUsd = user.walletBalances
                    .filter(w => w.assetSymbol !== baseCurrency)
                    .reduce(
                        (sum, w) => sum + (w.ownBalance || 0),
                        0
                    );
            }
        } catch (error) {
            console.warn("Failed to calculate wallet total in USD, using fallback:", error);
            // Final fallback
            walletTotalUsd = user.walletBalances
                .filter(w => w.assetSymbol !== baseCurrency)
                .reduce(
                    (sum, w) => sum + (w.ownBalance || 0),
                    0
                );
        }
    }

    // Available for trade: own + credit - in trade - locked - pending withdraws
    const availableToTrade = Math.max(
        0,
        tradingBalance -
        tradingInTrade -
        pendingWithdrawAmount -
        lockedTrading
    );

    // Calculate total equity in USD (internal calculation)
    // This includes trading balance converted to USD, live profit, wallet total in USD, and staking total in USD
    // tradingBalance is converted to USD, walletTotalUsd is already in USD, stakingTotalUsd is already in USD
    let tradingBalanceUsd = tradingBalance;
    
    // Convert base currency trading balance to USD if needed
    if (baseCurrency === "EUR") {
        try {
            const eurUsdRes = await fetch(
                "https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT",
                { cache: "no-store" }
            );
            
            if (eurUsdRes.ok) {
                const eurUsdData = await eurUsdRes.json();
                const eurUsdRate = parseFloat(eurUsdData.price);
                if (!isNaN(eurUsdRate) && eurUsdRate > 0) {
                    tradingBalanceUsd = tradingBalance * eurUsdRate;
                }
            }
        } catch (error) {
            console.warn("Failed to fetch EUR/USD rate for trading balance:", error);
        }
    }
    
    const totalEquityUsd = tradingBalanceUsd + liveProfit + walletTotalUsd + stakingTotalUsd;

    // For EUR users, convert total equity back to EUR for display
    let totalEquityDisplay = totalEquityUsd;
    let eurUsdRate: number | undefined;
    if (baseCurrency === "EUR") {
        try {
            const eurUsdRes = await fetch(
                "https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT",
                { cache: "no-store" }
            );
            
            if (eurUsdRes.ok) {
                const eurUsdData = await eurUsdRes.json();
                eurUsdRate = parseFloat(eurUsdData.price);
                if (!isNaN(eurUsdRate) && eurUsdRate > 0) {
                    totalEquityDisplay = totalEquityUsd / eurUsdRate;
                }
            }
        } catch (error) {
            console.warn("Failed to fetch EUR/USD rate for display:", error);
        }
    }

    // For EUR users, also provide approximate USD value for display
    let approxUsd: number | undefined;
    if (baseCurrency === "EUR") {
        approxUsd = totalEquityUsd;
    }

    return {
        balance: totalEquityDisplay,  // Display value in user's preferred currency
        liveProfit,
        details: {
            baseCurrency,
            tradingBalance,
            tradingInTrade,
            pendingWithdrawAmount,
            availableToWithdraw,
            lockedTrading,
            walletTotal: walletTotalUsd,  // Internal value in USD
            stakingTotal: stakingTotalUsd,  // Internal value in USD
            creditBalance,
            availableToTrade,
            ...(approxUsd !== undefined ? { approxUsd } : {}),
            ...(eurUsdRate !== undefined ? { eurUsdRate } : {}),
        },
    };
}