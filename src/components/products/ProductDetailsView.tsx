"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Package,
    ArrowLeft,
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar,
    Receipt,
    Search,
    Filter,
    ArrowDownRight,
    ArrowUpRight,
    Landmark,
    Users,
    Plus,
    Download,
    X,
    Trash2,
    Globe,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FilterDrawer } from "@/components/ui/FilterDrawer";
import { useForm, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";

interface ProductDetailsViewProps {
    productId: string;
}

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
    "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
];

function calculateDateRange(preset: string, customStart?: string, customEnd?: string) {
    if (preset === "all" || !preset) return { startDate: "", endDate: "" };
    const now = new Date();
    if (preset === "today") {
        const todayStr = now.toISOString().split("T")[0];
        return { startDate: todayStr, endDate: todayStr };
    }
    if (preset === "7d") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return { startDate: d.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
    }
    if (preset === "30d") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return { startDate: d.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
    }
    if (preset === "this_month") {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: firstDay.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
    }
    if (preset === "custom") {
        return { startDate: customStart || "", endDate: customEnd || "" };
    }
    return { startDate: "", endDate: "" };
}

export default function ProductDetailsView({ productId }: ProductDetailsViewProps) {
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);

    // Search and filter states
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterDate, setFilterDate] = useState<string>("all");
    const [customStartDate, setCustomStartDate] = useState<string>("");
    const [customEndDate, setCustomEndDate] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("date_desc");

    // Temp drawer filter states
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempType, setTempType] = useState<string>("all");
    const [tempDate, setTempDate] = useState<string>("all");
    const [tempStartDate, setTempStartDate] = useState<string>("");
    const [tempEndDate, setTempEndDate] = useState<string>("");
    const [tempSortBy, setTempSortBy] = useState<string>("date_desc");

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [appliedSearch, filterType, filterDate, customStartDate, customEndDate, sortBy]);

    // Active filter counter
    const activeFilterCount =
        (filterType !== "all" ? 1 : 0) +
        (filterDate !== "all" ? 1 : 0) +
        (sortBy !== "date_desc" ? 1 : 0);

    const openFilterDrawer = () => {
        setTempType(filterType);
        setTempDate(filterDate);
        setTempStartDate(customStartDate);
        setTempEndDate(customEndDate);
        setTempSortBy(sortBy);
        setIsFilterOpen(true);
    };

    const handleApplyFilters = () => {
        setFilterType(tempType);
        setFilterDate(tempDate);
        setCustomStartDate(tempStartDate);
        setCustomEndDate(tempEndDate);
        setSortBy(tempSortBy);
        setIsFilterOpen(false);
    };

    const handleResetFilters = () => {
        setFilterType("all");
        setFilterDate("all");
        setCustomStartDate("");
        setCustomEndDate("");
        setSortBy("date_desc");
        setSearchInput("");
        setAppliedSearch("");
        setTempType("all");
        setTempDate("all");
        setTempStartDate("");
        setTempEndDate("");
        setTempSortBy("date_desc");
    };

    // Query product details and transactions
    const { data, isLoading, error } = useQuery({
        queryKey: ["product-details", productId],
        queryFn: async () => {
            const res = await fetch(`/api/products/${productId}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to load product details");
            }
            return res.json();
        },
    });

    // Query accounts for transaction creation
    const { data: accountsData } = useQuery<any>({
        queryKey: ["all-finance-accounts"],
        queryFn: async () => {
            const res = await fetch("/api/admin/accounts?limit=1000");
            if (!res.ok) throw new Error("Failed to fetch accounts");
            return res.json();
        },
    });
    const allAccounts = accountsData?.accounts || [];

    const product = data?.product;
    const summary = data?.summary || {
        totalIncome: 0,
        totalExpense: 0,
        netRevenue: 0,
        transactionCount: 0,
    };
    const rawTransactions: any[] = data?.transactions || [];

    // Filter and sort transactions
    const filteredTransactions = useMemo(() => {
        let list = [...rawTransactions];

        // Type filter
        if (filterType !== "all") {
            list = list.filter((t) => t.type === filterType);
        }

        // Date range filter
        const { startDate, endDate } = calculateDateRange(filterDate, customStartDate, customEndDate);
        if (startDate) {
            const s = new Date(startDate);
            list = list.filter((t) => new Date(t.date) >= s);
        }
        if (endDate) {
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            list = list.filter((t) => new Date(t.date) <= e);
        }

        // Text search filter
        if (appliedSearch.trim()) {
            const term = appliedSearch.toLowerCase();
            list = list.filter((t) => {
                const desc = (t.description || "").toLowerCase();
                const accName = (t.accountDetails?.accountName || "").toLowerCase();
                const provider = (t.accountDetails?.providerName || "").toLowerCase();
                const accNum = (t.accountDetails?.accountNumber || "").toLowerCase();
                const userName = (t.user?.name || t.externalEntity || "").toLowerCase();
                return (
                    desc.includes(term) ||
                    accName.includes(term) ||
                    provider.includes(term) ||
                    accNum.includes(term) ||
                    userName.includes(term)
                );
            });
        }

        // Sorting
        list.sort((a, b) => {
            if (sortBy === "date_asc") {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            if (sortBy === "amount_desc") {
                const amtA = Number(a.amount || 0);
                const amtB = Number(b.amount || 0);
                return amtB - amtA;
            }
            if (sortBy === "amount_asc") {
                const amtA = Number(a.amount || 0);
                const amtB = Number(b.amount || 0);
                return amtA - amtB;
            }
            // Default: date_desc
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        return list;
    }, [rawTransactions, filterType, filterDate, customStartDate, customEndDate, appliedSearch, sortBy]);

    // CSV Export
    const handleExportCSV = () => {
        if (!filteredTransactions.length) {
            toast.error("No transactions to export");
            return;
        }
        const exportData = filteredTransactions.map((t) => ({
            Date: t.date ? new Date(t.date).toLocaleDateString() : "-",
            Type: t.type?.toUpperCase(),
            Category: t.category,
            Product: product?.name,
            "Amount (BDT)": Number(t.amount || 0),
            Description: t.description,
            Account: `${t.accountDetails?.providerName || ""} - ${t.accountDetails?.accountNumber || ""}`,
            "Handled By": t.user?.name || t.externalEntity || "-",
        }));
        exportToCSV(`${product?.name || "product"}-transactions.csv`, exportData);
        toast.success("Transactions exported to CSV!");
    };

    // Form setup for recording a product transaction directly
    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        watch,
        formState: { isSubmitting },
    } = useForm({
        defaultValues: {
            accountId: "",
            accountUser: "",
            type: "income",
            amount: 0,
            date: new Date().toISOString().split("T")[0],
            description: "",
        },
    });

    const modalType = watch("type");
    const typeColorClass =
        modalType === "income"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500"
            : "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500";

    const openAddModal = () => {
        reset({
            accountId: "",
            accountUser: "",
            type: "income",
            amount: 0,
            date: new Date().toISOString().split("T")[0],
            description: "",
        });
        setIsAddModalOpen(true);
    };

    // Create transaction mutation
    const createTransactionMutation = useMutation({
        mutationFn: async (formData: any) => {
            const numAmount = parseFloat(formData.amount) || 0;
            if (numAmount <= 0) {
                throw new Error("Amount must be greater than 0");
            }
            if (!formData.accountId || !formData.accountUser) {
                throw new Error("Please select an account for this transaction");
            }
            if (!formData.description?.trim()) {
                throw new Error("Description is required");
            }

            const payload = {
                accountId: formData.accountId,
                accountUser: formData.accountUser,
                type: formData.type,
                amount: numAmount,
                category: "product",
                productName: product.name,
                productId: product._id,
                date: formData.date || new Date().toISOString().split("T")[0],
                description: formData.description.trim(),
            };

            const res = await fetch("/api/finance/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to record transaction");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-details", productId] });
            queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
            queryClient.invalidateQueries({ queryKey: ["all-finance-accounts"] });
            toast.success("Transaction recorded successfully!");
            setIsAddModalOpen(false);
            reset();
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to record transaction");
        },
    });

    // Delete transaction mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/finance/transactions/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete transaction");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-details", productId] });
            queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
            queryClient.invalidateQueries({ queryKey: ["all-finance-accounts"] });
            toast.success("Transaction deleted successfully");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete transaction");
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-72 w-full rounded-xl" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center font-bold">
                    !
                </div>
                <h2 className="text-lg font-bold text-foreground">Product Not Found</h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {error instanceof Error ? error.message : "The requested product does not exist or has been removed."}
                </p>
                <Link href="/admin-dashboard/settings?_tab=products">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 cursor-pointer rounded-md">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
                    </Button>
                </Link>
            </div>
        );
    }

    const netIsPositive = summary.netRevenue >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 pb-16"
        >
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Link
                    href="/admin-dashboard/settings?_tab=products"
                    className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Products
                </Link>
                <span>/</span>
                <span className="font-semibold text-foreground">{product.name}</span>
            </div>

            {/* Page Header Deck matching Finance & Projects */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-0.5 text-xs font-bold tracking-wide text-indigo-600 dark:text-indigo-400">
                            <Package className="h-3.5 w-3.5" />
                            Product Finance
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        {product.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {product.description || `Income, expenses, and transaction ledger for ${product.name}.`}
                    </p>
                </div>

                {/* Header Action Buttons (all rounded-md) */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {product.url && (
                        <a href={product.url} target="_blank" rel="noreferrer">
                            <Button
                                variant="outline"
                                className="bg-card border-border/60 hover:bg-muted text-foreground shadow-xs flex items-center gap-2 rounded-md cursor-pointer text-xs font-semibold h-10"
                            >
                                <Globe className="h-4 w-4 text-indigo-500" />
                                <span className="hidden sm:inline">Visit Website</span>
                                <ExternalLink className="h-3 w-3 opacity-60" />
                            </Button>
                        </a>
                    )}
                    <Button
                        onClick={handleExportCSV}
                        variant="outline"
                        className="bg-card border-border/60 hover:bg-muted text-foreground shadow-xs flex items-center gap-2 rounded-md cursor-pointer text-xs font-semibold h-10"
                    >
                        <Download className="h-4 w-4 text-indigo-500" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                    <Button
                        onClick={openAddModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2 rounded-md cursor-pointer font-semibold text-xs h-10"
                    >
                        <Plus className="h-4 w-4" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* 4 Financial KPI Cards matching Finance & Projects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Net Revenue */}
                <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Net Revenue
                            <Wallet className="h-4 w-4 text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-xl sm:text-2xl font-bold tracking-tight", netIsPositive ? "text-foreground" : "text-rose-600")}>
                            ৳{summary.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Income minus direct expenses
                        </p>
                    </CardContent>
                </Card>

                {/* Total Income */}
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Total Income
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                            ৳{summary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total earnings attributed
                        </p>
                    </CardContent>
                </Card>

                {/* Total Expenses */}
                <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20 rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Total Expenses
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                            ৳{summary.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Direct product expenditures
                        </p>
                    </CardContent>
                </Card>

                {/* Total Transactions */}
                <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20 rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Transactions
                            <Receipt className="h-4 w-4 text-violet-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                            {summary.transactionCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Financial records logged
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls Bar: Search on Left, Filter on Right (matching Projects & Finance) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border shadow-xs">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setAppliedSearch(searchInput);
                    }}
                    className="relative w-full sm:max-w-md flex items-center flex-1"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                setAppliedSearch(searchInput);
                            }
                        }}
                        placeholder="Search description, account, handler… (Press Enter)"
                        className="pl-9 pr-20 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 text-foreground h-10 transition-all w-full rounded-md text-xs"
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        onClick={openFilterDrawer}
                        variant="outline"
                        className="bg-background/50 border-border hover:bg-accent text-foreground h-10 gap-2 cursor-pointer relative font-semibold text-xs rounded-md"
                    >
                        <Filter className="h-4 w-4 text-indigo-500" />
                        <span>Filter</span>
                        {activeFilterCount > 0 && (
                            <Badge className="ml-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>

                    {(activeFilterCount > 0 || appliedSearch) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-10 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer rounded-md"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Drawer matching Finance and Projects */}
            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                activeFilterCount={activeFilterCount}
                title="Product Filters"
                description={`Refine transactions for ${product.name}.`}
            >
                <div className="space-y-4">
                    {/* Transaction Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Transaction Type
                        </label>
                        <Select value={tempType} onValueChange={(val: any) => setTempType(val)}>
                            <SelectTrigger className="w-full h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 rounded-md">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                                <SelectItem value="all" className="h-10!">
                                    All Types
                                </SelectItem>
                                <SelectItem value="income" className="h-10!">
                                    Income Only
                                </SelectItem>
                                <SelectItem value="expense" className="h-10!">
                                    Expense Only
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Preset */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Date Range
                        </label>
                        <Select value={tempDate} onValueChange={(val: any) => setTempDate(val)}>
                            <SelectTrigger className="w-full h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 rounded-md">
                                <SelectValue placeholder="Select Date Range" />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                                <SelectItem value="all" className="h-10!">
                                    All Time
                                </SelectItem>
                                <SelectItem value="today" className="h-10!">
                                    Today
                                </SelectItem>
                                <SelectItem value="7d" className="h-10!">
                                    Last 7 Days
                                </SelectItem>
                                <SelectItem value="30d" className="h-10!">
                                    Last 30 Days
                                </SelectItem>
                                <SelectItem value="this_month" className="h-10!">
                                    This Month
                                </SelectItem>
                                <SelectItem value="custom" className="h-10!">
                                    Custom Range
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Date Range */}
                    {tempDate === "custom" && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">From</label>
                                <Input
                                    type="date"
                                    value={tempStartDate}
                                    onChange={(e) => setTempStartDate(e.target.value)}
                                    className="h-10! text-xs rounded-md"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">To</label>
                                <Input
                                    type="date"
                                    value={tempEndDate}
                                    onChange={(e) => setTempEndDate(e.target.value)}
                                    className="h-10! text-xs rounded-md"
                                />
                            </div>
                        </div>
                    )}

                    {/* Sort By */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Sort By
                        </label>
                        <Select value={tempSortBy} onValueChange={(val: any) => setTempSortBy(val)}>
                            <SelectTrigger className="w-full h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 rounded-md">
                                <SelectValue placeholder="Sort Order" />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                                <SelectItem value="date_desc" className="h-10!">
                                    Date (Newest First)
                                </SelectItem>
                                <SelectItem value="date_asc" className="h-10!">
                                    Date (Oldest First)
                                </SelectItem>
                                <SelectItem value="amount_desc" className="h-10!">
                                    Amount (High to Low)
                                </SelectItem>
                                <SelectItem value="amount_asc" className="h-10!">
                                    Amount (Low to High)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FilterDrawer>

            {/* Transactions Ledger Table matching Finance */}
            <Card className="border-border bg-card rounded-xl overflow-hidden">
                <CardHeader className="border-b border-border/50 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-indigo-500" />
                                Product Transactions Ledger
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                All financial activities attributed to {product.name}.
                            </CardDescription>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{filteredTransactions.length}</span> record{filteredTransactions.length === 1 ? "" : "s"}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Description</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Amount (৳)</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground mb-2">
                                                <Receipt className="h-5 w-5" />
                                            </div>
                                            <p className="font-semibold text-foreground text-sm">No transactions found</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                                                {rawTransactions.length === 0
                                                    ? `No transactions have been recorded for ${product.name} yet.`
                                                    : "Try adjusting your search or filters to see records."}
                                            </p>
                                            {rawTransactions.length === 0 && (
                                                <Button
                                                    onClick={openAddModal}
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 mt-3 rounded-md cursor-pointer h-10!"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Add First Transaction
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions
                                        .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                                        .map((t: any) => {
                                            const isIncome = t.type === "income";
                                            const amt = Number(t.amount || 0);

                                            return (
                                                <tr
                                                    key={t._id}
                                                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-foreground">
                                                            {t.description}
                                                        </div>
                                                        {t.accountDetails && (
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                                                                <Landmark className="h-3 w-3 text-indigo-500 shrink-0" />
                                                                <span className="font-semibold text-foreground">
                                                                    {t.accountDetails.providerName}
                                                                </span>
                                                                <span className="font-mono text-[10px] bg-muted/60 px-1 py-0.2 rounded text-foreground">
                                                                    {t.accountDetails.accountNumber}
                                                                </span>
                                                                {t.accountUser?.name && (
                                                                    <span className="text-[11px] opacity-75">
                                                                        ({t.accountUser.name})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {t.user?.name && (
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                <Users className="h-3 w-3" />
                                                                {t.user.name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge
                                                            className={cn(
                                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border gap-1 rounded-md",
                                                                isIncome
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                                            )}
                                                        >
                                                            {isIncome ? (
                                                                <ArrowUpRight className="h-3 w-3" />
                                                            ) : (
                                                                <ArrowDownRight className="h-3 w-3" />
                                                            )}
                                                            {t.type}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">
                                                        {isIncome ? (
                                                            <span className="text-emerald-500 flex items-center gap-1">
                                                                +৳{amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-rose-500 flex items-center gap-1">
                                                                -৳{amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div
                                                            className={cn(
                                                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md w-max font-semibold text-xs",
                                                                monthColors[new Date(t.date).getMonth()]
                                                            )}
                                                        >
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(t.date).toLocaleDateString(undefined, {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer rounded-md"
                                                            onClick={() => setTransactionToDelete(t._id)}
                                                            title="Delete Transaction"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredTransactions.length > ITEMS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 p-4 bg-muted/10">
                            <p className="text-xs text-muted-foreground text-center sm:text-left">
                                Showing{" "}
                                <span className="font-semibold text-foreground">
                                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-foreground">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-foreground">
                                    {filteredTransactions.length}
                                </span>{" "}
                                transactions
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="h-8 text-xs cursor-pointer rounded-md gap-1"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Prev
                                </Button>
                                <span className="text-xs font-semibold px-2">
                                    Page {currentPage} of {Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    className="h-8 text-xs cursor-pointer rounded-md gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Transaction Modal for Product (pre-populated with this product) */}
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
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="relative w-full max-w-xl border border-border bg-card shadow-2xl rounded-2xl overflow-hidden"
                                >
                                    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-accent/5">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Plus className="h-5 w-5 text-indigo-500" />
                                            Record Transaction for {product.name}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-md hover:bg-muted"
                                            onClick={() => setIsAddModalOpen(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <form
                                        onSubmit={handleSubmit((data) => createTransactionMutation.mutate(data))}
                                        className="p-6 grid grid-cols-2 gap-4"
                                    >
                                        {/* Row 1: Account (Full Width) */}
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                                                <span>Account (Bank / Mobile) <span className="text-rose-500">*</span></span>
                                                {allAccounts.length === 0 && (
                                                    <span className="text-amber-500 text-[10px] lowercase">No accounts found</span>
                                                )}
                                            </label>
                                            <Controller
                                                name="accountId"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value || ""}
                                                        onValueChange={(val: any) => {
                                                            const strVal = String(val || "");
                                                            field.onChange(strVal);
                                                            const found = allAccounts.find(
                                                                (a: any) => a.account?._id?.toString() === strVal
                                                            );
                                                            if (found) {
                                                                setValue("accountUser", found.userId?.toString() || "");
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none rounded-md">
                                                            <SelectValue placeholder="-- Select Account --" />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[150] max-h-64">
                                                            {allAccounts.map((item: any) => {
                                                                const acc = item.account;
                                                                return (
                                                                    <SelectItem
                                                                        key={acc._id}
                                                                        value={acc._id}
                                                                        className="h-12 py-2"
                                                                    >
                                                                        <div className="flex flex-col text-left">
                                                                            <span className="font-semibold text-xs">
                                                                                {acc.providerName} • {acc.accountNumber} ({item.userName})
                                                                            </span>
                                                                            <span className="text-[10px] text-muted-foreground">
                                                                                {acc.accountName} | Bal: ৳{Number(acc.balanceInBdt || acc.balance || 0).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>

                                        {/* Row 2: Type & Amount */}
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Type <span className="text-rose-500">*</span>
                                            </label>
                                            <Controller
                                                name="type"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger
                                                            className={cn(
                                                                "w-full h-10! px-3 text-sm focus:ring-2 outline-none transition-colors rounded-md",
                                                                typeColorClass
                                                            )}
                                                        >
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[150]">
                                                            <SelectItem value="income" className="h-10!">INCOME</SelectItem>
                                                            <SelectItem value="expense" className="h-10!">EXPENSE</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>

                                        <div className="col-span-1 space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Amount (৳) <span className="text-rose-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                step="any"
                                                {...register("amount", {
                                                    valueAsNumber: true,
                                                })}
                                                placeholder="0.00"
                                                className="h-10 font-semibold tracking-tight rounded-md"
                                            />
                                        </div>

                                        {/* Row 3: Category & Date */}
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Category
                                            </label>
                                            <Input
                                                value="PRODUCT"
                                                disabled
                                                className="h-10 bg-muted/40 font-semibold text-xs cursor-not-allowed rounded-md"
                                            />
                                        </div>

                                        <div className="col-span-1 space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Date <span className="text-rose-500">*</span>
                                            </label>
                                            <Input
                                                type="date"
                                                {...register("date")}
                                                className="h-10 rounded-md"
                                            />
                                        </div>

                                        {/* Row 4: Product Name (Auto-assigned) */}
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Product Name
                                            </label>
                                            <Input
                                                value={product.name}
                                                disabled
                                                className="h-10 bg-muted/40 font-semibold text-xs cursor-not-allowed rounded-md"
                                            />
                                        </div>

                                        {/* Row 5: Description */}
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Description <span className="text-rose-500">*</span>
                                            </label>
                                            <Input
                                                {...register("description")}
                                                placeholder="e.g. License renewal, Subscription income, Hosting bill..."
                                                className="h-10 rounded-md"
                                            />
                                        </div>

                                        {/* Action buttons */}
                                        <div className="col-span-2 pt-4 flex justify-end gap-3 border-t border-border/50">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="rounded-md"
                                                onClick={() => setIsAddModalOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || createTransactionMutation.isPending}
                                                className="min-w-[120px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer rounded-md"
                                            >
                                                {isSubmitting || createTransactionMutation.isPending
                                                    ? "Saving..."
                                                    : "Save Transaction"}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
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
                                    transition={{ duration: 0.15, ease: "easeOut" }}
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
                                                Are you sure you want to delete this transaction? This action will adjust your account balance and cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-muted/30 p-4 border-t border-border/50 flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setTransactionToDelete(null)}
                                            className="flex-1 cursor-pointer rounded-md"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer rounded-md"
                                            onClick={() => {
                                                deleteMutation.mutate(transactionToDelete);
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
                    document.body
                )}
        </motion.div>
    );
}
