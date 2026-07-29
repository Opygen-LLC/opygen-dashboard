"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuoteInput } from "@/lib/validations";
import { toast } from "sonner";
import {
    FileText,
    Plus,
    Trash2,
    Download,
    X,
    Loader2,
    Search,
    Edit,
    CreditCard,
    Eye,
    Tag,
    Filter,
} from "lucide-react";
import { generateQuotePDF } from "@/lib/pdf/quotePdfGenerator";

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
import QuoteFormModal from "./QuoteFormModal";

export default function QuotesView() {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [currencyFilter, setCurrencyFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [tempCurrencyFilter, setTempCurrencyFilter] = useState("all");
    const [tempDateFilter, setTempDateFilter] = useState("all");

    const openFilterDrawer = () => {
        setTempCurrencyFilter(currencyFilter);
        setTempDateFilter(dateFilter);
        setIsFilterOpen(true);
    };

    const handleApplyFilters = () => {
        setCurrencyFilter(tempCurrencyFilter);
        setDateFilter(tempDateFilter);
    };

    const handleResetFilters = () => {
        setTempCurrencyFilter("all");
        setTempDateFilter("all");
        setCurrencyFilter("all");
        setDateFilter("all");
    };

    const activeFilterCount = (currencyFilter !== "all" ? 1 : 0) + (dateFilter !== "all" ? 1 : 0);
    const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [previewQuoteName, setPreviewQuoteName] = useState<string>("");

    // Fetch Quotes
    const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery<any[]>({
        queryKey: ["quotes"],
        queryFn: async () => {
            const res = await fetch("/api/admin/quotes");
            if (!res.ok) throw new Error("Failed to fetch quotes");
            return res.json();
        },
    });

    // Fetch Settings for PDF Company Metadata
    const { data: settings } = useQuery<any>({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await fetch("/api/settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });

    const [formInitialData, setFormInitialData] = useState<Partial<QuoteInput>>({});

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: QuoteInput) => {
            const res = await fetch("/api/admin/quotes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create quote");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
            setIsCreateModalOpen(false);
            setEditingQuoteId(null);
            toast.success("Proposal quote created successfully");
        },
        onError: (err: any) => {
            toast.error(err.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/quotes/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete quote");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
            toast.success("Quote deleted");
            setIsDeleteModalOpen(false);
            setQuoteToDelete(null);
        },
        onError: (err: any) => {
            toast.error(err.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: QuoteInput }) => {
            const res = await fetch(`/api/admin/quotes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update quote");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes"] });
            setIsCreateModalOpen(false);
            setEditingQuoteId(null);
            toast.success("Quote updated successfully");
        },
        onError: (err: any) => {
            toast.error(err.message);
        },
    });

    const onSubmit = (data: QuoteInput) => {
        if (editingQuoteId) {
            updateMutation.mutate({ id: editingQuoteId, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleCreateNewQuote = () => {
        setEditingQuoteId(null);
        setFormInitialData({
            quoteNumber: `PRJ-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            projectName: "",
            proposalType: "SOFTWARE DEVELOPMENT PROPOSAL",
            proposalSubtitle: "Mobile Application — Inventory Management System",
            projectDetails: "",
            clientName: "",
            clientPhone: "",
            clientSocialLink: "",
            currency: "USD",
            advanceType: "percentage",
            advanceValue: null,
            projectDuration: "6–8 Weeks",
            paymentAccount: undefined,
        });
        setIsCreateModalOpen(true);
    };

    const handleEditQuote = (quote: any) => {
        setEditingQuoteId(quote._id);
        setFormInitialData({
            quoteNumber: quote.quoteNumber || `PRJ-${new Date().getFullYear()}-${quote._id.substring(0, 6).toUpperCase()}`,
            projectName: quote.projectName,
            proposalType: quote.proposalType || "SOFTWARE DEVELOPMENT PROPOSAL",
            proposalSubtitle: quote.proposalSubtitle || "",
            projectDetails: quote.projectDetails || "",
            clientName: quote.clientName,
            clientPhone: quote.clientPhone || "",
            clientSocialLink: quote.clientSocialLink || "",
            billedBy: quote.billedBy || {},
            billedTo: quote.billedTo || {},
            projectOverview: quote.projectOverview || quote.projectDetails || "",
            featureSections: quote.featureSections || [],
            phases: quote.phases || [],
            paymentSchedule: quote.paymentSchedule || [],
            termsAndConditions: quote.termsAndConditions || [],
            currency: quote.currency || "USD",
            advanceType: quote.advanceType || "percentage",
            advanceValue: quote.advanceValue ?? quote.advancePercent ?? null,
            projectDuration: quote.projectDuration || "",
            paymentAccount: quote.paymentAccount || null,
            footerNote: quote.footerNote || "",
        });
        setIsCreateModalOpen(true);
    };

    const handlePreviewPDF = (quote: any) => {
        try {
            const doc = generateQuotePDF(quote, settings);
            const blob = doc.output("blob");
            const blobUrl = URL.createObjectURL(blob);
            const nameStr = (quote.quoteNumber || quote.projectName || "proposal")
                .replace(/[^a-zA-Z0-9_-]/g, "_");
            setPdfPreviewUrl(blobUrl);
            setPreviewQuoteName(`Proposal_${nameStr}.pdf`);
            setIsPreviewModalOpen(true);
        } catch (error: any) {
            console.error("PDF Preview Error:", error);
            toast.error("Failed to generate PDF preview");
        }
    };

    const handleDownloadPDF = (quote: any) => {
        try {
            const doc = generateQuotePDF(quote, settings);
            const nameStr = (quote.quoteNumber || quote.projectName || "proposal")
                .replace(/[^a-zA-Z0-9_-]/g, "_");
            doc.save(`Proposal_${nameStr}.pdf`);
            toast.success("PDF downloaded successfully");
        } catch (error: any) {
            console.error("PDF Download Error:", error);
            toast.error("Failed to download PDF");
        }
    };

    const uniqueCurrencies = React.useMemo(() => {
        const currencies = new Set<string>();
        quotes.forEach((q) => {
            if (q.currency) currencies.add(q.currency);
        });
        return Array.from(currencies).sort();
    }, [quotes]);

    const filteredQuotes = quotes.filter((q) => {
        const matchesSearch =
            (q.quoteNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCurrency =
            currencyFilter === "all" || q.currency === currencyFilter;

        let matchesDate = true;
        if (dateFilter !== "all" && q.createdAt) {
            const date = new Date(q.createdAt);
            const now = new Date();

            if (dateFilter === "7days") {
                const limit = new Date();
                limit.setDate(now.getDate() - 7);
                matchesDate = date >= limit;
            } else if (dateFilter === "30days") {
                const limit = new Date();
                limit.setDate(now.getDate() - 30);
                matchesDate = date >= limit;
            } else if (dateFilter === "thisMonth") {
                matchesDate =
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();
            } else if (dateFilter === "lastMonth") {
                const limit = new Date();
                limit.setMonth(now.getMonth() - 1);
                matchesDate =
                    date.getMonth() === limit.getMonth() &&
                    date.getFullYear() === limit.getFullYear();
            } else if (dateFilter === "thisYear") {
                matchesDate = date.getFullYear() === now.getFullYear();
            }
        }

        return matchesSearch && matchesCurrency && matchesDate;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Quotes & Proposals
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Create dynamic project proposal quotes, assign receiving user payment accounts, and export multi-page PDFs.
                    </p>
                </div>
                <Button
                    onClick={handleCreateNewQuote}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm font-semibold"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create Proposal Quote
                </Button>
            </div>

            {/* Controls Bar: Search Left, Filter Button Right */}
            <div className="flex items-center justify-between gap-3 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border shadow-xs">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSearchQuery(searchInput);
                    }}
                    className="relative w-full sm:max-w-md flex items-center flex-1"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by quote #, project or client..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9 pr-20 h-10 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-600 w-full"
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer"
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
                title="Quote & Proposal Filters"
                description="Filter quotes by creation date range or payment currency."
            >
                <div className="space-y-4 flex gap-2">
                    <div className="space-y-1.5 flex-1">
                        <Label className="text-xs font-semibold text-muted-foreground">Date Range</Label>
                        <Select value={tempDateFilter} onValueChange={(val: any) => setTempDateFilter(val)}>
                            <SelectTrigger className="w-full h-10! bg-background border-border text-foreground">
                                <SelectValue placeholder="All Time" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160]">
                                <SelectItem value="all" className="h-10">All Time</SelectItem>
                                <SelectItem value="7days" className="h-10">Last 7 Days</SelectItem>
                                <SelectItem value="30days" className="h-10">Last 30 Days</SelectItem>
                                <SelectItem value="thisMonth" className="h-10">This Month</SelectItem>
                                <SelectItem value="lastMonth" className="h-10">Last Month</SelectItem>
                                <SelectItem value="thisYear" className="h-10">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <Label className="text-xs font-semibold text-muted-foreground">Currency</Label>
                        <Select
                            value={tempCurrencyFilter}
                            onValueChange={(val: any) => setTempCurrencyFilter(val)}
                        >
                            <SelectTrigger className="w-full h-10! bg-background border-border text-foreground">
                                <SelectValue placeholder="All Currencies" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground z-[160]">
                                <SelectItem value="all" className="h-10">All Currencies</SelectItem>
                                {uniqueCurrencies.map((currency) => (
                                    <SelectItem key={currency} value={currency} className="h-10">
                                        {currency}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FilterDrawer>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Quote Ref #</th>
                                <th className="px-6 py-4">Project & Subtitle</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Payment Account</th>
                                <th className="px-6 py-4">Currency</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoadingQuotes ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-600" />
                                        Loading proposal quotes...
                                    </td>
                                </tr>
                            ) : filteredQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        No proposal quotes found.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotes.map((quote) => {
                                    const quoteRef = quote.quoteNumber || `PRJ-${new Date(quote.createdAt || Date.now()).getFullYear()}-${quote._id.substring(0, 6).toUpperCase()}`;

                                    return (
                                        <tr key={quote._id} className="hover:bg-accent/30 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-teal-700 text-xs">
                                                <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 px-2.5 py-1 border border-teal-500/20">
                                                    <Tag className="h-3 w-3 text-teal-600" /> {quoteRef}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                <div className="font-bold text-sm text-foreground">{quote.projectName}</div>
                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                    {quote.proposalSubtitle || quote.proposalType || "Proposal"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-foreground text-sm">
                                                    {quote.clientName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {quote.billedTo?.company || quote.clientPhone || quote.clientSocialLink || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {quote.paymentAccount?.providerName ? (
                                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                        <CreditCard className="h-3 w-3" /> {quote.paymentAccount.providerName}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">None attached</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {quote.currency || "USD"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Preview PDF"
                                                        onClick={() => handlePreviewPDF(quote)}
                                                        className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-500/10 cursor-pointer"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Download PDF"
                                                        onClick={() => handleDownloadPDF(quote)}
                                                        className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 cursor-pointer"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Edit Quote"
                                                        onClick={() => handleEditQuote(quote)}
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 cursor-pointer"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Delete Quote"
                                                        onClick={() => {
                                                            setQuoteToDelete(quote._id);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <QuoteFormModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                mode={editingQuoteId ? "edit" : "create"}
                initialData={formInitialData}
                onSubmit={onSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Delete Quote
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete this quote? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setQuoteToDelete(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (quoteToDelete) {
                                        deleteMutation.mutate(quoteToDelete);
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Delete"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Preview Modal */}
            {isPreviewModalOpen && pdfPreviewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm transition-all">
                    <div className="bg-white w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-gray-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-none">
                                        Proposal PDF Preview
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 font-mono">
                                        {previewQuoteName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={pdfPreviewUrl}
                                    download={previewQuoteName}
                                    className="inline-flex items-center justify-center bg-teal-700 hover:bg-teal-800 text-white shadow-xs rounded-lg px-5 h-9 text-xs font-semibold transition-colors"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </a>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setIsPreviewModalOpen(false);
                                        setPdfPreviewUrl(null);
                                    }}
                                    className="h-9 w-9 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="flex-1 p-0 overflow-hidden relative bg-gray-100 flex items-center justify-center">
                            <iframe
                                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full h-full border-0"
                                title="PDF Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
