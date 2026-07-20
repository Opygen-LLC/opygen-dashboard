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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientInput } from "@/lib/validations";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { COUNTRIES } from "@/lib/countries";
import ClientToProjectModal from "./ClientToProjectModal";

export default function ClientDashboardView() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [convertingClient, setConvertingClient] = useState<any>(null);
    const [filterSource, setFilterSource] = useState<string>("All");
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");
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

    // Reset pagination when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterSource, filterStatus, searchQuery]);

    // Fetch clients
    const {
        data: clients = [],
        isLoading: isClientsLoading,
        refetch: refetchClients,
    } = useQuery({
        queryKey: ["clients", filterSource, filterStatus, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterSource !== "All") params.append("source", filterSource);
            if (filterStatus !== "All") params.append("status", filterStatus);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/clients?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch clients");
            return res.json();
        },
    });

    // Form
    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<any>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            companyName: "",
            number: "",
            socialMediaLink: "",
            country: "",
            minAmount: 0,
            maxAmount: 0,
            notes: "",
            source: "",
            otherSource: "",
            status: "Pending",
        },
    });

    const sourceWatch = watch("source");
    const statusWatch = watch("status");

    const openAddModal = () => {
        setEditingClient(null);
        reset({
            name: "",
            companyName: "",
            number: "",
            socialMediaLink: "",
            country: "",
            minAmount: 0,
            maxAmount: 0,
            notes: "",
            source: "",
            otherSource: "",
            status: "Pending",
            followupDate: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (client: any) => {
        setEditingClient(client);
        reset({
            name: client.name,
            companyName: client.companyName || "",
            number: client.number || "",
            socialMediaLink: client.socialMediaLink || "",
            country: client.country,
            minAmount: client.minAmount || 0,
            maxAmount: client.maxAmount || 0,
            notes: client.notes || "",
            source: client.source,
            otherSource: client.otherSource || "",
            status: client.status || "Pending",
            followupDate: client.followupDate
                ? new Date(client.followupDate).toISOString().split("T")[0]
                : "",
        });
        setIsModalOpen(true);
    };

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (data: ClientInput) => {
            const url = editingClient
                ? `/api/clients/${editingClient._id}`
                : "/api/clients";
            const method = editingClient ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                    errData.error || errData.details || "Failed to save client",
                );
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success(
                `Client ${editingClient ? "updated" : "added"} successfully`,
            );
            setIsModalOpen(false);
            reset();
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
        onError: (err: any) => toast.error(err.message),
    });

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
                <Button
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex gap-2 items-center"
                >
                    <Plus className="h-4 w-4" />
                    New Client
                </Button>
            </div>

            {/* Clients Table */}
            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="border-b border-border/50 p-4 flex flex-col md:flex-row items-start md:items-center justify-start gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search clients..."
                                className="pl-9 w-full sm:w-[250px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <select
                                className="flex-1 bg-background border border-input rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={filterStatus}
                                onChange={(e) =>
                                    setFilterStatus(e.target.value)
                                }
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Blocked">Blocked</option>
                                <option value="Declined">Declined</option>
                            </select>
                            <select
                                className="flex-1 bg-background border border-input rounded-md text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={filterSource}
                                onChange={(e) =>
                                    setFilterSource(e.target.value)
                                }
                            >
                                <option value="All">All Sources</option>
                                <option value="Social Media">
                                    Social Media
                                </option>
                                <option value="Ads">Ads</option>
                                <option value="Referral">Referral</option>
                                <option value="Cold Outreach">
                                    Cold Outreach
                                </option>
                                <option value="Organic Search">
                                    Organic Search
                                </option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
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
                                                            <FolderPlus className="h-3.5 w-3.5" /> {client.companyName}
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
                                                    <select
                                                        value={
                                                            client.status ||
                                                            "Pending"
                                                        }
                                                        onChange={(e) =>
                                                            updateStatusMutation.mutate(
                                                                {
                                                                    client,
                                                                    newStatus:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        className={cn(
                                                            "text-[11px] font-semibold px-2 py-1.5 rounded-md border cursor-pointer outline-none transition-colors",
                                                            client.status ===
                                                                "Confirmed"
                                                                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400"
                                                                : client.status ===
                                                                    "Follow-up"
                                                                  ? "text-blue-600 bg-blue-500/10 border-blue-500/30 dark:text-blue-400"
                                                                  : client.status ===
                                                                      "Blocked"
                                                                    ? "text-orange-600 bg-orange-500/10 border-orange-500/30 dark:text-orange-400"
                                                                    : client.status ===
                                                                        "Declined"
                                                                      ? "text-rose-600 bg-rose-500/10 border-rose-500/30 dark:text-rose-400"
                                                                      : "text-amber-600 bg-amber-500/10 border-amber-500/30 dark:text-amber-400",
                                                        )}
                                                        disabled={
                                                            updateStatusMutation.isPending
                                                        }
                                                    >
                                                        <option
                                                            value="Pending"
                                                            className="text-foreground bg-background"
                                                        >
                                                            Pending
                                                        </option>
                                                        <option
                                                            value="Confirmed"
                                                            className="text-foreground bg-background"
                                                        >
                                                            Confirmed
                                                        </option>
                                                        <option
                                                            value="Follow-up"
                                                            className="text-foreground bg-background"
                                                        >
                                                            Follow-up
                                                        </option>
                                                        <option
                                                            value="Blocked"
                                                            className="text-foreground bg-background"
                                                        >
                                                            Blocked
                                                        </option>
                                                        <option
                                                            value="Declined"
                                                            className="text-foreground bg-background"
                                                        >
                                                            Declined
                                                        </option>
                                                    </select>
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
                                                            className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                                                            onClick={() => {
                                                                setInfoClient(client);
                                                                setIsInfoModalOpen(true);
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
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsModalOpen(false)}
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
                                    className="relative w-full max-w-2xl border border-border bg-card shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
                                >
                                    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-accent/5 shrink-0">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            {editingClient ? (
                                                <Edit className="h-5 w-5 text-indigo-500" />
                                            ) : (
                                                <Plus className="h-5 w-5 text-indigo-500" />
                                            )}
                                            {editingClient
                                                ? "Edit Client"
                                                : "Add New Client"}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full hover:bg-muted"
                                            onClick={() =>
                                                setIsModalOpen(false)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-6">
                                        <form
                                            id="client-form"
                                            onSubmit={handleSubmit((d) =>
                                                saveMutation.mutate(d),
                                            )}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2 md:col-span-1">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Full Name{" "}
                                                        <span className="text-rose-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <Input
                                                        {...register("name")}
                                                        placeholder="e.g. John Doe"
                                                        className={
                                                            errors.name
                                                                ? "border-rose-500"
                                                                : ""
                                                        }
                                                    />
                                                    {errors.name && (
                                                        <p className="text-xs text-rose-500">
                                                            {
                                                                errors?.name
                                                                    ?.message as string
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2 md:col-span-1">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Company Name
                                                    </label>
                                                    <Input
                                                        {...register("companyName")}
                                                        placeholder="e.g. Acme Corp"
                                                        className={
                                                            errors.companyName
                                                                ? "border-rose-500"
                                                                : ""
                                                        }
                                                    />
                                                    {errors.companyName && (
                                                        <p className="text-xs text-rose-500">
                                                            {
                                                                errors.companyName
                                                                    .message as string
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-2 md:col-span-1">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Status{" "}
                                                        <span className="text-rose-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <select
                                                        {...register("status")}
                                                        className={cn(
                                                            "w-full bg-background border rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                                                            errors.status
                                                                ? "border-rose-500"
                                                                : "border-input",
                                                        )}
                                                    >
                                                        <option value="Pending">
                                                            Pending
                                                        </option>
                                                        <option value="Confirmed">
                                                            Confirmed
                                                        </option>
                                                        <option value="Follow-up">
                                                            Follow-up
                                                        </option>
                                                        <option value="Blocked">
                                                            Blocked
                                                        </option>
                                                        <option value="Declined">
                                                            Declined
                                                        </option>
                                                    </select>
                                                    {errors.status && (
                                                        <p className="text-xs text-rose-500">
                                                            {
                                                                errors.status
                                                                    ?.message
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Follow-up Date */}
                                                {statusWatch ===
                                                    "Follow-up" && (
                                                    <div className="space-y-2 md:col-span-1 animate-in fade-in">
                                                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                            Follow-up Date{" "}
                                                            <span className="text-rose-500">
                                                                *
                                                            </span>
                                                        </label>
                                                        <Input
                                                            type="date"
                                                            {...register(
                                                                "followupDate",
                                                            )}
                                                            className={
                                                                errors.followupDate
                                                                    ? "border-rose-500"
                                                                    : ""
                                                            }
                                                        />
                                                        {errors.followupDate && (
                                                            <p className="text-xs text-rose-500">
                                                                {
                                                                    errors
                                                                        .followupDate
                                                                        ?.message
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Phone Number */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Phone Number
                                                    </label>
                                                    <Controller
                                                        name="number"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <PhoneInput
                                                                id="number"
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        )}
                                                    />
                                                    {errors.number && (
                                                        <p className="text-xs text-rose-500">
                                                            {
                                                                errors.number
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Country Dropdown */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Country{" "}
                                                        <span className="text-rose-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <select
                                                        {...register("country")}
                                                        className={cn(
                                                            "w-full bg-background border rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                                                            errors.country
                                                                ? "border-rose-500"
                                                                : "border-input",
                                                        )}
                                                    >
                                                        <option value="">
                                                            Select a country
                                                        </option>
                                                        {COUNTRIES.map(
                                                            (country) => (
                                                                <option
                                                                    key={
                                                                        country
                                                                    }
                                                                    value={
                                                                        country
                                                                    }
                                                                >
                                                                    {country}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    {errors.country && (
                                                        <p className="text-xs text-rose-500">
                                                            {
                                                                errors.country
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Social Media Link */}
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Social Media Link
                                                    </label>
                                                    <Input
                                                        {...register(
                                                            "socialMediaLink",
                                                        )}
                                                        placeholder="https://linkedin.com/in/..."
                                                        className={
                                                            errors.socialMediaLink
                                                                ? "border-rose-500"
                                                                : ""
                                                        }
                                                    />
                                                    {errors.socialMediaLink && (
                                                        <p className="text-xs text-rose-500">
                                                            {
                                                                errors
                                                                    .socialMediaLink
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Estimated Amount Ranges */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Min Amount ($)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        {...register(
                                                            "minAmount",
                                                        )}
                                                        placeholder="0"
                                                        className={
                                                            errors.minAmount
                                                                ? "border-rose-500"
                                                                : ""
                                                        }
                                                    />
                                                    {errors.minAmount && (
                                                        <p className="text-xs text-rose-500">
                                                            {errors.minAmount.message?.toString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Max Amount ($)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        {...register(
                                                            "maxAmount",
                                                        )}
                                                        placeholder="1000"
                                                        className={
                                                            errors.maxAmount
                                                                ? "border-rose-500"
                                                                : ""
                                                        }
                                                    />
                                                    {errors.maxAmount && (
                                                        <p className="text-xs text-rose-500">
                                                            {errors.maxAmount.message?.toString()}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Source Dropdown */}
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Source{" "}
                                                        <span className="text-rose-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <select
                                                        {...register("source")}
                                                        className={cn(
                                                            "w-full bg-background border rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                                                            errors.source
                                                                ? "border-rose-500"
                                                                : "border-input",
                                                        )}
                                                    >
                                                        <option value="">
                                                            Select source
                                                        </option>
                                                        <option value="Social Media">
                                                            Social Media
                                                        </option>
                                                        <option value="Ads">
                                                            Ads
                                                        </option>
                                                        <option value="Referral">
                                                            Referral
                                                        </option>
                                                        <option value="Cold Outreach">
                                                            Cold Outreach
                                                        </option>
                                                        <option value="Organic Search">
                                                            Organic Search
                                                        </option>
                                                        <option value="Other">
                                                            Other
                                                        </option>
                                                    </select>
                                                    {errors.source && (
                                                        <p className="text-xs text-rose-500">
                                                            {
                                                                errors.source
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Other Source Input */}
                                                {sourceWatch === "Other" && (
                                                    <div className="space-y-2 md:col-span-2 animate-in fade-in">
                                                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                            Please specify the
                                                            source{" "}
                                                            <span className="text-rose-500">
                                                                *
                                                            </span>
                                                        </label>
                                                        <Input
                                                            {...register(
                                                                "otherSource",
                                                            )}
                                                            placeholder="Enter source details"
                                                            className={
                                                                errors.otherSource
                                                                    ? "border-rose-500"
                                                                    : ""
                                                            }
                                                        />
                                                        {errors.otherSource && (
                                                            <p className="text-xs text-rose-500">
                                                                {
                                                                    errors
                                                                        .otherSource
                                                                        .message
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Notes
                                                    </label>
                                                    <Textarea
                                                        {...register("notes")}
                                                        placeholder="Additional information about this client..."
                                                        className="min-h-[100px] resize-y"
                                                    />
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end gap-3 shrink-0">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setIsModalOpen(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            form="client-form"
                                            disabled={
                                                isSubmitting ||
                                                saveMutation.isPending
                                            }
                                            className="min-w-[120px] bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {isSubmitting ||
                                            saveMutation.isPending
                                                ? "Saving..."
                                                : "Save Client"}
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}

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
            <AnimatePresence>
                {isInfoModalOpen && infoClient && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            onClick={() => setIsInfoModalOpen(false)}
                            className="absolute inset-0 bg-background/60"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl overflow-hidden flex flex-col ring-1 ring-white/10 dark:ring-white/5"
                        >
                            {/* Decorative Top Gradient */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            
                            {/* Header */}
                            <div className="relative flex items-center justify-between p-6 pb-4">
                                <div>
                                    <h3 className="font-extrabold text-2xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Client Profile
                                    </h3>
                                    <p className="text-sm font-medium text-muted-foreground mt-1">
                                        Detailed view of client information and status
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted hover:text-foreground transition-colors"
                                    onClick={() => setIsInfoModalOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Content Grid */}
                            <div className="p-6 pt-2 space-y-6 max-h-[75vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
                                {/* Top Section: Identity */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/10">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                                                {infoClient.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-0.5">Primary Contact</h4>
                                                <p className="text-lg font-bold text-foreground">{infoClient.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {infoClient.companyName && (
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
                                                    <FolderPlus className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-pink-600/70 dark:text-pink-400/70 uppercase tracking-wider mb-0.5">Company</h4>
                                                    <p className="text-lg font-bold text-foreground">{infoClient.companyName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Middle Section: Contact & Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-4 p-4 rounded-2xl border border-border/50 bg-muted/20">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <Globe className="h-3.5 w-3.5" /> Contact Details
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Location</p>
                                                <p className="text-sm font-medium text-foreground">{infoClient.country}</p>
                                            </div>
                                            {infoClient.number && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Phone</p>
                                                    <p className="text-sm font-medium text-foreground">{infoClient.number}</p>
                                                </div>
                                            )}
                                            {infoClient.socialMediaLink && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Social Link</p>
                                                    <a
                                                        href={infoClient.socialMediaLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 w-fit"
                                                    >
                                                        View Profile <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 p-4 rounded-2xl border border-border/50 bg-muted/20">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                            <Edit className="h-3.5 w-3.5" /> Pipeline Status
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                                                <Badge variant="secondary" className="font-semibold">{infoClient.status}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Acquisition Source</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-sm font-medium text-foreground">{infoClient.source}</span>
                                                    {infoClient.source === "Other" && infoClient.otherSource && (
                                                        <span className="text-xs text-muted-foreground">({infoClient.otherSource})</span>
                                                    )}
                                                </div>
                                            </div>
                                            {infoClient.status === "Follow-up" && infoClient.followupDate && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Scheduled Follow-up</p>
                                                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 w-fit px-2 py-0.5 rounded-md">
                                                        {new Date(infoClient.followupDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Section: Financials & Notes */}
                                <div className="space-y-4 p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Estimated Deal Value
                                    </h4>
                                    <p className="text-2xl font-black text-foreground tracking-tight">
                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(infoClient.minAmount || 0)} 
                                        <span className="text-muted-foreground font-medium text-xl mx-2">to</span> 
                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(infoClient.maxAmount || 0)}
                                    </p>
                                </div>

                                {infoClient.notes && (
                                    <div className="space-y-2 p-4 rounded-2xl border border-border/50 bg-muted/10">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            Additional Notes
                                        </h4>
                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                            {infoClient.notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 px-6 border-t border-border/40 bg-accent/5 flex items-center justify-end gap-3">
                                <Button
                                    variant="outline"
                                    className="border-border/50 hover:bg-muted font-semibold"
                                    onClick={() => setIsInfoModalOpen(false)}
                                >
                                    Dismiss
                                </Button>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20"
                                    onClick={() => {
                                        setIsInfoModalOpen(false);
                                        openEditModal(infoClient);
                                    }}
                                >
                                    Edit Client
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ClientToProjectModal
                client={convertingClient}
                isOpen={!!convertingClient}
                onClose={() => setConvertingClient(null)}
            />
        </motion.div>
    );
}
