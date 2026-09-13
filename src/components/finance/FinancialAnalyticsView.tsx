"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Flame,
    PieChart as PieIcon,
    BarChart3,
    Briefcase,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    ShieldAlert,
    Landmark,
    Smartphone,
    Wallet,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#64748b", // slate-500
];

interface MonthlyTrend {
    month: string;
    income: number;
    incomeBdt: number;
    expense: number;
    expenseBdt: number;
    profit: number;
    profitBdt: number;
}

interface CategoryBreakdown {
    category: string;
    amount: number;
    amountBdt: number;
}

interface ProjectProfitability {
    id: string;
    title: string;
    clientName: string;
    status: string;
    budget: number;
    revenueCollected: number;
    pendingRevenue: number;
    profit: number;
    margin: number;
}

interface CashFlowForecast {
    horizon: string;
    projectedInflow: number;
    projectedInflowBdt: number;
    projectedOutflow: number;
    projectedOutflowBdt: number;
    netCashFlow: number;
    netCashFlowBdt: number;
}

interface AccountBalanceItem {
    _id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar?: string;
    providerName: string;
    accountName: string;
    accountNumber: string;
    type: string;
    branch?: string;
    routingNumber?: string;
    balance: number;
    balanceInBdt: number;
}

interface AnalyticsData {
    monthlyTrends: MonthlyTrend[];
    categoryBreakdown: CategoryBreakdown[];
    projectProfitability: ProjectProfitability[];
    cashFlowForecast: CashFlowForecast[];
    accountBalances: AccountBalanceItem[];
    summaryMetrics: {
        totalIncome6M: number;
        totalIncome6MBdt: number;
        totalExpense6M: number;
        totalExpense6MBdt: number;
        netProfit6M: number;
        netProfit6MBdt: number;
        profitMargin6M: number;
        monthlyBurnRate: number;
        monthlyBurnRateBdt: number;
    };
}

