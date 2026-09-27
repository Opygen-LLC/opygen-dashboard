"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    X,
    CreditCard,
    Globe,
    FolderKanban,
    Calendar,
    DollarSign,
    Sparkles,
    Loader2,
    Repeat,
    Info,
    Building2,
    FileText,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { subscriptionSchema, SubscriptionInput } from "@/lib/validations";

interface SubscriptionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSubscription?: any | null;
}

interface ProjectSelectProps {
    value: string;
    onChange: (val: string) => void;
    error?: string;
    isOpen: boolean;
}

function ProjectSelect({ value, onChange, error, isOpen }: ProjectSelectProps) {
    const queryClient = useQueryClient();
    const [isCustom, setIsCustom] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    const { data: existingProjects = [] } = useQuery<string[]>({
        queryKey: ["subscription-projects"],
        queryFn: async () => {
            const res = await fetch("/api/admin/subscriptions/projects");
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen,
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (projectName: string) => {
            const res = await fetch(
                `/api/admin/subscriptions/projects?name=${encodeURIComponent(projectName)}`,
                { method: "DELETE" }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete project");
            }
            return res.json();
        },
        onSuccess: (_, deletedName) => {
            toast.success(`Project "${deletedName}" removed successfully`);
            setProjectToDelete(null);
            if (value === deletedName) {
                onChange("");
            }
            queryClient.invalidateQueries({ queryKey: ["subscription-projects"] });
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Could not delete project");
        },
    });

    useEffect(() => {
        if (value && !existingProjects.includes(value) && existingProjects.length > 0) {
            setIsCustom(true);
        }
    }, [value, existingProjects]);

    const handleSelectChange = (val: string) => {
        if (val === "__ADD_NEW__") {
            setIsCustom(true);
            onChange("");
        } else {
            setIsCustom(false);
            onChange(val);
        }
    };

    const handleDeleteProject = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        e.preventDefault();
        setProjectToDelete(name);
    };

    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>
                    Project Name <span className="text-rose-500">*</span>
                </span>
                {isCustom && existingProjects.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setIsCustom(false);
                            if (existingProjects.length > 0) {
                                onChange(existingProjects[0]);
                            }
                        }}
                        className="h-10! text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 p-0 hover:bg-transparent cursor-pointer"
                    >
                        Select existing project
                    </Button>
                )}
            </Label>

            {isCustom ? (
                <div className="relative">
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Enter project name..."
                        className={cn(
                            "bg-background border-border h-10 pr-9 focus-visible:ring-cyan-500",
                            error ? "border-rose-500" : ""
                        )}
                        autoFocus
                    />
                    {existingProjects.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsCustom(false);
                                if (existingProjects.length > 0) onChange(existingProjects[0]);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Cancel custom input"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ) : (
                <Select
                    value={existingProjects.includes(value) ? value : ""}
                    onValueChange={(val: any) => handleSelectChange(val)}
                >
                    <SelectTrigger
                        className={cn(
                            "w-full bg-background border-border text-foreground h-10! px-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer",
                            error ? "border-rose-500" : ""
                        )}
                    >
                        <SelectValue placeholder="Select or add a project..." />
                    </SelectTrigger>
                    <SelectContent className="z-[150] bg-card border-border max-h-60">
                        {existingProjects.map((pName) => (
                            <div
                                key={pName}
                                className="flex items-center justify-between px-1 hover:bg-accent rounded-sm group"
                            >
                                <SelectItem
                                    value={pName}
                                    className="h-10! flex-1 cursor-pointer border-none shadow-none"
                                >
                                    {pName}
                                </SelectItem>
                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteProject(e, pName)}
                                    disabled={deleteProjectMutation.isPending}
                                    className="p-1.5 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors mr-1 cursor-pointer"
                                    title={`Delete project "${pName}"`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        <SelectItem
                            value="__ADD_NEW__"
                            className="h-10! text-cyan-600 dark:text-cyan-400 font-bold border-t border-border/50 mt-1 cursor-pointer"
                        >
                            + Add new project name...
                        </SelectItem>
                    </SelectContent>
                </Select>
            )}

            {/* Quick Pill Chips for existing projects */}
            {existingProjects.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Projects:</span>
                    {existingProjects.map((pName) => (
                        <div
                            key={pName}
                            className={cn(
                                "text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all",
                                value === pName
                                    ? "bg-cyan-600/10 text-cyan-600 border-cyan-500/40 font-semibold dark:text-cyan-400"
                                    : "bg-muted/40 text-muted-foreground border-border/60 hover:border-border"
                            )}
                        >
                            <span
                                className="cursor-pointer hover:underline"
                                onClick={() => {
                                    setIsCustom(false);
                                    onChange(pName);
                                }}
                            >
                                {pName}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => handleDeleteProject(e, pName)}
                                disabled={deleteProjectMutation.isPending}
                                className="text-muted-foreground hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer"
                                title={`Delete "${pName}"`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {projectToDelete && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setProjectToDelete(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative w-full max-w-md border border-border bg-card shadow-2xl rounded-2xl p-6 space-y-4 overflow-hidden z-[201]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-foreground">Delete Project Tag</h4>
                                    <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Are you sure you want to delete <span className="font-bold text-foreground">&quot;{projectToDelete}&quot;</span>? This will remove this project tag from all associated subscriptions and filter options.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setProjectToDelete(null)}
                                    disabled={deleteProjectMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        deleteProjectMutation.mutate(projectToDelete);
                                    }}
                                    disabled={deleteProjectMutation.isPending}
                                    className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                                >
                                    {deleteProjectMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    Delete
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}

const COMMON_PROVIDERS = [
    "AWS",
    "Google Cloud",
    "Vercel",
    "Supabase",
    "Cloudflare",
    "OpenAI",
    "GitHub",
    "Namecheap",
    "Figma",
    "Slack",
    "MongoDB Atlas",
    "Stripe",
    "DigitalOcean",
    "Other",
];

export function SubscriptionFormModal({
    isOpen,
    onClose,
    editingSubscription,
}: SubscriptionFormModalProps) {
    const queryClient = useQueryClient();
    const isEdit = !!editingSubscription;

    const getTodayDateString = () => {
        return new Date().toISOString().split("T")[0];
    };

    const form = useForm<SubscriptionInput>({
        resolver: zodResolver(subscriptionSchema) as any,
        defaultValues: {
            name: "",
            type: "global",
            projectName: "",
            startDate: getTodayDateString(),
            endDate: "",
            price: 0,
            billingCycle: "monthly",
            status: "active",
            autoRenew: true,
            provider: "",
            paymentMethod: "Company Card",
            notes: "",
        },
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        control,
        formState: { errors },
    } = form;

    const currentType = watch("type");
    const currentStartDate = watch("startDate");

    // Pre-fill form when editing
    useEffect(() => {
        if (editingSubscription) {
            const formatForInput = (d: any) => {
                if (!d) return "";
                try {
                    return new Date(d).toISOString().split("T")[0];
                } catch {
                    return "";
                }
            };

            reset({
                name: editingSubscription.name || "",
                type: editingSubscription.type || "global",
                projectName: editingSubscription.projectName || "",
                startDate: formatForInput(editingSubscription.startDate) || getTodayDateString(),
                endDate: formatForInput(editingSubscription.endDate) || "",
                price: Number(editingSubscription.price) || 0,
                billingCycle: editingSubscription.billingCycle || "monthly",
                status: editingSubscription.status || "active",
                autoRenew: editingSubscription.autoRenew ?? true,
                provider: editingSubscription.provider || "",
                paymentMethod: editingSubscription.paymentMethod || "Company Card",
                notes: editingSubscription.notes || "",
            });
        } else {
            reset({
                name: "",
                type: "global",
                projectName: "",
                startDate: getTodayDateString(),
                endDate: "",
                price: 0,
                billingCycle: "monthly",
                status: "active",
                autoRenew: true,
                provider: "",
                paymentMethod: "Company Card",
                notes: "",
            });
        }
    }, [editingSubscription, reset, isOpen]);

    // Quick End Date calculated shortcuts
    const handleQuickEndDate = (monthsToAdd: number) => {
        const base = currentStartDate ? new Date(currentStartDate) : new Date();
        const future = new Date(base);
        future.setMonth(future.getMonth() + monthsToAdd);
        setValue("endDate", future.toISOString().split("T")[0]);
    };

    const saveMutation = useMutation({
        mutationFn: async (data: SubscriptionInput) => {
            const url = isEdit
                ? `/api/admin/subscriptions/${editingSubscription._id}`
                : "/api/admin/subscriptions";
            const method = isEdit ? "PUT" : "POST";

            const payload: any = {
                ...data,
                projectName: data.type === "project" ? (data.projectName || "").trim() : "",
                endDate: data.endDate && data.endDate !== "" ? data.endDate : null,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to save subscription");
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success(
                isEdit
                    ? "Subscription updated successfully"
                    : "Subscription added successfully"
            );
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["subscription-projects"] });
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "An error occurred");
        },
    });

    const onSubmit = (data: SubscriptionInput) => {
        saveMutation.mutate(data);
    };

    if (!isOpen) return null;

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
                    className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 my-8 max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4.5 border-b border-border bg-accent/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">
                                    {isEdit ? "Edit Subscription" : "New Subscription"}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {isEdit
                                        ? "Update details, renewal dates, and billing preferences."
                                        : "Track internal SaaS licenses or project-specific client subscriptions."}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full text-muted-foreground hover:text-foreground cursor-pointer h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Scrollable Form Body */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-foreground"
                    >
                        {/* 1. Subscription Type Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Subscription Scope / Type <span className="text-rose-500">*</span>
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Global Type Card */}
                                <button
                                    type="button"
                                    onClick={() => setValue("type", "global")}
                                    className={cn(
                                        "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                                        currentType === "global"
                                            ? "border-indigo-600 bg-indigo-500/10 dark:bg-indigo-950/30 ring-1 ring-indigo-500"
                                            : "border-border bg-card/50 hover:bg-accent/40"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-2 rounded-lg shrink-0 mt-0.5",
                                            currentType === "global"
                                                ? "bg-indigo-600 text-white"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-sm">1. Global</span>
                                            {currentType === "global" && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Company-wide software, internal servers, SaaS tools, and shared team licenses.
                                        </p>
                                    </div>
                                </button>

                                {/* Project Type Card */}
                                <button
                                    type="button"
                                    onClick={() => setValue("type", "project")}
                                    className={cn(
                                        "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                                        currentType === "project"
                                            ? "border-cyan-600 bg-cyan-500/10 dark:bg-cyan-950/30 ring-1 ring-cyan-500"
                                            : "border-border bg-card/50 hover:bg-accent/40"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-2 rounded-lg shrink-0 mt-0.5",
                                            currentType === "project"
                                                ? "bg-cyan-600 text-white"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <FolderKanban className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-sm">2. Project</span>
                                            {currentType === "project" && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Client domain, hosting, specific API keys, or project-dedicated maintenance.
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Project Context (if Project type selected) */}
                        {currentType === "project" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3.5"
                            >
                                <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-semibold text-xs">
                                    <FolderKanban className="h-4 w-4" />
                                    <span>Select Project</span>
                                </div>

                                <Controller
                                    name="projectName"
                                    control={control}
                                    render={({ field }) => (
                                        <ProjectSelect
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            error={errors.projectName?.message as string}
                                            isOpen={isOpen}
                                        />
                                    )}
                                />
                            </motion.div>
                        )}

                        {/* 2. Primary Details */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Subscription Name <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    placeholder="e.g. AWS Production Infrastructure, Vercel Pro, Figma Org"
                                    {...register("name")}
                                    className="bg-background border-border h-10 focus-visible:ring-indigo-500"
                                />
                                {errors.name && (
                                    <p className="text-xs text-rose-500 font-medium">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            {/* Provider / Vendor with quick chips */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Vendor / Provider
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        Quick pick or type custom
                                    </span>
                                </div>
                                <Input
                                    placeholder="e.g. AWS, Vercel, Supabase, Cloudflare"
                                    {...register("provider")}
                                    className="bg-background border-border h-10"
                                />
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {COMMON_PROVIDERS.slice(0, 8).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setValue("provider", p)}
                                            className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-accent/30 hover:bg-accent hover:text-indigo-500 transition-colors cursor-pointer"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Pricing & Billing Cycle */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Price / Cost <span className="text-rose-500">*</span>
                                </Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        {...register("price", { valueAsNumber: true })}
                                        className="pl-9 bg-background border-border h-10 focus-visible:ring-indigo-500 font-semibold"
                                    />
                                </div>
                                {errors.price && (
                                    <p className="text-xs text-rose-500 font-medium">
                                        {errors.price.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Billing Cycle
                                </Label>
                                <Controller
                                    name="billingCycle"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="bg-background border-border text-foreground h-10! cursor-pointer w-full">
                                                <SelectValue placeholder="Select cycle" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border text-foreground z-[100]">
                                                <SelectItem value="monthly" className={`h-10! border-none`}>Monthly (Most Common)</SelectItem>
                                                <SelectItem value="yearly" className={`h-10! border-none`}>Yearly (Annual)</SelectItem>
                                                <SelectItem value="quarterly" className={`h-10! border-none`}>Quarterly (Every 3 months)</SelectItem>
                                                <SelectItem value="weekly" className={`h-10! border-none`}>Weekly</SelectItem>
                                                <SelectItem value="one-time" className={`h-10! border-none`}>One-Time Purchase</SelectItem>
                                                <SelectItem value="custom" className={`h-10! border-none`}>Custom Schedule</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 4. Dates & Renewals */}
                        <div className="p-4 rounded-xl bg-accent/20 border border-border/80 space-y-3.5">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-xs">
                                <Calendar className="h-4 w-4" />
                                <span>Subscription Lifecycle & Renewal Dates</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-foreground">
                                        Start Date <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        {...register("startDate")}
                                        className="bg-background border-border h-10 text-foreground cursor-pointer"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Defaults to current creation date.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-foreground">
                                            End / Renewal Date
                                        </Label>
                                        <span className="text-[11px] text-muted-foreground">
                                            Optional
                                        </span>
                                    </div>
                                    <Input
                                        type="date"
                                        {...register("endDate")}
                                        className="bg-background border-border h-10 text-foreground cursor-pointer"
                                    />
                                    {/* Quick helper shortcuts */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <span className="text-[10px] text-muted-foreground">
                                            Quick Set:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickEndDate(1)}
                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                        >
                                            +1 Mo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickEndDate(3)}
                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                        >
                                            +3 Mo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickEndDate(12)}
                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                        >
                                            +1 Year
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue("endDate", "")}
                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors ml-auto"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Status & Payment Preference */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Status
                                </Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="bg-background border-border text-foreground h-10! cursor-pointer w-full">
                                                <SelectValue placeholder="Active" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border text-foreground z-[100]">
                                                <SelectItem value="active" className={`h-10! border-none`}>Active</SelectItem>
                                                <SelectItem value="expiring_soon" className={`h-10! border-none`}>Expiring Soon</SelectItem>
                                                <SelectItem value="expired" className={`h-10! border-none`}>Expired</SelectItem>
                                                <SelectItem value="cancelled" className={`h-10! border-none`}>Cancelled</SelectItem>
                                                <SelectItem value="paused" className={`h-10! border-none`}>Paused</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Payment Method
                                </Label>
                                <Input
                                    placeholder="e.g. Card ending 4242, PayPal"
                                    {...register("paymentMethod")}
                                    className="bg-background border-border h-10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">
                                    Auto-Renewal
                                </Label>
                                <Controller
                                    name="autoRenew"
                                    control={control}
                                    render={({ field }) => (
                                        <button
                                            type="button"
                                            onClick={() => field.onChange(!field.value)}
                                            className={cn(
                                                "w-full h-10 px-3 rounded-lg border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer",
                                                field.value
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                                                    : "bg-muted/40 text-muted-foreground border-border"
                                            )}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <Repeat className="h-3.5 w-3.5" />
                                                {field.value ? "Auto-Renews" : "Manual Renewal"}
                                            </span>
                                            <span
                                                className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    field.value ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                                                )}
                                            />
                                        </button>
                                    )}
                                />
                            </div>
                        </div>

                        {/* 6. Notes & Additional Information */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                    Notes & Credentials Info (Optional)
                                </Label>
                                <span className="text-[11px] text-muted-foreground">
                                    e.g. Registered email, tier limits, renewal instructions
                                </span>
                            </div>
                            <Textarea
                                rows={3}
                                placeholder="Add any details, license terms, associated account logins, or reminder notes..."
                                {...register("notes")}
                                className="bg-background border-border resize-none text-xs"
                            />
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={saveMutation.isPending}
                                className="cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                            >
                                {saveMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : isEdit ? (
                                    "Save Changes"
                                ) : (
                                    "Create Subscription"
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
