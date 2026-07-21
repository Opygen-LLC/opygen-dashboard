"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    FolderKanban,
    Clock,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    RefreshCw,
    Sparkles,
    Wallet,
    CreditCard,
    Activity,
    Users,
    BarChart2,
    ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Legend,
    CartesianGrid,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import MonthlyBudgetBar from "@/components/dashboard/MonthlyBudgetBar";
import { StatsGrid } from "@/components/dashboard/stats/StatsGrid";
import { StatsCard } from "@/components/dashboard/stats/StatsCard";
import { ClientInfoModal } from "@/components/clients/modals/ClientInfoModal";
import { ClientFormModal } from "@/components/clients/modals/ClientFormModal";

/* ─── Animation Variants ─── */
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    }),
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.09 },
    },
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 120, damping: 18 },
    },
} as const;

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-xl border px-3 py-2 text-xs shadow-xl"
            style={{
                background: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
                color: isDark ? "#f8fafc" : "#0f172a",
            }}
        >
            {label && <p className="mb-1 font-bold text-[11px] opacity-60">{label}</p>}
            {payload.map((p: any, i: number) => (
                <p key={i} className="font-semibold" style={{ color: p.color }}>
                    {p.name}: <span className="text-foreground">{p.value}</span>
                </p>
            ))}
        </div>
    );
};

