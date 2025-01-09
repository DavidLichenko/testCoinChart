'use client'
import DashboardCard from '@/components/DashboardCard';
import {getDashboard} from "@/actions/form";
import RevenueChart from "@/components/RevenueChart";
import {useEffect, useState} from "react";
import {Skeleton} from "@/components/ui/skeleton";
import RadialProfitLossChart from "@/components/RadialChart";

async function fetchData() {
    return await getDashboard()
}

// Helper function to calculate total revenue
const calculateRevenue = (orders) => {
    return orders.length > 0
        ? orders.reduce((total, order) => total + order.amount, 0)
        : 0;
};

// Helper function to calculate money in work (i.e., in trade)
const calculateMoneyInWork = (trades) => {
    return trades.length > 0
        ? trades.reduce((total, trade) => total + (trade.profit || 0), 0)
        : 0;
};

// Helper function to calculate total profit from trades
const calculateProfit = (trades) => {
    return trades && trades.length > 0
        ? trades.reduce((total, trade) => total + (trade.profit || 0), 0)
        : 0;
};

// Helper function to format values and avoid errors with .toFixed(2)
const formatValue = (value) => {
    if (value === null || value === undefined || value === 0) {
        return '0.00'; // Show '0.00' if the value is 0 or undefined
    }
    return value.toFixed(2);
};


export default  function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchDataAsync = async () => {
            const data = await fetchData();
            setData(data)
            console.log(data)
            setLoading(false)
        };
        fetchDataAsync();

    }, []);

    if (!data) {
        return <div>Loading...</div>;
    }
    // Calculate values for total revenue, money in work, and profit
    const totalRevenue = calculateRevenue(data.orders);
    const moneyInWork = calculateMoneyInWork(data.trades);
    const totalProfit = calculateProfit(data.trades);

    const currentMonthProfit = totalProfit;
    const lastMonthProfit = calculateProfit(data.lastMonthTrades); // Fetch profit from last month's trades


    console.log(data)
    return (
        <>
            { loading ? <Skeleton className={'w-full h-full'}><span className={'opacity-0'}>0</span></Skeleton> :
                <div className={'container w-full h-full mb-16'}>
                    <h1 className="text-2xl font-bold mb-6 text-center">Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardCard
                            title="Total Balance"
                            value={`$${formatValue(data.totalBalance)}`}
                            change={null}
                        />

                        <DashboardCard
                            title="Total Profit"
                            value={`$${formatValue(totalProfit)}`} // All-time total profit
                            change={null} // No change for this card
                        />
                    </div>

                    {/*/!* Revenue Chart for Last Month *!/*/}
                    {/*<div className="mt-6">*/}
                    {/*    <RevenueChart data={data.revenueDataLastMonth} />*/}
                    {/*</div>*/}

                    {/* Profit and Profit Change for All Time */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardCard
                            title="Profit This Month"
                            value={`$${formatValue(totalProfit)}`}
                            change={null}// All-time profit
                        />
                        <DashboardCard
                            title="Profit Change"
                            value={`${formatValue(data.profitChange)}%`} // Percentage change from last month to current
                            change={data.profitChange}
                        />
                        <div className="col-span-1 md:col-span-2">
                            <RadialProfitLossChart totalProfit={totalProfit}/>
                        </div>
                    </div>
                </div>
            }
        </>
    );
}
