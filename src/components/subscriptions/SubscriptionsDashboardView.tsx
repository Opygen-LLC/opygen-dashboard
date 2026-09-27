"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    CreditCard,
    Globe,
    FolderKanban,
    Calendar,
    Clock,
    DollarSign,
    Repeat,
    Filter,
    ArrowUpDown,
    Eye,
    TrendingUp,
    ShieldAlert,
    AlertCircle,
    LayoutGrid,
    List,
    RefreshCw,
    X,
    RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterDrawer } from "@/components/ui/FilterDrawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SubscriptionFormModal } from "./SubscriptionFormModal";
import { SubscriptionDetailsModal } from "./SubscriptionDetailsModal";

export default function SubscriptionsDashboardView() {
    const queryClient = useQueryClient();

    // Filters and search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [selectedProject, setSelectedProject] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedBillingCycle, setSelectedBillingCycle] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("endDate");
    const [sortOrder, setSortOrder] = useState<string>("asc");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    // Filter Drawer state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempType, setTempType] = useState<string>("all");
    const [tempProject, setTempProject] = useState<string>("all");
    const [tempStatus, setTempStatus] = useState<string>("all");
    const [tempBillingCycle, setTempBillingCycle] = useState<string>("all");
    const [tempSortBy, setTempSortBy] = useState<string>("endDate");
    const [tempSortOrder, setTempSortOrder] = useState<string>("asc");

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState<any | null>(null);
    const [viewingSubscription, setViewingSubscription] = useState<any | null>(null);
    const [subscriptionToDelete, setSubscriptionToDelete] = useState<any | null>(null);

    // Fetch persistent projects list for filtering
    const { data: projectList = [] } = useQuery<string[]>({
        queryKey: ["subscription-projects"],
        queryFn: async () => {
            const res = await fetch("/api/admin/subscriptions/projects");
            if (!res.ok) return [];
            return res.json();
        },
    });

    // Active filter counter
    const activeFilterCount =
        (selectedType !== "all" ? 1 : 0) +
        (selectedProject !== "all" ? 1 : 0) +
        (selectedStatus !== "all" ? 1 : 0) +
        (selectedBillingCycle !== "all" ? 1 : 0) +
        (sortBy !== "endDate" || sortOrder !== "asc" ? 1 : 0);

    const openFilterDrawer = () => {
        setTempType(selectedType);
        setTempProject(selectedProject);
        setTempStatus(selectedStatus);
        setTempBillingCycle(selectedBillingCycle);
        setTempSortBy(sortBy);
        setTempSortOrder(sortOrder);
        setIsFilterOpen(true);
    };

    const handleApplyFilters = () => {
        setSelectedType(tempType);
        setSelectedProject(tempProject);
        setSelectedStatus(tempStatus);
        setSelectedBillingCycle(tempBillingCycle);
        setSortBy(tempSortBy);
        setSortOrder(tempSortOrder);
    };

    const handleResetFilters = () => {
        setTempType("all");
        setTempProject("all");
        setTempStatus("all");
        setTempBillingCycle("all");
        setTempSortBy("endDate");
        setTempSortOrder("asc");
        setSelectedType("all");
        setSelectedProject("all");
        setSelectedStatus("all");
        setSelectedBillingCycle("all");
        setSortBy("endDate");
        setSortOrder("asc");
    };

    // Fetch subscriptions & computed stats
    const { data, isLoading, isFetching } = useQuery<{
        subscriptions: any[];
        stats: {
            total: number;
            activeCount: number;
            expiringSoonCount: number;
            expiredCount: number;
            globalCount: number;
            projectCount: number;
            totalMonthlySpend: number;
            totalAnnualSpend: number;
        };
    }>({
        queryKey: [
            "subscriptions",
            selectedType,
            selectedProject,
            selectedStatus,
            selectedBillingCycle,
            searchQuery,
            sortBy,
            sortOrder,
        ],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedType !== "all") params.append("type", selectedType);
            if (selectedProject !== "all") params.append("project", selectedProject);
            if (selectedStatus !== "all") params.append("status", selectedStatus);
            if (selectedBillingCycle !== "all")
                params.append("billingCycle", selectedBillingCycle);
            if (searchQuery) params.append("search", searchQuery);
            params.append("sortBy", sortBy);
            params.append("sortOrder", sortOrder);

            const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to fetch subscriptions");
            }
            return res.json();
        },
    });

    const subscriptions = data?.subscriptions || [];
    const stats = data?.stats || {
        total: 0,
        activeCount: 0,
        expiringSoonCount: 0,
        expiredCount: 0,
        globalCount: 0,
        projectCount: 0,
        totalMonthlySpend: 0,
        totalAnnualSpend: 0,
    };

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/subscriptions/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete subscription");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Subscription removed successfully");
            setSubscriptionToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete");
        },
    });

    const handleOpenCreate = () => {
        setEditingSubscription(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (sub: any) => {
        setEditingSubscription(sub);
        setIsFormModalOpen(true);
    };

    const handleOpenDetails = (sub: any) => {
        setViewingSubscription(sub);
    };

    const formatDate = (date: any) => {
        if (!date) return "Ongoing / None";
        try {
            return new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return String(date);
        }
    };

    const getRemainingDaysInfo = (endDate: any) => {
        if (!endDate) return null;
        const now = new Date();
        const end = new Date(endDate);
        const diffMs = end.getTime() - now.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
            days,
            isExpired: days < 0,
            isUrgent: days >= 0 && days <= 7,
            isWarning: days > 7 && days <= 14,
        };
    };

    const getSortLabel = () => {
        if (sortBy === "endDate") return sortOrder === "asc" ? "Expiring Soonest" : "Expiring Latest";
        if (sortBy === "price") return sortOrder === "desc" ? "Price: High to Low" : "Price: Low to High";
        if (sortBy === "createdAt") return sortOrder === "desc" ? "Recently Added" : "Oldest First";
        if (sortBy === "startDate") return "Start Date";
        if (sortBy === "name") return "Alphabetical (A-Z)";
        return "Custom Order";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 pb-12"
        >
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <CreditCard className="h-7 w-7" />
                        </div>
                        <span>Subscriptions</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Track company SaaS licenses, infrastructure costs, and project-specific client subscriptions.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["subscriptions"] })}
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-indigo-500")} />
                    </Button>
                    <Button
                        onClick={handleOpenCreate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/15 flex items-center gap-2 h-10 px-4 cursor-pointer font-semibold flex-1 sm:flex-initial"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Subscription</span>
                    </Button>
                </div>
            </div>

            {/* KPI Metric Overview Deck */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Monthly Run Rate */}
                <Card className="bg-card/70 backdrop-blur-md border-border/80 shadow-xs hover:border-indigo-500/40 transition-all">
                    <CardContent className="p-4 sm:p-5 space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Monthly Burn Rate
                            </span>
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                ${stats.totalMonthlySpend.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">/mo</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Projected annual: <strong className="text-foreground">${stats.totalAnnualSpend.toLocaleString()}</strong>
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Total Subscriptions */}
                <Card className="bg-card/70 backdrop-blur-md border-border/80 shadow-xs hover:border-indigo-500/40 transition-all">
                    <CardContent className="p-4 sm:p-5 space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Total Subscriptions
                            </span>
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                {stats.total}
                            </span>
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 font-bold">
                                {stats.activeCount} Active
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            {stats.expiredCount} expired / inactive
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Global vs Project Breakdown */}
                <Card className="bg-card/70 backdrop-blur-md border-border/80 shadow-xs hover:border-indigo-500/40 transition-all">
                    <CardContent className="p-4 sm:p-5 space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Subscriptions Scope
                            </span>
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <Globe className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span>{stats.globalCount}</span>
                                    <span className="text-muted-foreground font-normal">Global</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                    <span>{stats.projectCount}</span>
                                    <span className="text-muted-foreground font-normal">Project</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden flex">
                            <div
                                className="bg-indigo-500 h-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.globalCount / stats.total) * 100 : 50}%`,
                                }}
                            />
                            <div
                                className="bg-cyan-500 h-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.projectCount / stats.total) * 100 : 50}%`,
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Renewals Due Soon */}
                <Card
                    onClick={() => {
                        const newStatus = selectedStatus === "expiring_soon" ? "all" : "expiring_soon";
                        setSelectedStatus(newStatus);
                        setTempStatus(newStatus);
                    }}
                    className={cn(
                        "bg-card/70 backdrop-blur-md border-border/80 shadow-xs cursor-pointer transition-all",
                        selectedStatus === "expiring_soon"
                            ? "ring-2 ring-amber-500 border-amber-500/40 bg-amber-500/5"
                            : "hover:border-amber-500/40"
                    )}
                >
                    <CardContent className="p-4 sm:p-5 space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Renewals &lt; 14 Days
                            </span>
                            <div
                                className={cn(
                                    "p-2 rounded-lg",
                                    stats.expiringSoonCount > 0
                                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                <AlertCircle className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span
                                className={cn(
                                    "text-2xl sm:text-3xl font-extrabold",
                                    stats.expiringSoonCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                                )}
                            >
                                {stats.expiringSoonCount}
                            </span>
                            <span className="text-xs text-muted-foreground">Due soon</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            {selectedStatus === "expiring_soon"
                                ? "Click to show all"
                                : "Click to view due renewals"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls Bar: Search Left, Filter Button Right (Standard Pattern across Dashboard) */}
            <div className="flex items-center justify-between gap-3 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border shadow-xs">
                {/* Search Form */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSearchQuery(searchInput);
                    }}
                    className="relative w-full sm:max-w-md flex items-center flex-1"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search subscriptions by name, vendor, project... (Press Enter)"
                        className="pl-9 pr-20 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 text-foreground h-10 transition-all w-full text-xs sm:text-sm"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                setSearchQuery(searchInput);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Search"
                    >
                        Search
                    </button>
                </form>

                {/* Right controls: View Toggle and Filter Button */}
                <div className="flex items-center gap-2 sm:w-auto justify-end shrink-0">
                    {/* View Switcher Toggle (Grid vs Table) */}
                    <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/50 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                                viewMode === "grid"
                                    ? "bg-background text-foreground shadow-xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Grid Card View"
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Grid</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                                viewMode === "table"
                                    ? "bg-background text-foreground shadow-xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Table View"
                        >
                            <List className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Table</span>
                        </button>
                    </div>

                    {/* Filter Button */}
                    <Button
                        onClick={openFilterDrawer}
                        variant="outline"
                        className="bg-background/50 border-border hover:bg-accent text-foreground h-10 gap-2 cursor-pointer relative font-semibold text-xs"
                    >
                        <Filter className="h-4 w-4 text-indigo-500" />
                        <span>Filter</span>
                        {activeFilterCount > 0 && (
                            <Badge className="ml-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>

            {/* Active Filter Chips Bar (Shown when any filter or search is active) */}
            {(activeFilterCount > 0 || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/20 border border-border/60 rounded-xl text-xs">
                    <span className="text-muted-foreground font-semibold text-[11px] uppercase tracking-wider mr-1">
                        Active Filters:
                    </span>

                    {searchQuery && (
                        <Badge
                            variant="secondary"
                            className="bg-background border-border text-foreground gap-1.5 py-1 px-2.5 rounded-lg font-medium"
                        >
                            <span>Search: &quot;{searchQuery}&quot;</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSearchInput("");
                                }}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {selectedType !== "all" && (
                        <Badge
                            variant="secondary"
                            className="bg-background border-border text-foreground gap-1.5 py-1 px-2.5 rounded-lg font-medium"
                        >
                            <span>
                                Scope: {selectedType === "global" ? "1. Global" : "2. Project"}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedType("all");
                                    setTempType("all");
                                }}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {selectedProject !== "all" && (
                        <Badge
                            variant="secondary"
                            className="bg-background border-border text-foreground gap-1.5 py-1 px-2.5 rounded-lg font-medium"
                        >
                            <span>Project: {selectedProject}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedProject("all");
                                    setTempProject("all");
                                }}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {selectedStatus !== "all" && (
                        <Badge
                            variant="secondary"
                            className="bg-background border-border text-foreground gap-1.5 py-1 px-2.5 rounded-lg font-medium"
                        >
                            <span>
                                Status:{" "}
                                {selectedStatus === "expiring_soon"
                                    ? "Expiring Soon"
                                    : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedStatus("all");
                                    setTempStatus("all");
                                }}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {selectedBillingCycle !== "all" && (
                        <Badge
                            variant="secondary"
                            className="bg-background border-border text-foreground gap-1.5 py-1 px-2.5 rounded-lg font-medium"
                        >
                            <span>
                                Cycle: {selectedBillingCycle.charAt(0).toUpperCase() + selectedBillingCycle.slice(1)}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedBillingCycle("all");
                                    setTempBillingCycle("all");
                                }}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {(sortBy !== "endDate" || sortOrder !== "asc") && (
                        <Badge
                            variant="secondary"
                            className="bg-background border-border text-foreground gap-1.5 py-1 px-2.5 rounded-lg font-medium"
                        >
                            <span>Sort: {getSortLabel()}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSortBy("endDate");
                                    setSortOrder("asc");
                                    setTempSortBy("endDate");
                                    setTempSortOrder("asc");
                                }}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            handleResetFilters();
                            setSearchQuery("");
                            setSearchInput("");
                        }}
                        className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 px-2 cursor-pointer font-semibold ml-auto"
                    >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Clear All
                    </Button>
                </div>
            )}

            {/* Filter Drawer Sidebar (Using Standard FilterDrawer component) */}
            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                activeFilterCount={activeFilterCount}
                title="Subscription Filters"
                description="Filter and sort subscriptions by scope, status, billing cycle, or renewal dates."
            >
                <div className="space-y-4">
                    {/* 1. Subscription Scope / Type */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Scope / Type</Label>
                        <Select
                            value={tempType}
                            onValueChange={(val: any) => setTempType(typeof val === "string" ? val : "all")}
                        >
                            <SelectTrigger className="bg-background border-border text-foreground h-10! cursor-pointer w-full">
                                <SelectValue placeholder="All Scopes" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160]">
                                <SelectItem value="all" className="h-10">All Types</SelectItem>
                                <SelectItem value="global" className="h-10">1. Global (Company SaaS/Tools)</SelectItem>
                                <SelectItem value="project" className="h-10">2. Project (Client-Dedicated)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 2. Project Filter */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Project</Label>
                        <Select
                            value={tempProject}
                            onValueChange={(val: any) => setTempProject(typeof val === "string" ? val : "all")}
                        >
                            <SelectTrigger className="bg-background border-border text-foreground h-10! cursor-pointer w-full">
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160] max-h-56">
                                <SelectItem value="all" className="h-10">All Projects</SelectItem>
                                {projectList.map((pName) => (
                                    <SelectItem key={pName} value={pName} className="h-10">
                                        {pName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 2. Status */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                        <Select
                            value={tempStatus}
                            onValueChange={(val: any) => setTempStatus(typeof val === "string" ? val : "all")}
                        >
                            <SelectTrigger className="bg-background border-border text-foreground h-10! cursor-pointer w-full">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160]">
                                <SelectItem value="all" className="h-10">All Statuses</SelectItem>
                                <SelectItem value="active" className="h-10">Active</SelectItem>
                                <SelectItem value="expiring_soon" className="h-10">Expiring Soon (&lt; 14 Days)</SelectItem>
                                <SelectItem value="expired" className="h-10">Expired</SelectItem>
                                <SelectItem value="cancelled" className="h-10">Cancelled</SelectItem>
                                <SelectItem value="paused" className="h-10">Paused</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Billing Cycle */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Billing Cycle</Label>
                        <Select
                            value={tempBillingCycle}
                            onValueChange={(val: any) => setTempBillingCycle(typeof val === "string" ? val : "all")}
                        >
                            <SelectTrigger className="bg-background border-border text-foreground h-10! cursor-pointer w-full">
                                <SelectValue placeholder="All Billing Cycles" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160]">
                                <SelectItem value="all" className="h-10">All Billing Cycles</SelectItem>
                                <SelectItem value="monthly" className="h-10">Monthly</SelectItem>
                                <SelectItem value="yearly" className="h-10">Yearly</SelectItem>
                                <SelectItem value="quarterly" className="h-10">Quarterly</SelectItem>
                                <SelectItem value="weekly" className="h-10">Weekly</SelectItem>
                                <SelectItem value="one-time" className="h-10">One-Time</SelectItem>
                                <SelectItem value="custom" className="h-10">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 4. Sort By & Sort Order */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Sort By</Label>
                        <div className="flex gap-2">
                            <Select
                                value={tempSortBy}
                                onValueChange={(val: any) => setTempSortBy(typeof val === "string" ? val : "endDate")}
                            >
                                <SelectTrigger className="bg-background border-border text-foreground h-10! flex-1 cursor-pointer">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground z-[160]">
                                    <SelectItem value="endDate" className="h-10">Renewal / End Date</SelectItem>
                                    <SelectItem value="price" className="h-10">Price</SelectItem>
                                    <SelectItem value="createdAt" className="h-10">Date Created</SelectItem>
                                    <SelectItem value="startDate" className="h-10">Start Date</SelectItem>
                                    <SelectItem value="name" className="h-10">Alphabetical (Name)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                type="button"
                                size="icon"
                                onClick={() => setTempSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                                className="h-10 w-10 border border-border bg-background text-foreground hover:bg-accent cursor-pointer shrink-0"
                                title={`Sort order: ${tempSortOrder.toUpperCase()}`}
                            >
                                <ArrowUpDown className="h-4 w-4 text-indigo-500" />
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground pt-0.5">
                            Direction: <strong className="text-foreground">{tempSortOrder === "asc" ? "Ascending (Soonest / Low to High)" : "Descending (Latest / High to Low)"}</strong>
                        </p>
                    </div>
                </div>
            </FilterDrawer>

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-56 w-full rounded-2xl" />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && subscriptions.length === 0 && (
                <div className="text-center py-16 bg-card/40 rounded-2xl border border-dashed border-border p-8 space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground">No Subscriptions Found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            {searchQuery || selectedType !== "all" || selectedStatus !== "all" || selectedBillingCycle !== "all"
                                ? "No subscriptions match your current filter criteria. Try adjusting or resetting your filters."
                                : "Start tracking your software licenses, hosting, domains, and SaaS subscriptions here."}
                        </p>
                    </div>
                    {activeFilterCount > 0 || searchQuery ? (
                        <Button
                            variant="outline"
                            onClick={handleResetFilters}
                            className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs border-border"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset All Filters
                        </Button>
                    ) : (
                        <Button
                            onClick={handleOpenCreate}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-sm"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add First Subscription
                        </Button>
                    )}
                </div>
            )}

            {/* View Mode: Grid Cards */}
            {!isLoading && subscriptions.length > 0 && viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subscriptions.map((sub: any) => {
                        const remaining = getRemainingDaysInfo(sub.endDate);

                        return (
                            <motion.div
                                key={sub._id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card
                                    onClick={() => handleOpenDetails(sub)}
                                    className="bg-card/70 hover:bg-card/95 border-border/80 hover:border-indigo-500/40 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group rounded-2xl"
                                >
                                    <CardContent className="p-5 space-y-4">
                                        {/* Card Top: Type & Status Badges */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                {sub.type === "global" ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                        <Globe className="h-3 w-3" />
                                                        Global
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                                        <FolderKanban className="h-3 w-3" />
                                                        Project
                                                    </span>
                                                )}

                                                {sub.provider && (
                                                    <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-accent/40 border border-border/60">
                                                        {sub.provider}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            {sub.status === "active" && !remaining?.isExpired && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Active
                                                </span>
                                            )}
                                            {(sub.status === "expiring_soon" || remaining?.isWarning || remaining?.isUrgent) && !remaining?.isExpired && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Expiring
                                                </span>
                                            )}
                                            {(sub.status === "expired" || remaining?.isExpired) && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                    <ShieldAlert className="h-3 w-3" />
                                                    Expired
                                                </span>
                                            )}
                                            {sub.status === "cancelled" && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                                                    Cancelled
                                                </span>
                                            )}
                                        </div>

                                        {/* Card Title & Project Context */}
                                        <div className="space-y-1">
                                            <h3 className="text-base font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                {sub.name}
                                            </h3>

                                            {sub.type === "project" && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                                                    <FolderKanban className="h-3 w-3 text-cyan-500 shrink-0" />
                                                    <span className="truncate">
                                                        {sub.projectName || "Project-Dedicated"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pricing Block */}
                                        <div className="p-3 rounded-xl bg-accent/20 border border-border/70 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider block">
                                                    Amount
                                                </span>
                                                <div className="flex items-baseline gap-1 mt-0.5">
                                                    <span className="text-xl font-extrabold text-foreground">
                                                        ${Number(sub.price).toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-normal">
                                                        / {sub.billingCycle}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider block">
                                                    Auto-Renew
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-xs font-semibold flex items-center justify-end gap-1 mt-0.5",
                                                        sub.autoRenew
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    <Repeat className="h-3 w-3" />
                                                    {sub.autoRenew ? "Yes" : "Manual"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Timeline & Countdown */}
                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                                <span>Starts: {formatDate(sub.startDate)}</span>
                                                <span>Renews: {formatDate(sub.endDate)}</span>
                                            </div>

                                            {remaining && (
                                                <div
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 mt-1",
                                                        remaining.isExpired
                                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                            : remaining.isUrgent
                                                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                                            : "bg-muted/40 text-muted-foreground"
                                                    )}
                                                >
                                                    <Clock className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">
                                                        {remaining.isExpired
                                                            ? `Expired ${Math.abs(remaining.days)} days ago`
                                                            : `Renews in ${remaining.days} ${
                                                                  remaining.days === 1 ? "day" : "days"
                                                              }`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div
                                            className="pt-2 border-t border-border/60 flex items-center justify-between"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDetails(sub)}
                                                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Details
                                            </Button>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(sub)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSubscriptionToDelete(sub)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* View Mode: Enterprise Table */}
            {!isLoading && subscriptions.length > 0 && viewMode === "table" && (
                <div className="rounded-xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-accent/40 text-muted-foreground uppercase tracking-wider text-[11px] border-b border-border font-semibold">
                                <tr>
                                    <th className="py-3 px-4">Subscription</th>
                                    <th className="py-3 px-4">Scope / Type</th>
                                    <th className="py-3 px-4">Price / Cycle</th>
                                    <th className="py-3 px-4">Start Date</th>
                                    <th className="py-3 px-4">End / Renewal</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {subscriptions.map((sub: any) => {
                                    const remaining = getRemainingDaysInfo(sub.endDate);

                                    return (
                                        <tr
                                            key={sub._id}
                                            onClick={() => handleOpenDetails(sub)}
                                            className="hover:bg-accent/30 transition-colors cursor-pointer"
                                        >
                                            <td className="py-3.5 px-4 font-semibold text-foreground">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                                                        <CreditCard className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-foreground block text-sm">
                                                            {sub.name}
                                                        </span>
                                                        {sub.provider && (
                                                            <span className="text-[11px] text-muted-foreground block">
                                                                Vendor: {sub.provider}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {sub.type === "global" ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                        <Globe className="h-3 w-3" />
                                                        Global
                                                    </span>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                                            <FolderKanban className="h-3 w-3" />
                                                            Project
                                                        </span>
                                                        {sub.projectName && (
                                                            <span className="text-[11px] text-muted-foreground block truncate max-w-[150px]">
                                                                {sub.projectName}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-foreground text-sm">
                                                    ${Number(sub.price).toLocaleString()}
                                                </span>
                                                <span className="text-muted-foreground text-[11px] block">
                                                    / {sub.billingCycle} {sub.autoRenew ? "(Auto)" : ""}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-muted-foreground">
                                                {formatDate(sub.startDate)}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="font-medium text-foreground block">
                                                    {formatDate(sub.endDate)}
                                                </span>
                                                {remaining && (
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-semibold block",
                                                            remaining.isExpired
                                                                ? "text-rose-500"
                                                                : remaining.isUrgent
                                                                ? "text-amber-500"
                                                                : "text-muted-foreground"
                                                        )}
                                                    >
                                                        {remaining.isExpired
                                                            ? `Expired ${Math.abs(remaining.days)}d ago`
                                                            : `In ${remaining.days}d`}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {sub.status === "active" && !remaining?.isExpired && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                                        Active
                                                    </Badge>
                                                )}
                                                {(sub.status === "expiring_soon" || remaining?.isWarning || remaining?.isUrgent) && !remaining?.isExpired && (
                                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                                                        Expiring
                                                    </Badge>
                                                )}
                                                {(sub.status === "expired" || remaining?.isExpired) && (
                                                    <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px]">
                                                        Expired
                                                    </Badge>
                                                )}
                                                {sub.status === "cancelled" && (
                                                    <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
                                                        Cancelled
                                                    </Badge>
                                                )}
                                            </td>

                                            <td
                                                className="py-3.5 px-4 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDetails(sub)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(sub)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setSubscriptionToDelete(sub)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Form Modal (Add & Edit) */}
            <SubscriptionFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setEditingSubscription(null);
                }}
                editingSubscription={editingSubscription}
            />

            {/* Details Modal */}
            <SubscriptionDetailsModal
                isOpen={!!viewingSubscription}
                onClose={() => setViewingSubscription(null)}
                subscription={viewingSubscription}
                onEdit={(sub) => handleOpenEdit(sub)}
                onDelete={(sub) => setSubscriptionToDelete(sub)}
            />

            {/* Delete Confirmation Modal */}
            {subscriptionToDelete && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div
                        onClick={() => setSubscriptionToDelete(null)}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl p-6 space-y-4 z-[121]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    Delete Subscription
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-rose-500">
                                &quot;{subscriptionToDelete.name}&quot;
                            </span>
                            ? This subscription record and its cost tracking will be removed from your dashboard.
                        </p>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSubscriptionToDelete(null)}
                                disabled={deleteMutation.isPending}
                                className="cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteMutation.mutate(subscriptionToDelete._id)}
                                disabled={deleteMutation.isPending}
                                className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                            >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
