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
        setFormInitialData({
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

            // Ultra-Clean Executive Corporate Palette
            const primaryNavy = [15, 23, 42];     // #0f172a Midnight Slate
            const accentBlue = [37, 99, 235];     // #2563eb Royal Blue
            const emeraldGreen = [16, 185, 129];   // #10b981 Emerald Green
            const bodySlate = [51, 65, 85];        // #334155 Slate 700
            const mutedSlate = [100, 116, 139];    // #64748b Slate 500
            const lightBorder = [226, 232, 240];    // #e2e8f0 Slate 200
            const softBg = [248, 250, 252];        // #f8fafc Slate 50

            // Top Decorative Thin Accent Bar (3mm)
            doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
            doc.rect(0, 0, pageWidth, 3, "F");

            let y = 16;

            // Fetch brand SVG icons
            const fbIconP = getSvgIconBase64('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2563eb"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>');
            const liIconP = getSvgIconBase64('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0284c7"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>');
            const linkIconP = getSvgIconBase64('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2563eb"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>');
            
            const [fbIcon, liIcon, linkIcon] = await Promise.all([fbIconP, liIconP, linkIconP]);

            // --- EXECUTIVE HEADER BRANDING ---
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
                doc.addImage(logoBase64, "PNG", 16, y, 14, 14);
                doc.setFontSize(20);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
                doc.text(settings?.companyName || "Opygen", 34, y + 10);
            } else {
                doc.setFontSize(20);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
                doc.text(settings?.companyName || "Opygen", 16, y + 10);
            }

            // DOCUMENT TITLE & METADATA (Right Header)
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
            doc.text("PROJECT PROPOSAL", pageWidth - 16, y + 7, { align: "right" });

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
            const formattedDate = new Date(quote.createdAt || Date.now()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
            doc.text(`DATE: ${formattedDate.toUpperCase()}`, pageWidth - 16, y + 14, { align: "right" });
            doc.text("VALIDITY: 30 DAYS", pageWidth - 16, y + 19, { align: "right" });

            y += 26;

            // Subtle Horizontal Rule
            doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
            doc.setLineWidth(0.5);
            doc.line(16, y, pageWidth - 16, y);
            
            y += 10;

            // --- 2-COLUMN METADATA GRID (ISSUED BY / PREPARED FOR) ---
            const colWidth = (pageWidth - 40) / 2;
            
            // Left Column (Company)
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
            doc.text("FROM (SERVICE PROVIDER)", 16, y);

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
            doc.text(settings?.companyName || "Company Name", 16, y + 6);

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(bodySlate[0], bodySlate[1], bodySlate[2]);
            let compY = y + 11;
            if (settings?.tagline) {
                doc.text(settings.tagline, 16, compY);
                compY += 4.5;
            }
            if (settings?.phone) {
                doc.text(`Tel: ${settings.phone}`, 16, compY);
                compY += 4.5;
            }
            if (settings?.email) {
                doc.text(`Email: ${settings.email}`, 16, compY);
                compY += 4.5;
            }
            if (settings?.website) {
                doc.text(`Web: ${settings.website}`, 16, compY);
            }

            // Right Column (Client)
            const rightColX = 16 + colWidth + 8;
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
            doc.text("PREPARED FOR (CLIENT)", rightColX, y);

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
            doc.text(quote.clientName, rightColX, y + 6);

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(bodySlate[0], bodySlate[1], bodySlate[2]);
            let clientY = y + 11;
            if (quote.clientPhone) {
                doc.text(`Phone: ${quote.clientPhone}`, rightColX, clientY);
                clientY += 4.5;
            }
            if (quote.clientSocialLink) {
                const truncatedLink = quote.clientSocialLink.substring(0, 32) + (quote.clientSocialLink.length > 32 ? '...' : '');
                doc.text(truncatedLink, rightColX, clientY);
            }

            y = Math.max(compY, clientY) + 14;

            // --- PROJECT SCOPE SECTION ---
            doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
            doc.setLineWidth(0.5);
            doc.line(16, y, pageWidth - 16, y);
            y += 8;

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
            doc.text("PROJECT SCOPE & OBJECTIVES", 16, y);

            y += 6;
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
            doc.text(quote.projectName, 16, y);

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
            doc.text(`Duration: ${quote.projectDuration}`, pageWidth - 16, y, { align: "right" });

            y += 8;

            if (quote.projectDetails) {
                doc.setFontSize(8.5);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(bodySlate[0], bodySlate[1], bodySlate[2]);
                const splitDetails = doc.splitTextToSize(
                    quote.projectDetails,
                    pageWidth - 32,
                );
                doc.text(splitDetails, 16, y);
                y += splitDetails.length * 4.5 + 6;
            }

            // --- EXECUTIVE SCOPE TABLE ---
            const tableColumn = [
                "PHASE / DELIVERABLE DESCRIPTION",
                `ESTIMATED BUDGET (${quote.currency})`,
            ];
            const tableRows = quote.phases.map((p: any) => {
                let amountStr = "";
                if (Number(p.minBudget) === Number(p.maxBudget)) {
                    amountStr = `${quote.currency === "USD" ? "$" : ""}${Number(p.minBudget).toLocaleString()}`;
                } else {
                    amountStr = `${quote.currency === "USD" ? "$" : ""}${Number(p.minBudget).toLocaleString()} - ${Number(p.maxBudget).toLocaleString()}`;
                }
                return [
                    `${p.phaseName.toUpperCase()}\n${p.description || ''}`,
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
                    fillColor: [primaryNavy[0], primaryNavy[1], primaryNavy[2]],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8.5,
                    cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
                    halign: "left",
                },
                alternateRowStyles: {
                    fillColor: [softBg[0], softBg[1], softBg[2]],
                },
                bodyStyles: {
                    textColor: [30, 41, 59],
                    fontSize: 8.5,
                    cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
                },
                columnStyles: {
                    0: { cellWidth: "auto" },
                    1: { cellWidth: 65, halign: "right", fontStyle: "bold" },
                },
                didDrawCell: (data) => {
                    if (data.row.section === "body") {
                        doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
                        doc.setLineWidth(0.4);
                        doc.line(
                            data.cell.x,
                            data.cell.y + data.cell.height,
                            data.cell.x + data.cell.width,
                            data.cell.y + data.cell.height
                        );
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

            y = (doc as any).lastAutoTable.finalY + 12;

            // --- FINANCIAL SUMMARY & PAYMENT DETAILS ---
            const boxWidth = (pageWidth - 40) / 2;
            
            // Payment Details Box (Left)
            if (quote.paymentAccount) {
                doc.setFillColor(softBg[0], softBg[1], softBg[2]);
                doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
                doc.setLineWidth(0.5);
                doc.roundedRect(16, y, boxWidth, 34, 2, 2, "FD");

                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
                doc.text("PAYMENT & BANKING DETAILS", 22, y + 7);

                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
                doc.text(`${quote.paymentAccount.providerName}`, 22, y + 13);
                
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(bodySlate[0], bodySlate[1], bodySlate[2]);
                doc.text(`Account Name: ${quote.paymentAccount.accountName}`, 22, y + 18.5);
                doc.setFont("helvetica", "bold");
                doc.text(`A/C: ${quote.paymentAccount.accountNumber}`, 22, y + 24);
                
                if (quote.paymentAccount.routingNumber) {
                    doc.setFont("helvetica", "normal");
                    doc.text(`Routing: ${quote.paymentAccount.routingNumber}`, 22, y + 29);
                }
            }

            // Financial Summary Box (Right)
            const sumBoxX = 16 + boxWidth + 8;
            doc.setFillColor(softBg[0], softBg[1], softBg[2]);
            doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(sumBoxX, y, boxWidth, 34, 2, 2, "FD");

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
            doc.text("ESTIMATED TOTAL BUDGET", sumBoxX + 6, y + 7);

            let totalStr = "";
            if (minTotal === maxTotal) {
                totalStr = `${quote.currency === "USD" ? "$" : ""}${maxTotal.toLocaleString()} ${quote.currency}`;
            } else {
                totalStr = `${quote.currency === "USD" ? "$" : ""}${minTotal.toLocaleString()} - ${maxTotal.toLocaleString()} ${quote.currency}`;
            }
            
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
            doc.text(totalStr, sumBoxX + 6, y + 16);

            // Advance requirement calculation
            const advanceType = quote.advanceType || "percentage";
            const advanceVal = quote.advanceValue ?? quote.advancePercent;

            if (advanceVal !== undefined && advanceVal !== null) {
                let advanceStr = "";
                if (advanceType === "fixed") {
                    advanceStr = `${quote.currency === "USD" ? "$" : ""}${advanceVal.toLocaleString()} ${quote.currency}`;
                } else {
                    const advMin = minTotal * (advanceVal / 100);
                    const advMax = maxTotal * (advanceVal / 100);
                    if (advMin === advMax) {
                        advanceStr = `${quote.currency === "USD" ? "$" : ""}${advMax.toLocaleString()} ${quote.currency}`;
                    } else {
                        advanceStr = `${quote.currency === "USD" ? "$" : ""}${advMin.toLocaleString()} - ${advMax.toLocaleString()} ${quote.currency}`;
                    }
                }

                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
                doc.text(
                    advanceType === "fixed" ? `REQUIRED ADVANCE:` : `REQUIRED ADVANCE (${advanceVal}%):`,
                    sumBoxX + 6,
                    y + 24,
                );
                doc.setFontSize(9.5);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
                doc.text(advanceStr, sumBoxX + 6, y + 29.5);
            }

            // --- EXECUTIVE FOOTER ---
            doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
            doc.setLineWidth(0.5);
            doc.line(16, pageHeight - 14, pageWidth - 16, pageHeight - 14);

            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
            doc.text(
                "Thank you for your business. For any questions regarding this proposal, please contact us.",
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
