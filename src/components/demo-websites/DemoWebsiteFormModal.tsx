"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { X, Plus, Trash2, Globe, Sparkles, Loader2 } from "lucide-react";
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
import { demoWebsiteSchema, DemoWebsiteInput } from "@/lib/validations";

interface CategorySelectProps {
    value: string;
    onChange: (val: string) => void;
    error?: string;
    isOpen: boolean;
}

function CategorySelect({ value, onChange, error, isOpen }: CategorySelectProps) {
    const queryClient = useQueryClient();
    const [isCustom, setIsCustom] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const { data: existingCategories = [] } = useQuery<string[]>({
        queryKey: ["demo-website-categories"],
        queryFn: async () => {
            const res = await fetch("/api/admin/demo-websites/categories");
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen,
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: async (categoryName: string) => {
            const res = await fetch(
                `/api/admin/demo-websites/categories?name=${encodeURIComponent(categoryName)}`,
                { method: "DELETE" }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete category");
            }
            return res.json();
        },
        onSuccess: (_, deletedName) => {
            toast.success(`Category "${deletedName}" deleted successfully`);
            setCategoryToDelete(null);
            if (value === deletedName) {
                onChange("");
            }
            queryClient.invalidateQueries({ queryKey: ["demo-website-categories"] });
            queryClient.invalidateQueries({ queryKey: ["demo-websites"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Could not delete category");
        },
    });

    useEffect(() => {
        if (value && !existingCategories.includes(value) && existingCategories.length > 0) {
            setIsCustom(true);
        }
    }, [value, existingCategories]);

    const handleSelectChange = (val: string) => {
        if (val === "__ADD_NEW__") {
            setIsCustom(true);
            onChange("");
        } else {
            setIsCustom(false);
            onChange(val);
        }
    };

    const handleDeleteCategory = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        e.preventDefault();
        setCategoryToDelete(name);
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>
                    Category <span className="text-rose-500">*</span>
                </span>
                {isCustom && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setIsCustom(false);
                            if (existingCategories.length > 0) {
                                onChange(existingCategories[0]);
                            }
                        }}
                        className="h-6 text-[11px] text-indigo-500 hover:text-indigo-600 p-0 hover:bg-transparent"
                    >
                        Select existing
                    </Button>
                )}
            </Label>

            {isCustom ? (
                <div className="relative">
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Enter category name explicitly..."
                        className={cn(
                            "bg-background h-10! pr-8 border-indigo-500/60 focus-visible:ring-indigo-500",
                            error ? "border-rose-500" : ""
                        )}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setIsCustom(false);
                            if (existingCategories.length > 0) onChange(existingCategories[0]);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <Select
                    value={existingCategories.includes(value) ? value : ""}
                    onValueChange={(val: any) => handleSelectChange(val)}
                >
                    <SelectTrigger
                        className={cn(
                            "w-full bg-background h-10! px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                            error ? "border-rose-500" : "border-input"
                        )}
                    >
                        <SelectValue placeholder="Select or add category..." />
                    </SelectTrigger>
                    <SelectContent className="z-[150] bg-card border-border">
                        {existingCategories.map((catName) => (
                            <div
                                key={catName}
                                className="flex items-center justify-between px-1 hover:bg-accent rounded-sm group"
                            >
                                <SelectItem value={catName} className="h-10! flex-1 cursor-pointer border-none shadow-none">
                                    {catName}
                                </SelectItem>
                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteCategory(e, catName)}
                                    disabled={deleteCategoryMutation.isPending}
                                    className="p-1.5 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors mr-1 cursor-pointer"
                                    title={`Delete "${catName}"`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        <SelectItem
                            value="__ADD_NEW__"
                            className="h-10! text-indigo-600 dark:text-indigo-400 font-bold border-t border-border/50 mt-1 cursor-pointer"
                        >
                            + Add new category...
                        </SelectItem>
                    </SelectContent>
                </Select>
            )}

            {existingCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">Existing Categories:</span>
                    {existingCategories.map((catName) => (
                        <div
                            key={catName}
                            className={cn(
                                "text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all",
                                value === catName
                                    ? "bg-indigo-600/10 text-indigo-600 border-indigo-500/40 font-semibold dark:text-indigo-400"
                                    : "bg-muted/40 text-muted-foreground border-border/60"
                            )}
                        >
                            <span
                                className="cursor-pointer hover:underline"
                                onClick={() => {
                                    setIsCustom(false);
                                    onChange(catName);
                                }}
                            >
                                {catName}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => handleDeleteCategory(e, catName)}
                                disabled={deleteCategoryMutation.isPending}
                                className="text-muted-foreground hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer"
                                title={`Delete "${catName}"`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {categoryToDelete && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setCategoryToDelete(null)}
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
                                <div className="p-3 rounded-full bg-rose-500/10 text-rose-500">
                                    <Trash2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Delete Category</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        This action will delete category reference from database.
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                                Are you sure you want to delete <span className="font-semibold text-rose-500">"{categoryToDelete}"</span>? All demo websites associated with this category will be removed.
                            </p>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCategoryToDelete(null)}
                                    disabled={deleteCategoryMutation.isPending}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => deleteCategoryMutation.mutate(categoryToDelete)}
                                    disabled={deleteCategoryMutation.isPending}
                                    className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                >
                                    {deleteCategoryMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...
                                        </>
                                    ) : (
                                        "Delete Category"
                                    )}
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

interface DemoWebsiteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingWebsite: any | null;
    onSuccessCallback?: () => void;
}

export function DemoWebsiteFormModal({
    isOpen,
    onClose,
    editingWebsite,
    onSuccessCallback,
}: DemoWebsiteFormModalProps) {
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<DemoWebsiteInput>({
        resolver: zodResolver(demoWebsiteSchema),
        defaultValues: {
            title: "",
            link: "",
            category: "",
            description: "",
            thumbnailUrl: "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (editingWebsite) {
                reset({
                    title: editingWebsite.title,
                    link: editingWebsite.link,
                    category: editingWebsite.category,
                    description: editingWebsite.description || "",
                    thumbnailUrl: editingWebsite.thumbnailUrl || "",
                });
            } else {
                reset({
                    title: "",
                    link: "",
                    category: "",
                    description: "",
                    thumbnailUrl: "",
                });
            }
        }
    }, [isOpen, editingWebsite, reset]);

    const mutation = useMutation({
        mutationFn: async (data: DemoWebsiteInput) => {
            const url = editingWebsite
                ? `/api/admin/demo-websites/${editingWebsite._id}`
                : "/api/admin/demo-websites";
            const method = editingWebsite ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to save demo website");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success(
                editingWebsite
                    ? "Demo website updated successfully"
                    : "Demo website added successfully"
            );
            queryClient.invalidateQueries({ queryKey: ["demo-websites"] });
            queryClient.invalidateQueries({ queryKey: ["demo-website-categories"] });
            onClose();
            if (onSuccessCallback) onSuccessCallback();
        },
        onError: (err: any) => {
            toast.error(err.message);
        },
    });

    const onSubmit = (data: DemoWebsiteInput) => {
        mutation.mutate(data);
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-xl border border-border bg-card shadow-2xl rounded-2xl overflow-hidden z-[101]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border p-6 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">
                                    {editingWebsite ? "Edit Demo Website" : "Add New Demo Website"}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Provide website details, preview link, and category.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-foreground">
                                Website Name <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                {...register("title")}
                                placeholder="e.g. E-Commerce Store Demo, SaaS Landing Page"
                                className={cn(
                                    "bg-background h-10 border-border focus-visible:ring-indigo-500",
                                    errors.title ? "border-rose-500" : ""
                                )}
                            />
                            {errors.title && (
                                <p className="text-xs text-rose-500 font-medium">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-foreground">
                                Website Link / URL <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                {...register("link")}
                                placeholder="https://demo.example.com"
                                className={cn(
                                    "bg-background h-10 border-border focus-visible:ring-indigo-500",
                                    errors.link ? "border-rose-500" : ""
                                )}
                            />
                            {errors.link && (
                                <p className="text-xs text-rose-500 font-medium">
                                    {errors.link.message}
                                </p>
                            )}
                        </div>

                        {/* Category Select Component */}
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <CategorySelect
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.category?.message}
                                    isOpen={isOpen}
                                />
                            )}
                        />
                        {errors.category && (
                            <p className="text-xs text-rose-500 font-medium">
                                {errors.category.message}
                            </p>
                        )}

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-foreground">
                                Description (Optional)
                            </Label>
                            <Textarea
                                {...register("description")}
                                placeholder="Brief overview of features, target industry, or tech stack used..."
                                className="bg-background border-border resize-none h-20 focus-visible:ring-indigo-500"
                            />
                        </div>

                        {/* Form Footer */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting || mutation.isPending}
                                className="cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || mutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/10 cursor-pointer"
                            >
                                {isSubmitting || mutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                                    </>
                                ) : editingWebsite ? (
                                    "Update Website"
                                ) : (
                                    "Save Demo Website"
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
