"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
    Search,
    Landmark,
    Smartphone,
    User as UserIcon,
    AlertCircle,
    Filter,
    History,
    Wallet,
    ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FilterDrawer } from "@/components/ui/FilterDrawer";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import AccountHistoryModal from "./AccountHistoryModal";

export default function AdminAccountsView() {
    const { data: session } = useSession();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [type, setType] = useState("all");
    const [tempType, setTempType] = useState("all");
    const [userFilter, setUserFilter] = useState("all");
    const [tempUserFilter, setTempUserFilter] = useState("all");
    const [sortBy, setSortBy] = useState("default");
    const [tempSortBy, setTempSortBy] = useState("default");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedAccountForHistory, setSelectedAccountForHistory] = useState<any | null>(null);

    // Fetch users for the user filter dropdown
    const { data: usersData } = useQuery({
        queryKey: ["users-list-for-accounts"],
        queryFn: async () => {
            const res = await fetch("/api/users");
            if (!res.ok) return [];
            const json = await res.json();
            return Array.isArray(json) ? json : json.users || [];
        },
        enabled: !!session,
    });
    const users: any[] = usersData || [];

    const openFilterDrawer = () => {
        setTempType(type);
        setTempUserFilter(userFilter);
        setTempSortBy(sortBy);
        setIsFilterOpen(true);
    };

    const handleApplyFilters = () => {
        setType(tempType);
        setUserFilter(tempUserFilter);
        setSortBy(tempSortBy);
        setPage(1);
    };

    const handleResetFilters = () => {
        setTempType("all");
        setTempUserFilter("all");
        setTempSortBy("default");
        setType("all");
        setUserFilter("all");
        setSortBy("default");
        setPage(1);
    };

    const activeFilterCount =
        (type !== "all" ? 1 : 0) +
        (userFilter !== "all" ? 1 : 0) +
        (sortBy !== "default" ? 1 : 0);

    // Controlled search trigger handler
    const handleSearchSubmit = () => {
        setDebouncedSearch(search);
        setPage(1);
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ["adminAccounts", page, limit, debouncedSearch, type, userFilter, sortBy],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: debouncedSearch,
                type: type,
                userId: userFilter,
                sortBy: sortBy,
            });
            const res = await fetch(`/api/admin/accounts?${params}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to fetch accounts");
            }
            return res.json();
        },
        enabled: !!session && session.user?.role === "admin",
    });

    const accounts = data?.accounts || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Accounts Overview
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        View and search all linked bank and mobile accounts
                        across users.
                    </p>
                </div>
            </div>

            {/* Controls Bar: Search Left, Filter Button Right */}
            <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl shadow-sm border border-border">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSearchSubmit();
                    }}
                    className="relative w-full sm:max-w-md flex items-center flex-1"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by User Name, Email, or Provider... (Press Enter)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSearchSubmit();
                            }
                        }}
                        className="pl-9 pr-20 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-foreground h-10 transition-all w-full"
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Search"
                    >
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-2 sm:w-auto justify-end">
                    <Button
                        onClick={openFilterDrawer}
                        variant="outline"
                        className="bg-background/50 border-border hover:bg-accent text-foreground h-10! gap-2 cursor-pointer relative font-semibold text-xs shrink-0"
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

            {/* Filter Drawer Sidebar */}
            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                activeFilterCount={activeFilterCount}
                title="Account Filters"
                description="Filter linked payment accounts by user, account type, or sort by balance price."
            >
                <div className="space-y-4">
                    {/* User Filter */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-indigo-500" />
                            Filter by User
                        </Label>
                        <Select
                            value={tempUserFilter}
                            onValueChange={(val: any) => setTempUserFilter(typeof val === "string" ? val : "all")}
                        >
                            <SelectTrigger className="w-full bg-background border-border text-foreground h-10! cursor-pointer">
                                <SelectValue placeholder="Select User" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160] max-h-64">
                                <SelectItem value="all" className="h-10">All Users</SelectItem>
                                {users.map((u: any) => (
                                    <SelectItem key={u._id} value={u._id} className="h-10">
                                        <div className="flex flex-col text-left">
                                            <span className="font-semibold text-xs">{u.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Account Type Filter */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5 text-indigo-500" />
                            Account Type
                        </Label>
                        <Select
                            value={tempType}
                            onValueChange={(val: any) => setTempType(typeof val === "string" ? val : "all")}
                        >
                            <SelectTrigger className="w-full bg-background border-border text-foreground h-10! cursor-pointer">
                                <SelectValue placeholder="Account Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160]">
                                <SelectItem value="all" className="h-10">All Accounts</SelectItem>
                                <SelectItem value="bank" className="h-10">Bank Accounts</SelectItem>
                                <SelectItem value="mobile_banking" className="h-10">Mobile Banking</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort by Price / Balance */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
                            Sort by Price (Balance)
                        </Label>
                        <Select
                            value={tempSortBy}
                            onValueChange={(val: any) => setTempSortBy(typeof val === "string" ? val : "default")}
                        >
                            <SelectTrigger className="w-full bg-background border-border text-foreground h-10! cursor-pointer">
                                <SelectValue placeholder="Sort Order" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160]">
                                <SelectItem value="default" className="h-10">Default (Provider Name)</SelectItem>
                                <SelectItem value="price_bdt_desc" className="h-10 font-semibold text-emerald-600 dark:text-emerald-400">
                                    Balance: High to Low (৳)
                                </SelectItem>
                                <SelectItem value="price_bdt_asc" className="h-10">
                                    Balance: Low to High (৳)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FilterDrawer>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-foreground/80">
                                    User
                                </TableHead>
                                <TableHead className="font-semibold text-foreground/80">
                                    Provider
                                </TableHead>
                                <TableHead className="font-semibold text-foreground/80">
                                    Account Details
                                </TableHead>
                                <TableHead className="font-semibold text-foreground/80">
                                    Routing/Branch
                                </TableHead>
                                <TableHead className="font-semibold text-foreground/80">
                                    Balance (৳)
                                </TableHead>
                                <TableHead className="font-semibold text-foreground/80 text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-6 w-40 bg-muted animate-pulse rounded"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-6 w-28 bg-muted animate-pulse rounded"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto"></div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : error ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-rose-500"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <AlertCircle className="h-6 w-6" />
                                            <span>
                                                Failed to load accounts.
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No accounts found matching your
                                        criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((item: any, idx: number) => {
                                    const {
                                        userAvatar,
                                        userName,
                                        userEmail,
                                        account,
                                    } = item;
                                    return (
                                        <TableRow
                                            key={`${account._id || idx}`}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-border">
                                                        <AvatarImage
                                                            src={
                                                                userAvatar ||
                                                                undefined
                                                            }
                                                            alt={userName}
                                                        />
                                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                                                            {userName?.charAt(
                                                                0,
                                                            ) || (
                                                                <UserIcon className="h-4 w-4" />
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-sm text-foreground">
                                                            {userName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {userEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-md text-indigo-600 dark:text-indigo-400">
                                                        {account.type ===
                                                        "bank" ? (
                                                            <Landmark className="h-4 w-4" />
                                                        ) : (
                                                            <Smartphone className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">
                                                            {
                                                                account.providerName
                                                            }
                                                        </p>
                                                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                                                            {account.type ===
                                                            "bank"
                                                                ? "Bank"
                                                                : "Mobile"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-sm text-foreground">
                                                        {account.accountName}
                                                    </span>
                                                    <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded text-foreground w-fit">
                                                        {account.accountNumber}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {account.type === "bank" ? (
                                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                        {account.branch ? (
                                                            <span>
                                                                <span className="font-medium">
                                                                    Br:
                                                                </span>{" "}
                                                                {account.branch}
                                                            </span>
                                                        ) : (
                                                            <span>-</span>
                                                        )}
                                                        {account.routingNumber && (
                                                            <span>
                                                                <span className="font-medium">
                                                                    Rt:
                                                                </span>{" "}
                                                                <span className="font-mono">
                                                                    {
                                                                        account.routingNumber
                                                                    }
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/50">
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-bold text-sm text-foreground">
                                                    ৳{Number(account.balanceInBdt || account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedAccountForHistory({ ...account, userName })}
                                                    className="h-8 gap-1.5 text-xs font-medium hover:border-indigo-500 hover:text-indigo-600 cursor-pointer"
                                                >
                                                    <History className="h-3.5 w-3.5 text-indigo-500" />
                                                    <span>History</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
                    <div className="flex flex-col">
                        <p className="text-xs text-muted-foreground">
                            Showing{" "}
                            <span className="font-semibold text-foreground">
                                {accounts.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-foreground">
                                {total}
                            </span>{" "}
                            accounts
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            Page{" "}
                            <span className="font-semibold text-foreground">
                                {page}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-foreground">
                                {totalPages}
                            </span>
                        </p>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                className="h-8"
                            >
                                Previous
                            </Button>

                            <div className="hidden sm:flex items-center gap-1 mx-2">
                                {Array.from({ length: totalPages }).map(
                                    (_, i) => {
                                        if (
                                            i === 0 ||
                                            i === totalPages - 1 ||
                                            Math.abs(page - (i + 1)) <= 1
                                        ) {
                                            return (
                                                <Button
                                                    key={i}
                                                    variant={
                                                        page === i + 1
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setPage(i + 1)
                                                    }
                                                    className={cn(
                                                        "h-8 w-8 p-0 text-xs",
                                                        page === i + 1
                                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                            : "",
                                                    )}
                                                >
                                                    {i + 1}
                                                </Button>
                                            );
                                        }

                                        if (Math.abs(page - (i + 1)) === 2) {
                                            return (
                                                <span
                                                    key={i}
                                                    className="text-muted-foreground text-xs px-1"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }

                                        return null;
                                    },
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() =>
                                    setPage((p) => Math.min(totalPages, p + 1))
                                }
                                className="h-8"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <AccountHistoryModal
                isOpen={!!selectedAccountForHistory}
                onClose={() => setSelectedAccountForHistory(null)}
                account={selectedAccountForHistory}
            />
        </motion.div>
    );
}
