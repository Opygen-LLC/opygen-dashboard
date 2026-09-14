"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Building2,
    Mail,
    Phone,
    Globe,
    MapPin,
    FileText,
    Target,
    Save,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    Sparkles,
    CheckCircle2,
    Calendar,
    DollarSign,
    Award,
    Upload,
    X,
    ChevronLeft,
    ChevronRight,
    Package,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductsSettingsTab from "./ProductsSettingsTab";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";



/* ─── Section card ─── */
const Section = ({
    title,
    description,
    icon,
    accent,
    children,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
    children: React.ReactNode;
}) => (
    <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader
            className={`border-b border-border/40 p-5 pb-4 bg-gradient-to-r ${accent} to-transparent`}
        >
            <CardTitle className="flex items-center gap-2.5 text-sm font-bold">
                <div className="h-7 w-7 rounded-lg bg-background/60 flex items-center justify-center shadow-sm">
                    {icon}
                </div>
                {title}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">{children}</CardContent>
    </Card>
);

/* ─── Field label ─── */
const Field = ({
    label,
    icon,
    children,
    hint,
}: {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    hint?: string;
}) => (
    <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">
            {icon}
            {label}
        </label>
        {children}
        {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
    </div>
);



/* ═══════════════════════════════════════
   DEFAULT FORM STATE
═══════════════════════════════════════ */
const DEFAULT_FORM = {
    logo: "",
    companyName: "",
    tagline: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    socials: { facebook: "", instagram: "", linkedin: "", youtube: "", x: "" },
    monthlyBudgetGoal: "200000",
};

type FormState = typeof DEFAULT_FORM;

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function CompanySettingsView() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [savedForm, setSavedForm] = useState<FormState>(DEFAULT_FORM);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm) || logoFile !== null;

    /* ── URL-synchronized tabs (_tab=) ── */
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("_tab");
    const [activeTab, setActiveTab] = useState<"company" | "revenue" | "products">(() => {
        return tabParam === "revenue" || tabParam === "products" ? tabParam : "company";
    });

    useEffect(() => {
        if (tabParam === "revenue" || tabParam === "products") {
            setActiveTab(tabParam);
        } else if (!tabParam) {
            setActiveTab("company");
        }
    }, [tabParam]);

    const switchTab = useCallback((tab: "company" | "revenue" | "products") => {
        setActiveTab(tab);
        const url = `/admin-dashboard/settings?_tab=${tab}`;
        window.history.replaceState(null, "", url);
    }, []);

    /* ── pagination for revenue table ── */
    const [revenuePage, setRevenuePage] = useState(1);
    const REVENUE_PER_PAGE = 10;

    /* ── fetch settings ── */
    const { data: settings, isLoading } = useQuery<any>({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await fetch("/api/settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        },
    });

    const revenueHistory: any[] = settings?.monthlyRevenueHistory ?? [];
    const totalRevenuePages = Math.ceil(revenueHistory.length / REVENUE_PER_PAGE) || 1;
    const totalPages = totalRevenuePages;
    const paginatedRevenue = revenueHistory.slice(
        (revenuePage - 1) * REVENUE_PER_PAGE,
        revenuePage * REVENUE_PER_PAGE
    );
    const totalLifetimeBdt = revenueHistory.reduce((sum, m) => sum + (m.revenueBdt || 0), 0);
    const bestMonth = revenueHistory.length > 0
        ? [...revenueHistory].sort((a, b) => (b.revenueBdt || 0) - (a.revenueBdt || 0))[0]
        : null;
    const currentMonthData = revenueHistory.find((m) => m.isCurrent);

    useEffect(() => {
        if (!settings) return;
        const loaded: FormState = {
            logo: settings.logo ?? "",
            companyName: settings.companyName ?? "",
            tagline: settings.tagline ?? "",
            description: settings.description ?? "",
            email: settings.email ?? "",
            phone: settings.phone ?? "",
            website: settings.website ?? "",
            address: settings.address ?? "",
            socials: {
                facebook: settings.socials?.facebook ?? "",
                instagram: settings.socials?.instagram ?? "",
                linkedin: settings.socials?.linkedin ?? "",
                youtube: settings.socials?.youtube ?? "",
                x: settings.socials?.x ?? "",
            },
            monthlyBudgetGoal: String(
                settings.monthlyBudgetGoal && Number(settings.monthlyBudgetGoal) > 0
                    ? settings.monthlyBudgetGoal
                    : 200000
            ),
        };
        setForm(loaded);
        setSavedForm(loaded);
    }, [settings]);

    /* ── save mutation ── */
    const saveMutation = useMutation({
        mutationFn: async () => {
            let finalLogoUrl = form.logo;
            if (logoPreview && logoPreview.startsWith("data:image")) {
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: logoPreview }),
                });
                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(errData.error || "Failed to upload logo");
                }
                const uploadData = await uploadRes.json();
                finalLogoUrl = uploadData.url;
            } else if (logoPreview === "") {
                finalLogoUrl = "";
            }

            const payload = {
                logo: finalLogoUrl,
                companyName: form.companyName,
                tagline: form.tagline,
                description: form.description,
                email: form.email,
                phone: form.phone,
                website: form.website,
                address: form.address,
                socials: form.socials,
                monthlyBudgetGoal: parseFloat(form.monthlyBudgetGoal) || 200000,
            };
            const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to save settings");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            setSavedForm({ ...form });
            setLogoFile(null);
            setLogoPreview(null);
            toast.success("Settings saved successfully!");
        },
        onError: (err: any) => toast.error(err.message),
    });

    const set = useCallback(
        (field: keyof FormState) => (value: string) =>
            setForm((prev) => ({ ...prev, [field]: value })),
        [],
    );
    const setSocial = useCallback(
        (platform: keyof FormState["socials"]) => (value: string) =>
            setForm((prev) => ({
                ...prev,
                socials: { ...prev.socials, [platform]: value },
            })),
        [],
    );

    const socialFields = [
        {
            key: "facebook" as const,
            label: "Facebook",
            icon: <FaFacebook className="h-3.5 w-3.5 text-[#1877F2]" />,
            placeholder: "https://facebook.com/your-page",
        },
        {
            key: "instagram" as const,
            label: "Instagram",
            icon: <FaInstagram className="h-3.5 w-3.5 text-[#E1306C]" />,
            placeholder: "https://instagram.com/your-handle",
        },
        {
            key: "linkedin" as const,
            label: "LinkedIn",
            icon: <FaLinkedin className="h-3.5 w-3.5 text-[#0A66C2]" />,
            placeholder: "https://linkedin.com/company/your-company",
        },
        {
            key: "youtube" as const,
            label: "YouTube",
            icon: <FaYoutube className="h-3.5 w-3.5 text-[#FF0000]" />,
            placeholder: "https://youtube.com/@your-channel",
        },
        {
            key: "x" as const,
            label: "X (Twitter)",
            icon: <FaXTwitter className="h-3.5 w-3.5 text-foreground" />,
            placeholder: "https://x.com/your-handle",
        },
    ];

    /* ── loading skeleton ── */
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-3xl" />
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32">
            {/* ── Hero header (no save button) ── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-6 sm:p-8"
            >
                <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="relative z-10 space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold tracking-wide text-indigo-600 dark:text-indigo-400">
                        <Building2 className="h-3 w-3" />
                        Company Settings
                    </span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                        Company Profile
                    </h1>
                    <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                        Manage your company identity, contact details, social
                        presence, and monthly revenue targets.
                    </p>
                </div>
            </motion.div>

            {/* ── Link Tabs (_tab=) ── */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => switchTab("company")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                        activeTab === "company"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Building2 className="h-3.5 w-3.5" />
                    Company & Socials
                </button>

                <button
                    type="button"
                    onClick={() => switchTab("revenue")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                        activeTab === "revenue"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Target className="h-3.5 w-3.5" />
                    Monthly Revenue
                </button>

                <button
                    type="button"
                    onClick={() => switchTab("products")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                        activeTab === "products"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Package className="h-3.5 w-3.5" />
                    Products
                </button>
            </div>

            {/* ── TAB 1: Company & Social Media ── */}
            {activeTab === "company" && (
                <div className="space-y-8">
                    {/* ── Section A: Company Info ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.08,
                            duration: 0.45,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                <Section
                    title="Company Information"
                    description="Basic identity and contact details for your company"
                    icon={<Building2 className="h-3.5 w-3.5 text-indigo-500" />}
                    accent="from-indigo-500/8"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Logo Upload */}
                        <div className="sm:col-span-2 mb-2">
                            <Field
                                label="Company Logo"
                                icon={<Upload className="h-3 w-3" />}
                                hint="Recommended size: 256x256px. Max 4MB."
                            >
                                <div className="flex items-center gap-6 mt-2">
                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-accent flex items-center justify-center">
                                        {(logoPreview || form.logo) && logoPreview !== "" ? (
                                            <img
                                                src={logoPreview || form.logo}
                                                alt="Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <Building2 className="h-8 w-8 text-muted-foreground/40" />
                                        )}
                                        {(logoPreview || form.logo) && logoPreview !== "" && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLogoPreview("");
                                                    setForm((prev) => ({ ...prev, logo: "" }));
                                                }}
                                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center text-white cursor-pointer"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="relative overflow-hidden cursor-pointer h-9 w-fit font-medium text-xs"
                                            >
                                                Choose Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        if (!file.type.startsWith("image/")) {
                                                            toast.error("Only image files are supported");
                                                            return;
                                                        }
                                                        if (file.size > 4 * 1024 * 1024) {
                                                            toast.error("Image size cannot exceed 4MB");
                                                            return;
                                                        }
                                                        setLogoFile(file);
                                                        const reader = new FileReader();
                                                        reader.onload = () => {
                                                            setLogoPreview(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                    className="absolute inset-0 cursor-pointer opacity-0"
                                                />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Field>
                        </div>

                        <Field
                            label="Company Name"
                            icon={<Building2 className="h-3 w-3" />}
                        >
                            <Input
                                type="text"
                                value={form.companyName}
                                onChange={(e) =>
                                    set("companyName")(e.target.value)
                                }
                                placeholder="e.g. Opygen"
                            />
                        </Field>
                        <Field
                            label="Tagline"
                            icon={<FileText className="h-3 w-3" />}
                        >
                            <Input
                                type="text"
                                value={form.tagline}
                                onChange={(e) => set("tagline")(e.target.value)}
                                placeholder="e.g. Building digital futures"
                            />
                        </Field>
                        <Field
                            label="Email"
                            icon={<Mail className="h-3 w-3" />}
                        >
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => set("email")(e.target.value)}
                                placeholder="contact@yourcompany.com"
                            />
                        </Field>

                        {/* ── Phone with country code ── */}
                        <Field
                            label="Phone"
                            icon={<Phone className="h-3 w-3" />}
                        >
                            <PhoneInput
                                value={form.phone}
                                onChange={(val) => set("phone")(val)}
                            />
                        </Field>

                        <Field
                            label="Website"
                            icon={<Globe className="h-3 w-3" />}
                        >
                            <Input
                                type="url"
                                value={form.website}
                                onChange={(e) => set("website")(e.target.value)}
                                placeholder="https://opygen.com"
                            />
                        </Field>
                        <Field
                            label="Address"
                            icon={<MapPin className="h-3 w-3" />}
                        >
                            <Input
                                type="text"
                                value={form.address}
                                onChange={(e) => set("address")(e.target.value)}
                                placeholder="123 Main St, City, Country"
                            />
                        </Field>
                    </div>
                    <Field
                        label="Description"
                        icon={<FileText className="h-3 w-3" />}
                        hint="A short blurb about what your company does."
                    >
                        <Textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => set("description")(e.target.value)}
                            placeholder="We build premium digital products and software solutions…"
                        />
                    </Field>
                </Section>
            </motion.div>

            {/* ── Section B: Social Links ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.16,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <Section
                    title="Social Media Links"
                    description="Connect your company's social presence — leave blank to hide"
                    icon={<Globe className="h-3.5 w-3.5 text-violet-500" />}
                    accent="from-violet-500/8"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {socialFields.map(
                            ({ key, label, icon, placeholder }) => (
                                <Field key={key} label={label} icon={icon}>
                                    <Input
                                        type="url"
                                        value={form.socials[key]}
                                        onChange={(e) =>
                                            setSocial(key)(e.target.value)
                                        }
                                        placeholder={placeholder}
                                    />
                                </Field>
                            ),
                        )}
                    </div>
                </Section>
            </motion.div>
        </div>
    )}

    {/* ── TAB 2: Monthly Revenue ── */}
    {activeTab === "revenue" && (
        <div className="space-y-8">
            {/* ── Section C: Monthly Revenue Goal & Performance History ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.1,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <Section
                    title="Monthly Revenue Goal & Performance"
                    description="Configure monthly revenue goals and review all historical monthly earnings from Finance income transactions"
                    icon={<Target className="h-3.5 w-3.5 text-emerald-500" />}
                    accent="from-emerald-500/8"
                >
                    <div className="space-y-6">
                        {/* Target Input */}
                        <div className="max-w-xs">
                            <Field
                                label="Default Monthly Target"
                                icon={<Target className="h-3 w-3" />}
                                hint="Target revenue you aim to collect in Finance income each month."
                            >
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">
                                        ৳
                                    </span>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={form.monthlyBudgetGoal}
                                        onChange={(e) =>
                                            set("monthlyBudgetGoal")(e.target.value)
                                        }
                                        placeholder="200000"
                                        className="pl-8 font-semibold"
                                    />
                                </div>
                            </Field>
                        </div>

                        {/* Summary KPI Cards for Revenue History */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 flex flex-col justify-between gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        All-Time Income
                                    </span>
                                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                                        ৳{totalLifetimeBdt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                                        Total BDT Collected
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 flex flex-col justify-between gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Current Month
                                    </span>
                                    <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-1.5">
                                        <p className="text-xl font-black text-foreground tracking-tight tabular-nums">
                                            ৳{(currentMonthData?.revenueBdt ?? 0).toLocaleString()}
                                        </p>
                                        {Number(form.monthlyBudgetGoal) > 0 && (
                                            <span className="text-xs font-bold text-muted-foreground">
                                                / ৳{Number(form.monthlyBudgetGoal).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                                        Earned this month
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 flex flex-col justify-between gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Best Month
                                    </span>
                                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                        <Award className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-foreground tracking-tight tabular-nums">
                                        ৳{(bestMonth?.revenueBdt ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                        {bestMonth?.monthName ?? "No record yet"}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 flex flex-col justify-between gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Months Tracked
                                    </span>
                                    <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-foreground tracking-tight tabular-nums">
                                        {revenueHistory.length}
                                    </p>
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                        Finance income ledger
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* All Monthly Revenue Records Showcase */}
                        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/10">
                                <div>
                                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Target className="h-4 w-4 text-emerald-500" />
                                        All Monthly Revenue & Target Showcase
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Full record of all months&apos; earned income transactions vs revenue goal targets.
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground/80 self-start sm:self-auto px-2.5 py-1 rounded-md bg-muted/40 border border-border/60">
                                    {revenueHistory.length} Month{revenueHistory.length === 1 ? "" : "s"}
                                </span>
                            </div>

                            {revenueHistory.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No monthly income transactions recorded yet.
                                </div>
                            ) : (
                                <>
                                     {/* Desktop Table */}
                                     <div className="hidden md:block overflow-x-auto">
                                         <table className="w-full text-sm text-left">
                                             <thead className="text-[11px] text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border/50">
                                                 <tr>
                                                     <th className="px-5 py-3 font-semibold">Month & Year</th>
                                                     <th className="px-5 py-3 font-semibold text-right">Revenue (৳ BDT)</th>
                                                     <th className="px-5 py-3 font-semibold text-right">Target Goal</th>
                                                     <th className="px-5 py-3 font-semibold min-w-[140px]">Progress</th>
                                                     <th className="px-5 py-3 font-semibold text-right">Status</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-border/40 text-xs">
                                                 {paginatedRevenue.map((m) => {
                                                     const goal = m.goal || Number(form.monthlyBudgetGoal) || 200000;
                                                     const pct = goal > 0 ? Math.min(Math.round((m.revenueBdt / goal) * 100), 999) : 0;
                                                     const isAchieved = goal > 0 && m.revenueBdt >= goal;

                                                     return (
                                                         <tr key={m.monthKey} className={cn("hover:bg-muted/20 transition-colors", m.isCurrent && "bg-indigo-500/5")}>
                                                             <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                                                                 <div className="flex items-center gap-2">
                                                                     <span className="font-bold text-foreground text-sm">
                                                                         {m.monthName}
                                                                     </span>
                                                                     {m.isCurrent && (
                                                                         <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px] px-1.5 py-0">
                                                                             Current Month
                                                                         </Badge>
                                                                     )}
                                                                 </div>
                                                                 <span className="text-[11px] text-muted-foreground">
                                                                     {m.transactionCount} transaction{m.transactionCount === 1 ? "" : "s"}
                                                                 </span>
                                                             </td>
                                                             <td className="px-5 py-3.5 text-right font-extrabold text-sm tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                                 ৳{m.revenueBdt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                             </td>
                                                             <td className="px-5 py-3.5 text-right font-medium text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                                                                 {goal > 0 ? `৳${goal.toLocaleString()}` : <span className="text-muted-foreground/50">No goal</span>}
                                                             </td>
                                                             <td className="px-5 py-3.5">
                                                                 <div className="space-y-1">
                                                                     <div className="flex items-center justify-between text-[11px] font-bold">
                                                                         <span className={cn(isAchieved ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                                                                             {pct}%
                                                                         </span>
                                                                     </div>
                                                                     <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                                                                         <div
                                                                             className={cn(
                                                                                 "h-full rounded-full transition-all duration-500",
                                                                                 pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-indigo-500" : "bg-violet-500"
                                                                             )}
                                                                             style={{ width: `${Math.min(pct, 100)}%` }}
                                                                         />
                                                                     </div>
                                                                 </div>
                                                             </td>
                                                             <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                                 {isAchieved ? (
                                                                     <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold gap-1">
                                                                         <Sparkles className="h-3 w-3" />
                                                                         Goal Reached
                                                                     </Badge>
                                                                 ) : m.isCurrent ? (
                                                                     <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[11px] font-semibold gap-1">
                                                                         <TrendingUp className="h-3 w-3" />
                                                                         In Progress
                                                                     </Badge>
                                                                 ) : (
                                                                     <Badge variant="outline" className="text-muted-foreground text-[11px] font-medium">
                                                                         Under Target
                                                                     </Badge>
                                                                 )}
                                                             </td>
                                                         </tr>
                                                     );
                                                 })}
                                             </tbody>
                                         </table>
                                     </div>

                                     {/* Mobile Card List */}
                                     <div className="md:hidden divide-y divide-border/50">
                                         {paginatedRevenue.map((m) => {
                                             const goal = m.goal || Number(form.monthlyBudgetGoal) || 200000;
                                             const pct = goal > 0 ? Math.min(Math.round((m.revenueBdt / goal) * 100), 999) : 0;
                                             const isAchieved = goal > 0 && m.revenueBdt >= goal;

                                             return (
                                                 <div key={m.monthKey} className="p-4 space-y-3">
                                                     <div className="flex items-start justify-between gap-2">
                                                         <div>
                                                             <div className="flex items-center gap-1.5">
                                                                 <span className="font-bold text-foreground text-sm">
                                                                     {m.monthName}
                                                                 </span>
                                                                 {m.isCurrent && (
                                                                     <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[9px] px-1 py-0">
                                                                         Current
                                                                     </Badge>
                                                                 )}
                                                             </div>
                                                             <span className="text-[11px] text-muted-foreground">
                                                                 {m.transactionCount} transaction{m.transactionCount === 1 ? "" : "s"}
                                                             </span>
                                                         </div>
                                                         {isAchieved ? (
                                                             <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold gap-1">
                                                                 <Sparkles className="h-2.5 w-2.5" />
                                                                 Reached
                                                             </Badge>
                                                         ) : m.isCurrent ? (
                                                             <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px] font-semibold">
                                                                 Active
                                                             </Badge>
                                                         ) : (
                                                             <Badge variant="outline" className="text-muted-foreground text-[10px]">
                                                                 Ended
                                                             </Badge>
                                                         )}
                                                     </div>

                                                     <div className="bg-muted/20 p-2.5 rounded-lg text-xs">
                                                         <span className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Revenue</span>
                                                         <p className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                                                             ৳{m.revenueBdt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                         </p>
                                                     </div>

                                                     <div className="space-y-1">
                                                         <div className="flex items-center justify-between text-[11px]">
                                                             <span className="text-muted-foreground">
                                                                 Target: {goal > 0 ? `৳${goal.toLocaleString()}` : "None"}
                                                             </span>
                                                             <span className="font-bold text-foreground tabular-nums">
                                                                 {pct}%
                                                             </span>
                                                         </div>
                                                         <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                                                             <div
                                                                 className={cn(
                                                                     "h-full rounded-full",
                                                                     pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-indigo-500" : "bg-violet-500"
                                                                 )}
                                                                 style={{ width: `${Math.min(pct, 100)}%` }}
                                                             />
                                                         </div>
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                     </div>

                                    {/* Pagination Controls when data > 10 */}
                                    {revenueHistory.length > REVENUE_PER_PAGE && (
                                        <div className="px-5 py-3.5 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <p className="text-xs text-muted-foreground">
                                                Showing <span className="font-semibold text-foreground">{(revenuePage - 1) * REVENUE_PER_PAGE + 1}</span> to{" "}
                                                <span className="font-semibold text-foreground">
                                                    {Math.min(revenuePage * REVENUE_PER_PAGE, revenueHistory.length)}
                                                </span>{" "}
                                                of <span className="font-semibold text-foreground">{revenueHistory.length}</span> months
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                                                    onClick={() => setRevenuePage((p) => Math.max(1, p - 1))}
                                                    disabled={revenuePage <= 1}
                                                >
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                    Previous
                                                </Button>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: totalRevenuePages }).map((_, i) => (
                                                        <Button
                                                            key={i}
                                                            variant={revenuePage === i + 1 ? "default" : "outline"}
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 w-8 p-0 text-xs font-medium cursor-pointer",
                                                                revenuePage === i + 1 ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                                                            )}
                                                            onClick={() => setRevenuePage(i + 1)}
                                                        >
                                                            {i + 1}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                                                    onClick={() => setRevenuePage((p) => Math.min(totalRevenuePages, p + 1))}
                                                    disabled={revenuePage >= totalRevenuePages}
                                                >
                                                    Next
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Section>
            </motion.div>
        </div>
    )}

    {/* ── TAB 3: Products Management ── */}
    {activeTab === "products" && <ProductsSettingsTab />}

    {/* ══════════════════════════════════════════
        FLOATING SAVE BAR — appears when dirty
    ══════════════════════════════════════════ */}
    <AnimatePresence>
        {isDirty && activeTab !== "products" && (
            <motion.div
                        key="save-bar"
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 32 }}
                        transition={{
                            duration: 0.28,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
                    >
                        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/95 px-5 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl ring-1 ring-indigo-500/10">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                Unsaved changes
                            </div>
                            <div className="h-4 w-px bg-border/60" />
                            <button
                                onClick={() => {
                                    setForm(savedForm);
                                    setLogoFile(null);
                                    setLogoPreview(null);
                                }}
                                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                Discard
                            </button>
                            <Button
                                onClick={() => saveMutation.mutate()}
                                disabled={saveMutation.isPending}
                                className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/25 px-5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {saveMutation.isPending ? (
                                    <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />{" "}
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5" /> Save
                                        Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
