"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteSchema, QuoteInput } from "@/lib/validations";
import {
    X,
    Plus,
    Loader2,
    UserCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface QuoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Partial<QuoteInput>;
    onSubmit: (data: QuoteInput) => void;
    isSubmitting?: boolean;
    mode: "create" | "edit" | "convert";
}

export default function QuoteFormModal({
    isOpen,
    onClose,
    initialData,
    onSubmit,
    isSubmitting = false,
    mode,
}: QuoteFormModalProps) {
    // Fetch Accounts for PDF Payment Details
    const { data: accountsData } = useQuery<any>({
        queryKey: ["adminAccountsList"],
        queryFn: async () => {
            const res = await fetch("/api/admin/accounts?limit=100");
            if (!res.ok) throw new Error("Failed to fetch accounts");
            return res.json();
        },
        enabled: isOpen,
    });
    const accountsList = accountsData?.accounts || [];

    const defaultFormValues: QuoteInput = {
        projectName: "",
        projectDetails: "",
        clientName: "",
        clientPhone: "",
        clientSocialLink: "",
        currency: "USD",
        advanceType: "percentage",
        advanceValue: null,
        projectDuration: "",
        phases: [
            { phaseName: "", description: "", minBudget: 0, maxBudget: 0 },
        ],
        ...initialData,
    };

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<QuoteInput>({
        resolver: zodResolver(quoteSchema),
        defaultValues: defaultFormValues,
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "phases",
    });

    // Reset form when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) {
            reset(defaultFormValues);
        }
    }, [isOpen, initialData, reset]);

    const titleMap = {
        create: "Create New Quote",
        edit: "Edit Quote",
        convert: "Convert Client to Quote",
    };

    const descriptionMap = {
        create: "Fill in the details below to generate a new proposal.",
        edit: "Update the proposal details.",
        convert: "Review and complete the quote details for this client.",
    };

    const submitLabelMap = {
        create: "Create Quote",
        edit: "Update Quote",
        convert: "Create Quote",
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="w-[95vw] sm:max-w-4xl max-w-4xl bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="px-6 py-5 border-b border-border bg-muted/20 shrink-0">
                    <DialogTitle className="text-2xl font-bold bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        {titleMap[mode]}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-1">
                        {descriptionMap[mode]}
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto p-6">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                        id="quote-form"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Project Name *
                                </label>
                                <Input
                                    {...register("projectName")}
                                    className="bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                                />
                                {errors.projectName && (
                                    <p className="text-xs text-red-500">
                                        {(errors.projectName as any).message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Client Name *
                                </label>
                                <Input
                                    {...register("clientName")}
                                    className="bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                                />
                                {errors.clientName && (
                                    <p className="text-xs text-red-500">
                                        {(errors.clientName as any).message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Client Phone
                                </label>
                                <Controller
                                    control={control}
                                    name="clientPhone"
                                    render={({
                                        field: { onChange, value },
                                    }) => (
                                        <PhoneInput
                                            value={value || ""}
                                            onChange={onChange}
                                        />
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Client Social Link
                                </label>
                                <Input
                                    {...register("clientSocialLink")}
                                    className="bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium text-foreground">
                                    Project Details (Optional)
                                </label>
                                <Textarea
                                    {...register("projectDetails")}
                                    className="bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 min-h-[80px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Currency
                                </label>
                                <div className="flex gap-2">
                                    <Controller
                                        name="currency"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className="w-32 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 h-10! flex-1">
                                                    <SelectValue placeholder="Type" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[150]">
                                                    <SelectItem value="USD" className="h-10!">USD</SelectItem>
                                                    <SelectItem value="BDT" className="h-10!">BDT</SelectItem>
                                                    <SelectItem value="EUR" className="h-10!">EUR</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Advance Amount (Optional)
                                    </label>
                                    <div className="flex gap-2">
                                        <Controller
                                            name="advanceType"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="w-32 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 h-10! flex-1">
                                                        <SelectValue placeholder="Type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[150]">
                                                        <SelectItem value="percentage" className="h-10!">Percent (%)</SelectItem>
                                                        <SelectItem value="fixed" className="h-10!">Fixed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        <Input
                                            type="number"
                                            {...register("advanceValue", { valueAsNumber: true })}
                                            placeholder="e.g. 50"
                                            className="bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-10 flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Project Duration *
                                </label>
                                <Input
                                    {...register("projectDuration")}
                                    placeholder="e.g. 2 Weeks, 1 Month"
                                    className="bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            <label className="text-sm font-medium text-foreground">
                                Receiving Payment Account *
                            </label>
                            <Controller
                                name="paymentAccount"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-1">
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(JSON.parse(val));
                                            }}
                                            value={field.value ? JSON.stringify(field.value) : undefined}
                                        >
                                            <SelectTrigger className="bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 h-10! w-full text-left">
                                                <SelectValue placeholder="Select an account to display on PDF" />
                                            </SelectTrigger>
                                            <SelectContent className="z-[150]">
                                                {accountsList.map((accItem: any, idx: number) => {
                                                    const valStr = JSON.stringify({
                                                        providerName: accItem.account.providerName,
                                                        accountName: accItem.account.accountName,
                                                        accountNumber: accItem.account.accountNumber,
                                                        routingNumber: accItem.account.routingNumber,
                                                        branch: accItem.account.branch,
                                                    });

                                                    const userName = accItem.user?.name || accItem.userName || "Unknown";
                                                    const hash = userName.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                                                    const colors = [
                                                        "bg-blue-50/80 hover:bg-blue-100 text-blue-900 border-l-4 border-blue-500",
                                                        "bg-green-50/80 hover:bg-green-100 text-green-900 border-l-4 border-green-500",
                                                        "bg-purple-50/80 hover:bg-purple-100 text-purple-900 border-l-4 border-purple-500",
                                                        "bg-amber-50/80 hover:bg-amber-100 text-amber-900 border-l-4 border-amber-500",
                                                        "bg-pink-50/80 hover:bg-pink-100 text-pink-900 border-l-4 border-pink-500",
                                                        "bg-teal-50/80 hover:bg-teal-100 text-teal-900 border-l-4 border-teal-500",
                                                    ];
                                                    const colorClass = colors[hash % colors.length];

                                                    return (
                                                        <SelectItem
                                                            key={idx}
                                                            value={valStr}
                                                            className={`mb-2 mx-1 rounded-md transition-colors ${colorClass}`}
                                                        >
                                                            <div className="flex flex-col gap-1 py-1">
                                                                <div className="font-semibold text-sm">
                                                                    {accItem.account.providerName} - {accItem.account.accountNumber}
                                                                </div>
                                                                <div className="text-xs opacity-80 flex items-center gap-1">
                                                                    <UserCircle2 className="h-3 w-3" />
                                                                    {userName}
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        {errors.paymentAccount && (
                                            <p className="text-xs text-red-500">
                                                {errors.paymentAccount.message as string}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground">
                                    Project Phases
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        append({
                                            phaseName: "",
                                            description: "",
                                            minBudget: 0,
                                            maxBudget: 0,
                                        })
                                    }
                                    className="h-8 cursor-pointer border-indigo-500 text-indigo-600 hover:bg-indigo-500 group hover:text-white transition-colors"
                                >
                                    <Plus className="mr-1 h-3 w-3 group-hover:text-white" /> Add Phase
                                </Button>
                            </div>
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="relative rounded-lg border border-border bg-accent/30 p-4 pt-8"
                                >
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-red-500 cursor-pointer"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Phase Name
                                            </label>
                                            <Input
                                                {...register(`phases.${index}.phaseName`)}
                                                placeholder="e.g. Frontend"
                                                className="h-10 text-sm bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500"
                                            />
                                            {errors.phases?.[index]?.phaseName && (
                                                <p className="text-xs text-red-500">
                                                    {errors.phases?.[index]?.phaseName?.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Min Budget
                                                </label>
                                                <Input
                                                    type="number"
                                                    {...register(`phases.${index}.minBudget`, { valueAsNumber: true })}
                                                    placeholder="Min"
                                                    className="h-10 text-sm bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500"
                                                />
                                                {errors.phases?.[index]?.minBudget && (
                                                    <p className="text-xs text-red-500">
                                                        {errors.phases?.[index]?.minBudget?.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Max Budget
                                                </label>
                                                <Input
                                                    type="number"
                                                    {...register(`phases.${index}.maxBudget`, { valueAsNumber: true })}
                                                    placeholder="Max"
                                                    className="h-10 text-sm bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500"
                                                />
                                                {errors.phases?.[index]?.maxBudget && (
                                                    <p className="text-xs text-red-500">
                                                        {errors.phases?.[index]?.maxBudget?.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                Description
                                            </label>
                                            <Textarea
                                                {...register(`phases.${index}.description`)}
                                                className="min-h-20 text-sm bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="quote-form"
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {submitLabelMap[mode]}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
