'use client';

import React from 'react';
import { RadialBarChart, RadialBar, Legend } from 'recharts';

const RadialProfitLossChart = ({ totalProfit }) => {
    // Prepare chart data
    const profitPercentage = Math.abs(totalProfit); // Absolute value for display
    const isProfit = totalProfit >= 0;

    const data = [
        {
            name: isProfit ? 'Profit' : 'Loss',
            value: profitPercentage,
            fill: isProfit ? '#4CAF50' : '#F44336', // Green for profit, red for loss
        },
    ];

    return (
        <div className="flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold mb-4">
                {isProfit ? 'Total Profit' : 'Total Loss'}
            </h2>
            <RadialBarChart
                width={200}
                height={200}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="80%"
                barSize={20}
                data={data}
            >
                <RadialBar
                    dataKey="value"
                    background
                />
                <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" />
            </RadialBarChart>
            <p className="text-center text-lg font-medium mt-2">
                {isProfit ? `$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
            </p>
        </div>
    );
};

export default RadialProfitLossChart;
