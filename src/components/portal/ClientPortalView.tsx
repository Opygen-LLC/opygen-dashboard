"use client";

import React from "react";
import {
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    FileCheck2,
    Layers,
    MessageSquare,
    Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ClientPortalViewProps {
    project: any;
}

export function ClientPortalView({ project }: ClientPortalViewProps) {
    const totalBudget = project.budget || 0;
    const payments = project.payments || [];
    const paidAmount = payments
        .filter((p: any) => p.status === "paid")
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const pendingAmount = Math.max(0, totalBudget - paidAmount);
    const paymentProgressPercent =
        totalBudget > 0
            ? Math.min(100, Math.round((paidAmount / totalBudget) * 100))
            : 0;

    const statusColors: Record<string, string> = {
        COMPLETED:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        IN_PROGRESS:
            "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        IN_REVIEW:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        ON_HOLD:
            "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
        TODO: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500 selection:text-white">
            {/* Header Navbar */}
            <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex h-16 items-center justify-center px-6 border-b border-border/80">
                        <div className="flex items-center gap-2.5">
                            <Image
                                src="/logo.png"
                                alt="Opygen Logo"
                                width={24}
                                height={24}
                                className="object-contain dark:invert transition-all duration-300"
                            />
                            <span className="text-lg font-extrabold tracking-tight bg-indigo-600 bg-clip-text text-transparent">
                                Opygen
                            </span>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5"
                    >
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Progress
                    </Badge>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Hero Banner */}
                <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-indigo-950/10 shadow-md relative">
                    <div className="pointer-events-none absolute inset-0 bg-radial from-indigo-500/5 via-transparent to-transparent opacity-50" />
                    <div className="p-6 sm:p-8 relative z-10 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                        className={cn(
                                            "capitalize px-3 py-1 text-xs font-bold border",
                                            statusColors[project.status] ||
                                                statusColors.TODO,
                                        )}
                                    >
                                        {project.status?.replace("_", " ")}
                                    </Badge>
                                    {project.priority && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {project.priority} Priority
                                        </Badge>
                                    )}
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                                    {project.title}
                                </h1>
                                {project.clientName && (
                                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4 text-indigo-500" />
                                        Prepared for{" "}
                                        <span className="font-semibold text-foreground">
                                            {project.clientName}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {project.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl border-t border-border/40 pt-4">
                                {project.description}
                            </p>
                        )}

                        {/* Overall Progress Meter */}
                        <div className="space-y-2 border-t border-border/40 pt-4">
                            <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <FileCheck2 className="h-4 w-4 text-indigo-500" />
                                    Milestone &amp; Payment Collection Progress
                                </span>
                                <span className="font-bold text-foreground">
                                    {paymentProgressPercent}%
                                </span>
                            </div>
                            <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden p-0.5 border border-border/40">
                                <div
                                    style={{
                                        width: `${paymentProgressPercent}%`,
                                    }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border bg-card shadow-xs">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold">
                                    Total Budget
                                </p>
                                <p className="text-2xl font-extrabold text-foreground mt-0.5">
                                    ${totalBudget.toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-xs">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold">
                                    Amount Paid
                                </p>
                                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    ${paidAmount.toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-xs">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold">
                                    Pending Balance
                                </p>
                                <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                    ${pendingAmount.toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-xs">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold">
                                    Due Date
                                </p>
                                <p className="text-base font-extrabold text-foreground mt-0.5 truncate">
                                    {project.dueDate
                                        ? new Date(
                                              project.dueDate,
                                          ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                          })
                                        : "TBD"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Milestone & Payment Breakdown Section */}
                <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="p-6 border-b border-border/60">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-500" />
                            Milestone &amp; Payment Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {payments.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No milestone payments logged yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-border/60 bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                                        <tr>
                                            <th className="p-4 pl-6">
                                                Phase / Milestone
                                            </th>
                                            <th className="p-4">Amount</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 pr-6 text-right">
                                                Payment Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {payments.map((p: any, idx: number) => {
                                            const isPaid = p.status === "paid";
                                            const label =
                                                p.customLabel ||
                                                p.type.charAt(0).toUpperCase() +
                                                    p.type.slice(1);

                                            return (
                                                <tr
                                                    key={p._id || idx}
                                                    className="hover:bg-muted/10 transition-colors"
                                                >
                                                    <td className="p-4 pl-6 font-semibold text-foreground flex items-center gap-2">
                                                        {isPaid ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                                        )}
                                                        {label}
                                                    </td>
                                                    <td className="p-4 font-bold text-foreground">
                                                        $
                                                        {(
                                                            p.amount || 0
                                                        ).toLocaleString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "capitalize text-xs font-semibold px-2.5 py-0.5",
                                                                isPaid
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                                                            )}
                                                        >
                                                            {p.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right text-muted-foreground text-xs font-medium">
                                                        {p.paymentDate
                                                            ? new Date(
                                                                  p.paymentDate,
                                                              ).toLocaleDateString()
                                                            : "—"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Assigned Team Section */}
                {project.assignees && project.assignees.length > 0 && (
                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader className="p-6 border-b border-border/60">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-500" />
                                Assigned Project Team
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {project.assignees.map((user: any) => (
                                    <div
                                        key={user._id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-xs">
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                user.name?.charAt(0) || "U"
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground leading-tight">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {user.role || "Co-Founder"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/60 py-6 mt-12 text-center text-xs text-muted-foreground">
                <p>
                    &copy; {new Date().getFullYear()} Opygen. All rights
                    reserved.
                </p>
            </footer>
        </div>
    );
}
