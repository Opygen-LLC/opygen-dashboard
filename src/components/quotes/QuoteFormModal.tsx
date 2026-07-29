"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteSchema, QuoteInput } from "@/lib/validations";
import { formatUserTitle } from "@/lib/utils";
import {
    X,
    Plus,
    Loader2,
    UserCircle2,
    RefreshCw,
    DollarSign,
    FileText,
    ShieldCheck,
    CreditCard,
    Info,
    ListChecks,
    User,
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface QuoteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Partial<QuoteInput>;
    onSubmit: (data: QuoteInput) => void;
    isSubmitting?: boolean;
    mode: "create" | "edit" | "convert";
}

const DEFAULT_TERMS = [
    {
        title: "Project Timeline",
        text: "The estimated project timeline is 6–8 weeks from the date of advance payment receipt. Timeline may be adjusted based on mutual agreement and client feedback cycles.",
    },
    {
        title: "Revisions",
        text: "Each phase includes up to 3 rounds of revisions at no additional cost. Additional revisions beyond this limit will be billed at an hourly rate agreed upon in writing.",
    },
    {
        title: "Intellectual Property",
        text: "Upon final payment, the client shall own all custom code, design assets, and deliverables produced under this agreement. Developer retains rights to use the work for portfolio purposes only.",
    },
    {
        title: "Confidentiality",
        text: "Both parties agree to keep all project details, communications, and business information strictly confidential and not to disclose to any third party without prior written consent.",
    },
    {
        title: "Payment Terms",
        text: "All payments are non-refundable once work on that phase has commenced. Late payments beyond 7 days of due date may result in a pause in project delivery.",
    },
    {
        title: "Support & Warranty",
        text: "Developer provides 30 days of post-delivery bug fixes at no charge. Feature additions or third-party integration issues are outside this warranty scope.",
    },
    {
        title: "Dispute Resolution",
        text: "Any disputes arising from this agreement shall first be attempted to be resolved amicably through written communication. Both parties agree to act in good faith.",
    },
];

