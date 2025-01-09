'use client';

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export default function RevenueChart({ data }) {
    console.log(data)
    const chartData = data.map(item => ({
        month: item.month,
        revenue: item.revenue,
    }));
    // const chartData = [
    //     { month: "January", desktop: 186, mobile: 80 },
    //     { month: "February", desktop: 305, mobile: 200 },
    //     { month: "March", desktop: 237, mobile: 120 },
    //     { month: "April", desktop: 73, mobile: 190 },
    //     { month: "May", desktop: 209, mobile: 130 },
    //     { month: "June", desktop: 214, mobile: 140 },
    // ]
    const chartConfig = {
        month: {
            label: "Month",
            color: "hsl(var(--chart-1))",
        },
        Revenue: {
            label: "Revenue",
            color: "hsl(var(--chart-2))",
        },
    } satisfies ChartConfig
    return (
        <Card>
            <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>January - June 2025</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Line
                            dataKey="desktop"
                            type="natural"
                            stroke="var(--color-desktop)"
                            strokeWidth={2}
                            dot={{
                                fill: "var(--color-desktop)",
                            }}
                            activeDot={{
                                r: 6,
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                    Your income up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
            </CardFooter>
        </Card>
    );
}
