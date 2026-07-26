import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Edit, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { clientSchema, ClientInput } from "@/lib/validations";
import { COUNTRIES } from "@/lib/countries";
import { PhoneInput } from "@/components/ui/PhoneInput";

interface AdNameSelectProps {
    value: string;
    onChange: (val: string) => void;
    existingAdNames: string[];
    error?: string;
}

function AdNameSelect({ value, onChange, existingAdNames, error }: AdNameSelectProps) {
    const queryClient = useQueryClient();
    const isInitialCustom = !!value && !existingAdNames.includes(value);
    const [isCustom, setIsCustom] = useState(isInitialCustom);
    const [customValue, setCustomValue] = useState(isInitialCustom ? value : "");

    useEffect(() => {
        if (value && !existingAdNames.includes(value)) {
            setIsCustom(true);
            setCustomValue(value);
        } else if (value && existingAdNames.includes(value)) {
            setIsCustom(false);
        }
    }, [value, existingAdNames]);

    const [adNameToDelete, setAdNameToDelete] = useState<string | null>(null);

    const deleteAdNameMutation = useMutation({
        mutationFn: async (targetName: string) => {
            const res = await fetch(
                `/api/clients/ad-names?name=${encodeURIComponent(targetName)}`,
                { method: "DELETE" }
            );
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to delete ad name");
            }
            return res.json();
        },
        onSuccess: (_, deletedName) => {
            toast.success(`Ad name "${deletedName}" deleted successfully`);
            queryClient.invalidateQueries({ queryKey: ["ad-names"] });
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            if (value === deletedName) {
                onChange("");
            }
        },
        onError: (err: any) => toast.error(err.message),
    });

    const handleDeleteAdName = (e: React.MouseEvent, targetName: string) => {
        e.stopPropagation();
        e.preventDefault();
        setAdNameToDelete(targetName);
    };

    const handleSelectChange = (selected: string) => {
        if (selected === "__ADD_NEW__") {
            setIsCustom(true);
            setCustomValue("");
            onChange("");
        } else {
            setIsCustom(false);
            onChange(selected);
        }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomValue(val);
        onChange(val);
    };

    return (
        <div className="space-y-2">
            {isCustom ? (
                <div className="flex items-center gap-2">
                    <Input
                        value={customValue}
                        onChange={handleCustomChange}
                        placeholder="Enter new Ad Name explicitly..."
                        className={cn(
                            "w-full bg-background h-10 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                            error ? "border-rose-500" : "border-input"
                        )}
                        autoFocus
                    />
                    {existingAdNames.length > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setIsCustom(false);
                                onChange(existingAdNames[0] || "");
                            }}
                            className="h-10 text-xs shrink-0 whitespace-nowrap"
                        >
                            Select existing
                        </Button>
                    )}
                </div>
            ) : (
                <Select
                    value={existingAdNames.includes(value) ? value : ""}
                    onValueChange={handleSelectChange}
                >
                    <SelectTrigger
                        className={cn(
                            "w-full bg-background h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                            error ? "border-rose-500" : "border-input"
                        )}
                    >
                        <SelectValue placeholder="Select Ad Name..." />
                    </SelectTrigger>
                    <SelectContent className="z-[150]">
                        {existingAdNames.map((adName) => (
                            <div
                                key={adName}
                                className="flex items-center justify-between px-1 hover:bg-accent rounded-sm group"
                            >
                                <SelectItem value={adName} className="h-10! flex-1 cursor-pointer border-none shadow-none">
                                    {adName}
                                </SelectItem>
                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteAdName(e, adName)}
                                    disabled={deleteAdNameMutation.isPending}
                                    className="p-1.5 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors mr-1"
                                    title={`Delete "${adName}"`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        <SelectItem
                            value="__ADD_NEW__"
                            className="h-10! text-indigo-600 dark:text-indigo-400 font-bold border-t border-border/50 mt-1 cursor-pointer"
                        >
                            + Add new ad name...
                        </SelectItem>
                    </SelectContent>
                </Select>
            )}

            {existingAdNames.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Existing Ad Names:</span>
                    {existingAdNames.map((adName) => (
                        <div
                            key={adName}
                            className={cn(
                                "text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all",
                                value === adName
                                    ? "bg-indigo-600/10 text-indigo-600 border-indigo-500/40 font-semibold dark:text-indigo-400"
                                    : "bg-muted/40 text-muted-foreground border-border/60"
                            )}
                        >
                            <span
                                className="cursor-pointer hover:underline"
                                onClick={() => {
                                    setIsCustom(false);
                                    onChange(adName);
                                }}
                            >
                                {adName}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => handleDeleteAdName(e, adName)}
                                disabled={deleteAdNameMutation.isPending}
                                className="text-muted-foreground hover:text-rose-500 p-0.5 rounded transition-colors"
                                title={`Delete "${adName}"`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {adNameToDelete && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAdNameToDelete(null)}
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
                                    <h4 className="font-bold text-lg text-foreground">Delete Ad Name</h4>
                                    <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Are you sure you want to delete <span className="font-bold text-foreground">"{adNameToDelete}"</span>? This will remove this ad name from all associated client records.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setAdNameToDelete(null)}
                                    disabled={deleteAdNameMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        deleteAdNameMutation.mutate(adNameToDelete, {
                                            onSettled: () => setAdNameToDelete(null),
                                        });
                                    }}
                                    disabled={deleteAdNameMutation.isPending}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md shadow-rose-500/20"
                                >
                                    {deleteAdNameMutation.isPending ? "Deleting..." : "Delete Ad Name"}
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

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingClient: any | null;
    onSuccessCallback?: () => void;
}

export function ClientFormModal({
    isOpen,
    onClose,
    editingClient,
    onSuccessCallback,
}: ClientFormModalProps) {
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors, isSubmitting },
    } = useForm<z.input<typeof clientSchema>>({
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
            adName: "",
            status: "Pending",
            followupDate: "",
            meetingDate: "",
        },
    });

    const sourceWatch = watch("source");
    const statusWatch = watch("status");

    const { data: existingAdNames = [] } = useQuery<string[]>({
        queryKey: ["ad-names"],
        queryFn: async () => {
            const res = await fetch("/api/clients/ad-names");
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen,
    });

    useEffect(() => {
        if (isOpen) {
            if (editingClient) {
                reset({
                    name: editingClient.name,
                    companyName: editingClient.companyName || "",
                    number: editingClient.number || "",
                    socialMediaLink: editingClient.socialMediaLink || "",
                    country: editingClient.country,
                    minAmount: editingClient.minAmount || 0,
                    maxAmount: editingClient.maxAmount || 0,
                    notes: editingClient.notes || "",
                    source: editingClient.source,
                    otherSource: editingClient.otherSource || "",
                    adName: editingClient.adName || "",
                    status: editingClient.status || "Pending",
                    followupDate: editingClient.followupDate
                        ? new Date(editingClient.followupDate)
                              .toISOString()
                              .split("T")[0]
                        : "",
                    meetingDate: editingClient.meetingDate
                        ? new Date(editingClient.meetingDate)
                              .toISOString()
                              .split("T")[0]
                        : "",
                });
            } else {
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
                    adName: "",
                    status: "Pending",
                    followupDate: "",
                    meetingDate: "",
                });
            }
        }
    }, [isOpen, editingClient, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: ClientInput) => {
            const payload: any = { ...data };
            if (payload.status === "Meeting Scheduled" && (!payload.meetingDate || payload.meetingDate.trim() === "")) {
                payload.meetingDate = new Date().toISOString().split("T")[0];
            }
            if (payload.status === "Follow-up" && (!payload.followupDate || payload.followupDate.trim() === "")) {
                payload.followupDate = new Date().toISOString().split("T")[0];
            }

            const url = editingClient
                ? `/api/clients/${editingClient._id}`
                : "/api/clients";
            const method = editingClient ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
            onClose();
            reset();
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["ad-names"] });
            queryClient.invalidateQueries({ queryKey: ["all-clients-stats"] });
            queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (err: any) => toast.error(err.message),
    });

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
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
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                            <form
                                id="client-form"
                                onSubmit={handleSubmit((d) =>
                                    saveMutation.mutate(d as ClientInput),
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
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            "w-full bg-background h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                                                            errors.status
                                                                ? "border-rose-500"
                                                                : "border-input",
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[150]">
                                                        <SelectItem
                                                            value="Pending"
                                                            className={`h-10!`}
                                                        >
                                                            Pending
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="Confirmed"
                                                            className={`h-10!`}
                                                        >
                                                            Confirmed
                                                        </SelectItem>
                                                         <SelectItem
                                                            value="Follow-up"
                                                            className={`h-10!`}
                                                        >
                                                            Follow-up
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="Meeting Scheduled"
                                                            className={`h-10!`}
                                                        >
                                                            Meeting Scheduled
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="Blocked"
                                                            className={`h-10!`}
                                                        >
                                                            Blocked
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="Declined"
                                                            className={`h-10!`}
                                                        >
                                                            Declined
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.status && (
                                            <p className="text-xs text-rose-500">
                                                {
                                                    errors.status
                                                        ?.message as string
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {statusWatch === "Follow-up" && (
                                        <div className="space-y-2 md:col-span-1 animate-in fade-in">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Follow-up Date{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <Input
                                                type="date"
                                                {...register("followupDate")}
                                                className={
                                                    errors.followupDate
                                                        ? "border-rose-500"
                                                        : ""
                                                }
                                            />
                                            {errors.followupDate && (
                                                <p className="text-xs text-rose-500">
                                                    {
                                                        errors.followupDate
                                                            ?.message as string
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {statusWatch === "Meeting Scheduled" && (
                                        <div className="space-y-2 md:col-span-1 animate-in fade-in">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Meeting Date{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <Input
                                                type="date"
                                                {...register("meetingDate")}
                                                className={
                                                    errors.meetingDate
                                                        ? "border-rose-500"
                                                        : ""
                                                }
                                            />
                                            {errors.meetingDate && (
                                                <p className="text-xs text-rose-500">
                                                    {
                                                        errors.meetingDate
                                                            ?.message as string
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}

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
                                        {errors.number && (
                                            <p className="text-xs text-rose-500">
                                                {
                                                    errors.number
                                                        .message as string
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                                            Country{" "}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <Controller
                                            name="country"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            "w-full bg-background h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                                                            errors.country
                                                                ? "border-rose-500"
                                                                : "border-input",
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Select a country" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[150]">
                                                        {COUNTRIES.map(
                                                            (country) => (
                                                                <SelectItem
                                                                    key={
                                                                        country
                                                                    }
                                                                    value={
                                                                        country
                                                                    } className={`h-10!`}
                                                                >
                                                                    {country}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.country && (
                                            <p className="text-xs text-rose-500">
                                                {
                                                    errors.country
                                                        .message as string
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                                            Social Media Link
                                        </label>
                                        <Input
                                            {...register("socialMediaLink")}
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
                                                    errors.socialMediaLink
                                                        .message as string
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                                            Min Amount ($)
                                        </label>
                                        <Input
                                            type="number"
                                            {...register("minAmount", {
                                                valueAsNumber: true,
                                            })}
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
                                            {...register("maxAmount", {
                                                valueAsNumber: true,
                                            })}
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

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                                            Source{" "}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <Controller
                                            name="source"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            "w-full bg-background h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                                                            errors.source
                                                                ? "border-rose-500"
                                                                : "border-input",
                                                        )}
                                                    >
                                                        <SelectValue placeholder="Select source" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[150]">
                                                        <SelectItem value="Social Media" className={`h-10!`}>
                                                            Social Media
                                                        </SelectItem>
                                                        <SelectItem value="Ads" className={`h-10!`}>
                                                            Ads
                                                        </SelectItem>
                                                        <SelectItem value="Referral" className={`h-10!`}>
                                                            Referral
                                                        </SelectItem>
                                                        <SelectItem value="Cold Outreach" className={`h-10!`}>
                                                            Cold Outreach
                                                        </SelectItem>
                                                        <SelectItem value="Organic Search" className={`h-10!`}>
                                                            Organic Search
                                                        </SelectItem>
                                                        <SelectItem value="Other" className={`h-10!`}>
                                                            Other
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.source && (
                                            <p className="text-xs text-rose-500">
                                                {
                                                    errors.source
                                                        .message as string
                                                }
                                            </p>
                                        )}
                                    </div>

                                     {sourceWatch === "Ads" && (
                                         <div className="space-y-2 md:col-span-2 animate-in fade-in">
                                             <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                 Ad Name{" "}
                                                 <span className="text-rose-500">
                                                     *
                                                 </span>
                                             </label>
                                             <Controller
                                                 name="adName"
                                                 control={control}
                                                 render={({ field }) => (
                                                     <AdNameSelect
                                                         value={field.value || ""}
                                                         onChange={field.onChange}
                                                         existingAdNames={existingAdNames}
                                                         error={errors.adName?.message as string}
                                                     />
                                                 )}
                                             />
                                             {errors.adName && (
                                                 <p className="text-xs text-rose-500">
                                                     {errors.adName.message as string}
                                                 </p>
                                             )}
                                         </div>
                                     )}

                                    {sourceWatch === "Other" && (
                                        <div className="space-y-2 md:col-span-2 animate-in fade-in">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Please specify the source{" "}
                                                <span className="text-rose-500">
                                                    *
                                                </span>
                                            </label>
                                            <Input
                                                {...register("otherSource")}
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
                                                        errors.otherSource
                                                            .message as string
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                                            Notes
                                        </label>
                                        <Textarea
                                            {...register("notes")}
                                            placeholder="Additional information about this client..."
                                            className="min-h-[100px] resize-y bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-foreground transition-all"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end gap-3 shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="client-form"
                                disabled={
                                    isSubmitting || saveMutation.isPending
                                }
                                className="min-w-[120px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                            >
                                {isSubmitting || saveMutation.isPending
                                    ? "Saving..."
                                    : "Save Client"}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
