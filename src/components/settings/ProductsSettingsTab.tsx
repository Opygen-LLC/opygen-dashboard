"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Package,
    Plus,
    ExternalLink,
    Pencil,
    Trash2,
    TrendingUp,
    RefreshCw,
    AlertCircle,
    X,
    Globe,
    FileText,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
    _id: string;
    name: string;
    url: string;
    description?: string;
    createdAt?: string;
}

export default function ProductsSettingsTab() {
    const queryClient = useQueryClient();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    const [formName, setFormName] = useState("");
    const [formUrl, setFormUrl] = useState("");
    const [formDescription, setFormDescription] = useState("");

    // Fetch products
    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ["products"],
        queryFn: async () => {
            const res = await fetch("/api/products");
            if (!res.ok) throw new Error("Failed to fetch products");
            return res.json();
        },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (payload: { name: string; url: string; description?: string }) => {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to create product");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product created successfully!");
            setIsAddOpen(false);
            setFormName("");
            setFormUrl("");
            setFormDescription("");
        },
        onError: (err: any) => toast.error(err.message),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({
            id,
            payload,
        }: {
            id: string;
            payload: { name: string; url: string; description?: string };
        }) => {
            const res = await fetch(`/api/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update product");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product updated successfully!");
            setEditingProduct(null);
            setFormName("");
            setFormUrl("");
            setFormDescription("");
        },
        onError: (err: any) => toast.error(err.message),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/products/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete product");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product deleted successfully!");
            setDeletingProduct(null);
        },
        onError: (err: any) => toast.error(err.message),
    });

    const openAddModal = () => {
        setFormName("");
        setFormUrl("");
        setFormDescription("");
        setIsAddOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormName(product.name);
        setFormUrl(product.url);
        setFormDescription(product.description || "");
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error("Product name is required");
            return;
        }
        if (!formUrl.trim()) {
            toast.error("Product URL is required");
            return;
        }
        createMutation.mutate({
            name: formName.trim(),
            url: formUrl.trim(),
            description: formDescription.trim(),
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        if (!formName.trim()) {
            toast.error("Product name is required");
            return;
        }
        if (!formUrl.trim()) {
            toast.error("Product URL is required");
            return;
        }
        updateMutation.mutate({
            id: editingProduct._id,
            payload: {
                name: formName.trim(),
                url: formUrl.trim(),
                description: formDescription.trim(),
            },
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-40 rounded-2xl" />
                    <Skeleton className="h-40 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/40 p-5 bg-gradient-to-r from-blue-500/8 to-transparent">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2.5 text-base font-bold">
                                <div className="h-8 w-8 rounded-lg bg-background/80 flex items-center justify-center shadow-sm">
                                    <Package className="h-4 w-4 text-blue-500" />
                                </div>
                                Manage Products
                                <Badge variant="outline" className="text-xs font-semibold">
                                    {products.length} {products.length === 1 ? "Product" : "Products"}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Create, update, or remove company products. Each product appears in the sidebar and Finance transactions ledger.
                            </CardDescription>
                        </div>
                        <Button
                            onClick={openAddModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add New Product
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-5">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-3 text-muted-foreground">
                                <Package className="h-7 w-7" />
                            </div>
                            <h3 className="font-bold text-foreground text-sm">No products found</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                                You haven&apos;t added any products yet. Add your first product to track its revenue and display it in the sidebar.
                            </p>
                            <Button
                                onClick={openAddModal}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add Product
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {products.map((product) => (
                                <div
                                    key={product._id}
                                    className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-muted/15 p-4 hover:border-indigo-500/40 hover:bg-muted/30 transition-all duration-200"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-bold text-xs">
                                                    {product.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-sm tracking-tight">
                                                        {product.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
                                                    title="Edit Product"
                                                    onClick={() => openEditModal(product)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-destructive/10 cursor-pointer text-muted-foreground hover:text-destructive"
                                                    title="Delete Product"
                                                    onClick={() => setDeletingProduct(product)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Website URL */}
                                        <div className="pt-1">
                                            <a
                                                href={product.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                                            >
                                                <Globe className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate max-w-[280px] sm:max-w-xs">{product.url}</span>
                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                            </a>
                                        </div>

                                        {product.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {product.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action footer */}
                                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                                            Income & Expenses
                                        </span>
                                        <Link
                                            href={`/admin-dashboard/products/${product._id}`}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
                                        >
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            View Revenue & Ledger →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── ADD PRODUCT MODAL ─── */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative w-full max-w-md border border-border bg-card shadow-2xl rounded-2xl overflow-hidden text-card-foreground z-10"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-indigo-500" />
                                    Add New Product
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md hover:bg-muted"
                                    onClick={() => setIsAddOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Package className="h-3 w-3" />
                                        Product Name <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="e.g. Opygen Cleaning CRM"
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Globe className="h-3 w-3" />
                                        Website / Portal URL <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="url"
                                        value={formUrl}
                                        onChange={(e) => setFormUrl(e.target.value)}
                                        placeholder="https://cleaningcrm.opygen.com/admin/dashboard"
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" />
                                        Description (Optional)
                                    </label>
                                    <Textarea
                                        rows={3}
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Brief note about the product and target industry…"
                                        className="text-xs"
                                    />
                                </div>

                                <div className="pt-3 flex justify-end gap-2 border-t border-border/50">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsAddOpen(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={createMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5"
                                    >
                                        {createMutation.isPending && (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                        )}
                                        Create Product
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── EDIT PRODUCT MODAL ─── */}
            <AnimatePresence>
                {editingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingProduct(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative w-full max-w-md border border-border bg-card shadow-2xl rounded-2xl overflow-hidden text-card-foreground z-10"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <Pencil className="h-4 w-4 text-indigo-500" />
                                    Update Product
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md hover:bg-muted"
                                    onClick={() => setEditingProduct(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Package className="h-3 w-3" />
                                        Product Name <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="e.g. Opygen Cleaning CRM"
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Globe className="h-3 w-3" />
                                        Website / Portal URL <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        type="url"
                                        value={formUrl}
                                        onChange={(e) => setFormUrl(e.target.value)}
                                        placeholder="https://cleaningcrm.opygen.com/admin/dashboard"
                                        required
                                        className="h-9 text-xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" />
                                        Description (Optional)
                                    </label>
                                    <Textarea
                                        rows={3}
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Brief note about the product…"
                                        className="text-xs"
                                    />
                                </div>

                                <div className="pt-3 flex justify-end gap-2 border-t border-border/50">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingProduct(null)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={updateMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5"
                                    >
                                        {updateMutation.isPending && (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                        )}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── DELETE CONFIRMATION MODAL ─── */}
            <AnimatePresence>
                {deletingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeletingProduct(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="relative w-full max-w-sm border border-border bg-card p-6 shadow-2xl rounded-2xl text-card-foreground z-10"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-base">Delete Product</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Are you sure you want to delete <span className="font-semibold text-foreground">{deletingProduct.name}</span>?
                                    </p>
                                </div>
                            </div>

                            <p className="text-[11px] text-muted-foreground mt-4 bg-muted/30 p-2.5 rounded-lg">
                                Existing finance transactions linked to this product will retain their records, but this product will no longer appear in the sidebar or product selectors.
                            </p>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingProduct(null)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={deleteMutation.isPending}
                                    onClick={() => deleteMutation.mutate(deletingProduct._id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
                                >
                                    {deleteMutation.isPending && (
                                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                    )}
                                    Delete Product
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