const CustomTooltip = ({ active, payload, label, currencyPrefix }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover/90 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl text-xs space-y-1">
                <p className="font-semibold text-popover-foreground">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                        <span style={{ color: entry.color }} className="font-medium">
                            {entry.name}:
                        </span>
                        <span className="font-bold text-popover-foreground">
                            {currencyPrefix}{Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ACCOUNT_PIE_COLORS = [
    "#6366f1", // indigo-500
    "#10b981", // emerald-500
    "#3b82f6", // blue-500
    "#f59e0b", // amber-500
    "#ec4899", // pink-500
    "#8b5cf6", // violet-500
    "#14b8a6", // teal-500
    "#06b6d4", // cyan-500
    "#f43f5e", // rose-500
    "#64748b", // slate-500
];

const AccountPieTooltip = ({ active, payload, currencyPrefix }: any) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className="bg-popover/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[220px]">
                <div className="flex items-center gap-2">
                    <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                    />
                    <p className="font-bold text-foreground truncate">{item.providerName}</p>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                    {item.accountNumber} • {item.accountName}
                </p>
                <p className="text-[10px] text-muted-foreground">Owner: {item.userName}</p>
                <div className="border-t border-border/50 pt-1.5 flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-bold text-foreground">
                        {currencyPrefix}{Number(item.actualBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                {item.percent !== undefined && (
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>Share of Liquidity:</span>
                        <span className="font-semibold text-indigo-500">{item.percent}%</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export default function FinancialAnalyticsView() {
    const currency = "BDT";
    const [forecastHorizon, setForecastHorizon] = useState<"30" | "60" | "90">("30");

    const currencyPrefix = "৳";

    const { data, isLoading, isError, refetch } = useQuery<AnalyticsData>({
        queryKey: ["finance-analytics"],
        queryFn: async () => {
            const res = await fetch("/api/finance/analytics");
            if (!res.ok) throw new Error("Failed to fetch analytics data");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
                    <Skeleton className="h-80 rounded-xl" />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <Card className="border-destructive/30 bg-destructive/5 text-destructive p-6 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6" />
                    <div>
                        <h4 className="font-semibold">Failed to load financial analytics</h4>
                        <p className="text-xs opacity-80">Unable to query analytics metrics at this time.</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                </Button>
            </Card>
        );
    }

    const {
        summaryMetrics,
        monthlyTrends = [],
        categoryBreakdown = [],
        projectProfitability = [],
        cashFlowForecast = [],
        accountBalances = [],
    } = data;

    // Currency mapped metrics (standardized to BDT)
    const netProfitActive = summaryMetrics.netProfit6MBdt;
    const burnRateActive = summaryMetrics.monthlyBurnRateBdt;
    const inflow30Active = cashFlowForecast[0]?.projectedInflowBdt || 0;

    // Filtered trends by currency
    const activeMonthlyTrends = monthlyTrends.map((m) => ({
        month: m.month,
        income: m.incomeBdt,
        expense: m.expenseBdt,
        profit: m.profitBdt,
    }));

    // Filtered categories by currency
    const activeCategories = categoryBreakdown.map((c) => ({
        category: c.category,
        amount: c.amountBdt,
    }));

    // Filtered forecast by currency
    const activeForecast = cashFlowForecast.map((f) => ({
        horizon: f.horizon,
        projectedInflow: f.projectedInflowBdt,
        projectedOutflow: f.projectedOutflowBdt,
        netCashFlow: f.netCashFlowBdt,
    }));

    const selectedForecast = activeForecast.find((f) => f.horizon.includes(forecastHorizon)) || activeForecast[0];

    // Account balances & liquidity breakdown mapped by active currency
    const totalAccountLiquidity = accountBalances.reduce(
        (sum, item) => sum + (item.balanceInBdt || 0),
        0
    );

    const accountPieData = accountBalances.map((acc, index) => {
        const rawBalance = acc.balanceInBdt || 0;
        const percent = totalAccountLiquidity > 0 ? ((rawBalance / totalAccountLiquidity) * 100) : 0;
        return {
            ...acc,
            name: `${acc.providerName} (${acc.accountNumber.slice(-4)})`,
            fullName: `${acc.providerName} - ${acc.accountNumber}`,
            actualBalance: rawBalance,
            value: Math.max(0, rawBalance),
            percent: percent.toFixed(1),
            color: ACCOUNT_PIE_COLORS[index % ACCOUNT_PIE_COLORS.length],
        };
    });

    const hasPositiveFunds = accountPieData.some((a) => a.value > 0);
    const pieChartData = hasPositiveFunds
        ? accountPieData.filter((a) => a.value > 0)
        : [
              {
                  name: "Zero Balance",
                  fullName: "All accounts balance = 0",
                  providerName: "Zero Liquidity",
                  accountNumber: "----",
                  accountName: "0.00 Balance",
                  userName: "All",
                  actualBalance: 0,
                  value: 1,
                  percent: "0.0",
                  color: "#94a3b8",
              },
          ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Controls Bar: Currency Selector Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs">
                <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                        Financial Analytics & Forecasting
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Track historical income, operating costs, liquidity by account, and predictive cash flow.
                    </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 rounded-xl border border-border">
                    <span className="text-xs font-semibold text-muted-foreground">Currency:</span>
                    <Badge className="bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold text-xs">
                        BDT (৳)
                    </Badge>
                </div>
            </div>

            {/* Top KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card/80 via-card to-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            6-Month Net Profit
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {currencyPrefix}{Math.round(netProfitActive).toLocaleString()}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            {netProfitActive >= 0 ? (
                                <span className="text-emerald-500 font-medium flex items-center mr-1">
                                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                                    +{summaryMetrics.profitMargin6M}% Margin
                                </span>
                            ) : (
                                <span className="text-red-500 font-medium flex items-center mr-1">
                                    <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                                    {summaryMetrics.profitMargin6M}% Margin
                                </span>
                            )}
                            <span className="opacity-70">vs Expenses</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card/80 via-card to-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Monthly Burn Rate
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Flame className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {currencyPrefix}{Math.round(burnRateActive).toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground">/mo</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Trailing 90-day avg operating spend
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card/80 via-card to-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Forecasted Inflow (30d)
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {currencyPrefix}{Math.round(inflow30Active).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pending project milestones & quote advances
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card/80 via-card to-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Overall Profit Margin
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                            <Sparkles className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {summaryMetrics.profitMargin6M}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Avg profit retained per {currencyPrefix}1 earned
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Account Balances Breakdown Chart & Liquidity */}
            <Card className="border-border/60 shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-indigo-500" />
                                Account Balances & Liquidity Distribution ({currency})
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Real-time balance currently held across linked bank and mobile banking accounts in {currency}.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-semibold text-xs">
                                Total Accounts: {accountBalances.length}
                            </Badge>
                            <Badge className="bg-indigo-600 text-white font-semibold text-xs">
                                Total: {currencyPrefix}{Number(totalAccountLiquidity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {accountBalances.length === 0 ? (
                        <div className="py-12 text-center text-xs text-muted-foreground">
                            No linked accounts with balances found.
                        </div>
                    ) : (
                        <>
                            {/* Pie Chart & Breakdown Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-2">
                                {/* Left: Pie Chart */}
                                <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[250px]">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={95}
                                                paddingAngle={pieChartData.length > 1 && totalAccountLiquidity > 0 ? 3 : 0}
                                            >
                                                {pieChartData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<AccountPieTooltip currencyPrefix={currencyPrefix} />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Donut Center Total */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Total {currency}
                                        </span>
                                        <span className="text-base font-bold text-foreground">
                                            {currencyPrefix}{Number(totalAccountLiquidity).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Account Share Breakdown List */}
                                <div className="lg:col-span-7 space-y-2.5">
                                    <div className="flex items-center justify-between pb-1 border-b border-border/50">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Account Share Breakdown ({currency})
                                        </p>
                                        <span className="text-[11px] text-muted-foreground">
                                            Active Currency: <strong className="text-foreground">{currency}</strong>
                                        </span>
                                    </div>
                                    <div className="max-h-[230px] overflow-y-auto space-y-2 pr-1">
                                        {accountPieData.map((item: any) => (
                                            <div
                                                key={item._id}
                                                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span
                                                        className="h-3 w-3 rounded-full shrink-0"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-foreground truncate">
                                                            {item.providerName}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                                                            {item.accountNumber} • {item.userName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-2">
                                                    <p className="font-bold text-foreground">
                                                        {currencyPrefix}{Number(item.actualBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                    <span className="inline-block text-[10px] font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded mt-0.5">
                                                        {item.percent}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Account Detail Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {accountBalances.map((acc) => {
                                    const bal = acc.balanceInBdt || acc.balance || 0;
                                    return (
                                        <div
                                            key={acc._id}
                                            className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-muted/30 transition-all flex items-start justify-between gap-3 shadow-xs"
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 mt-0.5">
                                                    {acc.type === "bank" ? (
                                                        <Landmark className="h-4 w-4" />
                                                    ) : (
                                                        <Smartphone className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-xs text-foreground truncate">
                                                        {acc.providerName}
                                                    </p>
                                                    <p className="font-mono text-[10px] text-muted-foreground truncate">
                                                        {acc.accountNumber} • {acc.accountName}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground/75 truncate mt-0.5">
                                                        Owner: {acc.userName}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-sm text-foreground">
                                                    {currencyPrefix}{Number(bal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* MoM Revenue vs Expense Area Chart */}
                <Card className="lg:col-span-2 border-border/60 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    MoM Revenue vs. Operating Expenses ({currency})
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Track historical monthly income, expenses, and net profit trends in {currency}.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activeMonthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                                    <Tooltip content={<CustomTooltip currencyPrefix={currencyPrefix} />} />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        name="Income"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#incomeGrad)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Expense"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#expenseGrad)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Category Breakdown Pie Chart */}
                <Card className="border-border/60 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <PieIcon className="h-4 w-4 text-primary" />
                            Expense Distribution ({currency})
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Breakdown of operating costs by category in {currency}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeCategories.length > 0 ? (
                            <div className="h-72 w-full flex flex-col items-center justify-center">
                                <ResponsiveContainer width="100%" height="70%">
                                    <PieChart>
                                        <Pie
                                            data={activeCategories}
                                            dataKey="amount"
                                            nameKey="category"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                        >
                                            {activeCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip currencyPrefix={currencyPrefix} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-full grid grid-cols-2 gap-2 text-xs mt-2 overflow-y-auto max-h-24 pr-1">
                                    {activeCategories.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 truncate">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                                            />
                                            <span className="text-muted-foreground truncate">{item.category}:</span>
                                            <span className="font-medium text-foreground ml-auto">
                                                {currencyPrefix}{Number(item.amount).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs">
                                No expense categorization records found.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Cash Flow Forecast & Project Profitability Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cash Flow Forecast */}
                <Card className="border-border/60 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Cash Flow Forecast ({currency})
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Estimated cash inflows vs burn rate over time in {currency}.
                                </CardDescription>
                            </div>
                            <div className="flex items-center bg-muted p-1 rounded-lg text-xs">
                                {(["30", "60", "90"] as const).map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => setForecastHorizon(h)}
                                        className={`px-2 py-1 rounded-md transition-all text-xs font-medium ${
                                            forecastHorizon === h
                                                ? "bg-background text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {h}d
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-48 w-full pt-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activeForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                    <XAxis dataKey="horizon" tick={{ fontSize: 11 }} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                                    <Tooltip content={<CustomTooltip currencyPrefix={currencyPrefix} />} />
                                    <Bar dataKey="projectedInflow" name="Projected Inflow" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="projectedOutflow" name="Expected Burn" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-medium">Selected Horizon:</span>
                                <Badge variant="outline" className="font-semibold">{selectedForecast.horizon}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Est. Inflow:</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    +{currencyPrefix}{selectedForecast.projectedInflow.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Est. Operating Burn:</span>
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                    -{currencyPrefix}{selectedForecast.projectedOutflow.toLocaleString()}
                                </span>
                            </div>
                            <div className="border-t border-border/40 pt-1.5 flex justify-between items-center font-bold">
                                <span>Projected Net Position:</span>
                                <span className={selectedForecast.netCashFlow >= 0 ? "text-emerald-500" : "text-red-500"}>
                                    {selectedForecast.netCashFlow >= 0 ? "+" : ""}{currencyPrefix}{selectedForecast.netCashFlow.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Project Profitability Leaderboard Table */}
                <Card className="lg:col-span-2 border-border/60 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            Project Profitability Leaderboard
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Top active projects ranked by total revenue collected and profit margins.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {projectProfitability.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-muted-foreground uppercase border-b border-border/60 bg-muted/20">
                                        <tr>
                                            <th className="py-2.5 px-3">Project / Client</th>
                                            <th className="py-2.5 px-3">Budget</th>
                                            <th className="py-2.5 px-3">Collected</th>
                                            <th className="py-2.5 px-3">Pending</th>
                                            <th className="py-2.5 px-3 text-right">Margin %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {projectProfitability.map((proj) => (
                                            <tr key={proj.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3">
                                                    <div className="font-medium text-foreground">{proj.title}</div>
                                                    <div className="text-[11px] text-muted-foreground">{proj.clientName}</div>
                                                </td>
                                                <td className="py-2.5 px-3 font-medium">
                                                    ৳{proj.budget.toLocaleString()}
                                                </td>
                                                <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    ৳{proj.revenueCollected.toLocaleString()}
                                                </td>
                                                <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-medium">
                                                    ৳{proj.pendingRevenue.toLocaleString()}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            proj.margin >= 70
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : proj.margin >= 40
                                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                        }
                                                    >
                                                        {proj.margin}%
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground text-xs">
                                No active project revenue data available yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
