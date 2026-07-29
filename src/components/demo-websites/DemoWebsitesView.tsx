"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    ExternalLink,
    Globe,
    Sparkles,
    Loader2,
    Tag,
    Layers,
    Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FilterDrawer } from "@/components/ui/FilterDrawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DemoWebsiteFormModal } from "./DemoWebsiteFormModal";

export default function DemoWebsitesView() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWebsite, setEditingWebsite] = useState<any | null>(null);
    const [websiteToDelete, setWebsiteToDelete] = useState<any | null>(null);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>("All");
    const [tempFilterCategory, setTempFilterCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchInput, setSearchInput] = useState<string>("");

    const openFilterDrawer = () => {
        setTempFilterCategory(filterCategory);
        setIsFilterOpen(true);
    };

    const handleApplyFilters = () => {
        setFilterCategory(tempFilterCategory);
    };

    const handleResetFilters = () => {
        setTempFilterCategory("All");
        setFilterCategory("All");
    };

    const activeFilterCount = filterCategory !== "All" ? 1 : 0;

    // Fetch distinct categories for filter bar
    const { data: categories = [] } = useQuery<string[]>({
        queryKey: ["demo-website-categories"],
        queryFn: async () => {
            const res = await fetch("/api/admin/demo-websites/categories");
            if (!res.ok) return [];
            return res.json();
        },
    });

    // Fetch demo websites
    const { data: websites = [], isLoading } = useQuery<any[]>({
        queryKey: ["demo-websites", filterCategory, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterCategory !== "All") params.append("category", filterCategory);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/admin/demo-websites?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch demo websites");
            return res.json();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/demo-websites/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to delete demo website");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Demo website deleted successfully");
            setWebsiteToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["demo-websites"] });
            queryClient.invalidateQueries({ queryKey: ["demo-website-categories"] });
        },
        onError: (err: any) => {
            toast.error(err.message);
        },
    });

    const openAddModal = () => {
        setEditingWebsite(null);
        setIsModalOpen(true);
    };

    const openEditModal = (website: any) => {
        setEditingWebsite(website);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-56 w-full rounded-2xl" />
                    ))}
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
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Globe className="h-8 w-8 text-indigo-500" />
                        Demo Websites
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Showcase and manage demo web applications and showcase links.
                    </p>
                </div>
                <Button
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 flex gap-2 items-center cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    Add Demo Website
                </Button>
            </div>

            {/* Controls Bar: Search Left, Filter Button Right */}
            <div className="flex items-center justify-between gap-3 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border shadow-xs">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSearchQuery(searchInput);
                    }}
                    className="relative w-full sm:max-w-md flex flex-1 items-center"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search demo websites by name, link, category... (Press Enter)"
                        className="pl-9 pr-20 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 text-foreground h-10 transition-all w-full"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                setSearchQuery(searchInput);
                            }
                        }}
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
                        className="bg-background/50 border-border hover:bg-accent text-foreground h-10 gap-2 cursor-pointer relative font-semibold text-xs"
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
                title="Demo Website Filters"
                description="Filter showcase demo websites by industry or project category."
            >
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
                        <Select
                            value={tempFilterCategory}
                            onValueChange={(val: any) => setTempFilterCategory(typeof val === "string" ? val : "All")}
                        >
                            <SelectTrigger className="bg-background border-border text-foreground h-10! cursor-pointer w-full">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160]">
                                <SelectItem value="All" className="h-10">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat} className="h-10">
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FilterDrawer>

            {/* Content Grid */}
            {websites.length === 0 ? (
                <div className="text-center py-16 bg-card/40 rounded-2xl border border-dashed border-border p-8 space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Globe className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No Demo Websites Found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        There are no demo websites matching your criteria. Click below to create your first showcase website.
                    </p>
                    <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" /> Add Demo Website
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {websites.map((website: any) => (
                        <Card
                            key={website._id}
                            className="group border border-border/80 bg-card hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between"
                        >
                            <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-indigo-500 transition-colors">
                                                {website.title}
                                            </h3>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 shrink-0 text-xs font-semibold"
                                        >
                                            {website.category}
                                        </Badge>
                                    </div>

                                    {website.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                            {website.description}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2 mt-4">
                                    <a
                                        href={website.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                                    >
                                        Visit Live Demo <ExternalLink className="h-3.5 w-3.5" />
                                    </a>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditModal(website)}
                                            className="h-8 w-8 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 cursor-pointer"
                                            title="Edit"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setWebsiteToDelete(website)}
                                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Demo Website Form Modal */}
            <DemoWebsiteFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingWebsite={editingWebsite}
            />

            {/* Custom Delete Confirmation Modal */}
            {websiteToDelete && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setWebsiteToDelete(null)}
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
                                    <h3 className="text-lg font-bold text-foreground">Delete Demo Website</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                                Are you sure you want to delete <span className="font-semibold text-rose-500">"{websiteToDelete.title}"</span>?
                            </p>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setWebsiteToDelete(null)}
                                    disabled={deleteMutation.isPending}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => deleteMutation.mutate(websiteToDelete._id)}
                                    disabled={deleteMutation.isPending}
                                    className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                >
                                    {deleteMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Deleting...
                                        </>
                                    ) : (
                                        "Delete Demo Website"
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
}
