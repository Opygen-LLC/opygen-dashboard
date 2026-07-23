"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Wallet,
    TrendingDown,
    TrendingUp,
    Briefcase,
    Plus,
    X,
    Filter,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    Users,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Download,
    BarChart3,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, TransactionInput } from "@/lib/validations";
import { TransactionType, TransactionCategory } from "@/types";
import FinancialAnalyticsView from "./FinancialAnalyticsView";

const monthColors = [
    "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
    "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
    "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400"
];

export default function FinanceDashboardView() {
    const [activeViewTab, setActiveViewTab] = useState<"overview" | "analytics">("overview");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportRange, setExportRange] = useState("30d");
    const [transactionToDelete, setTransactionToDelete] = useState<
        string | null
    >(null);
    const [filterType, setFilterType] = useState<string>("");
    const [filterCategory, setFilterCategory] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, filterCategory]);

    // Fetch summary
    const {
        data: summary,
        isLoading: isSummaryLoading,
        refetch: refetchSummary,
    } = useQuery({
        queryKey: ["finance-summary"],
        queryFn: async () => {
            const res = await fetch("/api/finance/summary");
            if (!res.ok) throw new Error("Failed to fetch summary");
            return res.json();
        },
    });

    // Fetch transactions
    const {
        data: transactions = [],
        isLoading: isTransactionsLoading,
        refetch: refetchTransactions,
    } = useQuery({
        queryKey: ["finance-transactions", filterType, filterCategory],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterType && filterType !== "all_types" && filterType !== "all") {
                params.append("type", filterType);
            }
            if (filterCategory && filterCategory !== "all_categories" && filterCategory !== "all") {
                params.append("category", filterCategory);
            }
            const queryString = params.toString();
            const url = queryString
                ? `/api/finance/transactions?${queryString}`
                : `/api/finance/transactions`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch transactions");
            return res.json();
        },
    });

    // Fetch users for dropdown
    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
    });

    // Form
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: "expense",
            category: "office",
            amount: 0,
            date: new Date().toISOString().split("T")[0],
            description: "",
            user: null,
        },
    });

    const selectedType = watch("type");
    const selectedCategory = watch("category");
    const selectedUser = watch("user");
    const needsUserSelection = [
        "salary",
        "allowance",
        "loan_given",
        "loan_repayment",
        "loan_taken",
    ].includes(selectedCategory);

    const typeColorClass =
        selectedType === "income"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500"
            : "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500";

    // Mutations
    const addMutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = { ...data };

            if (needsUserSelection) {
                if (!payload.user || payload.user === "") {
                    throw new Error(
                        "Please assign an employee/user or select 'Other'.",
                    );
                }
                if (payload.user === "other") {
                    if (
                        !payload.externalEntity ||
                        payload.externalEntity.trim() === ""
                    ) {
                        throw new Error(
                            "Please provide the External Entity Name.",
                        );
                    }
                    payload.user = null; // Remove the 'other' string so it doesn't fail ObjectId validation
                } else {
                    delete payload.externalEntity;
                }
            } else {
                delete payload.user;
                delete payload.externalEntity;
            }

            const res = await fetch("/api/finance/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Backend Error:", errData);
                if (errData.error?.fieldErrors) {
                    const firstError = Object.values(
                        errData.error.fieldErrors,
                    )[0] as string[];
                    throw new Error(firstError[0] || "Validation failed");
                }
                throw new Error(
                    errData.error ||
                        errData.details ||
                        "Failed to add transaction",
                );
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Transaction added successfully");
            setIsAddModalOpen(false);
            reset();
            refetchSummary();
            refetchTransactions();
        },
        onError: (err: any) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/finance/transactions/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete transaction");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Transaction deleted");
            refetchSummary();
            refetchTransactions();
        },
        onError: (err: any) => toast.error(err.message),
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount || 0);
    };

    if (isSummaryLoading || isTransactionsLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                
                {/* 4 Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-border/50 pb-4">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                        <Skeleton className="h-10 w-[150px]" />
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 pb-10"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Finance Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track company expenses, revenue, salaries, and forecasting analytics.
                    </p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <Button
                        onClick={() => setIsExportModalOpen(true)}
                        variant="outline"
                        className="bg-card border-border/60 hover:bg-muted text-foreground shadow-sm flex gap-2 items-center transition-all cursor-pointer"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex gap-2 items-center cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        New Transaction
                    </Button>
                </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Button
                    variant={activeViewTab === "overview" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveViewTab("overview")}
                    className={`gap-2 h-10! cursor-pointer font-medium ${
                        activeViewTab === "overview" ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Wallet className="h-4 w-4" />
                    Overview & Transactions
                </Button>
                <Button
                    variant={activeViewTab === "analytics" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveViewTab("analytics")}
                    className={`gap-2 h-10! cursor-pointer font-medium ${
                        activeViewTab === "analytics" ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <BarChart3 className="h-4 w-4" />
                    Analytics & Forecasting
                </Button>
            </div>

            {activeViewTab === "analytics" ? (
                <FinancialAnalyticsView />
            ) : (
                <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Net Balance
                            <Wallet className="h-4 w-4 text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {formatCurrency(summary.netBalance)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Total Income
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(summary.totalIncome)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Total Expenses
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(summary.totalExpense)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Outstanding Loans
                            <Briefcase className="h-4 w-4 text-amber-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(summary.outstandingLoans)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card className="border-border bg-card">
                <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>
                            All financial activities across the organization.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={filterType || "all_types"}
                            onValueChange={(val) => setFilterType(val === "all_types" ? "" : val)}
                        >
                            <SelectTrigger className="w-[150px] h-10! text-sm focus:ring-2 focus:ring-indigo-500">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="z-[150]">
                                <SelectItem value="all_types" className="h-10!">All Types</SelectItem>
                                <SelectItem value="income" className="h-10!">Income Only</SelectItem>
                                <SelectItem value="expense" className="h-10!">Expenses Only</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filterCategory || "all_categories"}
                            onValueChange={(val) => setFilterCategory(val === "all_categories" ? "" : val)}
                        >
                            <SelectTrigger className="w-[180px] h-10! text-sm focus:ring-2 focus:ring-indigo-500">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="z-[150]">
                                <SelectItem value="all_categories" className="h-10!">All Categories</SelectItem>
                                {Object.values(TransactionCategory).map((cat) => (
                                    <SelectItem key={cat} value={cat} className="h-10! capitalize">
                                        {cat.replace("_", " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(filterType || filterCategory) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFilterType("");
                                    setFilterCategory("");
                                }}
                                className="h-10 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                            >
                                <X className="h-3.5 w-3.5" />
                                Reset
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Description
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Category
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Amount
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                            No transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions
                                        .slice((currentPage - 1) * 10, currentPage * 10)
                                        .map((t: any) => (
                                        <tr
                                            key={t._id}
                                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">
                                                    {t.description}
                                                </div>
                                                {t.user && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                        <Users className="h-3 w-3" />{" "}
                                                        {t.user.name}
                                                    </div>
                                                )}
                                                {!t.user &&
                                                    t.externalEntity && (
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                            <Users className="h-3 w-3" />{" "}
                                                            {t.externalEntity}{" "}
                                                            (External)
                                                        </div>
                                                    )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize text-xs font-semibold"
                                                >
                                                    {t.category.replace(
                                                        "_",
                                                        " ",
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-bold">
                                                {t.type === "income" ? (
                                                    <span className="text-emerald-500 flex items-center gap-1">
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                        {formatCurrency(
                                                            t.amount,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-500 flex items-center gap-1">
                                                        <ArrowDownRight className="h-3.5 w-3.5" />
                                                        {formatCurrency(
                                                            t.amount,
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md w-max font-semibold text-xs", monthColors[new Date(t.date).getMonth()])}>
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(
                                                        t.date,
                                                    ).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                    onClick={() =>
                                                        setTransactionToDelete(
                                                            t._id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {transactions.length > 10 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 p-4 bg-muted/10">
                            <p className="text-xs text-muted-foreground text-center sm:text-left">
                                Showing{" "}
                                <span className="font-semibold text-foreground">
                                    {(currentPage - 1) * 10 + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-foreground">
                                    {Math.min(
                                        currentPage * 10,
                                        transactions.length,
                                    )}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-foreground">
                                    {transactions.length}
                                </span>{" "}
                                transactions
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                    className="h-8 w-8 cursor-pointer disabled:opacity-50"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({
                                        length: Math.ceil(
                                            transactions.length / 10,
                                        ),
                                    }).map((_, i) => {
                                        const pageNum = i + 1;
                                        const totalPages = Math.ceil(
                                            transactions.length / 10,
                                        );
                                        if (
                                            pageNum !== 1 &&
                                            pageNum !== totalPages &&
                                            (pageNum < currentPage - 1 ||
                                                pageNum > currentPage + 1)
                                        ) {
                                            if (
                                                pageNum === 2 &&
                                                currentPage > 3
                                            ) {
                                                return (
                                                    <span
                                                        key="ellipsis-start"
                                                        className="text-xs text-muted-foreground px-1"
                                                    >
                                                        ...
                                                    </span>
                                                );
                                            }
                                            if (
                                                pageNum === totalPages - 1 &&
                                                currentPage < totalPages - 2
                                            ) {
                                                return (
                                                    <span
                                                        key="ellipsis-end"
                                                        className="text-xs text-muted-foreground px-1"
                                                    >
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={
                                                    currentPage === pageNum
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setCurrentPage(pageNum)
                                                }
                                                className={cn(
                                                    "h-8 w-8 text-xs cursor-pointer p-0 transition-all font-semibold",
                                                    currentPage === pageNum
                                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                                                        : "hover:bg-accent",
                                                )}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={
                                        currentPage ===
                                        Math.ceil(transactions.length / 10)
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.min(
                                                currentPage + 1,
                                                Math.ceil(
                                                    transactions.length / 10,
                                                ),
                                            ),
                                        )
                                    }
                                    className="h-8 w-8 cursor-pointer disabled:opacity-50"
                                    title="Next Page"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            </>
            )}

            {/* Add Transaction Modal */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isAddModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.15,
                                        ease: "easeOut",
                                    }}
                                    className="relative w-full max-w-lg border border-border bg-card shadow-2xl rounded-2xl overflow-hidden"
                                >
                                    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-accent/5">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Plus className="h-5 w-5 text-indigo-500" />
                                            Add Transaction
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full hover:bg-muted"
                                            onClick={() =>
                                                setIsAddModalOpen(false)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <form
                                        onSubmit={handleSubmit((d) =>
                                            addMutation.mutate(d as any),
                                        )}
                                        className="p-6 space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Type{" "}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Controller
                                                    name="type"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <SelectTrigger
                                                                className={cn(
                                                                    "w-full h-10! px-3 text-sm focus:ring-2 outline-none transition-colors",
                                                                    typeColorClass
                                                                )}
                                                            >
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[150]">
                                                                <SelectItem value="income" className={`h-10!`}>INCOME</SelectItem>
                                                                <SelectItem value="expense" className={`h-10!`}>EXPENSE</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Amount ($){" "}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...register("amount", {
                                                        valueAsNumber: true,
                                                    })}
                                                    placeholder="0.00"
                                                    className="h-10 text-lg font-semibold tracking-tight"
                                                />
                                                {errors.amount && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.amount.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Category{" "}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Controller
                                                    name="category"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <SelectTrigger className="w-full h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                                                <SelectValue placeholder="Select category" />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[150]">
                                                                {Object.values(TransactionCategory).map((cat) => (
                                                                    <SelectItem key={cat} value={cat} className={`h-10!`}>
                                                                        {cat.replace("_", " ").toUpperCase()}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Date{" "}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Input
                                                    type="date"
                                                    {...register("date")}
                                                    className="h-10"
                                                />
                                                {errors.date && (
                                                    <p className="text-xs text-rose-500">
                                                        {errors.date.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {needsUserSelection && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Assign Employee/User{" "}
                                                    <span className="text-rose-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Controller
                                                    name="user"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select value={field.value} onValueChange={field.onChange}>
                                                            <SelectTrigger className="w-full h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                                                <SelectValue placeholder="-- Select User --" />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[150]">
                                                                <SelectItem value="other">Other (External Entity)</SelectItem>
                                                                {users.map((u: any) => (
                                                                    <SelectItem key={u._id} value={u._id} className={`h-10!`}>
                                                                        {u.name} ({u.email})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                        )}

                                        {needsUserSelection &&
                                            selectedUser === "other" && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        External Entity Name{" "}
                                                        <span className="text-rose-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <Input
                                                        {...register(
                                                            "externalEntity",
                                                        )}
                                                        placeholder="e.g., John Doe, Acme Corp..."
                                                        className="h-10"
                                                    />
                                                </div>
                                            )}

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Description{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <Input
                                                {...register("description")}
                                                placeholder="e.g., February Salary, Office Supplies..."
                                                className="h-10"
                                            />
                                            {errors.description && (
                                                <p className="text-xs text-rose-500">
                                                    {errors.description.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() =>
                                                    setIsAddModalOpen(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    isSubmitting ||
                                                    addMutation.isPending
                                                }
                                                className="min-w-[120px] bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                {isSubmitting ||
                                                addMutation.isPending
                                                    ? "Saving..."
                                                    : "Save Transaction"}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}

            {/* Delete Confirmation Modal */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {transactionToDelete && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setTransactionToDelete(null)}
                                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                                />
                                <motion.div
                                    key={transactionToDelete}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.15,
                                        ease: "easeOut",
                                    }}
                                    className="relative w-full max-w-sm border border-border bg-card shadow-2xl rounded-2xl overflow-hidden flex flex-col"
                                >
                                    <div className="p-6 text-center space-y-4">
                                        <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
                                            <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-foreground">
                                                Confirm Deletion
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Are you sure you want to delete this
                                                transaction? This action cannot be
                                                undone.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-muted/30 p-4 border-t border-border/50 flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setTransactionToDelete(null)
                                            }
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                                            onClick={() => {
                                                deleteMutation.mutate(
                                                    transactionToDelete,
                                                );
                                                setTransactionToDelete(null);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}

            {/* Export Data Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isExportModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsExportModalOpen(false)}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-sm border border-border bg-card shadow-2xl rounded-2xl overflow-hidden p-6 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold">Export Finance Data</h3>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExportModalOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                        Select Date Range
                                    </label>
                                    <Select value={exportRange} onValueChange={setExportRange}>
                                        <SelectTrigger className="w-full h-10 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                                            <SelectValue placeholder="Select Date Range" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[150]">
                                            <SelectItem value="7d">Last 7 Days</SelectItem>
                                            <SelectItem value="30d">Last 30 Days</SelectItem>
                                            <SelectItem value="90d">Last 90 Days</SelectItem>
                                            <SelectItem value="all">All Time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="pt-4">
                                    <Button onClick={() => {
                                        import("@/lib/export").then(({ exportToCSV }) => {
                                            const now = new Date();
                                            let filtered = transactions;
                                            
                                            if (exportRange === "7d") {
                                                const limitDate = new Date(now.setDate(now.getDate() - 7));
                                                filtered = transactions.filter((t: any) => new Date(t.date) >= limitDate);
                                            } else if (exportRange === "30d") {
                                                const limitDate = new Date(now.setDate(now.getDate() - 30));
                                                filtered = transactions.filter((t: any) => new Date(t.date) >= limitDate);
                                            } else if (exportRange === "90d") {
                                                const limitDate = new Date(now.setDate(now.getDate() - 90));
                                                filtered = transactions.filter((t: any) => new Date(t.date) >= limitDate);
                                            }
                                            
                                            const data = filtered.map((t: any) => ({
                                                Date: new Date(t.date).toLocaleDateString(),
                                                Type: t.type,
                                                Category: t.category,
                                                Amount: t.amount,
                                                Description: t.description,
                                                "User/Entity": t.user ? t.user.name : (t.externalEntity || ""),
                                                "Created At": new Date(t.createdAt).toLocaleDateString()
                                            }));
                                            
                                            exportToCSV(`finance-export-${exportRange}.csv`, data);
                                            setIsExportModalOpen(false);
                                        });
                                    }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex gap-2 items-center justify-center cursor-pointer">
                                        <Download className="h-4 w-4" />
                                        Export to CSV
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
}
