"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Landmark,
    Smartphone,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Receipt,
    Wallet,
    AlertCircle,
    User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AccountHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: {
        _id?: string;
        type?: "bank" | "mobile_banking" | string;
        providerName: string;
        accountName: string;
        accountNumber: string;
        branch?: string;
        routingNumber?: string;
        balance?: number;
        balanceInBdt?: number;
        userName?: string;
    } | null;
}

export default function AccountHistoryModal({
    isOpen,
    onClose,
    account,
}: AccountHistoryModalProps) {
    const accountId = account?._id;

    const { data, isLoading, isError } = useQuery({
        queryKey: ["account-history", accountId],
        queryFn: async () => {
            if (!accountId) return [];
            const res = await fetch(`/api/finance/transactions?accountId=${accountId}&limit=30`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to fetch account transactions");
            }
            const json = await res.json();
            return Array.isArray(json) ? json : json.transactions || [];
        },
        enabled: isOpen && !!accountId,
    });

    const transactions = Array.isArray(data) ? data : [];

    const formatCurrency = (val?: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(val || 0);
    };

    const formatBDT = (val?: number) => {
        const num = val || 0;
        const isNeg = num < 0;
        return `${isNeg ? "-" : ""}৳${Math.abs(num).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    if (!isOpen || !account) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="relative w-full max-w-2xl max-h-[85vh] flex flex-col border border-border bg-card shadow-2xl rounded-2xl overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-border/60 bg-muted/20 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                                {account.type === "bank" ? (
                                    <Landmark className="h-5 w-5" />
                                ) : (
                                    <Smartphone className="h-5 w-5" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-foreground">
                                        {account.providerName}
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase tracking-wider font-semibold py-0 h-5"
                                    >
                                        {account.type === "bank" ? "Bank" : "Mobile"}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {account.accountName}
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-foreground">
                                        {account.accountNumber}
                                    </span>
                                    {account.userName && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <UserIcon className="h-3 w-3" />
                                                {account.userName}
                                            </span>
                                        </>
                                    )}
                                </div>
                                {(account.branch || account.routingNumber) && (
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                        {account.branch && <span>Br: {account.branch}</span>}
                                        {account.routingNumber && <span>Rt: {account.routingNumber}</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Balance Strip */}
                    <div className="px-5 py-3 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent border-b border-border/60 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <Wallet className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Current Account Balance</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <span className="text-indigo-600 dark:text-indigo-400">
                                {formatBDT(account.balanceInBdt ?? account.balance)}
                            </span>
                        </div>
                    </div>

                    {/* Content / Transactions List */}
                    <div className="p-5 overflow-y-auto flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Recent Transactions
                            </h4>
                            <span className="text-xs text-muted-foreground">
                                {transactions.length} record{transactions.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="space-y-2 pt-1">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="p-8 text-center text-rose-500 flex flex-col items-center gap-2">
                                <AlertCircle className="h-6 w-6" />
                                <p className="text-sm font-medium">
                                    Failed to load transactions for this account.
                                </p>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="py-12 border border-dashed border-border rounded-xl text-center flex flex-col items-center justify-center gap-2">
                                <div className="p-3 bg-muted rounded-full">
                                    <Receipt className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    No transactions recorded
                                </p>
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    Transactions linked to this account from the Finance Dashboard will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {transactions.map((tx: any) => {
                                    const isIncome = tx.type === "income";
                                    return (
                                        <div
                                            key={tx._id}
                                            className="p-3.5 rounded-xl border border-border/70 hover:border-border hover:bg-muted/30 transition-all flex items-center justify-between gap-3 bg-card"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={cn(
                                                        "p-2 rounded-lg shrink-0 mt-0.5",
                                                        isIncome
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                    )}
                                                >
                                                    {isIncome ? (
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {tx.description}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] uppercase font-semibold h-4 px-1.5"
                                                        >
                                                            {tx.category?.replace(/_/g, " ")}
                                                        </Badge>
                                                        <span className="flex items-center gap-1 text-[11px]">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(tx.date).toLocaleDateString(undefined, {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                        {tx.user?.name && (
                                                            <span className="text-[11px] opacity-80">
                                                                • {tx.user.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div
                                                    className={cn(
                                                        "font-bold text-sm flex items-center justify-end gap-0.5",
                                                        isIncome
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-rose-600 dark:text-rose-400"
                                                    )}
                                                >
                                                    <span>{isIncome ? "+" : "-"}</span>
                                                    <span>{formatBDT(tx.amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-border/60 bg-muted/10 flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-xs h-8"
                        >
                            Close
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
