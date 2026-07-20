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
} from "lucide-react";
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
    companyName: "",
    tagline: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    socials: { facebook: "", instagram: "", linkedin: "", youtube: "", x: "" },
    monthlyBudgetGoal: "0",
};

type FormState = typeof DEFAULT_FORM;

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function CompanySettingsView() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [savedForm, setSavedForm] = useState<FormState>(DEFAULT_FORM);
    const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

    /* ── fetch settings ── */
    const { data: settings, isLoading } = useQuery<any>({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await fetch("/api/settings");
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        },
    });

    useEffect(() => {
        if (!settings) return;
        const loaded: FormState = {
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
            monthlyBudgetGoal: String(settings.monthlyBudgetGoal ?? 0),
        };
        setForm(loaded);
        setSavedForm(loaded);
    }, [settings]);

    /* ── save mutation ── */
    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                companyName: form.companyName,
                tagline: form.tagline,
                description: form.description,
                email: form.email,
                phone: form.phone,
                website: form.website,
                address: form.address,
                socials: form.socials,
                monthlyBudgetGoal: parseFloat(form.monthlyBudgetGoal) || 0,
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

            {/* ── Section C: Monthly Revenue Goal ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.24,
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                <Section
                    title="Monthly Revenue Goal"
                    description="Set a monthly payment collection target — shown as a progress bar on the dashboard"
                    icon={<Target className="h-3.5 w-3.5 text-emerald-500" />}
                    accent="from-emerald-500/8"
                >
                    <div className="max-w-xs">
                        <Field
                            label="Monthly Target"
                            icon={<Target className="h-3 w-3" />}
                            hint="Total amount you aim to collect in payments each month."
                        >
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">
                                    $
                                </span>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.monthlyBudgetGoal}
                                    onChange={(e) =>
                                        set("monthlyBudgetGoal")(e.target.value)
                                    }
                                    placeholder="0"
                                    className="pl-8"
                                />
                            </div>
                        </Field>
                    </div>
                </Section>
            </motion.div>

            {/* ══════════════════════════════════════════
                FLOATING SAVE BAR — appears when dirty
            ══════════════════════════════════════════ */}
            <AnimatePresence>
                {isDirty && (
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
                                onClick={() => setForm(savedForm)}
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
