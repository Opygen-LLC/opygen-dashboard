"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
    ArrowDownRight,
    Calendar,
    DollarSign,
    Plus,
    FileText,
    Globe,
    Building2,
    Landmark,
    ChevronRight,
} from "lucide-react";
import { cn, formatTime12Hour } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import MonthlyBudgetBar from "@/components/dashboard/MonthlyBudgetBar";
import { StatsGrid } from "@/components/dashboard/stats/StatsGrid";
import { StatsCard } from "@/components/dashboard/stats/StatsCard";
import { ClientInfoModal } from "@/components/clients/modals/ClientInfoModal";
import { ClientFormModal } from "@/components/clients/modals/ClientFormModal";

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
            {label && (
                <p className="mb-1 font-bold text-[11px] opacity-60">{label}</p>
            )}
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

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        data: stats,
        isLoading,
        error,
        refetch: refetchStats,
        isRefetching: isRefetchingStats,
    } = useQuery<any>({
        queryKey: ["stats", dateRange],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/stats?range=${dateRange}`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        },
    });

    const {
        data: clientsData,
        refetch: refetchClients,
        isRefetching: isRefetchingClients,
    } = useQuery<any>({
        queryKey: ["clients"],
        queryFn: async () => {
            const res = await fetch("/api/clients");
            if (!res.ok) throw new Error("Failed to fetch clients");
            return res.json();
        },
    });

    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const todayFollowUps = (
        Array.isArray(clientsData) ? clientsData : []
    ).filter((c: any) => {
        const fDate = c.followupDate ? (typeof c.followupDate === "string" ? c.followupDate : new Date(c.followupDate).toISOString()) : null;
        const nfDate = c.nextFollowupDate ? (typeof c.nextFollowupDate === "string" ? c.nextFollowupDate : new Date(c.nextFollowupDate).toISOString()) : null;
        return (c.status === "Follow-up" && fDate && fDate.startsWith(today)) || (nfDate && nfDate.startsWith(today));
    });

    const todayMeetings = (
        Array.isArray(clientsData) ? clientsData : []
    ).filter(
        (c: any) =>
            c.status === "Meeting Scheduled" &&
            c.meetingDate &&
            (typeof c.meetingDate === "string"
                ? c.meetingDate
                : new Date(c.meetingDate).toISOString()
            ).startsWith(today),
    );

    const isRefetching = isRefetchingStats || isRefetchingClients;
    const handleRefresh = () => {
        refetchStats();
        refetchClients();
    };

    /* ─── Chart theme tokens ─── */
    const axisColor = isDark ? "#64748b" : "#94a3b8";
    const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    const cursorFill = isDark ? "#1e293b" : "#f1f5f9";

    /* ─── Loading skeleton ─── */
    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="h-44 w-full rounded-3xl bg-muted/30 animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                    ))}
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
                    <h3 className="text-lg font-bold text-foreground">
                        Error Loading Dashboard
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Could not retrieve dashboard statistics.
                    </p>
                </div>
                <Button
                    onClick={() => handleRefresh()}
                    className="mt-2 cursor-pointer"
                >
                    Retry
                </Button>
            </div>
        );
    }

    const {
        summary = {},
        statusBreakdown = [],
        workload = [],
        completionTrend = [],
        accountsSummary = [],
        recentTransactions = [],
        activeProjects = [],
        recentQuotes = [],
    } = stats;

    /* ─── Financial KPI Cards ─── */
    const treasuryCards = [
        {
            title: "Total Liquid Cash",
            value: summary.totalLiquidityBdt || 0,
            description: "Combined balance in bank & mobile accounts",
            icon: Landmark,
            accent: "from-emerald-500/15 to-teal-500/10",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            trend: "Available",
            isCurrency: true,
        },
        {
            title: "This Month Income",
            value: summary.monthlyIncomeBdt || 0,
            description: "Total revenue income collected this month",
            icon: ArrowDownRight,
            accent: "from-indigo-500/15 to-blue-500/10",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            trend: "Inflow",
            isCurrency: true,
        },
        {
            title: "This Month Burn",
            value: summary.monthlyExpenseBdt || 0,
            description: "Operating expenditures logged this month",
            icon: ArrowUpRight,
            accent: "from-rose-500/15 to-pink-500/10",
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-500",
            trend: "Outflow",
            isCurrency: true,
        },
        {
            title: "Net Cash Flow",
            value: summary.monthlyNetBdt || 0,
            description: "Net monthly operating balance",
            icon: TrendingUp,
            accent:
                (summary.monthlyNetBdt || 0) >= 0
                    ? "from-emerald-500/15 to-teal-500/10"
                    : "from-rose-500/15 to-orange-500/10",
            iconBg:
                (summary.monthlyNetBdt || 0) >= 0
                    ? "bg-emerald-500/10"
                    : "bg-rose-500/10",
            iconColor:
                (summary.monthlyNetBdt || 0) >= 0
                    ? "text-emerald-500"
                    : "text-rose-500",
            trend: (summary.monthlyNetBdt || 0) >= 0 ? "Surplus" : "Deficit",
            isCurrency: true,
        },
    ];

    const projectBillingCards = [
        {
            title: "Pipeline Budget",
            value: summary.totalBudget || 0,
            description: "Total contracted budget of active projects",
            icon: Wallet,
            accent: "from-indigo-500/15 to-violet-500/10",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            trend: "+12%",
            isCurrency: true,
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
            isCurrency: true,
        },
        {
            title: "Milestone Outstanding",
            value: summary.totalRevenuePending || 0,
            description: "Billing awaiting completion sign-off",
            icon: CreditCard,
            accent: "from-amber-500/15 to-orange-500/10",
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            trend: null,
            isCurrency: true,
        },
    ];

    const projectCards = [
        {
            title: "Total Projects",
            value: summary.totalProjects || 0,
            description: "All client projects in pipeline",
            icon: FolderKanban,
            accent: "from-indigo-500/10 to-purple-500/10",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
        },
        {
            title: "In Development",
            value: summary.inProgress || 0,
            description: "Active engineering builds in progress",
            icon: Activity,
            accent: "from-sky-500/10 to-blue-500/10",
            iconBg: "bg-sky-500/10",
            iconColor: "text-sky-500",
        },
        {
            title: "Completed",
            value: summary.completed || 0,
            description: "Successfully delivered projects",
            icon: CheckCircle2,
            accent: "from-emerald-500/10 to-teal-500/10",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
        },
        {
            title: "Overdue",
            value: summary.overdue || 0,
            description: "Projects past targeted completion date",
            icon: AlertTriangle,
            accent: "from-rose-500/10 to-red-500/10",
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-500",
            badge: (summary.overdue || 0) > 0,
        },
    ];

    const crmCards = [
        {
            title: "Total Leads Tracked",
            value: summary.totalClients || 0,
            description: "Prospective and current clients in CRM",
            icon: Users,
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
        },
        {
            title: "Confirmed Deals",
            value: summary.confirmedClients || 0,
            description: "Successfully closed client contracts",
            icon: CheckCircle2,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
        },
        {
            title: "Active Pipeline Value",
            value:
                (summary.pipelineDealValueMin || 0) ===
                (summary.pipelineDealValueMax || 0)
                    ? `৳${(summary.pipelineDealValueMin || 0).toLocaleString()}`
                    : `৳${(summary.pipelineDealValueMin || 0).toLocaleString()} - ৳${(summary.pipelineDealValueMax || 0).toLocaleString()}`,
            description: "Estimated value of prospective deals",
            icon: DollarSign,
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
        },
        {
            title: "Client Proposals",
            value: summary.totalQuotes || 0,
            description: "Formal proposals & price quotes drafted",
            icon: FileText,
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
        },
    ];

    const PIE_COLORS: Record<string, string> = {
        potential: "#f59e0b",
        future: "#0ea5e9",
        todo: "#64748b",
        in_progress: "#6366f1",
        in_review: "#a855f7",
        completed: "#10b981",
        on_hold: "#ef4444",
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
                            Co-Founder Command Center
                        </motion.span>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                            Admin &amp; Analytics Dashboard
                        </h1>
                        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                            Holistic view of Opygen's ongoing software engineering,
                            treasury liquidity, client CRM pipeline, and team workload.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                        {/* Quick stats pill */}
                        <div className="flex items-center justify-center gap-2 sm:gap-3 rounded-md border border-border/60 bg-card/60 px-3 sm:px-4 py-3 sm:py-2.5 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-muted-foreground divide-x divide-border/60 w-full sm:w-auto">
                            <span className="pr-2 sm:pr-3 whitespace-nowrap">
                                <span className="text-foreground font-bold text-xs sm:text-sm">
                                    {summary.totalProjects || 0}
                                </span>{" "}
                                Projects
                            </span>
                            <span className="px-2 sm:px-3 whitespace-nowrap">
                                <span className="text-emerald-500 font-bold text-xs sm:text-sm">
                                    {summary.completed || 0}
                                </span>{" "}
                                Done
                            </span>
                            <span className="px-2 sm:px-3 whitespace-nowrap">
                                <span className="text-amber-500 font-bold text-xs sm:text-sm">
                                    {todayFollowUps.length}
                                </span>{" "}
                                Follow-ups
                            </span>
                            <span className="pl-2 sm:pl-3 whitespace-nowrap">
                                <span className="text-purple-500 font-bold text-xs sm:text-sm">
                                    {todayMeetings.length}
                                </span>{" "}
                                Meetings
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                value={dateRange}
                                onValueChange={(val: any) => setDateRange(val)}
                            >
                                <SelectTrigger className="h-10! w-full sm:w-auto rounded-md border border-border/60 bg-card/80 px-3 text-xs font-semibold backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer">
                                    <SelectValue placeholder="Select Date Range" />
                                </SelectTrigger>
                                <SelectContent className="z-[150]">
                                    <SelectItem value="7d" className="h-10!">
                                        Last 7 Days
                                    </SelectItem>
                                    <SelectItem value="30d" className="h-10!">
                                        Last 30 Days
                                    </SelectItem>
                                    <SelectItem value="ytd" className="h-10!">
                                        Year to Date
                                    </SelectItem>
                                    <SelectItem value="all" className="h-10!">
                                        All Time
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isRefetching}
                                className="h-10! w-full sm:w-auto cursor-pointer justify-center gap-2 border-border/60 bg-card/80 px-4 text-xs font-bold backdrop-blur-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-indigo-500" : ""}`}
                                />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ─── Executive Quick Actions Bar ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <Link
                    href="/admin-dashboard/projects"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/70 bg-card/80 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-xs font-bold text-foreground group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                    <FolderKanban className="h-3.5 w-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span>+ New Project</span>
                </Link>
                <button
                    type="button"
                    onClick={() => {
                        setEditingClient(null);
                        setIsEditModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/70 bg-card/80 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-xs font-bold text-foreground group shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                    <Users className="h-3.5 w-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
                    <span>+ New Client</span>
                </button>
                <Link
                    href="/admin-dashboard/finance"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/70 bg-card/80 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-xs font-bold text-foreground group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="h-3.5 w-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span>Log Finance</span>
                </Link>
                <Link
                    href="/admin-dashboard/quotes"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/70 bg-card/80 hover:bg-teal-500/10 hover:border-teal-500/30 transition-all text-xs font-bold text-foreground group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                    <FileText className="h-3.5 w-3.5 text-teal-500 group-hover:scale-110 transition-transform" />
                    <span>Create Quote</span>
                </Link>
                <Link
                    href="/admin-dashboard/accounts"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/70 bg-card/80 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-xs font-bold text-foreground group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                    <CreditCard className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Bank Accounts</span>
                </Link>
                <Link
                    href="/admin-dashboard/demo-websites"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/70 bg-card/80 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all text-xs font-bold text-foreground group shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Globe className="h-3.5 w-3.5 text-sky-500 group-hover:scale-110 transition-transform" />
                    <span>Demo Sites ({summary.totalDemoWebsites || 0})</span>
                </Link>
            </div>

            {/* ─── SECTION 1: Financial & Treasury Pulse ─── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-indigo-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            Financial &amp; Treasury Overview
                        </h2>
                    </div>
                    <Link
                        href="/admin-dashboard/finance"
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 hover:underline"
                    >
                        Go to Finance <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {/* Monthly Revenue Goal Box — UNCHANGED & PRESERVED */}
                <MonthlyBudgetBar
                    monthlyCollected={summary.monthlyCollected ?? 0}
                    monthlyCollectedBdt={summary.monthlyCollectedBdt ?? 0}
                />

                {/* Treasury KPI Cards (4 columns) */}
                <StatsGrid columns={4}>
                    {treasuryCards.map((card) => (
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

                {/* Project Milestone Billing Cards (3 columns) */}
                <StatsGrid columns={3}>
                    {projectBillingCards.map((card) => (
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

                {/* Treasury Pulse: Bank Accounts Strip + Recent Financial Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Bank & Mobile Banking Accounts Strip */}
                    <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm flex flex-col overflow-hidden">
                        <CardHeader className="border-b border-border/40 p-5 pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-emerald-500" />
                                    Accounts &amp; Treasury Balances
                                </CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    Live balance across verified company accounts
                                </CardDescription>
                            </div>
                            <Link
                                href="/admin-dashboard/accounts"
                                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 hover:underline"
                            >
                                View all <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-4 flex-1">
                            {(!accountsSummary || accountsSummary.length === 0) ? (
                                <div className="text-center py-8 text-xs text-muted-foreground">
                                    No active accounts registered yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {accountsSummary.map((acc: any) => (
                                        <div
                                            key={acc._id}
                                            className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">
                                                    {acc.providerName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-mono truncate">
                                                    {acc.accountNumber} • {acc.userName}
                                                </p>
                                            </div>
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                                                ৳{Number(acc.balanceInBdt || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Financial Activity Feed */}
                    <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm flex flex-col overflow-hidden">
                        <CardHeader className="border-b border-border/40 p-5 pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-indigo-500" />
                                    Recent Financial Activity
                                </CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    Latest transactions posted to company ledger
                                </CardDescription>
                            </div>
                            <Link
                                href="/admin-dashboard/finance"
                                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 hover:underline"
                            >
                                All Finance <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto" style={{ maxHeight: "260px" }}>
                            {(!recentTransactions || recentTransactions.length === 0) ? (
                                <div className="text-center py-8 text-xs text-muted-foreground">
                                    No transactions recorded recently.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {recentTransactions.map((tx: any) => {
                                        const isIncome = tx.type === "income";
                                        return (
                                            <div
                                                key={tx._id}
                                                className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={cn(
                                                        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs",
                                                        isIncome ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                    )}>
                                                        {isIncome ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground truncate">
                                                            {tx.description || tx.category}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                                            <span className="capitalize">{tx.category}</span>
                                                            {tx.accountName && <span>• {tx.accountName}</span>}
                                                            {tx.date && <span>• {new Date(tx.date).toLocaleDateString()}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-black tabular-nums shrink-0",
                                                    isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                )}>
                                                    {isIncome ? "+৳" : "-৳"}{Number(tx.amount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ─── SECTION 2: Project Operations & Workload ─── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-indigo-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            Project Operations &amp; Workload
                        </h2>
                    </div>
                    <Link
                        href="/admin-dashboard/projects"
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 hover:underline"
                    >
                        View Projects <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <StatsGrid columns={4}>
                    {projectCards.map((card) => (
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

                {/* Donut + Bar Charts */}
                {mounted && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Donut – Status Breakdown */}
                        <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300">
                            <CardHeader className="border-b border-border/40 p-5 pb-4">
                                <CardTitle className="text-sm font-bold">
                                    Projects by Status
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Breakdown of current project distributions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="h-64">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={statusBreakdown.filter(
                                                    (d: any) => d.value > 0,
                                                )}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={58}
                                                outerRadius={82}
                                                paddingAngle={3}
                                                dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {statusBreakdown.map(
                                                    (
                                                        entry: any,
                                                        index: number,
                                                    ) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                PIE_COLORS[
                                                                    entry.key
                                                                ] || "#8884d8"
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <Tooltip
                                                content={
                                                    <CustomTooltip
                                                        isDark={isDark}
                                                    />
                                                }
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                                iconSize={7}
                                                formatter={(
                                                    value: any,
                                                    entry: any,
                                                ) => (
                                                    <span className="text-[11px] font-semibold text-muted-foreground px-1">
                                                        {value} (
                                                        {entry?.payload
                                                            ?.value || 0}
                                                        )
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
                                <CardTitle className="text-sm font-bold">
                                    Founder Workloads
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Active projects assigned to each co-founder
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="h-64">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={workload}
                                            margin={{
                                                top: 8,
                                                right: 8,
                                                left: -24,
                                                bottom: 0,
                                            }}
                                            barCategoryGap="35%"
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                stroke={gridColor}
                                            />
                                            <XAxis
                                                dataKey="name"
                                                stroke={axisColor}
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke={axisColor}
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                allowDecimals={false}
                                            />
                                            <Tooltip
                                                cursor={{
                                                    fill: cursorFill,
                                                    opacity: isDark
                                                        ? 0.15
                                                        : 0.6,
                                                    radius: 4,
                                                }}
                                                content={
                                                    <CustomTooltip
                                                        isDark={isDark}
                                                    />
                                                }
                                            />
                                            <Bar
                                                dataKey="projects"
                                                name="Projects"
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={48}
                                            >
                                                {workload.map(
                                                    (_: any, index: number) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                [
                                                                    "#6366f1",
                                                                    "#a855f7",
                                                                    "#06b6d4",
                                                                    "#f59e0b",
                                                                ][index % 4]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Active Deliverables in Flight */}
                <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm flex flex-col overflow-hidden">
                    <CardHeader className="border-b border-border/40 p-5 pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <FolderKanban className="h-4 w-4 text-indigo-500" />
                                Active Deliverables in Flight
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Key ongoing builds with milestone progression
                            </CardDescription>
                        </div>
                        <Link
                            href="/admin-dashboard/projects"
                            className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 hover:underline"
                        >
                            Open Kanban <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-4">
                        {(!activeProjects || activeProjects.length === 0) ? (
                            <div className="text-center py-8 text-xs text-muted-foreground">
                                No active development builds at this time.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {activeProjects.map((p: any) => (
                                    <div
                                        key={p._id}
                                        className="p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col justify-between space-y-3"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                    {p.status.replace("_", " ")}
                                                </span>
                                                {p.priority && (
                                                    <span className={cn(
                                                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                                                        p.priority === "high"
                                                            ? "bg-rose-500/10 text-rose-500"
                                                            : p.priority === "medium"
                                                              ? "bg-amber-500/10 text-amber-500"
                                                              : "bg-slate-500/10 text-slate-500"
                                                    )}>
                                                        {p.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-xs text-foreground mt-2 line-clamp-1">
                                                {p.title}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                                {p.clientName ? `Client: ${p.clientName}` : "Internal Initiative"}
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                                <span>Milestones</span>
                                                <span className="font-bold text-foreground">
                                                    ৳{Number(p.paidPayments || 0).toLocaleString()} / ৳{Number(p.budget || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                                                    style={{ width: `${p.progressPercent || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {p.dueDate
                                                    ? new Date(p.dueDate).toLocaleDateString("en-US", {
                                                          month: "short",
                                                          day: "numeric",
                                                      })
                                                    : "No deadline"}
                                            </span>
                                            <div className="flex items-center -space-x-1.5">
                                                {(p.assignees || []).slice(0, 3).map((a: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        title={a.name}
                                                        className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-card flex items-center justify-center text-[9px] font-bold overflow-hidden"
                                                    >
                                                        {a.name?.charAt(0) || "U"}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Area – Completion Trend */}
                {mounted && (
                    <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300">
                        <CardHeader className="border-b border-border/40 p-5 pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                Project Completion Trend
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Projects completed day-by-day (last 30 days)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={completionTrend}
                                        margin={{
                                            top: 8,
                                            right: 8,
                                            left: -24,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="colorCompleted"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#10b981"
                                                    stopOpacity={0.35}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#10b981"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            vertical={false}
                                            stroke={gridColor}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            stroke={axisColor}
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke={axisColor}
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            content={
                                                <CustomTooltip
                                                    isDark={isDark}
                                                />
                                            }
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="completed"
                                            name="Completed"
                                            stroke="#10b981"
                                            strokeWidth={2.5}
                                            fill="url(#colorCompleted)"
                                            dot={false}
                                            activeDot={{
                                                r: 5,
                                                fill: "#10b981",
                                                strokeWidth: 0,
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ─── SECTION 3: Client CRM & Sales Proposals ─── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                            Client CRM &amp; Sales Proposals
                        </h2>
                    </div>
                    <Link
                        href="/admin-dashboard/clients"
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 hover:underline"
                    >
                        Open CRM <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <StatsGrid columns={4}>
                    {crmCards.map((card) => (
                        <StatsCard
                            key={card.title}
                            title={card.title}
                            value={card.value}
                            description={card.description}
                            icon={card.icon}
                            iconBg={card.iconBg}
                            iconColor={card.iconColor}
                            isCurrency={false}
                        />
                    ))}
                </StatsGrid>

                {/* 3-column CRM action cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Today's Meetings */}
                    <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
                        <CardHeader className="border-b border-border/40 p-5 pb-4 bg-gradient-to-r from-purple-500/5 to-transparent shrink-0">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-purple-500" />
                                </div>
                                Today's Meetings
                                {todayMeetings.length > 0 && (
                                    <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-500 text-white text-[10px] font-extrabold">
                                        {todayMeetings.length}
                                    </span>
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Clients with calls scheduled today
                            </CardDescription>
                        </CardHeader>
                        <CardContent
                            className="p-0 flex-1 overflow-y-auto"
                            style={{ maxHeight: "296px" }}
                        >
                            {todayMeetings.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                                    <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Calendar className="h-7 w-7 text-purple-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        All clear — no meetings today!
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-border/40">
                                    {todayMeetings.map(
                                        (client: any) => (
                                            <li
                                                key={client._id}
                                                className="group flex flex-col gap-2.5 p-4 hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
                                                onClick={() => {
                                                    setInfoClient(client);
                                                    setIsInfoModalOpen(true);
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="h-8 w-8 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                            <Users className="h-3.5 w-3.5 text-purple-500" />
                                                        </div>
                                                        <h4 className="font-bold text-sm text-foreground group-hover:text-purple-500 transition-colors truncate">
                                                            {client.name}
                                                        </h4>
                                                    </div>
                                                    <div className="flex shrink-0 flex-col items-end gap-1 text-[10px]">
                                                        {client.number && (
                                                            <span className="rounded-md bg-accent/50 px-2 py-0.5 font-medium text-muted-foreground">
                                                                {client.number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {client.notes && (
                                                    <p className="text-[11px] leading-relaxed text-muted-foreground bg-background/50 rounded-lg px-2.5 py-1.5 border border-border/40">
                                                        <span className="font-semibold text-foreground/70">
                                                            Note:{" "}
                                                        </span>
                                                        {client.notes}
                                                    </p>
                                                )}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
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
                            <CardDescription className="text-xs">
                                Leads requiring touch-point today
                            </CardDescription>
                        </CardHeader>
                        <CardContent
                            className="p-0 flex-1 overflow-y-auto"
                            style={{ maxHeight: "296px" }}
                        >
                            {todayFollowUps.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                                    <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        All clear — no follow-ups today!
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-border/40">
                                    {todayFollowUps.map(
                                        (client: any) => (
                                            <li
                                                key={client._id}
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
                                                        {client.followupTime && (
                                                            <span className="flex items-center gap-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 font-medium text-[10px] border border-blue-500/20">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTime12Hour(client.followupTime)}
                                                            </span>
                                                        )}
                                                        {client.number && (
                                                            <span className="rounded-md bg-accent/50 px-2 py-0.5 font-medium text-muted-foreground">
                                                                {client.number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {client.notes && (
                                                    <p className="text-[11px] leading-relaxed text-muted-foreground bg-background/50 rounded-lg px-2.5 py-1.5 border border-border/40">
                                                        <span className="font-semibold text-foreground/70">
                                                            Note:{" "}
                                                        </span>
                                                        {client.notes}
                                                    </p>
                                                )}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Proposals & Quotes */}
                    <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
                        <CardHeader className="border-b border-border/40 p-5 pb-4 bg-gradient-to-r from-teal-500/5 to-transparent shrink-0 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-teal-500" />
                                    </div>
                                    Recent Proposals
                                </CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    Client quotes and proposals
                                </CardDescription>
                            </div>
                            <Link
                                href="/admin-dashboard/quotes"
                                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                            >
                                All Quotes <ChevronRight className="h-3 w-3" />
                            </Link>
                        </CardHeader>
                        <CardContent
                            className="p-0 flex-1 overflow-y-auto"
                            style={{ maxHeight: "296px" }}
                        >
                            {(!recentQuotes || recentQuotes.length === 0) ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
                                    <div className="h-14 w-14 rounded-full bg-teal-500/10 flex items-center justify-center">
                                        <FileText className="h-7 w-7 text-teal-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        No proposals generated yet.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-border/40">
                                    {recentQuotes.map((quote: any) => (
                                        <li
                                            key={quote._id}
                                            className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                                        {quote.quoteNumber || "QUOTE"}
                                                    </span>
                                                    <span className="text-xs font-bold text-foreground truncate">
                                                        {quote.projectName}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                                    Client: {quote.clientName || "Direct"}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-extrabold text-foreground">
                                                    {quote.projectPrice
                                                        ? (quote.projectPrice.includes("৳") || quote.projectPrice.includes("$")
                                                            ? quote.projectPrice
                                                            : `৳${quote.projectPrice}`)
                                                        : "Proposal"}
                                                </p>
                                                <p className="text-[9px] text-muted-foreground">
                                                    {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : ""}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Client Info Modal */}
            <ClientInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
                client={infoClient}
                onEdit={(client) => {
                    setEditingClient(client);
                    setIsEditModalOpen(true);
                }}
            />

            {/* Client Form Modal */}
            <ClientFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                editingClient={editingClient}
                onSuccessCallback={() => {
                    handleRefresh();
                }}
            />
        </div>
    );
}
