"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteSchema, QuoteInput } from "@/lib/validations";
import { toast } from "sonner";
import {
    FileText,
    Plus,
    Trash2,
    Download,
    X,
    Loader2,
    Search,
    Sparkles,
    Edit,
    UserCircle2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function QuotesView() {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currencyFilter, setCurrencyFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
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

    // Fetch Settings for PDF
    const { data: settings } = useQuery<any>({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await fetch("/api/settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });

    // Fetch Accounts for PDF Payment Details
    const { data: accountsData } = useQuery<any>({
        queryKey: ["adminAccountsList"],
        queryFn: async () => {
            const res = await fetch("/api/admin/accounts?limit=100");
            if (!res.ok) throw new Error("Failed to fetch accounts");
            return res.json();
        },
    });
    const accountsList = accountsData?.accounts || [];

    // Form
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<QuoteInput>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
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
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "phases",
    });

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
            reset();
            toast.success("Quote created successfully");
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
            reset();
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
        reset({
            projectName: "",
            projectDetails: "",
            clientName: "",
            clientPhone: "",
            clientSocialLink: "",
            currency: "USD",
            advanceType: "percentage",
            advanceValue: null,
            projectDuration: "",
            paymentAccount: null,
            phases: [
                { phaseName: "", description: "", minBudget: 0, maxBudget: 0 },
            ],
        });
        setIsCreateModalOpen(true);
    };

    const handleEditQuote = (quote: any) => {
        setEditingQuoteId(quote._id);
        reset({
            projectName: quote.projectName,
            projectDetails: quote.projectDetails || "",
            clientName: quote.clientName,
            clientPhone: quote.clientPhone || "",
            clientSocialLink: quote.clientSocialLink || "",
            currency: quote.currency || "USD",
            advanceType: quote.advanceType || "percentage",
            advanceValue: quote.advanceValue ?? quote.advancePercent ?? null,
            projectDuration: quote.projectDuration || "",
            paymentAccount: quote.paymentAccount || null,
            phases: quote.phases.map((p: any) => ({
                phaseName: p.phaseName,
                description: p.description || "",
                minBudget: p.minBudget,
                maxBudget: p.maxBudget,
            })),
        });
        setIsCreateModalOpen(true);
    };

    const getBase64Image = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                } else {
                    reject(new Error("Canvas context failed"));
                }
            };
            img.onerror = (error) => reject(error);
            img.src = url;
        });
    };

    const getSvgIconBase64 = (svgString: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svg);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 24;
                canvas.height = 24;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                }
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    };

    const generatePDF = async (quote: any) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let y = 20;

            // Fetch standard icons - Dark Monochrome version
            const fbIconP = getSvgIconBase64('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0f172a"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>');
            const liIconP = getSvgIconBase64('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0f172a"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>');
            const linkIconP = getSvgIconBase64('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0f172a"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>');
            
            const [fbIcon, liIcon, linkIcon] = await Promise.all([fbIconP, liIconP, linkIconP]);

            // --- HEADER ---
            // Logo on the top left
            let logoBase64 = null;
            if (settings?.logo && settings.logo.trim() !== "") {
                try {
                    logoBase64 = await getBase64Image(settings.logo);
                } catch (e) {}
            }
            if (!logoBase64) {
                try {
                    logoBase64 = await getBase64Image(
                        window.location.origin + "/logo.png",
                    );
                } catch (e) {}
            }

            if (logoBase64) {
                doc.addImage(logoBase64, "PNG", 16, y, 16, 16);
                doc.setFontSize(22);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42); // Slate 900
                doc.text("Opygen", 36, y + 12);
            } else {
                doc.setFontSize(22);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42);
                doc.text("Opygen", 16, y + 12);
            }

            // PROPOSAL TITLE on the right
            doc.setFontSize(36);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text("PROPOSAL", pageWidth - 16, y + 12, { align: "right" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139); // Slate 500
            doc.text(
                `DATE: ${new Date(quote.createdAt || Date.now()).toLocaleDateString().toUpperCase()}`,
                pageWidth - 16,
                y + 20,
                { align: "right" },
            );

            y += 28;

            // --- SEPARATOR ---
            doc.setDrawColor(226, 232, 240); // Slate 200
            doc.setLineWidth(0.5);
            doc.line(16, y, pageWidth - 16, y);
            
            y += 12;

            // --- COMPANY & CLIENT INFO (Clean Layout) ---
            
            // Company Info (Left)
            let boxY = y;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(settings?.companyName || "Company Name", 16, boxY);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105); // Slate 600
            boxY += 6;
            if (settings?.tagline) {
                doc.text(settings.tagline, 16, boxY);
                boxY += 5;
            }
            if (settings?.phone) {
                doc.text(settings.phone, 16, boxY);
                boxY += 5;
            }
            if (settings?.email) {
                doc.text(settings.email, 16, boxY);
                boxY += 5;
            }
            if (settings?.website) {
                doc.text(settings.website, 16, boxY);
                boxY += 5;
            }

            // Social icons loop for company
            let socialX = 16;
            if (settings?.socials?.facebook) {
                doc.addImage(fbIcon, "PNG", socialX, boxY - 3, 4, 4);
                socialX += 6;
            }
            if (settings?.socials?.linkedin) {
                doc.addImage(liIcon, "PNG", socialX, boxY - 3, 4, 4);
            }

            // Client Info (Right)
            let rightY = y;
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.text("PREPARED FOR", pageWidth - 16, rightY, { align: "right" });

            rightY += 6;
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(quote.clientName, pageWidth - 16, rightY, { align: "right" });
            
            rightY += 6;
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            if (quote.clientPhone) {
                doc.text(quote.clientPhone, pageWidth - 16, rightY, { align: "right" });
                rightY += 5;
            }
            if (quote.clientSocialLink) {
                doc.text(quote.clientSocialLink.substring(0, 30) + (quote.clientSocialLink.length > 30 ? '...' : ''), pageWidth - 23, rightY, { align: "right" });
                doc.addImage(linkIcon, "PNG", pageWidth - 21, rightY - 3, 4, 4);
            }

            y = Math.max(boxY, rightY) + 20;

            // --- PROJECT DETAILS ---
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(quote.projectName, 16, y);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(
                `Duration: ${quote.projectDuration}`,
                16,
                y + 6,
            );

            y += 16;

            if (quote.projectDetails) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                const splitDetails = doc.splitTextToSize(
                    quote.projectDetails,
                    pageWidth - 32,
                );
                doc.text(splitDetails, 16, y);
                y += splitDetails.length * 5 + 8;
            }

            // --- TABLE ---
            // Combine MIN/MAX into a single AMOUNT column
            const tableColumn = [
                "PHASE / DESCRIPTION",
                `AMOUNT (${quote.currency})`,
            ];
            const tableRows = quote.phases.map((p: any) => {
                let amountStr = "";
                if (Number(p.minBudget) === Number(p.maxBudget)) {
                    amountStr = Number(p.minBudget).toLocaleString();
                } else {
                    amountStr = `${Number(p.minBudget).toLocaleString()} - ${Number(p.maxBudget).toLocaleString()}`;
                }
                return [
                    `${p.phaseName}\n${p.description}`,
                    amountStr
                ];
            });

            autoTable(doc, {
                startY: y,
                head: [tableColumn],
                body: tableRows,
                theme: "plain",
                margin: { left: 16, right: 16 },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [15, 23, 42],
                    fontStyle: "bold",
                    fontSize: 9,
                    cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
                },
                bodyStyles: {
                    textColor: [51, 65, 85], // Slate 700
                    fontSize: 9,
                    cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
                },
                columnStyles: {
                    0: { cellWidth: "auto" },
                    1: { cellWidth: 55, halign: "right" },
                },
                didDrawCell: (data) => {
                    if (data.row.section === "head") {
                        // Top border
                        doc.setDrawColor(15, 23, 42); // Slate 900
                        doc.setLineWidth(1);
                        if (data.row.index === 0) {
                            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                        }
                        // Bottom border
                        doc.setLineWidth(0.5);
                        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                    }
                    if (data.row.section === "body") {
                        // Very faint bottom border for rows
                        doc.setDrawColor(241, 245, 249); // Slate 100
                        doc.setLineWidth(0.5);
                        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                    }
                },
            });

            // Calculate Totals
            let minTotal = 0;
            let maxTotal = 0;
            quote.phases.forEach((p: any) => {
                minTotal += Number(p.minBudget) || 0;
                maxTotal += Number(p.maxBudget) || 0;
            });

            y = (doc as any).lastAutoTable.finalY + 15;

            // --- SUMMARY TOTALS & PAYMENT ---

            // Totals (Right side)
            const totalsX = pageWidth / 2 + 10;
            const totalsRightX = pageWidth - 16;

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text("Estimated Total", totalsX, y);
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);
            
            let totalStr = "";
            if (minTotal === maxTotal) {
                totalStr = `${maxTotal.toLocaleString()} ${quote.currency}`;
            } else {
                totalStr = `${minTotal.toLocaleString()} - ${maxTotal.toLocaleString()} ${quote.currency}`;
            }
            doc.text(totalStr, totalsRightX, y, { align: "right" });

            const advanceType = quote.advanceType || "percentage";
            const advanceVal = quote.advanceValue ?? quote.advancePercent;

            if (advanceVal !== undefined && advanceVal !== null) {
                let advanceStr = "";
                if (advanceType === "fixed") {
                    advanceStr = `${advanceVal.toLocaleString()} ${quote.currency}`;
                } else {
                    const advMin = minTotal * (advanceVal / 100);
                    const advMax = maxTotal * (advanceVal / 100);
                    if (advMin === advMax) {
                        advanceStr = `${advMax.toLocaleString()} ${quote.currency}`;
                    } else {
                        advanceStr = `${advMin.toLocaleString()} - ${advMax.toLocaleString()} ${quote.currency}`;
                    }
                }

                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139);
                doc.text(
                    advanceType === "fixed"
                        ? `Required Advance:`
                        : `Required Advance (${advanceVal}%):`,
                    totalsX,
                    y + 8,
                );
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42);
                doc.text(
                    advanceStr,
                    totalsRightX,
                    y + 8,
                    { align: "right" },
                );
            }

            // Payment Account Details (Left side)
            if (quote.paymentAccount) {
                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(148, 163, 184); // Slate 400
                doc.text("PAYMENT DETAILS", 16, y);

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42);
                let accY = y + 6;
                doc.text(`${quote.paymentAccount.providerName}`, 16, accY);
                
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                accY += 5;
                doc.text(`Account Name: ${quote.paymentAccount.accountName}`, 16, accY);
                
                accY += 5;
                doc.setFont("helvetica", "bold");
                doc.text(`A/C: ${quote.paymentAccount.accountNumber}`, 16, accY);
                
                doc.setFont("helvetica", "normal");
                accY += 5;
                if (quote.paymentAccount.routingNumber) {
                    doc.text(`Routing: ${quote.paymentAccount.routingNumber}`, 16, accY);
                    accY += 5;
                }
                if (quote.paymentAccount.branch) {
                    doc.text(`Branch: ${quote.paymentAccount.branch}`, 16, accY);
                }
            }

            // --- FOOTER ---
            // Elegant simple footer border
            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.5);
            doc.line(16, pageHeight - 15, pageWidth - 16, pageHeight - 15);
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.text(
                "Thank you for your business. This proposal is valid for 30 days.",
                pageWidth / 2,
                pageHeight - 8,
                { align: "center" },
            );

            // Show PDF Preview
            const pdfBlob = doc.output("blob");
            const blobUrl = URL.createObjectURL(pdfBlob);
            setPdfPreviewUrl(blobUrl);
            setPreviewQuoteName(
                `Quote_${quote.projectName.replace(/\s+/g, "_")}.pdf`,
            );
            setIsPreviewModalOpen(true);
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF");
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
                        Create and manage project quotes and generate PDFs.
                    </p>
                </div>
                <Button
                    onClick={handleCreateNewQuote}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create Quote
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search quotes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 w-full"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-full h-10! bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500">
                            <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="h-10!">
                                All Time
                            </SelectItem>
                            <SelectItem value="7days" className="h-10!">
                                Last 7 Days
                            </SelectItem>
                            <SelectItem value="30days" className="h-10!">
                                Last 30 Days
                            </SelectItem>
                            <SelectItem value="thisMonth" className="h-10!">
                                This Month
                            </SelectItem>
                            <SelectItem value="lastMonth" className="h-10!">
                                Last Month
                            </SelectItem>
                            <SelectItem value="thisYear" className="h-10!">
                                This Year
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full sm:w-48">
                    <Select
                        value={currencyFilter}
                        onValueChange={setCurrencyFilter}
                    >
                        <SelectTrigger className="w-full h-10! bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500">
                            <SelectValue placeholder="All Currencies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="h-10!">
                                All Currencies
                            </SelectItem>
                            {uniqueCurrencies.map((currency) => (
                                <SelectItem
                                    key={currency}
                                    value={currency}
                                    className="h-10!"
                                >
                                    {currency}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-accent/50 text-muted-foreground text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Project Name</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Currency</th>
                                <th className="px-6 py-4">Phases</th>
                                <th className="px-6 py-4 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoadingQuotes ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                        Loading quotes...
                                    </td>
                                </tr>
                            ) : filteredQuotes.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        No quotes found.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotes.map((quote) => (
                                    <tr
                                        key={quote._id}
                                        className="hover:bg-accent/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {quote.projectName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">
                                                {quote.clientName}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {quote.clientPhone ||
                                                    quote.clientSocialLink}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                                {quote.currency}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {quote.phases?.length || 0} phase(s)
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        generatePDF(quote)
                                                    }
                                                    className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 cursor-pointer"
                                                >
                                                    <Sparkles className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleEditQuote(quote)
                                                    }
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 cursor-pointer"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setQuoteToDelete(
                                                            quote._id,
                                                        );
                                                        setIsDeleteModalOpen(
                                                            true,
                                                        );
                                                    }}
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
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
            </div>

            {/* Create Quote Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsCreateModalOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">
                                {editingQuoteId ? "Edit Quote" : "Create Quote"}
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="h-8 w-8 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-6"
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
                                            {
                                                (errors.projectName as any)
                                                    .message
                                            }
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
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger className="w-32 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 h-10! flex-1">
                                                        <SelectValue placeholder="Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="USD"
                                                            className="h-10!"
                                                        >
                                                            USD
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="BDT"
                                                            className="h-10!"
                                                        >
                                                            BDT
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="EUR"
                                                            className="h-10!"
                                                        >
                                                            EUR
                                                        </SelectItem>
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
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 h-10! flex-1">
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem
                                                                value="percentage"
                                                                className="h-10!"
                                                            >
                                                                Percent (%)
                                                            </SelectItem>
                                                            <SelectItem
                                                                value="fixed"
                                                                className="h-10!"
                                                            >
                                                                Fixed
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            <Input
                                                type="number"
                                                {...register("advanceValue")}
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
                                                    field.onChange(
                                                        JSON.parse(val),
                                                    );
                                                }}
                                                value={
                                                    field.value
                                                        ? JSON.stringify(
                                                              field.value,
                                                          )
                                                        : undefined
                                                }
                                            >
                                                <SelectTrigger className="bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 h-10! w-full text-left">
                                                    <SelectValue placeholder="Select an account to display on PDF" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accountsList.map(
                                                        (
                                                            accItem: any,
                                                            idx: number,
                                                        ) => {
                                                            const valStr =
                                                                JSON.stringify({
                                                                    providerName:
                                                                        accItem
                                                                            .account
                                                                            .providerName,
                                                                    accountName:
                                                                        accItem
                                                                            .account
                                                                            .accountName,
                                                                    accountNumber:
                                                                        accItem
                                                                            .account
                                                                            .accountNumber,
                                                                    routingNumber:
                                                                        accItem
                                                                            .account
                                                                            .routingNumber,
                                                                    branch: accItem
                                                                        .account
                                                                        .branch,
                                                                });

                                                            const userName =
                                                                accItem.user
                                                                    ?.name ||
                                                                accItem.userName ||
                                                                "Unknown";
                                                            const hash =
                                                                userName
                                                                    .split("")
                                                                    .reduce(
                                                                        (
                                                                            acc: number,
                                                                            char: string,
                                                                        ) =>
                                                                            acc +
                                                                            char.charCodeAt(
                                                                                0,
                                                                            ),
                                                                        0,
                                                                    );
                                                            const colors = [
                                                                "bg-blue-50/80 hover:bg-blue-100 text-blue-900 border-l-4 border-blue-500",
                                                                "bg-green-50/80 hover:bg-green-100 text-green-900 border-l-4 border-green-500",
                                                                "bg-purple-50/80 hover:bg-purple-100 text-purple-900 border-l-4 border-purple-500",
                                                                "bg-amber-50/80 hover:bg-amber-100 text-amber-900 border-l-4 border-amber-500",
                                                                "bg-pink-50/80 hover:bg-pink-100 text-pink-900 border-l-4 border-pink-500",
                                                                "bg-teal-50/80 hover:bg-teal-100 text-teal-900 border-l-4 border-teal-500",
                                                            ];
                                                            const colorClass =
                                                                colors[
                                                                    hash %
                                                                        colors.length
                                                                ];

                                                            return (
                                                                <SelectItem
                                                                    key={idx}
                                                                    value={
                                                                        valStr
                                                                    }
                                                                    className={`mb-2 mx-1 rounded-md transition-colors ${colorClass}`}
                                                                >
                                                                    <div className="flex flex-col gap-1 py-1">
                                                                        <div className="font-semibold text-sm">
                                                                            {
                                                                                accItem
                                                                                    .account
                                                                                    .providerName
                                                                            }{" "}
                                                                            -{" "}
                                                                            {
                                                                                accItem
                                                                                    .account
                                                                                    .accountNumber
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs opacity-80 flex items-center gap-1">
                                                                            <UserCircle2 className="h-3 w-3" />
                                                                            {
                                                                                userName
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </SelectItem>
                                                            );
                                                        },
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.paymentAccount && (
                                                <p className="text-xs text-red-500">
                                                    {
                                                        errors.paymentAccount
                                                            .message
                                                    }
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
                                        <Plus className="mr-1 h-3 w-3 group-hover:text-white" /> Add
                                        Phase
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
                                                    {...register(
                                                        `phases.${index}.phaseName`,
                                                    )}
                                                    placeholder="e.g. Frontend"
                                                    className="h-10 text-sm bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500"
                                                />
                                                {errors.phases?.[index]
                                                    ?.phaseName && (
                                                    <p className="text-xs text-red-500">
                                                        {
                                                            errors.phases?.[
                                                                index
                                                            ]?.phaseName
                                                                ?.message
                                                        }
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
                                                        {...register(
                                                            `phases.${index}.minBudget`,
                                                        )}
                                                        placeholder="Min"
                                                        className="h-10 text-sm bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500"
                                                    />
                                                    {errors.phases?.[index]
                                                        ?.minBudget && (
                                                        <p className="text-xs text-red-500">
                                                            {
                                                                errors.phases?.[
                                                                    index
                                                                ]?.minBudget
                                                                    ?.message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">
                                                        Max Budget
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        {...register(
                                                            `phases.${index}.maxBudget`,
                                                        )}
                                                        placeholder="Max"
                                                        className="h-10 text-sm bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500"
                                                    />
                                                    {errors.phases?.[index]
                                                        ?.maxBudget && (
                                                        <p className="text-xs text-red-500">
                                                            {
                                                                errors.phases?.[
                                                                    index
                                                                ]?.maxBudget
                                                                    ?.message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="sm:col-span-2 space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Description
                                                </label>
                                                <Textarea
                                                    {...register(
                                                        `phases.${index}.description`,
                                                    )}
                                                    className="min-h-20 text-sm bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        createMutation.isPending ||
                                        updateMutation.isPending
                                    }
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                                >
                                    {createMutation.isPending ||
                                    updateMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    {editingQuoteId
                                        ? "Update Quote"
                                        : "Create Quote"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Delete Quote
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete this quote? This
                            action cannot be undone.
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
                    <div className="bg-white w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden relative border border-gray-200">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200 z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-none">
                                        Proposal Preview
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {previewQuoteName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="default"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg px-6 h-10 font-medium transition-colors"
                                    asChild
                                >
                                    <a
                                        href={pdfPreviewUrl}
                                        download={previewQuoteName}
                                        className="flex items-center"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </a>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setIsPreviewModalOpen(false);
                                        setPdfPreviewUrl(null);
                                    }}
                                    className="h-10 w-10 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
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
