"use client";

import React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    CreditCard,
    Globe,
    FolderKanban,
    Calendar,
    DollarSign,
    Repeat,
    Clock,
    User,
    FileText,
    ExternalLink,
    Edit3,
    Trash2,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
    Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubscriptionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscription: any | null;
    onEdit: (sub: any) => void;
    onDelete: (sub: any) => void;
}

export function SubscriptionDetailsModal({
    isOpen,
    onClose,
    subscription,
    onEdit,
    onDelete,
}: SubscriptionDetailsModalProps) {
    if (!isOpen || !subscription) return null;

    const formatDate = (date: any) => {
        if (!date) return "Not set";
        try {
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return String(date);
        }
    };

    // Calculate Days Remaining
    const now = new Date();
    let daysDiff: number | null = null;
    let isExpired = false;
    let isExpiringSoon = false;

    if (subscription.endDate) {
        const end = new Date(subscription.endDate);
        const diffMs = end.getTime() - now.getTime();
        daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysDiff < 0) {
            isExpired = true;
        } else if (daysDiff <= 14) {
            isExpiringSoon = true;
        }
    }

    // Monthly equivalent
    let monthlyPrice = subscription.price || 0;
    if (subscription.billingCycle === "yearly") {
        monthlyPrice = subscription.price / 12;
    } else if (subscription.billingCycle === "quarterly") {
        monthlyPrice = subscription.price / 3;
    } else if (subscription.billingCycle === "weekly") {
        monthlyPrice = subscription.price * 4.33;
    } else if (subscription.billingCycle === "one-time") {
        monthlyPrice = 0;
    }

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 my-8 max-h-[90vh] flex flex-col"
                >
                    {/* Header Banner */}
                    <div className="relative px-6 py-5 border-b border-border bg-gradient-to-r from-accent/40 via-card to-background">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 pr-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    {subscription.type === "global" ? (
                                        <Badge className="bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 gap-1 text-[11px] font-semibold py-0.5">
                                            <Globe className="h-3 w-3" />
                                            Global Subscription
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-cyan-600/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 gap-1 text-[11px] font-semibold py-0.5">
                                            <FolderKanban className="h-3 w-3" />
                                            Project Subscription
                                        </Badge>
                                    )}

                                    {/* Status Badge */}
                                    {subscription.status === "active" && !isExpired && (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-semibold py-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </Badge>
                                    )}
                                    {(subscription.status === "expiring_soon" || isExpiringSoon) && !isExpired && (
                                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-semibold py-0.5">
                                            <AlertCircle className="h-3 w-3" />
                                            Expiring Soon
                                        </Badge>
                                    )}
                                    {(subscription.status === "expired" || isExpired) && (
                                        <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 text-[11px] font-semibold py-0.5">
                                            <ShieldAlert className="h-3 w-3" />
                                            Expired
                                        </Badge>
                                    )}
                                    {subscription.status === "cancelled" && (
                                        <Badge className="bg-muted text-muted-foreground border-border gap-1 text-[11px] font-semibold py-0.5">
                                            Cancelled
                                        </Badge>
                                    )}
                                </div>

                                <h2 className="text-xl font-extrabold text-foreground tracking-tight pt-1">
                                    {subscription.name}
                                </h2>
                                {subscription.provider && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>Provider:</span>
                                        <span className="font-semibold text-foreground">
                                            {subscription.provider}
                                        </span>
                                    </p>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full text-muted-foreground hover:text-foreground cursor-pointer h-8 w-8 shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-foreground">
                        {/* Cost & Billing Highlight Box */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-accent/25 border border-border">
                            <div>
                                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
                                    Billed Price
                                </span>
                                <div className="text-lg font-bold text-foreground flex items-baseline gap-1 mt-0.5">
                                    <span>
                                        ${Number(subscription.price || 0).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        / {subscription.billingCycle}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
                                    Monthly Burn
                                </span>
                                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                    ${Math.round(monthlyPrice).toLocaleString()}
                                    <span className="text-xs text-muted-foreground font-normal"> / mo</span>
                                </div>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
                                    Renewal Policy
                                </span>
                                <div className="text-xs font-semibold mt-1.5 flex items-center gap-1.5">
                                    <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{subscription.autoRenew ? "Auto-Renews" : "Manual Renewal"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expiration Countdown Banner (if applicable) */}
                        {daysDiff !== null && (
                            <div
                                className={cn(
                                    "p-3.5 rounded-xl border flex items-center gap-3",
                                    isExpired
                                        ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                                        : isExpiringSoon
                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                                        : "bg-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                                )}
                            >
                                <Clock className="h-5 w-5 shrink-0" />
                                <div className="text-xs">
                                    {isExpired ? (
                                        <p className="font-semibold">
                                            Expired {Math.abs(daysDiff)} {Math.abs(daysDiff) === 1 ? "day" : "days"} ago ({formatDate(subscription.endDate)}).
                                        </p>
                                    ) : (
                                        <p className="font-semibold">
                                            Renews in {daysDiff} {daysDiff === 1 ? "day" : "days"} ({formatDate(subscription.endDate)}).
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Project Connection (if Project type) */}
                        {subscription.type === "project" && (
                            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                                    <FolderKanban className="h-3.5 w-3.5" />
                                    <span>Associated Project</span>
                                </div>

                                <div className="text-xs pt-1">
                                    <span className="text-muted-foreground block text-[11px]">Project Name</span>
                                    <span className="font-semibold text-foreground">
                                        {subscription.projectName || "General Project"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Key Dates Timeline */}
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                Timeline & Payment Info
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 rounded-lg border border-border/70 bg-card/60">
                                    <span className="text-[11px] text-muted-foreground block">Start Date</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">
                                        {formatDate(subscription.startDate)}
                                    </span>
                                </div>
                                <div className="p-3 rounded-lg border border-border/70 bg-card/60">
                                    <span className="text-[11px] text-muted-foreground block">End / Renewal Date</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">
                                        {formatDate(subscription.endDate)}
                                    </span>
                                </div>
                                <div className="p-3 rounded-lg border border-border/70 bg-card/60 col-span-2 sm:col-span-1">
                                    <span className="text-[11px] text-muted-foreground block">Payment Method</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">
                                        {subscription.paymentMethod || "Company Card"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        {subscription.notes && (
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" />
                                    Notes & Credentials
                                </span>
                                <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-mono">
                                    {subscription.notes}
                                </div>
                            </div>
                        )}

                        {/* Audit info */}
                        <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
                            {subscription.createdBy?.name && (
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Added by: <strong className="text-foreground">{subscription.createdBy.name}</strong>
                                </span>
                            )}
                            <span>Created: {formatDate(subscription.createdAt)}</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-accent/10">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                onClose();
                                onDelete(subscription);
                            }}
                            className="gap-1.5 cursor-pointer bg-rose-600/90 hover:bg-rose-700"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="cursor-pointer"
                            >
                                Close
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    onEdit(subscription);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit Subscription
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
