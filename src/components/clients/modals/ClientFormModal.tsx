import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Edit } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { clientSchema, ClientInput } from "@/lib/validations";
import { COUNTRIES } from "@/lib/countries";
import { PhoneInput } from "@/components/ui/PhoneInput";

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
            status: "Pending",
        },
    });

    const sourceWatch = watch("source");
    const statusWatch = watch("status");

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
                    status: editingClient.status || "Pending",
                    followupDate: editingClient.followupDate
                        ? new Date(editingClient.followupDate)
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
                    status: "Pending",
                    followupDate: "",
                });
            }
        }
    }, [isOpen, editingClient, reset]);

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
            onClose();
            reset();
            queryClient.invalidateQueries({ queryKey: ["clients"] });
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
                                                {errors.status?.message as string}
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
                                            {COUNTRIES.map((country) => (
                                                <option
                                                    key={country}
                                                    value={country}
                                                >
                                                    {country}
                                                </option>
                                            ))}
                                        </select>
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
                                            <option value="Ads">Ads</option>
                                            <option value="Referral">
                                                Referral
                                            </option>
                                            <option value="Cold Outreach">
                                                Cold Outreach
                                            </option>
                                            <option value="Organic Search">
                                                Organic Search
                                            </option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {errors.source && (
                                            <p className="text-xs text-rose-500">
                                                {
                                                    errors.source
                                                        .message as string
                                                }
                                            </p>
                                        )}
                                    </div>

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
