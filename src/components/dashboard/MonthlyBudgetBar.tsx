"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Target, TrendingUp, Sparkles, Settings } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface MonthlyBudgetBarProps {
    monthlyCollected: number;
}

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
];

export default function MonthlyBudgetBar({ monthlyCollected }: MonthlyBudgetBarProps) {
    const currentMonth = MONTH_NAMES[new Date().getMonth()];
    const currentYear  = new Date().getFullYear();

    /* ── fetch goal from settings (read-only) ── */
    const { data: settings, isLoading } = useQuery<any>({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await fetch("/api/settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        },
        staleTime: 1000 * 60 * 2,
    });

    const goal: number = settings?.monthlyBudgetGoal ?? 0;

    /* ── derived values ── */
    const pct          = goal > 0 ? Math.min((monthlyCollected / goal) * 100, 100) : 0;
    const overAchieved = goal > 0 && monthlyCollected > goal;
    const remaining    = Math.max(goal - monthlyCollected, 0);

    const barColor =
        pct >= 100 ? "from-emerald-400 to-emerald-600" :
        pct >= 75  ? "from-teal-400 to-emerald-500"    :
        pct >= 40  ? "from-indigo-400 to-violet-500"   :
                     "from-indigo-500 to-purple-600";

    if (isLoading) {
        return <div className="h-28 w-full rounded-2xl bg-muted/30 animate-pulse" />;
    }

    return (
        <Card className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 via-violet-500/5 to-transparent bg-card/80 backdrop-blur-sm shadow-sm">
            {/* Decorative orbs */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="pointer-events-none absolute right-16 bottom-0 h-24 w-24 rounded-full bg-violet-500/8 blur-3xl" />

            <CardContent className="relative z-10 p-5 sm:p-6">
                <div className="flex flex-col gap-4">

                    {/* Header row */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                <Target className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                    Monthly Revenue Goal
                                </p>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    {currentMonth} {currentYear}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {overAchieved && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Goal Reached!
                                </span>
                            )}
                            {/* Link to Settings page to manage the goal */}
                            {/* <Link
                                href="/admin-dashboard/settings"
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                                title="Set monthly goal in Settings"
                            >
                                <Settings className="h-3 w-3" />
                                Set Goal
                            </Link> */}
                        </div>
                    </div>

                    {/* Amount row */}
                    <div className="flex items-end justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-extrabold tracking-tight text-foreground">
                                ${monthlyCollected.toLocaleString()}
                            </span>
                            {goal > 0 && (
                                <span className="text-sm font-medium text-muted-foreground">
                                    / ${goal.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            {goal > 0 ? (
                                <>
                                    <span className={`text-xl font-extrabold ${overAchieved ? "text-emerald-500" : "text-indigo-500"}`}>
                                        {Math.round(pct)}%
                                    </span>
                                    {!overAchieved && remaining > 0 && (
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                            ${remaining.toLocaleString()} remaining
                                        </p>
                                    )}
                                </>
                            ) : (
                                <Link
                                    href="/admin-dashboard/settings"
                                    className="text-xs font-semibold text-indigo-500 hover:underline"
                                >
                                    + Set a goal
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative">
                        <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                                className={`h-full rounded-full bg-gradient-to-r ${barColor} shadow-sm`}
                            />
                        </div>
                        {[25, 50, 75].map((tick) => (
                            <div
                                key={tick}
                                className="absolute top-0 h-3 w-px bg-background/60"
                                style={{ left: `${tick}%` }}
                            />
                        ))}
                    </div>

                    {/* Footer hint when no goal set */}
                    {goal === 0 && (
                        <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Go to{" "}
                            <Link href="/admin-dashboard/settings" className="text-indigo-500 hover:underline font-semibold">
                                Settings
                            </Link>{" "}
                            to set a monthly revenue target.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
