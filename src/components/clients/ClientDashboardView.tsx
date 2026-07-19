"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Briefcase,
    Plus,
    X,
    Search,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Globe,
    ExternalLink
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
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, ClientInput } from "@/lib/validations";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { COUNTRIES } from "@/lib/countries";

export default function ClientDashboardView() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [filterSource, setFilterSource] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [deleteClientTarget, setDeleteClientTarget] = useState<any | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Reset pagination when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterSource, searchQuery]);

    // Fetch clients
    const {
        data: clients = [],
        isLoading: isClientsLoading,
        refetch: refetchClients,
    } = useQuery({
        queryKey: ["clients", filterSource, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterSource !== "All") params.append("source", filterSource);
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
    } = useForm<ClientInput>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            number: "",
            socialMediaLink: "",
            country: "",
            minAmount: 0,
            maxAmount: 0,
            notes: "",
            source: "",
            otherSource: "",
        },
    });

    const sourceWatch = watch("source");

    const openAddModal = () => {
        setEditingClient(null);
        reset({
            name: "",
            number: "",
            socialMediaLink: "",
            country: "",
            minAmount: 0,
            maxAmount: 0,
            notes: "",
            source: "",
            otherSource: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (client: any) => {
        setEditingClient(client);
        reset({
            name: client.name,
            number: client.number || "",
            socialMediaLink: client.socialMediaLink || "",
            country: client.country,
            minAmount: client.minAmount,
            maxAmount: client.maxAmount,
            notes: client.notes || "",
            source: client.source,
            otherSource: client.otherSource || "",
        });
        setIsModalOpen(true);
    };

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (data: ClientInput) => {
            const url = editingClient ? `/api/clients/${editingClient._id}` : "/api/clients";
            const method = editingClient ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.details || "Failed to save client");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success(`Client ${editingClient ? "updated" : "added"} successfully`);
            setIsModalOpen(false);
            reset();
            refetchClients();
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
            refetchClients();
        },
        onError: (err: any) => toast.error(err.message),
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
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
                <CardHeader className="border-b border-border/50 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Client Directory</CardTitle>
                        <CardDescription>
                            All registered clients in the system.
                        </CardDescription>
                    </div>
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
                        <select
                            className="bg-background border border-input rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                        >
                            <option value="All">All Sources</option>
                            <option value="Social Media">Social Media</option>
                            <option value="Ads">Ads</option>
                            <option value="Referral">Referral</option>
                            <option value="Cold Outreach">Cold Outreach</option>
                            <option value="Organic Search">Organic Search</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Client</th>
                                    <th className="px-6 py-4 font-semibold">Location & Contact</th>
                                    <th className="px-6 py-4 font-semibold">Est. Amount</th>
                                    <th className="px-6 py-4 font-semibold">Source</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                            No clients found.
                                        </td>
                                    </tr>
                                ) : (
                                    clients
                                        .slice((currentPage - 1) * 10, currentPage * 10)
                                        .map((client: any) => (
                                        <tr
                                            key={client._id}
                                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-foreground text-base">
                                                    {client.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[200px]">
                                                    {client.notes || "No notes"}
                                                </div>
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
                                                        href={client.socialMediaLink} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1"
                                                    >
                                                        Social Link <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                                                    {formatCurrency(client.minAmount)} - {formatCurrency(client.maxAmount)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">
                                                    {client.source}
                                                </div>
                                                {client.source === "Other" && client.otherSource && (
                                                    <div className="text-xs text-muted-foreground">
                                                        ({client.otherSource})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10"
                                                        onClick={() => openEditModal(client)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                        onClick={() => setDeleteClientTarget(client)}
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
                                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                    className="h-8 w-8 cursor-pointer disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.ceil(clients.length / 10) }).map((_, i) => {
                                        const pageNum = i + 1;
                                        const totalPages = Math.ceil(clients.length / 10);
                                        if (pageNum !== 1 && pageNum !== totalPages && (pageNum < currentPage - 1 || pageNum > currentPage + 1)) {
                                            if (pageNum === 2 && currentPage > 3) return <span key="start" className="text-xs px-1">...</span>;
                                            if (pageNum === totalPages - 1 && currentPage < totalPages - 2) return <span key="end" className="text-xs px-1">...</span>;
                                            return null;
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={cn(
                                                    "h-8 w-8 text-xs cursor-pointer p-0 font-semibold",
                                                    currentPage === pageNum ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "hover:bg-accent"
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
                                    disabled={currentPage === Math.ceil(clients.length / 10)}
                                    onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(clients.length / 10)))}
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
            {mounted && createPortal(
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
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="relative w-full max-w-2xl border border-border bg-card shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
                            >
                                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-accent/5 shrink-0">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        {editingClient ? <Edit className="h-5 w-5 text-indigo-500" /> : <Plus className="h-5 w-5 text-indigo-500" />}
                                        {editingClient ? "Edit Client" : "Add New Client"}
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full hover:bg-muted"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="overflow-y-auto flex-1 p-6">
                                    <form id="client-form" onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Name */}
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Full Name <span className="text-rose-500">*</span>
                                                </label>
                                                <Input 
                                                    {...register("name")} 
                                                    placeholder="e.g. John Doe" 
                                                    className={errors.name ? "border-rose-500" : ""}
                                                />
                                                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
                                            </div>

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
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                        />
                                                    )}
                                                />
                                                {errors.number && <p className="text-xs text-rose-500">{errors.number.message}</p>}
                                            </div>

                                            {/* Country Dropdown */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Country <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    {...register("country")}
                                                    className={cn(
                                                        "w-full bg-background border rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                                                        errors.country ? "border-rose-500" : "border-input"
                                                    )}
                                                >
                                                    <option value="">Select a country</option>
                                                    {COUNTRIES.map(country => (
                                                        <option key={country} value={country}>{country}</option>
                                                    ))}
                                                </select>
                                                {errors.country && <p className="text-xs text-rose-500">{errors.country.message}</p>}
                                            </div>

                                            {/* Social Media Link */}
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Social Media Link
                                                </label>
                                                <Input 
                                                    {...register("socialMediaLink")} 
                                                    placeholder="https://linkedin.com/in/..." 
                                                    className={errors.socialMediaLink ? "border-rose-500" : ""}
                                                />
                                                {errors.socialMediaLink && <p className="text-xs text-rose-500">{errors.socialMediaLink.message}</p>}
                                            </div>

                                            {/* Estimated Amount Ranges */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Min Amount ($) <span className="text-rose-500">*</span>
                                                </label>
                                                <Input 
                                                    type="number"
                                                    {...register("minAmount", { valueAsNumber: true })} 
                                                    placeholder="0"
                                                    className={errors.minAmount ? "border-rose-500" : ""}
                                                />
                                                {errors.minAmount && <p className="text-xs text-rose-500">{errors.minAmount.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Max Amount ($) <span className="text-rose-500">*</span>
                                                </label>
                                                <Input 
                                                    type="number"
                                                    {...register("maxAmount", { valueAsNumber: true })} 
                                                    placeholder="1000"
                                                    className={errors.maxAmount ? "border-rose-500" : ""}
                                                />
                                                {errors.maxAmount && <p className="text-xs text-rose-500">{errors.maxAmount.message}</p>}
                                            </div>

                                            {/* Source Dropdown */}
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                    Source <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    {...register("source")}
                                                    className={cn(
                                                        "w-full bg-background border rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                                                        errors.source ? "border-rose-500" : "border-input"
                                                    )}
                                                >
                                                    <option value="">Select source</option>
                                                    <option value="Social Media">Social Media</option>
                                                    <option value="Ads">Ads</option>
                                                    <option value="Referral">Referral</option>
                                                    <option value="Cold Outreach">Cold Outreach</option>
                                                    <option value="Organic Search">Organic Search</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                {errors.source && <p className="text-xs text-rose-500">{errors.source.message}</p>}
                                            </div>

                                            {/* Other Source Input */}
                                            {sourceWatch === "Other" && (
                                                <div className="space-y-2 md:col-span-2 animate-in fade-in">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                        Please specify the source <span className="text-rose-500">*</span>
                                                    </label>
                                                    <Input 
                                                        {...register("otherSource")} 
                                                        placeholder="Enter source details" 
                                                        className={errors.otherSource ? "border-rose-500" : ""}
                                                    />
                                                    {errors.otherSource && <p className="text-xs text-rose-500">{errors.otherSource.message}</p>}
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
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="client-form"
                                        disabled={isSubmitting || saveMutation.isPending}
                                        className="min-w-[120px] bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {isSubmitting || saveMutation.isPending ? "Saving..." : "Save Client"}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
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
                                Are you sure you want to permanently delete the client{" "}
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
        </motion.div>
    );
}
