'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
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
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AnimatedCounter from '@/components/dashboard/AnimatedCounter';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
} as const;

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: stats, isLoading, error, refetch, isRefetching } = useQuery<any>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-border">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Error Loading Dashboard</h3>
        <p className="text-sm text-muted-foreground mt-2">Could not retrieve project management statistics.</p>
        <Button onClick={() => refetch()} className="mt-4 h-10 cursor-pointer">Retry</Button>
      </div>
    );
  }

  const { summary, statusBreakdown, workload, completionTrend } = stats;

  const cards = [
    {
      title: 'Total Projects',
      value: summary.totalProjects,
      description: 'Active + completed projects',
      icon: FolderKanban,
      color: 'from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30',
    },
    {
      title: 'In Progress',
      value: summary.inProgress,
      description: 'Projects currently being built',
      icon: Clock,
      color: 'from-sky-500/5 to-indigo-500/5 dark:from-sky-500/10 dark:to-indigo-500/20 text-sky-650 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/30',
    },
    {
      title: 'Completed',
      value: summary.completed,
      description: 'Projects finished successfully',
      icon: CheckCircle2,
      color: 'from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/20 text-emerald-650 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
    },
    {
      title: 'Overdue',
      value: summary.overdue,
      description: 'Uncompleted past due date',
      icon: AlertTriangle,
      color: 'from-rose-500/5 to-red-500/5 dark:from-rose-500/10 dark:to-red-500/20 text-rose-650 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30',
      badge: summary.overdue > 0,
    },
  ];

  const PIE_COLORS: Record<string, string> = {
    potential: '#f59e0b',
    future: '#0ea5e9',
    todo: '#64748b',
    in_progress: '#6366f1',
    in_review: '#a855f7',
    completed: '#10b981',
    on_hold: '#ef4444',
  };

  // Dynamic colors for charting
  const isDark = resolvedTheme === 'dark';
  const axisColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipColor = isDark ? '#f8fafc' : '#0f172a';
  const cursorColor = isDark ? '#1e293b' : '#f1f5f9';

  return (
    <div className="space-y-8">
      {/* Header Title Section */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Opygen project status and co-founder metrics dashboard.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-10 w-10 text-muted-foreground hover:text-foreground cursor-pointer hover:scale-[1.05] active:scale-[0.95] transition-all bg-card/60 border-border"
          title="Refresh statistics"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${isRefetching ? 'animate-spin text-indigo-550' : ''}`} />
        </Button>
      </div>

      {/* Summary Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {cards.map((card) => {
          const CardIcon = card.icon;
          return (
            <motion.div key={card.title} variants={itemVariants}>
              <Card className={`bg-gradient-to-br ${card.color} border bg-card text-card-foreground shadow-md backdrop-blur-xs relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                  <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground">{card.title}</CardTitle>
                  <CardIcon className="h-5 w-5 shrink-0" />
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="text-3xl font-bold tracking-tight">
                    <AnimatedCounter value={card.value} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{card.description}</p>
                </CardContent>
                {card.badge && (
                  <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-455 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Section */}
      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Status Breakdown Donut Chart */}
          <Card className="border-border bg-card shadow-md text-card-foreground">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold">Projects by Status</CardTitle>
              <CardDescription className="text-muted-foreground">Breakdown of current task distributions</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown.filter((d: any) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.key] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      itemStyle={{ color: tooltipColor, fontSize: '12px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value, entry: any) => {
                        const count = entry?.payload?.value || 0;
                        return <span className="text-xs text-muted-foreground font-semibold px-1">{value} ({count})</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Workload per Founder Bar Chart */}
          <Card className="border-border bg-card shadow-md text-card-foreground">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold">Founder Workloads</CardTitle>
              <CardDescription className="text-muted-foreground">Number of active projects assigned to each co-founder</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: cursorColor, opacity: isDark ? 0.2 : 0.8 }}
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      itemStyle={{ color: tooltipColor, fontSize: '12px' }}
                    />
                    <Bar dataKey="projects" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45}>
                      {workload.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#a855f7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Completion Trend Area Chart */}
          <Card className="border-border bg-card shadow-md text-card-foreground lg:col-span-2">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Completion Trend
              </CardTitle>
              <CardDescription className="text-muted-foreground">Total projects marked completed day-by-day (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={completionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      itemStyle={{ color: tooltipColor, fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="completed" name="Completed Projects" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