/* ─── Main Component ─── */
export default function AdminDashboardPage() {
    const [mounted, setMounted] = useState(false);
    const [dateRange, setDateRange] = useState("all");
    
    // Modal State
    const [infoClient, setInfoClient] = useState<any>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    useEffect(() => { setMounted(true); }, []);

    const { data: stats, isLoading, error, refetch, isRefetching } = useQuery<any>({
        queryKey: ["stats", dateRange],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/stats?range=${dateRange}`, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        },
    });

    const { data: clientsData } = useQuery<any>({
        queryKey: ["clients"],
        queryFn: async () => {
            const res = await fetch("/api/clients");
            if (!res.ok) throw new Error("Failed to fetch clients");
            return res.json();
        },
    });

    const today = new Date().toISOString().split("T")[0];
    const todayFollowUps = (Array.isArray(clientsData) ? clientsData : []).filter(
        (c: any) =>
            c.status === "Follow-up" &&
            c.followupDate &&
            new Date(c.followupDate).toISOString().split("T")[0] === today,
    );

    /* ─── Chart theme tokens ─── */
    const axisColor   = isDark ? "#64748b" : "#94a3b8";
    const gridColor   = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    const tooltipBg   = isDark ? "#0f172a" : "#ffffff";
    const tooltipBorder = isDark ? "#1e293b" : "#e2e8f0";
    const tooltipColor  = isDark ? "#f8fafc" : "#0f172a";
    const cursorFill    = isDark ? "#1e293b" : "#f1f5f9";

    /* ─── Loading skeleton ─── */
    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="h-44 w-full rounded-3xl bg-muted/30 animate-pulse" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
                </div>
            </div>
        );
    }

    /* ─── Error state ─── */
    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Error Loading Dashboard</h3>
                    <p className="text-sm text-muted-foreground mt-1">Could not retrieve project statistics.</p>
                </div>
                <Button onClick={() => refetch()} className="mt-2 cursor-pointer">Retry</Button>
            </div>
        );
    }

    const { summary, statusBreakdown, workload, completionTrend } = stats;

    /* ─── Card data ─── */
    const financialCards = [
        {
            title: "Pipeline Budget",
            value: summary.totalBudget || 0,
            description: "Total billing budget of active projects",
            icon: Wallet,
            accent: "from-indigo-500/15 to-violet-500/10",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            trend: "+12%",
        },
        {
            title: "Payments Collected",
            value: summary.totalRevenueReceived || 0,
            description: "Milestone payments received to date",
            icon: CheckCircle2,
            accent: "from-emerald-500/15 to-teal-500/10",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            trend: "+8%",
        },
        {
            title: "Outstanding",
            value: summary.totalRevenuePending || 0,
            description: "Billing awaiting completion approval",
            icon: CreditCard,
            accent: "from-amber-500/15 to-orange-500/10",
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            trend: null,
        },
    ];

    const projectCards = [
        {
            title: "Total Projects",
            value: summary.totalProjects,
            description: "All tracked projects",
            icon: FolderKanban,
            accent: "from-indigo-500/10 to-purple-500/10",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
        },
        {
            title: "In Development",
            value: summary.inProgress,
            description: "Active builds in progress",
            icon: Activity,
            accent: "from-sky-500/10 to-blue-500/10",
            iconBg: "bg-sky-500/10",
            iconColor: "text-sky-500",
        },
        {
            title: "Completed",
            value: summary.completed,
            description: "Successfully delivered",
            icon: CheckCircle2,
            accent: "from-emerald-500/10 to-teal-500/10",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
        },
        {
            title: "Overdue",
            value: summary.overdue,
            description: "Past their due dates",
            icon: AlertTriangle,
            accent: "from-rose-500/10 to-red-500/10",
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-500",
            badge: summary.overdue > 0,
        },
    ];

    const PIE_COLORS: Record<string, string> = {
        potential:   "#f59e0b",
        future:      "#0ea5e9",
        todo:        "#64748b",
        in_progress: "#6366f1",
        in_review:   "#a855f7",
        completed:   "#10b981",
        on_hold:     "#ef4444",
    };

    /* ══════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════ */
    return (
        <div className="space-y-8">

            {/* ─── Hero Banner ─── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-6 sm:p-8"
            >
                {/* Glowing orbs */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="pointer-events-none absolute right-20 bottom-0 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <motion.span
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold tracking-wide text-indigo-600 dark:text-indigo-400"
                        >
                            <Sparkles className="h-3 w-3" />
                            Co-Founder Workspace
                        </motion.span>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                            Admin &amp; Analytics Dashboard
                        </h1>
                        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                            Track Opygen's ongoing software developments, team workload, and financial collections in real-time.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                        {/* Quick stats pill */}
                        <div className="flex items-center justify-center gap-2 sm:gap-3 rounded-2xl border border-border/60 bg-card/60 px-3 sm:px-4 py-2 sm:py-2.5 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-muted-foreground divide-x divide-border/60 w-full sm:w-auto">
                            <span className="pr-2 sm:pr-3 whitespace-nowrap"><span className="text-foreground font-bold text-xs sm:text-sm">{summary.totalProjects}</span> Projects</span>
                            <span className="px-2 sm:px-3 whitespace-nowrap"><span className="text-emerald-500 font-bold text-xs sm:text-sm">{summary.completed}</span> Done</span>
                            <span className="pl-2 sm:pl-3 whitespace-nowrap"><span className="text-amber-500 font-bold text-xs sm:text-sm">{todayFollowUps.length}</span> Follow-ups</span>
                        </div>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="h-9 w-full sm:w-auto rounded-md border border-border/60 bg-card/80 px-3 text-xs font-semibold backdrop-blur-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="ytd">Year to Date</option>
                            <option value="all">All Time</option>
                        </select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isRefetching}
                            className="h-9 w-full sm:w-auto cursor-pointer justify-center gap-2 border-border/60 bg-card/80 px-4 text-xs font-bold backdrop-blur-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-indigo-500" : ""}`} />
                            {isRefetching ? "Refreshing…" : "Refresh"}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* ─── Financial KPI Cards ─── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-0.5">
                    <BarChart2 className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Financial Overview</h2>
                </div>

                <MonthlyBudgetBar monthlyCollected={summary.monthlyCollected ?? 0} />

                <StatsGrid columns={3}>
                    {financialCards.map((card, i) => (
                        <StatsCard
                            key={card.title}
                            title={card.title}
                            value={card.value}
                            description={card.description}
                            icon={card.icon}
                            iconBg={card.iconBg}
                            iconColor={card.iconColor}
                            trend={card.trend}
                            isCurrency={true}
                        />
                    ))}
                </StatsGrid>
            </div>

            {/* ─── Project Stat Cards ─── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-0.5">
                    <FolderKanban className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Project Statistics</h2>
                </div>
                <StatsGrid columns={4}>
                    {projectCards.map((card, i) => (
                        <StatsCard
                            key={card.title}
                            title={card.title}
                            value={card.value}
                            description={card.description}
                            icon={card.icon}
                            iconBg={card.iconBg}
                            iconColor={card.iconColor}
                            badge={card.badge}
                            isCurrency={false}
                        />
                    ))}
                </StatsGrid>
            </div>

            {/* ─── Charts + Follow-ups Row ─── */}
            {mounted && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2 px-0.5">
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Analytics &amp; Insights</h2>
                    </div>

                    {/* Top row: Donut + Bar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Donut – Status Breakdown */}
                        <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300">
                            <CardHeader className="border-b border-border/40 p-5 pb-4">
                                <CardTitle className="text-sm font-bold">Projects by Status</CardTitle>
                                <CardDescription className="text-xs">Breakdown of current project distributions</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusBreakdown.filter((d: any) => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={58}
                                                outerRadius={82}
                                                paddingAngle={3}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {statusBreakdown.map((entry: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={PIE_COLORS[entry.key] || "#8884d8"}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={<CustomTooltip isDark={isDark} />}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                                iconSize={7}
                                                formatter={(value: any, entry: any) => (
                                                    <span className="text-[11px] font-semibold text-muted-foreground px-1">
                                                        {value} ({entry?.payload?.value || 0})
                                                    </span>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bar – Founder Workload */}
                        <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300">
                            <CardHeader className="border-b border-border/40 p-5 pb-4">
                                <CardTitle className="text-sm font-bold">Founder Workloads</CardTitle>
                                <CardDescription className="text-xs">Active projects assigned to each co-founder</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={workload}
                                            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                                            barCategoryGap="35%"
                                        >
                                            <CartesianGrid vertical={false} stroke={gridColor} />
                                            <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip
                                                cursor={{ fill: cursorFill, opacity: isDark ? 0.15 : 0.6, radius: 4 }}
                                                content={<CustomTooltip isDark={isDark} />}
                                            />
                                            <Bar dataKey="projects" name="Projects" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                                {workload.map((_: any, index: number) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={["#6366f1", "#a855f7", "#06b6d4", "#f59e0b"][index % 4]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom row: Area trend + Today's Follow-ups */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Area – Completion Trend */}
                        <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300">
                            <CardHeader className="border-b border-border/40 p-5 pb-4">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    Completion Trend
                                </CardTitle>
                                <CardDescription className="text-xs">Projects completed day-by-day (last 30 days)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={completionTrend}
                                            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.35} />
                                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} stroke={gridColor} />
                                            <XAxis dataKey="date" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                            <Area
                                                type="monotone"
                                                dataKey="completed"
                                                name="Completed"
                                                stroke="#10b981"
                                                strokeWidth={2.5}
                                                fill="url(#colorCompleted)"
                                                dot={false}
                                                activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Today's Follow-ups */}
                        <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
                            <CardHeader className="border-b border-border/40 p-5 pb-4 bg-gradient-to-r from-amber-500/5 to-transparent shrink-0">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                    </div>
                                    Today's Follow-ups
                                    {todayFollowUps.length > 0 && (
                                        <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                                            {todayFollowUps.length}
                                        </span>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-xs">Clients requiring immediate attention today</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto" style={{ maxHeight: "296px" }}>
                                {todayFollowUps.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                                        <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-muted-foreground">All clear — no follow-ups today!</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-border/40">
                                        {todayFollowUps.map((client: any, idx: number) => (
                                            <motion.li
                                                key={client._id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.05 * idx }}
                                                className="group flex flex-col gap-2.5 p-4 hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
                                                onClick={() => {
                                                    setInfoClient(client);
                                                    setIsInfoModalOpen(true);
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="h-8 w-8 shrink-0 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                            <Users className="h-3.5 w-3.5 text-indigo-500" />
                                                        </div>
                                                        <h4 className="font-bold text-sm text-foreground group-hover:text-indigo-500 transition-colors truncate">
                                                            {client.name}
                                                        </h4>
                                                    </div>
                                                    <div className="flex shrink-0 flex-col items-end gap-1 text-[10px]">
                                                        {client.number && (
                                                            <span className="rounded-md bg-accent/50 px-2 py-0.5 font-medium text-muted-foreground">
                                                                {client.number}
                                                            </span>
                                                        )}
                                                        {client.socialMediaLink && (
                                                            <a
                                                                href={client.socialMediaLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-500 hover:underline transition-colors"
                                                            >
                                                                Social ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                {client.notes && (
                                                    <p className="text-[11px] leading-relaxed text-muted-foreground bg-background/50 rounded-lg px-2.5 py-1.5 border border-border/40">
                                                        <span className="font-semibold text-foreground/70">Note: </span>
                                                        {client.notes}
                                                    </p>
                                                )}
                                            </motion.li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                </motion.div>
            )}

            <ClientInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
                client={infoClient}
                onEdit={(client) => {
                    setEditingClient(client);
                    setIsEditModalOpen(true);
                }}
            />

            <ClientFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                editingClient={editingClient}
                onSuccessCallback={() => {
                    // Refetch dashboard summary to update stats
                    refetch();
                }}
            />
        </div>
    );
}
