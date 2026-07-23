"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Plus,
    X,
    Search,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Globe,
    ExternalLink,
    FolderPlus,
    Eye,
    Download,
    FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/Loading";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientInput } from "@/lib/validations";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { COUNTRIES } from "@/lib/countries";
import ClientToProjectModal from "./ClientToProjectModal";
import { ClientInfoModal } from "./modals/ClientInfoModal";
import { ClientFormModal } from "./modals/ClientFormModal";
import QuoteFormModal from "../quotes/QuoteFormModal";
export default function ClientDashboardView() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [convertingClient, setConvertingClient] = useState<any>(null);
    const [convertingQuoteClient, setConvertingQuoteClient] = useState<any>(null);
    const [filterSource, setFilterSource] = useState<string>("All");
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [filterDate, setFilterDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchInput, setSearchInput] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [deleteClientTarget, setDeleteClientTarget] = useState<any | null>(
        null,
    );
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [mounted, setMounted] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [infoClient, setInfoClient] = useState<any>(null);
    const queryClient = useQueryClient();

    useEffect(() => setMounted(true), []);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

    // Reset pagination when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterSource, filterStatus, filterDate, searchQuery]);

    // Fetch clients
    const {
        data: clients = [],
        isLoading: isClientsLoading,
        refetch: refetchClients,
    } = useQuery({
        queryKey: ["clients", filterSource, filterStatus, filterDate, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterSource !== "All") params.append("source", filterSource);
            if (filterStatus !== "All") params.append("status", filterStatus);
            if (filterDate) params.append("followupDate", filterDate);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/clients?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch clients");
            return res.json();
        },
    });

    const openAddModal = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    const openEditModal = (client: any) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete client");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Client deleted successfully");
            setDeleteClientTarget(null);
            setDeleteConfirmText("");
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            client,
            newStatus,
        }: {
            client: any;
            newStatus: string;
        }) => {
            const payload = {
                name: client.name,
                number: client.number || "",
                socialMediaLink: client.socialMediaLink || "",
                country: client.country,
                minAmount: client.minAmount || 0,
                maxAmount: client.maxAmount || 0,
                notes: client.notes || "",
                source: client.source,
                otherSource: client.otherSource || "",
                status: newStatus,
                followupDate: client.followupDate
                    ? new Date(client.followupDate).toISOString().split("T")[0]
                    : undefined,
            };
            const res = await fetch(`/api/clients/${client._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                    errData.error ||
                        errData.details ||
                        "Failed to update status",
                );
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Status updated");
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
        onError: (err: any) => toast.error(err.message),
    });

    const convertQuoteMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/admin/quotes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to create quote");
            }
            return res.json();
        },
        onSuccess: async () => {
            toast.success("Quote created successfully from client!");
            queryClient.invalidateQueries({ queryKey: ["quotes"] });

            // Update the originating client's status to "Follow-up" or "Confirmed"
            if (convertingQuoteClient?._id) {
                try {
                    const res = await fetch(`/api/clients/${convertingQuoteClient._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "Follow-up" }),
                    });
                    if (res.ok) {
                        queryClient.invalidateQueries({ queryKey: ["clients"] });
                    }
                } catch {
                    // Non-blocking
                }
            }
            setConvertingQuoteClient(null);
        },
        onError: (err: any) => toast.error(err.message),
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    if (isClientsLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-border/50 pb-4">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-10 w-[250px]" />
                            <Skeleton className="h-10 w-36" />
                        </div>
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
                        Clients
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and track your client pipeline and details.
                    </p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <Button
                        onClick={() => {
                            import("@/lib/export").then(({ exportToCSV }) => {
                                const data = clients.map((c: any) => ({
                                    Name: c.name,
                                    Company: c.companyName || "",
                                    Status: c.status,
                                    Source: c.source,
                                    Country: c.country,
                                    Phone: c.number || "",
                                    "Min Amount": c.minAmount || 0,
                                    "Max Amount": c.maxAmount || 0,
                                    "Follow-up Date": c.followupDate
                                        ? new Date(
                                              c.followupDate,
                                          ).toLocaleDateString()
                                        : "",
                                    Notes: c.notes || "",
                                }));
                                exportToCSV("clients-export.csv", data);
                            });
                        }}
                        variant="outline"
                        className="bg-card border-border/60 hover:bg-muted text-foreground shadow-sm flex gap-2 items-center transition-all"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                    <Button
                        onClick={openAddModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex gap-2 items-center"
                    >
                        <Plus className="h-4 w-4" />
                        New Client
                    </Button>
                </div>
            </div>

            {/* Redesigned Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border shadow-xs mb-6">
                <div className="relative sm:col-span-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, phone number, company..."
                        className="pl-9 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-foreground h-10 transition-all w-full"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                <div>
                    <Select
                        value={filterStatus}
                        onValueChange={(val) => setFilterStatus(val || "All")}
                    >
                        <SelectTrigger className="bg-background/50 border-border text-foreground h-10! cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="All" className="h-10!">
                                All Statuses
                            </SelectItem>
                            <SelectItem value="Pending" className="h-10!">
                                Pending
                            </SelectItem>
                            <SelectItem value="Confirmed" className="h-10!">
                                Confirmed
                            </SelectItem>
                            <SelectItem value="Follow-up" className="h-10!">
                                Follow-up
                            </SelectItem>
                            <SelectItem value="Blocked" className="h-10!">
                                Blocked
                            </SelectItem>
                            <SelectItem value="Declined" className="h-10!">
                                Declined
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Select
                        value={filterSource}
                        onValueChange={(val) => setFilterSource(val || "All")}
                    >
                        <SelectTrigger className="bg-background/50 border-border text-foreground h-10! cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="All" className="h-10!">
                                All Sources
                            </SelectItem>
                            <SelectItem value="Social Media" className="h-10!">
                                Social Media
                            </SelectItem>
                            <SelectItem value="Ads" className="h-10!">
                                Ads
                            </SelectItem>
                            <SelectItem value="Referral" className="h-10!">
                                Referral
                            </SelectItem>
                            <SelectItem value="Cold Outreach" className="h-10!">
                                Cold Outreach
                            </SelectItem>
                            <SelectItem
                                value="Organic Search"
                                className="h-10!"
                            >
                                Organic Search
                            </SelectItem>
                            <SelectItem value="Other" className="h-10!">
                                Other
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-background/50 border-border text-foreground h-10! focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all w-full"
                    />
                </div>
            </div>

            {/* Clients Table */}
            <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Client
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Location & Contact
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Est. Amount
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 font-semibold">
                                        Source
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-10 text-center text-muted-foreground"
                                        >
                                            No clients found.
                                        </td>
                                    </tr>
                                ) : (
                                    clients
                                        .slice(
                                            (currentPage - 1) * 10,
                                            currentPage * 10,
                                        )
                                        .map((client: any) => (
                                            <tr
                                                key={client._id}
                                                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-foreground text-base">
                                                        {client.name}
                                                    </div>
                                                    {client.companyName && (
                                                        <div className="text-sm font-medium text-pink-600 dark:text-pink-400 mt-0.5 flex items-center gap-1.5">
                                                            <FolderPlus className="h-3.5 w-3.5" />{" "}
                                                            {client.companyName}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground mt-1.5 line-clamp-1 max-w-[200px]">
                                                        {client.notes ||
                                                            "No notes"}
                                                    </div>
                                                    {client.status ===
                                                        "Follow-up" &&
                                                        client.followupDate && (
                                                            <div className="text-[10px] text-muted-foreground mt-1">
                                                                Follow-up:{" "}
                                                                <span className="font-medium text-blue-500">
                                                                    {new Date(
                                                                        client.followupDate,
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                                                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {client.country}
                                                    </div>
                                                    {client.number && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {client.number}
                                                        </div>
                                                    )}
                                                    {client.socialMediaLink && (
                                                        <a
                                                            href={
                                                                client.socialMediaLink
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1"
                                                        >
                                                            Social Link{" "}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                                                    >
                                                        {formatCurrency(
                                                            client.minAmount,
                                                        )}{" "}
                                                        -{" "}
                                                        {formatCurrency(
                                                            client.maxAmount,
                                                        )}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Select
                                                        value={
                                                            client.status ||
                                                            "Pending"
                                                        }
                                                        onValueChange={(val) =>
                                                            updateStatusMutation.mutate(
                                                                {
                                                                    client,
                                                                    newStatus:
                                                                        val,
                                                                },
                                                            )
                                                        }
                                                        disabled={
                                                            updateStatusMutation.isPending
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                "text-[11px] font-semibold px-2 py-1.5 h-8! rounded-md border cursor-pointer outline-none transition-colors w-[110px]",
                                                                client.status ===
                                                                    "Confirmed"
                                                                    ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30"
                                                                    : client.status ===
                                                                        "Follow-up"
                                                                      ? "text-blue-600 bg-blue-500/10 border-blue-500/30"
                                                                      : client.status ===
                                                                          "Blocked"
                                                                        ? "text-orange-600 bg-orange-500/10 border-orange-500/30"
                                                                        : client.status ===
                                                                            "Declined"
                                                                          ? "text-rose-600 bg-rose-500/10 border-rose-500/30"
                                                                          : "text-amber-600 bg-amber-500/10 border-amber-500/30",
                                                            )}
                                                        >
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem
                                                                value="Pending"
                                                                className={`h-8!`}
                                                            >
                                                                Pending
                                                            </SelectItem>
                                                            <SelectItem
                                                                value="Confirmed"
                                                                className={`h-8!`}
                                                            >
                                                                Confirmed
                                                            </SelectItem>
                                                            <SelectItem
                                                                value="Follow-up"
                                                                className={`h-8!`}
                                                            >
                                                                Follow-up
                                                            </SelectItem>
                                                            <SelectItem
                                                                value="Blocked"
                                                                className={`h-8!`}
                                                            >
                                                                Blocked
                                                            </SelectItem>
                                                            <SelectItem
                                                                value="Declined "
                                                                className={`h-8!`}
                                                            >
                                                                Declined
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground">
                                                        {client.source}
                                                    </div>
                                                    {client.source ===
                                                        "Other" &&
                                                        client.otherSource && (
                                                            <div className="text-xs text-muted-foreground">
                                                                (
                                                                {
                                                                    client.otherSource
                                                                }
                                                                )
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Convert to Project"
                                                            className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                                                            onClick={() =>
                                                                setConvertingClient(
                                                                    client,
                                                                )
                                                            }
                                                        >
                                                            <FolderPlus className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Convert to Quote"
                                                            className="h-8 w-8 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10"
                                                            onClick={() =>
                                                                setConvertingQuoteClient(
                                                                    client,
                                                                )
                                                            }
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                                                            onClick={() => {
                                                                setInfoClient(
                                                                    client,
                                                                );
                                                                setIsInfoModalOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    client,
                                                                )
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                            onClick={() =>
                                                                setDeleteClientTarget(
                                                                    client,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {clients.length > 10 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 p-4 bg-muted/10">
                            <p className="text-xs text-muted-foreground text-center sm:text-left">
                                Showing{" "}
                                <span className="font-semibold text-foreground">
                                    {(currentPage - 1) * 10 + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-foreground">
                                    {Math.min(currentPage * 10, clients.length)}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-foreground">
                                    {clients.length}
                                </span>{" "}
                                clients
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.max(currentPage - 1, 1),
                                        )
                                    }
                                    className="h-8 w-8 cursor-pointer disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({
                                        length: Math.ceil(clients.length / 10),
                                    }).map((_, i) => {
                                        const pageNum = i + 1;
                                        const totalPages = Math.ceil(
                                            clients.length / 10,
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
                                            )
                                                return (
                                                    <span
                                                        key="start"
                                                        className="text-xs px-1"
                                                    >
                                                        ...
                                                    </span>
                                                );
                                            if (
                                                pageNum === totalPages - 1 &&
                                                currentPage < totalPages - 2
                                            )
                                                return (
                                                    <span
                                                        key="end"
                                                        className="text-xs px-1"
                                                    >
                                                        ...
                                                    </span>
                                                );
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
                                                    "h-8 w-8 text-xs cursor-pointer p-0 font-semibold",
                                                    currentPage === pageNum
                                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
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
                                        Math.ceil(clients.length / 10)
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.min(
                                                currentPage + 1,
                                                Math.ceil(clients.length / 10),
                                            ),
                                        )
                                    }
                                    className="h-8 w-8 cursor-pointer disabled:opacity-50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Client Modal */}
            <ClientFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingClient={editingClient}
            />

            {/* Delete Client Confirmation Modal */}
            <AnimatePresence>
                {deleteClientTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setDeleteClientTarget(null);
                                setDeleteConfirmText("");
                            }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xs"
                        />
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative z-10 w-full max-w-sm border border-border bg-card p-6 shadow-xl rounded-xl text-card-foreground"
                        >
                            <h3 className="text-lg font-bold text-foreground">
                                Delete Client
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-normal">
                                Are you sure you want to permanently delete the
                                client{" "}
                                <strong className="text-foreground">
                                    "{deleteClientTarget.name}"
                                </strong>
                                ? This action is irreversible.
                            </p>

                            <div className="mt-4 space-y-2">
                                <Label
                                    htmlFor="confirmDeleteInput"
                                    className="text-xs font-semibold text-muted-foreground"
                                >
                                    Type{" "}
                                    <span className="font-bold text-foreground select-all">
                                        DELETE
                                    </span>{" "}
                                    to confirm:
                                </Label>
                                <Input
                                    id="confirmDeleteInput"
                                    value={deleteConfirmText}
                                    onChange={(e) =>
                                        setDeleteConfirmText(e.target.value)
                                    }
                                    placeholder="DELETE"
                                    className="bg-background border-border text-foreground focus-visible:ring-1 focus-visible:ring-red-500 focus-visible:border-red-500 h-9 text-sm"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setDeleteClientTarget(null);
                                        setDeleteConfirmText("");
                                    }}
                                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground h-10 cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() =>
                                        deleteMutation.mutate(
                                            deleteClientTarget._id,
                                        )
                                    }
                                    disabled={
                                        deleteMutation.isPending ||
                                        deleteConfirmText !== "DELETE"
                                    }
                                    className="bg-red-700 hover:bg-red-800 text-white dark:text-destructive-foreground font-medium shadow-md shadow-destructive/10 h-10 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteMutation.isPending ? (
                                        <Loading variant="mini" />
                                    ) : (
                                        "Delete"
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Client Info Modal */}
            <ClientInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
                client={infoClient}
                onEdit={(client) => {
                    openEditModal(client);
                }}
            />

            <ClientToProjectModal
                client={convertingClient}
                isOpen={!!convertingClient}
                onClose={() => setConvertingClient(null)}
            />

            <QuoteFormModal
                isOpen={!!convertingQuoteClient}
                onClose={() => setConvertingQuoteClient(null)}
                mode="convert"
                initialData={convertingQuoteClient ? {
                    projectName: `${convertingQuoteClient.name} - Project`,
                    clientName: convertingQuoteClient.name || "Unknown Client",
                    clientPhone: convertingQuoteClient.number || "",
                    clientSocialLink: convertingQuoteClient.socialMediaLink || "",
                    phases: [
                        {
                            phaseName: "Initial Phase",
                            description: "Initial project phase based on client discussion",
                            minBudget: convertingQuoteClient.minAmount || 0,
                            maxBudget: convertingQuoteClient.maxAmount || 0,
                        }
                    ]
                } : {}}
                onSubmit={(data) => {
                    convertQuoteMutation.mutate(data);
                }}
                isSubmitting={convertQuoteMutation.isPending}
            />
        </motion.div>
    );
}