export default function QuoteFormModal({
    isOpen,
    onClose,
    initialData,
    onSubmit,
    isSubmitting = false,
    mode,
}: QuoteFormModalProps) {
    const [activeTab, setActiveTab] = useState<
        "general" | "features" | "pricing" | "payment" | "terms"
    >("general");

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

    // Fetch Users List for BILLED BY developer selection
    const { data: usersList = [] } = useQuery<any[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/users");
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen,
    });

    const generateUniqueQuoteNumber = () => {
        const randomCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
        return `PRJ-${new Date().getFullYear()}-${randomCode}`;
    };

    const defaultFormValues: QuoteInput = {
        quoteNumber: initialData?.quoteNumber || generateUniqueQuoteNumber(),
        projectName: initialData?.projectName || "Software Development Proposal",
        proposalType:
            initialData?.proposalType || "SOFTWARE DEVELOPMENT PROPOSAL",
        proposalSubtitle:
            initialData?.proposalSubtitle ||
            "Mobile Application — Inventory Management System",
        projectDetails: initialData?.projectDetails || "",
        clientName: initialData?.clientName || "",
        clientPhone: initialData?.clientPhone || "",
        clientSocialLink: initialData?.clientSocialLink || "",
        billedBy: {
            name: initialData?.billedBy?.name || "MD. Faysal Mridha",
            title: initialData?.billedBy?.title || "Full Stack Developer",
            email: initialData?.billedBy?.email || "",
            phone: initialData?.billedBy?.phone || "",
        },
        billedTo: {
            name: initialData?.billedTo?.name || initialData?.clientName || "",
            company: initialData?.billedTo?.company || "",
            country: initialData?.billedTo?.country || "",
            email: initialData?.billedTo?.email || "",
            phone:
                initialData?.billedTo?.phone || initialData?.clientPhone || "",
            socialLink:
                initialData?.billedTo?.socialLink ||
                initialData?.clientSocialLink ||
                "",
        },
        projectOverview:
            initialData?.projectOverview || initialData?.projectDetails || "",
        featureSections:
            initialData?.featureSections &&
            initialData.featureSections.length > 0
                ? initialData.featureSections
                : [
                      {
                          title: "CLIENT-FACING APP FEATURES",
                          description:
                              "The following features will be developed and delivered as part of the mobile application:",
                          features: [
                              {
                                  featureName: "App Icon & Animations",
                                  description:
                                      "Custom branded app icon with smooth launch and transition animations for a polished user experience.",
                              },
                              {
                                  featureName: "Home Screen — Inventory Feed",
                                  description:
                                      "Central dashboard displaying all available inventory items in a clean, scrollable card-based layout.",
                              },
                          ],
                      },
                  ],
        currency: initialData?.currency || "USD",
        advanceType: initialData?.advanceType || "percentage",
        advanceValue: initialData?.advanceValue ?? null,
        projectDuration: initialData?.projectDuration || "6-8 Weeks",
        phases:
            initialData?.phases && initialData.phases.length > 0
                ? initialData.phases
                : [
                      {
                          phaseName: "Frontend Development",
                          description: "UI/UX Design & Implementation",
                          phaseTag: "Phase 1",
                          minBudget: 1000,
                          maxBudget: 1000,
                      },
                      {
                          phaseName: "Backend Development & Deployment",
                          description:
                              "Server-side logic, API integration, hosting",
                          phaseTag: "Phase 2",
                          minBudget: 700,
                          maxBudget: 700,
                      },
                  ],
        paymentSchedule:
            initialData?.paymentSchedule &&
            initialData.paymentSchedule.length > 0
                ? initialData.paymentSchedule
                : [
                      {
                          pmtNo: 1,
                          milestone: "Advance Payment",
                          calculation: "30% of Total",
                          amount: 510,
                      },
                      {
                          pmtNo: 2,
                          milestone: "After Frontend Delivery",
                          calculation: "Frontend ($1,000) - Advance ($510)",
                          amount: 490,
                      },
                      {
                          pmtNo: 3,
                          milestone: "After Backend & Deployment",
                          calculation: "Full Backend Cost",
                          amount: 700,
                      },
                  ],
        paymentAccount: initialData?.paymentAccount || null,
        termsAndConditions:
            initialData?.termsAndConditions &&
            initialData.termsAndConditions.length > 0
                ? initialData.termsAndConditions
                : DEFAULT_TERMS,
        quoteDate: initialData?.quoteDate || new Date().toISOString().split("T")[0],
        projectPrice: initialData?.projectPrice || "",
        showBilledInfo: initialData?.showBilledInfo ?? true,
        showFeatureSections: initialData?.showFeatureSections ?? true,
        showScopePricing: initialData?.showScopePricing ?? true,
        showPaymentAccount: initialData?.showPaymentAccount ?? true,
        showTerms: initialData?.showTerms ?? true,
        showAgreement: initialData?.showAgreement ?? true,
        footerNote:
            initialData?.footerNote ||
            "Thank you for the opportunity. We look forward to building something great together. | Opygen",
    };

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(quoteSchema),
        defaultValues: defaultFormValues,
    });

    const {
        fields: phaseFields,
        append: appendPhase,
        remove: removePhase,
    } = useFieldArray({
        control,
        name: "phases",
    });

    const {
        fields: pmtFields,
        append: appendPmt,
        remove: removePmt,
    } = useFieldArray({
        control,
        name: "paymentSchedule",
    });

    const {
        fields: termFields,
        append: appendTerm,
        remove: removeTerm,
    } = useFieldArray({
        control,
        name: "termsAndConditions",
    });

    const {
        fields: featureSectionFields,
        append: appendSection,
        remove: removeSection,
    } = useFieldArray({
        control,
        name: "featureSections",
    });

    const [projectPriceMode, setProjectPriceMode] = useState<"fixed" | "range">(
        initialData?.projectPrice && initialData.projectPrice.includes("-") ? "range" : "fixed"
    );
    const [projectPriceMin, setProjectPriceMin] = useState(
        initialData?.projectPrice && initialData.projectPrice.includes("-")
            ? initialData.projectPrice.split("-")[0].trim()
            : ""
    );
    const [projectPriceMax, setProjectPriceMax] = useState(
        initialData?.projectPrice && initialData.projectPrice.includes("-")
            ? initialData.projectPrice.split("-")[1].trim()
            : initialData?.projectPrice || ""
    );

    useEffect(() => {
        if (isOpen) {
            reset(defaultFormValues);
            setActiveTab("general");
            const priceStr = initialData?.projectPrice || "";
            if (priceStr.includes("-")) {
                setProjectPriceMode("range");
                const parts = priceStr.split("-");
                setProjectPriceMin(parts[0].trim());
                setProjectPriceMax(parts[1].trim());
            } else {
                setProjectPriceMode("fixed");
                setProjectPriceMin(priceStr);
                setProjectPriceMax(priceStr);
            }
        }
    }, [isOpen, initialData, reset]);

    const titleMap = {
        create: "Create Proposal Quote",
        edit: "Edit Proposal Quote",
        convert: "Convert Client to Proposal Quote",
    };

    const handleGenerateNewRef = () => {
        setValue("quoteNumber", generateUniqueQuoteNumber());
    };

    const onFormError = (formErrors: any) => {
        console.error("Quote Form Validation Errors:", formErrors);
        const errorMessages = Object.entries(formErrors)
            .map(([key, err]: any) => `${key}: ${err?.message || "Invalid value"}`)
            .join("; ");
        toast.error(`Form error: ${errorMessages || "Please check invalid fields"}`);
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="w-[95vw] sm:max-w-5xl max-w-5xl bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
                <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20 shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold bg-linear-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            {titleMap[mode]}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                            Customize proposal parameters, feature tables,
                            deliverables, user payment account, and terms.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {/* Tab Navigation */}
                <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-border bg-muted/10 px-2 sm:px-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab("general")}
                        className={`flex items-center justify-center gap-1.5 px-2 sm:px-3 py-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer text-center ${
                            activeTab === "general"
                                ? "border-indigo-600 text-indigo-600 bg-background/50"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Info className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">General & Billed Info</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("features")}
                        className={`flex items-center justify-center gap-1.5 px-2 sm:px-3 py-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer text-center ${
                            activeTab === "features"
                                ? "border-indigo-600 text-indigo-600 bg-background/50"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <ListChecks className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Feature Tables</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("pricing")}
                        className={`flex items-center justify-center gap-1.5 px-2 sm:px-3 py-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer text-center ${
                            activeTab === "pricing"
                                ? "border-indigo-600 text-indigo-600 bg-background/50"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <DollarSign className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Scope & Pricing</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("payment")}
                        className={`flex items-center justify-center gap-1.5 px-2 sm:px-3 py-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer text-center ${
                            activeTab === "payment"
                                ? "border-indigo-600 text-indigo-600 bg-background/50"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <CreditCard className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Payment Account</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("terms")}
                        className={`flex items-center justify-center gap-1.5 px-2 sm:px-3 py-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer text-center ${
                            activeTab === "terms"
                                ? "border-indigo-600 text-indigo-600 bg-background/50"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Terms & Footer</span>
                    </button>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto p-6 flex-1">
                    <form
                        id="quote-form"
                        onSubmit={handleSubmit(onSubmit, onFormError)}
                        className="space-y-6"
                    >
                        {/* TAB 1: GENERAL & BILLED INFO */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                {/* SECTION VISIBILITY TOGGLES CARD */}
                                <div className="p-4 rounded-xl bg-accent/30 border border-border/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                            <span>PDF Section Visibility Controls (On / Off)</span>
                                        </label>
                                        <span className="text-[11px] text-muted-foreground">Toggle sections to include or omit in generated PDF</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <Controller
                                            name="showBilledInfo"
                                            control={control}
                                            render={({ field }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(!field.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        field.value
                                                            ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-muted/40 border-border text-muted-foreground opacity-60"
                                                    }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${field.value ? "bg-indigo-600" : "bg-muted-foreground/40"}`} />
                                                    Billed Info (BY & TO) {field.value ? "(ON)" : "(OFF)"}
                                                </button>
                                            )}
                                        />
                                        <Controller
                                            name="showFeatureSections"
                                            control={control}
                                            render={({ field }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(!field.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        field.value
                                                            ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-muted/40 border-border text-muted-foreground opacity-60"
                                                    }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${field.value ? "bg-indigo-600" : "bg-muted-foreground/40"}`} />
                                                    Feature Tables {field.value ? "(ON)" : "(OFF)"}
                                                </button>
                                            )}
                                        />
                                        <Controller
                                            name="showScopePricing"
                                            control={control}
                                            render={({ field }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(!field.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        field.value
                                                            ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-muted/40 border-border text-muted-foreground opacity-60"
                                                    }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${field.value ? "bg-indigo-600" : "bg-muted-foreground/40"}`} />
                                                    Scope & Pricing {field.value ? "(ON)" : "(OFF)"}
                                                </button>
                                            )}
                                        />
                                        <Controller
                                            name="showPaymentAccount"
                                            control={control}
                                            render={({ field }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(!field.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        field.value
                                                            ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-muted/40 border-border text-muted-foreground opacity-60"
                                                    }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${field.value ? "bg-indigo-600" : "bg-muted-foreground/40"}`} />
                                                    Payment Account {field.value ? "(ON)" : "(OFF)"}
                                                </button>
                                            )}
                                        />
                                        <Controller
                                            name="showTerms"
                                            control={control}
                                            render={({ field }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(!field.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        field.value
                                                            ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-muted/40 border-border text-muted-foreground opacity-60"
                                                    }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${field.value ? "bg-indigo-600" : "bg-muted-foreground/40"}`} />
                                                    Terms & Conditions {field.value ? "(ON)" : "(OFF)"}
                                                </button>
                                            )}
                                        />
                                        <Controller
                                            name="showAgreement"
                                            control={control}
                                            render={({ field }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange(!field.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                        field.value
                                                            ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-muted/40 border-border text-muted-foreground opacity-60"
                                                    }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${field.value ? "bg-indigo-600" : "bg-muted-foreground/40"}`} />
                                                    Agreement & Signatures {field.value ? "(ON)" : "(OFF)"}
                                                </button>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-accent/20 border border-border">
                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>
                                                Project Name <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                        <Input
                                            {...register("projectName")}
                                            placeholder="e.g. E-Commerce Mobile App & Admin Dashboard"
                                            className="bg-background border-border font-semibold text-sm h-10"
                                        />
                                        {errors.projectName && (
                                            <p className="text-xs text-red-500">
                                                {
                                                    (
                                                        errors.projectName as any
                                                    ).message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">
                                            Proposal Date <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="date"
                                            {...register("quoteDate")}
                                            className="bg-background border-border text-xs h-10"
                                        />
                                        {errors.quoteDate && (
                                            <p className="text-xs text-red-500">
                                                {
                                                    (
                                                        errors.quoteDate as any
                                                    ).message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>
                                                Quote Reference Number (Unique
                                                String)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleGenerateNewRef}
                                                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-[11px] font-normal cursor-pointer"
                                            >
                                                <RefreshCw className="h-3 w-3" />{" "}
                                                Regenerate
                                            </button>
                                        </label>
                                        <Input
                                            {...register("quoteNumber")}
                                            placeholder="e.g. PRJ-2025-001"
                                            className="bg-background border-border font-mono text-sm h-10"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">
                                            Currency
                                        </label>
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
                                                    <SelectTrigger className="bg-background border-border h-10! w-full">
                                                        <SelectValue placeholder="Currency" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="USD">
                                                            USD ($)
                                                        </SelectItem>
                                                        <SelectItem value="BDT">
                                                            BDT (৳)
                                                        </SelectItem>
                                                        <SelectItem value="EUR">
                                                            EUR (€)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-foreground">
                                                Project Price ({projectPriceMode === "fixed" ? "Fixed Number" : "Price Range"})
                                            </label>
                                            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded border border-border">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProjectPriceMode("fixed");
                                                        const fixedVal = projectPriceMin || projectPriceMax || "";
                                                        setValue("projectPrice", fixedVal);
                                                    }}
                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                                                        projectPriceMode === "fixed"
                                                            ? "bg-indigo-600 text-white shadow-xs"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    Fixed
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProjectPriceMode("range");
                                                        if (projectPriceMin && projectPriceMax) {
                                                            setValue("projectPrice", `${projectPriceMin} - ${projectPriceMax}`);
                                                        }
                                                    }}
                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                                                        projectPriceMode === "range"
                                                            ? "bg-indigo-600 text-white shadow-xs"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    Range
                                                </button>
                                            </div>
                                        </div>

                                        {projectPriceMode === "fixed" ? (
                                            <Input
                                                value={watch("projectPrice") || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setValue("projectPrice", val);
                                                    setProjectPriceMin(val);
                                                    setProjectPriceMax(val);
                                                }}
                                                placeholder="e.g. 1500"
                                                className="bg-background border-border text-xs h-10"
                                            />
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    value={projectPriceMin}
                                                    onChange={(e) => {
                                                        const minV = e.target.value;
                                                        setProjectPriceMin(minV);
                                                        setValue("projectPrice", `${minV} - ${projectPriceMax}`);
                                                    }}
                                                    placeholder="Min Price (e.g. 1500)"
                                                    className="bg-background border-border text-xs h-10"
                                                />
                                                <Input
                                                    value={projectPriceMax}
                                                    onChange={(e) => {
                                                        const maxV = e.target.value;
                                                        setProjectPriceMax(maxV);
                                                        setValue("projectPrice", `${projectPriceMin} - ${maxV}`);
                                                    }}
                                                    placeholder="Max Price (e.g. 2500)"
                                                    className="bg-background border-border text-xs h-10"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">
                                            Project Duration
                                        </label>
                                        <Input
                                            {...register("projectDuration")}
                                            placeholder="e.g. 6–8 Weeks"
                                            className="bg-background border-border text-xs h-10"
                                        />
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-xs font-semibold text-foreground">
                                            Proposal Header Title
                                        </label>
                                        <Input
                                            {...register("proposalType")}
                                            placeholder="e.g. SOFTWARE DEVELOPMENT PROPOSAL"
                                            className="bg-background border-border text-xs h-10"
                                        />
                                    </div>

                                    <div className="space-y-1 sm:col-span-3">
                                        <label className="text-xs font-semibold text-foreground">
                                            Proposal Subtitle / App Type
                                        </label>
                                        <Input
                                            {...register("proposalSubtitle")}
                                            placeholder="e.g. Mobile Application — Inventory Management System"
                                            className="bg-background border-border text-xs h-10"
                                        />
                                    </div>
                                </div>

                                {/* BILLED BY & BILLED TO */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* BILLED BY CARD */}
                                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                                BILLED BY (Developer / Agency)
                                            </h3>
                                            <User className="h-4 w-4 text-indigo-600" />
                                        </div>

                                        {/* User Selector Dropdown */}
                                        <div className="space-y-1">
                                            <Select
                                                onValueChange={(
                                                    userId: any,
                                                ) => {
                                                    if (userId === "custom")
                                                        return;
                                                    const foundUser =
                                                        usersList.find(
                                                            (u: any) =>
                                                                u._id ===
                                                                userId,
                                                        );
                                                    if (foundUser) {
                                                        setValue(
                                                            "billedBy.name",
                                                            foundUser.name ||
                                                                "",
                                                        );
                                                        setValue(
                                                            "billedBy.title",
                                                            formatUserTitle(foundUser.title) ||
                                                                foundUser.role ||
                                                                "Full Stack Developer",
                                                        );
                                                        setValue(
                                                            "billedBy.email",
                                                            foundUser.email ||
                                                                "",
                                                        );
                                                        setValue(
                                                            "billedBy.phone",
                                                            foundUser.mobileNumber ||
                                                                "",
                                                        );
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="bg-background border-border text-xs h-10! w-full">
                                                    <SelectValue placeholder="-- Select User to Populate Fields --" />
                                                </SelectTrigger>
                                                <SelectContent className="z-200">
                                                    <SelectItem
                                                        value="custom"
                                                        className="text-xs h-10!"
                                                    >
                                                        -- Custom / Manual Entry
                                                        --
                                                    </SelectItem>
                                                    {usersList.map(
                                                        (user: any) => (
                                                            <SelectItem
                                                                key={user._id}
                                                                value={user._id}
                                                                className="text-xs h-10!"
                                                            >
                                                                {user.name} (
                                                                {user.email})
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Input
                                                {...register("billedBy.name")}
                                                placeholder="Developer Name"
                                                className="bg-background text-sm"
                                            />
                                            <Input
                                                {...register("billedBy.title")}
                                                placeholder="Role / Title"
                                                className="bg-background text-sm"
                                            />
                                            <Input
                                                {...register("billedBy.email")}
                                                placeholder="Email (Optional)"
                                                className="bg-background text-sm"
                                            />
                                            <Controller
                                                control={control}
                                                name="billedBy.phone"
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
                                    </div>

                                    {/* BILLED TO CARD */}
                                    <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
                                        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                                            BILLED TO (Client Info)
                                        </h3>
                                        <div className="space-y-2">
                                            <Input
                                                {...register("clientName")}
                                                placeholder="Client Name * (e.g. Abdul Azeez)"
                                                className="bg-background text-sm"
                                            />
                                            {errors.clientName && (
                                                <p className="text-xs text-red-500">
                                                    {
                                                        (
                                                            errors.clientName as any
                                                        ).message
                                                    }
                                                </p>
                                            )}
                                            <Input
                                                {...register(
                                                    "billedTo.company",
                                                )}
                                                placeholder="Company Name (e.g. AB & Abroz Machinery Inc.)"
                                                className="bg-background text-sm"
                                            />
                                            <Input
                                                {...register(
                                                    "billedTo.country",
                                                )}
                                                placeholder="Country / Location (e.g. Philippines)"
                                                className="bg-background text-sm"
                                            />
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
                                            <Input
                                                {...register(
                                                    "clientSocialLink",
                                                )}
                                                placeholder="Social / Website URL"
                                                className="bg-background text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* PROJECT OVERVIEW */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        Project Overview / Scope Description
                                        (Optional)
                                    </label>
                                    <Textarea
                                        {...register("projectOverview")}
                                        placeholder="This proposal outlines the scope, deliverables, milestones, and payment structure..."
                                        className="min-h-22.5 text-sm bg-background border-border"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 2: DYNAMIC FEATURE TABLES */}
                        {activeTab === "features" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">
                                            Feature Tables (Dynamic PDF
                                            Sections)
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Add customizable feature tables
                                            (e.g. Client-Facing App Features,
                                            Admin Panel Features).
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            appendSection({
                                                title: "NEW FEATURE SECTION",
                                                description: "",
                                                features: [
                                                    {
                                                        featureName: "",
                                                        description: "",
                                                    },
                                                ],
                                            })
                                        }
                                        className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                                    >
                                        <Plus className="mr-1 h-3.5 w-3.5" />{" "}
                                        Add Section Table
                                    </Button>
                                </div>

                                {featureSectionFields.map(
                                    (sectionField, sIdx) => (
                                        <div
                                            key={sectionField.id}
                                            className="p-4 rounded-xl border border-border bg-accent/20 space-y-4 relative"
                                        >
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    removeSection(sIdx)
                                                }
                                                className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-red-500"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">
                                                        Section Title
                                                    </label>
                                                    <Input
                                                        {...register(
                                                            `featureSections.${sIdx}.title`,
                                                        )}
                                                        placeholder="e.g. CLIENT-FACING APP FEATURES"
                                                        className="font-semibold text-sm bg-background"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">
                                                        Section Subtitle /
                                                        Description
                                                    </label>
                                                    <Input
                                                        {...register(
                                                            `featureSections.${sIdx}.description`,
                                                        )}
                                                        placeholder="e.g. The following features will be delivered..."
                                                        className="text-sm bg-background"
                                                    />
                                                </div>
                                            </div>

                                            {/* Nested Features List */}
                                            <FeatureListArray
                                                sIdx={sIdx}
                                                control={control}
                                                register={register}
                                            />
                                        </div>
                                    ),
                                )}
                            </div>
                        )}

                        {/* TAB 3: SCOPE & PRICING */}
                        {activeTab === "pricing" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">
                                            Project Deliverables & Scope Pricing
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Define key deliverables, phase tags,
                                            and estimated budget.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            appendPhase({
                                                phaseName: "",
                                                description: "",
                                                phaseTag: `Phase ${phaseFields.length + 1}`,
                                                minBudget: 0,
                                                maxBudget: 0,
                                            })
                                        }
                                        className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                                    >
                                        <Plus className="mr-1 h-3.5 w-3.5" />{" "}
                                        Add Deliverable
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {phaseFields.map((field, index) => (
                                        <DeliverableRowItem
                                            key={field.id}
                                            index={index}
                                            field={field}
                                            register={register}
                                            setValue={setValue}
                                            watch={watch}
                                            removePhase={removePhase}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: USER PAYMENT ACCOUNT */}
                        {activeTab === "payment" && (
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-3">
                                    <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />{" "}
                                        Select Receiving Payment Account (From
                                        User Model)
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Select which user account the client
                                        should transfer project funds to. All
                                        details will render in a dedicated block
                                        on the proposal PDF.
                                    </p>

                                    <Controller
                                        name="paymentAccount"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="space-y-2">
                                                <Select
                                                    onValueChange={(
                                                        val: any,
                                                    ) => {
                                                        if (val === "none") {
                                                            field.onChange(
                                                                null,
                                                            );
                                                            return;
                                                        }
                                                        try {
                                                            field.onChange(
                                                                JSON.parse(val),
                                                            );
                                                        } catch (e) {}
                                                    }}
                                                    value={
                                                        field.value
                                                            ? JSON.stringify(
                                                                  field.value,
                                                              )
                                                            : "none"
                                                    }
                                                >
                                                    <SelectTrigger className="bg-background border-border h-10! w-full text-left">
                                                        <SelectValue placeholder="Select a User Account" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-72">
                                                        <SelectItem value="none">
                                                            -- None (Do not
                                                            print account
                                                            details on PDF) --
                                                        </SelectItem>
                                                        {accountsList.map(
                                                            (
                                                                accItem: any,
                                                                idx: number,
                                                            ) => {
                                                                const valObj = {
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
                                                                            .routingNumber ||
                                                                        "",
                                                                    branch:
                                                                        accItem
                                                                            .account
                                                                            .branch ||
                                                                        "",
                                                                    type:
                                                                        accItem
                                                                            .account
                                                                            .type ||
                                                                        "bank",
                                                                    userName:
                                                                        accItem.userName ||
                                                                        accItem
                                                                            .user
                                                                            ?.name ||
                                                                        "User",
                                                                    userId:
                                                                        accItem.userId ||
                                                                        accItem
                                                                            .user
                                                                            ?._id ||
                                                                        "",
                                                                };
                                                                const valStr =
                                                                    JSON.stringify(
                                                                        valObj,
                                                                    );
                                                                const userName =
                                                                    accItem.userName ||
                                                                    accItem.user
                                                                        ?.name ||
                                                                    "User";

                                                                return (
                                                                    <SelectItem
                                                                        key={
                                                                            idx
                                                                        }
                                                                        value={
                                                                            valStr
                                                                        }
                                                                        className="py-2"
                                                                    >
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <div className="font-semibold text-xs text-foreground">
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
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    accItem
                                                                                        .account
                                                                                        .accountName
                                                                                }

                                                                                )
                                                                            </div>
                                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                                <UserCircle2 className="h-3 w-3 text-indigo-600" />{" "}
                                                                                Owner:{" "}
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

                                                {/* Edit account details directly if selected */}
                                                {field.value && (
                                                    <div className="p-3 rounded-lg border border-border bg-background space-y-2 mt-3">
                                                        <p className="text-xs font-semibold text-indigo-600">
                                                            Selected Account
                                                            Details (Optional
                                                            overrides):
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <Input
                                                                value={
                                                                    field.value
                                                                        .providerName ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        {
                                                                            ...field.value,
                                                                            providerName:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Provider / Bank Name"
                                                            />
                                                            <Input
                                                                value={
                                                                    field.value
                                                                        .accountName ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        {
                                                                            ...field.value,
                                                                            accountName:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Account Name"
                                                            />
                                                            <Input
                                                                value={
                                                                    field.value
                                                                        .accountNumber ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        {
                                                                            ...field.value,
                                                                            accountNumber:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Account Number"
                                                            />
                                                            <Input
                                                                value={
                                                                    field.value
                                                                        .routingNumber ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        {
                                                                            ...field.value,
                                                                            routingNumber:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Routing No / Branch (Optional)"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    />
                                </div>

                                {/* PAYMENT SCHEDULE BUILDER */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground">
                                                Payment Schedule Milestones
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Milestones breakdown for the
                                                payment table on PDF.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                appendPmt({
                                                    pmtNo: pmtFields.length + 1,
                                                    milestone: "",
                                                    calculation: "",
                                                    amount: 0,
                                                })
                                            }
                                            className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                                        >
                                            <Plus className="mr-1 h-3.5 w-3.5" />{" "}
                                            Add Milestone
                                        </Button>
                                    </div>

                                    {pmtFields.map((field, idx) => (
                                        <div
                                            key={field.id}
                                            className="p-3 rounded-lg border border-border bg-accent/20 grid grid-cols-1 sm:grid-cols-4 gap-3 relative items-center"
                                        >
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removePmt(idx)}
                                                className="absolute right-2 top-2 h-5 w-5 text-muted-foreground hover:text-red-500"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>

                                            <div className="space-y-1 sm:col-span-2">
                                                <label className="text-[11px] font-medium text-muted-foreground">
                                                    Milestone / Trigger
                                                </label>
                                                <Input
                                                    {...register(
                                                        `paymentSchedule.${idx}.milestone`,
                                                    )}
                                                    placeholder="e.g. Advance Payment"
                                                    className="bg-background text-xs h-9"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-medium text-muted-foreground">
                                                    Calculation Formula
                                                </label>
                                                <Input
                                                    {...register(
                                                        `paymentSchedule.${idx}.calculation`,
                                                    )}
                                                    placeholder="e.g. 30% of Total"
                                                    className="bg-background text-xs h-9"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-medium text-muted-foreground">
                                                    Amount
                                                </label>
                                                <Input
                                                    type="number"
                                                    {...register(
                                                        `paymentSchedule.${idx}.amount`,
                                                        { valueAsNumber: true },
                                                    )}
                                                    placeholder="Amount"
                                                    className="bg-background text-xs h-9"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 5: TERMS & FOOTER */}
                        {activeTab === "terms" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">
                                            Terms & Conditions
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Numbered list of terms included on
                                            the proposal agreement.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            appendTerm({ title: "", text: "" })
                                        }
                                        className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                                    >
                                        <Plus className="mr-1 h-3.5 w-3.5" />{" "}
                                        Add Term
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {termFields.map((field, idx) => (
                                        <div
                                            key={field.id}
                                            className="p-3 rounded-lg border border-border bg-accent/20 space-y-2 relative"
                                        >
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeTerm(idx)}
                                                className="absolute right-2 top-2 h-5 w-5 text-muted-foreground hover:text-red-500"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-indigo-600">
                                                    {idx + 1}.
                                                </span>
                                                <Input
                                                    {...register(
                                                        `termsAndConditions.${idx}.title`,
                                                    )}
                                                    placeholder="Term Title (e.g. Revisions)"
                                                    className="font-semibold text-xs bg-background h-8"
                                                />
                                            </div>
                                            <Textarea
                                                {...register(
                                                    `termsAndConditions.${idx}.text`,
                                                )}
                                                placeholder="Term description..."
                                                className="min-h-12.5 text-xs bg-background"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                                    <h4 className="text-xs font-bold text-foreground">
                                        PDF Footer Note
                                    </h4>
                                    <Input
                                        {...register("footerNote")}
                                        placeholder="e.g. Thank you for the opportunity... | Opygen"
                                        className="bg-background text-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between items-center px-6 py-3 border-t border-border bg-muted/20 shrink-0">
                    <p className="text-xs text-muted-foreground">
                        Note: All sections and account details are optional.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="cursor-pointer text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="quote-form"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer min-w-32.5 text-xs font-semibold"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {mode === "edit" ? "Update Quote" : "Create Quote"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Sub-component for features list inside section
function FeatureListArray({
    sIdx,
    control,
    register,
}: {
    sIdx: number;
    control: any;
    register: any;
}) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `featureSections.${sIdx}.features`,
    });

    return (
        <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600">
                    Features List
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => append({ featureName: "", description: "" })}
                    className="h-7 text-xs text-indigo-600 hover:bg-indigo-50"
                >
                    <Plus className="h-3 w-3 mr-1" /> Add Feature Item
                </Button>
            </div>

            {fields.map((fItem, fIdx) => (
                <div
                    key={fItem.id}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-background p-2 rounded-lg border border-border relative pr-8"
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(fIdx)}
                        className="absolute right-1 top-2 h-5 w-5 text-muted-foreground hover:text-red-500"
                    >
                        <X className="h-3 w-3" />
                    </Button>

                    <Input
                        {...register(
                            `featureSections.${sIdx}.features.${fIdx}.featureName`,
                        )}
                        placeholder="Feature Name"
                        className="text-xs h-8 font-medium"
                    />
                    <Input
                        {...register(
                            `featureSections.${sIdx}.features.${fIdx}.description`,
                        )}
                        placeholder="Feature Description..."
                        className="text-xs h-8 sm:col-span-2"
                    />
                </div>
            ))}
        </div>
    );
}

function DeliverableRowItem({
    index,
    field,
    register,
    setValue,
    watch,
    removePhase,
}: {
    index: number;
    field: any;
    register: any;
    setValue: any;
    watch: any;
    removePhase: (idx: number) => void;
}) {
    const minB = watch(`phases.${index}.minBudget`);
    const maxB = watch(`phases.${index}.maxBudget`);
    const isRange = minB && minB > 0 && minB !== maxB;
    const [budgetMode, setBudgetMode] = useState<"fixed" | "range">(
        isRange ? "range" : "fixed"
    );

    return (
        <div
            key={field.id}
            className="p-4 rounded-xl border border-border bg-accent/20 relative space-y-3"
        >
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePhase(index)}
                className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-red-500 cursor-pointer"
            >
                <X className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pr-6">
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                        Deliverable Title *
                    </label>
                    <Input
                        {...register(`phases.${index}.phaseName`)}
                        placeholder="e.g. Frontend Development"
                        className="bg-background text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                        Phase Tag
                    </label>
                    <Input
                        {...register(`phases.${index}.phaseTag`)}
                        placeholder="e.g. Phase 1"
                        className="bg-background text-sm"
                    />
                </div>

                {/* Budget Column with Mode Switcher */}
                <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">
                            Budget ({budgetMode === "fixed" ? "Fixed Amount" : "Price Range"})
                        </label>
                        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded border border-border">
                            <button
                                type="button"
                                onClick={() => {
                                    setBudgetMode("fixed");
                                    const currentMax = watch(`phases.${index}.maxBudget`) || 0;
                                    setValue(`phases.${index}.minBudget`, 0);
                                    setValue(`phases.${index}.maxBudget`, currentMax);
                                }}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                                    budgetMode === "fixed"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Fixed
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setBudgetMode("range");
                                }}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                                    budgetMode === "range"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Range
                            </button>
                        </div>
                    </div>

                    {budgetMode === "fixed" ? (
                        <Input
                            type="number"
                            {...register(`phases.${index}.maxBudget`, {
                                valueAsNumber: true,
                            })}
                            onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setValue(`phases.${index}.maxBudget`, val);
                                setValue(`phases.${index}.minBudget`, 0);
                            }}
                            placeholder="Fixed Budget Amount"
                            className="bg-background text-sm"
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="number"
                                {...register(`phases.${index}.minBudget`, {
                                    valueAsNumber: true,
                                })}
                                placeholder="Min Budget"
                                className="bg-background text-sm"
                            />
                            <Input
                                type="number"
                                {...register(`phases.${index}.maxBudget`, {
                                    valueAsNumber: true,
                                })}
                                placeholder="Max Budget"
                                className="bg-background text-sm"
                            />
                        </div>
                    )}
                </div>

                <div className="sm:col-span-5 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                        Description / Technical Details
                    </label>
                    <Input
                        {...register(`phases.${index}.description`)}
                        placeholder="e.g. UI/UX Design & Implementation..."
                        className="bg-background text-xs"
                    />
                </div>
            </div>
        </div>
    );
}
