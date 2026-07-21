"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    User as UserIcon,
    Mail,
    Upload,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    Laptop,
    Globe,
    Trash2,
    KeyRound,
    ShieldAlert,
    Smartphone,
    ChevronRight,
    Wallet,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Landmark,
    Plus,
    X,
    CreditCard,
} from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { useForm, Controller } from "react-hook-form";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileInput } from "@/lib/validations";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "../../lib/utils";
import { useAppSelector, useAppDispatch } from "@/store";
import { setUserProfile, updateAvatar } from "@/store/userSlice";
import User from "../../models/User";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

const BANGLADESH_BANKS = [
    "AB Bank",
    "Agrani Bank",
    "Al-Arafah Islami Bank",
    "Bangladesh Commerce Bank",
    "Bangladesh Development Bank (BDBL)",
    "Bangladesh Krishi Bank",
    "Bank Alfalah",
    "Bank Asia",
    "BASIC Bank",
    "Bengal Commercial Bank",
    "BRAC Bank",
    "Citizens Bank",
    "Citibank N.A.",
    "City Bank",
    "Commercial Bank of Ceylon",
    "Dhaka Bank",
    "Dutch-Bangla Bank (DBBL)",
    "Eastern Bank (EBL)",
    "Exim Bank",
    "First Security Islami Bank",
    "Global Islami Bank",
    "Habib Bank",
    "HSBC",
    "ICB Islamic Bank",
    "IFIC Bank",
    "Islami Bank (IBBL)",
    "Jamuna Bank",
    "Janata Bank",
    "Meghna Bank",
    "Mercantile Bank",
    "Midland Bank",
    "Modhumoti Bank",
    "Mutual Trust Bank (MTB)",
    "National Bank",
    "National Bank of Pakistan",
    "National Credit and Commerce Bank (NCC)",
    "NRB Bank",
    "NRB Commercial Bank",
    "One Bank",
    "Padma Bank",
    "Premier Bank",
    "Prime Bank",
    "Probashi Kallyan Bank",
    "Pubali Bank",
    "Rajshahi Krishi Unnayan Bank",
    "Rupali Bank",
    "Shahjalal Islami Bank",
    "Shimanto Bank",
    "Social Islami Bank (SIBL)",
    "Sonali Bank",
    "South Bangla Agriculture and Commerce Bank (SBAC)",
    "Southeast Bank",
    "Standard Bank",
    "Standard Chartered Bank",
    "State Bank of India",
    "Trust Bank",
    "Union Bank",
    "United Commercial Bank (UCB)",
    "Uttara Bank",
    "Woori Bank",
    "Other",
];

const MOBILE_BANKING_PROVIDERS = [
    "bKash",
    "Nagad",
    "Rocket",
    "Upay",
    "mCash",
    "SureCash",
    "Tap",
    "Other",
];

/** Small pure helpers — no side effects, safe to keep outside the component */
function formatRelativeTime(dateInput: string | Date) {
    const date = new Date(dateInput);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getPasswordStrength(password: string) {
    if (!password) return { score: 0, label: "", barClass: "bg-border" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const clamped = Math.min(score, 4);
    const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
    const barClasses = [
        "bg-rose-500",
        "bg-rose-500",
        "bg-amber-500",
        "bg-emerald-500",
        "bg-emerald-600",
    ];
    return {
        score: clamped,
        label: labels[clamped],
        barClass: barClasses[clamped],
    };
}

export default function UserProfileView() {
    const { data: session } = useSession();
    const reduxUser = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();

    const [activeTab, setActiveTab] = useState<
        "profile" | "security" | "sessions" | "statement" | "accounts"
    >("profile");
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showBalance, setShowBalance] = useState(false);
    const [statementPage, setStatementPage] = useState(1);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const [providerSelection, setProviderSelection] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form for Profile Details (Name, Mobile Number, Avatar)
    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        setValue: setProfileValue,
        getValues: getProfileValues,
        watch: watchProfile,
        control: profileControl,
        formState: { errors: profileErrors },
    } = useForm<ProfileInput>({
        resolver: zodResolver(profileSchema),
        values: {
            name: reduxUser.name || session?.user?.name || "",
            avatarUrl: reduxUser.avatarUrl || session?.user?.avatarUrl || "",
            mobileNumber:
                reduxUser.mobileNumber || session?.user?.mobileNumber || "",
            fathersName: reduxUser.fathersName || "",
            mothersName: reduxUser.mothersName || "",
            gender: reduxUser.gender || "",
            dateOfBirth: reduxUser.dateOfBirth
                ? new Date(reduxUser.dateOfBirth).toISOString().split("T")[0]
                : "",
            bloodGroup: reduxUser.bloodGroup || "",
        },
    });

    // Dedicated Form for Password Change
    const [passwordLoading, setPasswordLoading] = useState(false);
    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPasswordForm,
        watch: watchPassword,
        formState: { errors: passwordErrors },
    } = useForm({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const newPasswordValue = watchPassword("newPassword");
    const passwordStrength = getPasswordStrength(newPasswordValue || "");

    // Account Modal Form
    const {
        register: registerAccount,
        handleSubmit: handleAccountSubmit,
        reset: resetAccountForm,
        watch: watchAccount,
        formState: { errors: accountErrors },
        setValue: setAccountValue,
        control: accountControl,
    } = useForm({
        shouldUnregister: false,
        defaultValues: {
            type: "bank",
            providerName: "",
            accountName: "",
            accountNumber: "",
            routingNumber: "",
            branch: "",
        },
    });

    const accountType = watchAccount("type");

    const saveAccountMutation = useMutation({
        mutationFn: async (data: any) => {
            const currentAccounts = reduxUser.accounts
                ? [...reduxUser.accounts]
                : [];
            if (accountToEdit) {
                const index = currentAccounts.findIndex(
                    (a: any) => a._id === accountToEdit._id,
                );
                if (index !== -1) {
                    currentAccounts[index] = {
                        ...currentAccounts[index],
                        ...data,
                    };
                }
            } else {
                currentAccounts.push(data);
            }

            const res = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accounts: currentAccounts }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to save account");
            }
            return res.json();
        },
        onSuccess: (data) => {
            dispatch(setUserProfile({ accounts: data.user.accounts }));
            setIsAccountModalOpen(false);
            setAccountToEdit(null);
            resetAccountForm();
            toast.success("Account saved successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to save account");
        },
    });

    const deleteAccountMutation = useMutation({
        mutationFn: async (accountId: string) => {
            const currentAccounts = (reduxUser.accounts || []).filter(
                (a: any) => a._id !== accountId,
            );
            const res = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accounts: currentAccounts }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to delete account");
            }
            return res.json();
        },
        onSuccess: (data) => {
            dispatch(setUserProfile({ accounts: data.user.accounts }));
            toast.success("Account deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete account");
        },
    });

    // Query to get active sessions
    const { data: sessions = [], refetch: refetchSessions } = useQuery<any[]>({
        queryKey: ["sessions"],
        queryFn: async () => {
            const res = await fetch("/api/sessions");
            if (!res.ok) throw new Error("Failed to fetch active sessions");
            return res.json();
        },
    });

    const { data: userProfile } = useQuery({
        queryKey: ["userProfile"],
        queryFn: async () => {
            const res = await fetch("/api/users/profile");
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        },
        refetchInterval: 10000, // poll every 10s to keep balance in sync
        refetchOnWindowFocus: true, // refetch when user switches back to tab
        staleTime: 5000,
    });

    useEffect(() => {
        if (userProfile) {
            dispatch(
                setUserProfile({
                    id: userProfile._id,
                    name: userProfile.name,
                    email: userProfile.email,
                    avatarUrl: userProfile.avatarUrl,
                    mobileNumber: userProfile.mobileNumber,
                    role: userProfile.role,
                    balance: userProfile.balance,
                    status: userProfile.status,
                    fathersName: userProfile.fathersName,
                    mothersName: userProfile.mothersName,
                    gender: userProfile.gender,
                    dateOfBirth: userProfile.dateOfBirth,
                    bloodGroup: userProfile.bloodGroup,
                    accounts: userProfile.accounts || [],
                }),
            );
        }
    }, [userProfile, dispatch]);

    // Query to get paginated statements for the statement tab
    const {
        data: statementData,
        isLoading: isLoadingStatement,
        refetch: refetchStatements,
    } = useQuery({
        queryKey: ["statement", statementPage, session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return { transactions: [], totalPages: 1 };
            const res = await fetch(
                `/api/statements?user=${session.user.id}&page=${statementPage}&limit=10`,
            );
            if (!res.ok) throw new Error("Failed to fetch statements");
            const data = await res.json();
            return {
                transactions: data.statements || [],
                totalPages: data.totalPages,
                currentPage: data.currentPage,
                total: data.total,
            };
        },
        enabled: !!session?.user?.id,
        refetchInterval: 10000, // poll every 10 seconds automatically
        refetchOnWindowFocus: true, // refetch when user switches back to the tab/window
        staleTime: 5000, // treat data as stale after 5s so refetch triggers
    });

    // Mutation to delete a session
    const deleteSessionMutation = useMutation({
        mutationFn: async (sessionId: string) => {
            const res = await fetch(`/api/sessions?id=${sessionId}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error || "Failed to terminate session",
                );
            }
            return res.json();
        },
        onSuccess: () => {
            refetchSessions();
            toast.success("Session terminated successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to terminate session");
        },
    });

    const avatarUrlValue = watchProfile("avatarUrl");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async () => {
            const base64 = reader.result as string;
            setPreviewUrl(base64);

            try {
                // 1. Upload to Cloudinary
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64 }),
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(
                        errData.error || "Failed to upload image to Cloudinary",
                    );
                }

                const uploadData = await uploadRes.json();

                // 2. Immediately save the new avatar to the DB
                // The backend PATCH route handles deleting the previous image from Cloudinary
                const currentData = getProfileValues();
                const patchData = {
                    name: currentData.name,
                    mobileNumber: currentData.mobileNumber,
                    avatarUrl: uploadData.url,
                };

                const profileRes = await fetch("/api/users/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patchData),
                });

                if (!profileRes.ok) {
                    const errData = await profileRes.json();
                    throw new Error(
                        errData.error || "Failed to save avatar to profile",
                    );
                }

                // 3. Update the frontend session & form state
                dispatch(updateAvatar(uploadData.url));

                setProfileValue("avatarUrl", uploadData.url, {
                    shouldValidate: true,
                });

                setPreviewUrl(null);
                toast.success("Avatar updated successfully!");
            } catch (err: any) {
                setPreviewUrl(null);
                toast.error(err.message || "Image update failed.");
            } finally {
                setIsUploading(false);
            }
        };

        reader.readAsDataURL(file);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const onProfileSubmit = async (data: ProfileInput) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to update profile");
            }

            const updatedData = await res.json();

            dispatch(setUserProfile(updatedData.user));

            toast.success("Your profile has been updated!");
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile details.");
        } finally {
            setIsSaving(false);
        }
    };

    const onPasswordSubmit = async (data: any) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await fetch("/api/users/change-password-voluntary", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to update password");
            }

            toast.success("Your password has been changed successfully!");
            resetPasswordForm();
        } catch (err: any) {
            toast.error(err.message || "Failed to update password.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const nameValue =
        watchProfile("name") || reduxUser.name || session?.user?.name || "";
    const currentAvatar =
        previewUrl ||
        avatarUrlValue ||
        reduxUser.avatarUrl ||
        session?.user?.avatarUrl ||
        "";
    // Page-level income/expense split for the statement tab summary strip
    const pageIncome = (statementData?.transactions || [])
        .filter((t: any) => t.type === "income" || t.type === "+")
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const pageExpense = (statementData?.transactions || [])
        .filter((t: any) => t.type !== "income" && t.type !== "+")
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    const balanceValue = Number((pageIncome - pageExpense).toFixed(2));

    useEffect(() => {
        if (balanceValue !== undefined && session?.user?.id && reduxUser) {
            // Optimistically update redux
            if (reduxUser.balance !== balanceValue) {
                dispatch(
                    setUserProfile({
                        ...reduxUser,
                        balance: balanceValue,
                    }),
                );
                // Update backend
                fetch("/api/users/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ balance: balanceValue }),
                }).catch((err) => console.error("Failed to sync balance", err));
            }
        }
    }, [balanceValue, session?.user?.id, reduxUser, dispatch]);

    const tabs = [
        {
            id: "profile",
            name: "Profile Details",
            icon: UserIcon,
            description: "Name & contact",
        },
        {
            id: "security",
            name: "Security",
            icon: KeyRound,
            description: "Password",
        },
        {
            id: "sessions",
            name: "Active Sessions",
            icon: Laptop,
            description: `${sessions.length} device${sessions.length === 1 ? "" : "s"}`,
        },
        {
            id: "statement",
            name: "Salary & Balance",
            icon: Wallet,
            description: "Statements",
        },
        {
            id: "accounts",
            name: "Linked Accounts",
            icon: Landmark,
            description: "Bank & Mobile",
        },
    ] as const;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto space-y-6"
        >
            {/* Profile Header Card */}
            <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Banner Graphics */}
                <div className="relative h-28 sm:h-32 w-full bg-linear-to-br from-indigo-600 via-indigo-500 to-purple-600 overflow-hidden">
                    <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                    <div className="absolute -top-6 right-16 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                </div>

                {/* Profile Card Body */}
                <div className="px-6 pb-6 pt-0 relative">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 -mt-12 sm:-mt-14">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                            {/* Avatar Selector Wrapper */}
                            <div
                                className="relative group cursor-pointer shrink-0"
                                onClick={handleAvatarClick}
                                title="Click to upload avatar"
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-card ring-2 ring-indigo-500/20 shadow-xl transition-transform duration-300 group-hover:scale-95">
                                    <AvatarImage
                                        src={currentAvatar}
                                        alt={nameValue}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-linear-to-br from-indigo-500 to-indigo-600 text-3xl font-extrabold text-white">
                                        {nameValue
                                            .substring(0, 2)
                                            .toUpperCase() || "OP"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {isUploading ? (
                                        <Loading variant="mini" />
                                    ) : (
                                        <Upload className="h-6 w-6 text-white" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5 pb-1">
                                <h2 className="text-2xl font-extrabold tracking-tight text-white">
                                    {nameValue}
                                </h2>
                                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                                    <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 font-bold text-xs capitalize">
                                        {session?.user?.role || "Member"}
                                    </Badge>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 font-bold text-xs flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 shrink-0" />
                                        {session?.user?.status || "Active"}
                                    </Badge>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                                    <Mail className="h-4 w-4 text-muted-foreground/80" />
                                    {session?.user?.email}
                                </p>
                            </div>
                        </div>

                        {/* Balance quick-view */}
                        {/* <button
                            type="button"
                            onClick={() => setShowBalance(!showBalance)}
                            className="group flex items-center gap-3 self-center lg:self-auto rounded-xl border border-border bg-accent/20 px-4 py-2.5 transition-colors hover:bg-accent/40 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Wallet className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Balance
                                </p>
                                <AnimatePresence mode="wait" initial={false}>
                                    {showBalance ? (
                                        <motion.p
                                            key="amount"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.15 }}
                                            className={cn(
                                                "text-base font-black tabular-nums leading-tight",
                                                balanceValue >= 0
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-rose-600 dark:text-rose-400",
                                            )}
                                        >
                                            ${balanceValue.toFixed(2)}
                                        </motion.p>
                                    ) : (
                                        <motion.p
                                            key="hidden"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.15 }}
                                            className="text-base font-black tracking-widest text-foreground/60 leading-tight"
                                        >
                                            •••••
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </button> */}
                        {/* <button
                            type="button"
                            onClick={() => setShowBalance(!showBalance)}
                            className="group flex items-center gap-3 self-center lg:self-auto rounded-xl border border-border bg-accent/20 px-4 py-2.5 hover:bg-accent/40 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <Wallet className="h-4 w-4" />
                            </div>

                            <div className="text-left">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Balance
                                </p>

                                <div className="w-[140px] overflow-hidden">
                                    <AnimatePresence
                                        mode="wait"
                                        initial={false}
                                    >
                                        {showBalance ? (
                                            <motion.p
                                                key="amount"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.15 }}
                                                className={cn(
                                                    "truncate text-base font-black leading-tight tabular-nums",
                                                    balanceValue >= 0
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-rose-600 dark:text-rose-400",
                                                )}
                                            >
                                                $
                                                {balanceValue.toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    },
                                                )}
                                            </motion.p>
                                        ) : (
                                            <motion.p
                                                key="hidden"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.15 }}
                                                className="text-base font-black tracking-widest text-foreground/60 leading-tight"
                                            >
                                                •••••••••
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </button> */}
                    </div>
                </div>
            </div>

            {/* Sidebar + Content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[228px_1fr] gap-6 items-start">
                {/* Nav rail — horizontal pills on mobile, vertical list on desktop */}
                <nav className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0 lg:sticky lg:top-6">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors shrink-0 lg:shrink lg:w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                                    isActive
                                        ? "border-indigo-500/30 bg-indigo-500/10"
                                        : "border-transparent hover:bg-accent/40",
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors",
                                        isActive
                                            ? "bg-indigo-600 text-white"
                                            : "bg-accent/60 text-muted-foreground group-hover:text-foreground",
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 hidden sm:block">
                                    <p
                                        className={cn(
                                            "text-sm font-semibold whitespace-nowrap",
                                            isActive
                                                ? "text-indigo-600 dark:text-indigo-400"
                                                : "text-foreground",
                                        )}
                                    >
                                        {tab.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                        {tab.description}
                                    </p>
                                </div>
                                <ChevronRight
                                    className={cn(
                                        "h-4 w-4 ml-auto shrink-0 text-indigo-500 transition-opacity hidden lg:block",
                                        isActive
                                            ? "opacity-100"
                                            : "opacity-0 group-hover:opacity-40",
                                    )}
                                />
                            </button>
                        );
                    })}
                </nav>

                {/* Tab Panels */}
                <div className="relative min-w-0">
                    <AnimatePresence mode="wait">
                        {activeTab === "profile" && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-border bg-card shadow-sm text-card-foreground">
                                    <CardHeader className="border-b border-border/60 pb-4">
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <UserIcon className="h-4.5 w-4.5 text-indigo-500" />
                                            Personal Information
                                        </CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            Update your display name and contact
                                            mobile number.
                                        </CardDescription>
                                    </CardHeader>
                                    <form
                                        onSubmit={handleProfileSubmit(
                                            onProfileSubmit,
                                        )}
                                    >
                                        <CardContent className="p-6 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="name"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        Full Name
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        placeholder="Alice Smith"
                                                        {...registerProfile(
                                                            "name",
                                                        )}
                                                        className="bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10 w-full"
                                                    />
                                                    {profileErrors.name && (
                                                        <p className="text-xs text-destructive mt-1">
                                                            {
                                                                profileErrors
                                                                    .name
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="mobileNumber"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        Mobile Number
                                                    </Label>
                                                    <Controller
                                                        name="mobileNumber"
                                                        control={profileControl}
                                                        render={({ field }) => (
                                                            <PhoneInput
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                                id="mobileNumber"
                                                            />
                                                        )}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground italic mt-1">
                                                        Select country code from
                                                        dropdown.
                                                    </p>
                                                    {profileErrors.mobileNumber && (
                                                        <p className="text-xs text-destructive mt-1">
                                                            {
                                                                profileErrors
                                                                    .mobileNumber
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="email"
                                                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                >
                                                    Email Address
                                                </Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        value={
                                                            session?.user
                                                                ?.email || ""
                                                        }
                                                        disabled
                                                        className="pl-10 bg-accent/40 border-border text-muted-foreground cursor-not-allowed h-10 w-full"
                                                    />
                                                </div>
                                                <p className="text-[11px] text-muted-foreground italic mt-1">
                                                    Email addresses are unique
                                                    and locked to this account.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="fathersName"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        Father's Name
                                                    </Label>
                                                    <Input
                                                        id="fathersName"
                                                        placeholder="John Smith"
                                                        {...registerProfile(
                                                            "fathersName",
                                                        )}
                                                        className="bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10 w-full"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="mothersName"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        Mother's Name
                                                    </Label>
                                                    <Input
                                                        id="mothersName"
                                                        placeholder="Jane Smith"
                                                        {...registerProfile(
                                                            "mothersName",
                                                        )}
                                                        className="bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10 w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="gender"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        Gender
                                                    </Label>
                                                    <Controller
                                                        name="gender"
                                                        control={profileControl}
                                                        render={({ field }) => (
                                                            <Select
                                                                value={
                                                                    field.value ||
                                                                    ""
                                                                }
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                            >
                                                                <SelectTrigger className="bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10! w-full">
                                                                    <SelectValue placeholder="Select gender" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value="Male"
                                                                        className="h-10!"
                                                                    >
                                                                        Male
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="Female"
                                                                        className="h-10!"
                                                                    >
                                                                        Female
                                                                    </SelectItem>
                                                                    <SelectItem
                                                                        value="Other"
                                                                        className="h-10!"
                                                                    >
                                                                        Other
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="dateOfBirth"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        Date of Birth
                                                    </Label>
                                                    <Input
                                                        id="dateOfBirth"
                                                        type="date"
                                                        {...registerProfile(
                                                            "dateOfBirth",
                                                        )}
                                                        className="bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10 w-full"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="bloodGroup"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        Blood Group
                                                    </Label>
                                                    <Controller
                                                        name="bloodGroup"
                                                        control={profileControl}
                                                        render={({ field }) => (
                                                            <Select
                                                                value={
                                                                    field.value ||
                                                                    ""
                                                                }
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                            >
                                                                <SelectTrigger className="bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10! w-full">
                                                                    <SelectValue placeholder="Select blood group" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {[
                                                                        "A+",
                                                                        "A-",
                                                                        "B+",
                                                                        "B-",
                                                                        "AB+",
                                                                        "AB-",
                                                                        "O+",
                                                                        "O-",
                                                                    ].map(
                                                                        (
                                                                            bg,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    bg
                                                                                }
                                                                                value={
                                                                                    bg
                                                                                }
                                                                            >
                                                                                {
                                                                                    bg
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="border-t border-border/80 p-6 flex justify-end gap-3 bg-accent/5 rounded-b-lg">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    isSaving || isUploading
                                                }
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-10 px-5 cursor-pointer shadow-md shadow-indigo-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            >
                                                {isSaving ? (
                                                    <Loading
                                                        variant="mini"
                                                        text="Saving changes..."
                                                    />
                                                ) : (
                                                    "Save Profile Details"
                                                )}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "security" && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-border bg-card shadow-sm text-card-foreground">
                                    <CardHeader className="border-b border-border/60 pb-4">
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <Lock className="h-4.5 w-4.5 text-indigo-500" />
                                            Security Settings
                                        </CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            Update your account credentials.
                                            Your current password is required to
                                            confirm this change.
                                        </CardDescription>
                                    </CardHeader>
                                    <form
                                        onSubmit={handlePasswordSubmit(
                                            onPasswordSubmit,
                                        )}
                                    >
                                        <CardContent className="p-6 space-y-5">
                                            {/* Security Alert banner */}
                                            <div className="flex gap-3 p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-indigo-950 dark:text-indigo-200">
                                                <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-bold">
                                                        Password Requirements
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                        Use at least 8
                                                        characters with a mix of
                                                        uppercase letters,
                                                        numbers, and symbols.
                                                        Avoid reusing previous
                                                        passwords.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="currentPassword"
                                                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                >
                                                    Current Password
                                                </Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="currentPassword"
                                                        type={
                                                            showPassword
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        placeholder="Confirm current password"
                                                        {...registerPassword(
                                                            "currentPassword",
                                                            {
                                                                required:
                                                                    "Current password is required",
                                                            },
                                                        )}
                                                        className="pl-10 pr-10 bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10 w-full"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setShowPassword(
                                                                !showPassword,
                                                            )
                                                        }
                                                        className="absolute right-2 top-1.5 h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                                {passwordErrors.currentPassword && (
                                                    <p className="text-xs text-destructive mt-1">
                                                        {
                                                            passwordErrors
                                                                .currentPassword
                                                                .message as string
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="newPassword"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        New Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="newPassword"
                                                            type={
                                                                showNewPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            placeholder="At least 8 characters"
                                                            {...registerPassword(
                                                                "newPassword",
                                                                {
                                                                    required:
                                                                        "New password is required",
                                                                    minLength: {
                                                                        value: 8,
                                                                        message:
                                                                            "New password must be at least 8 characters long",
                                                                    },
                                                                },
                                                            )}
                                                            className="pl-10 pr-10 bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10 w-full"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                setShowNewPassword(
                                                                    !showNewPassword,
                                                                )
                                                            }
                                                            className="absolute right-2 top-1.5 h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                                        >
                                                            {showNewPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {/* Live strength meter */}
                                                    {newPasswordValue && (
                                                        <div className="pt-1.5 space-y-1">
                                                            <div className="flex gap-1">
                                                                {[
                                                                    0, 1, 2, 3,
                                                                ].map((i) => (
                                                                    <div
                                                                        key={i}
                                                                        className={cn(
                                                                            "h-1 flex-1 rounded-full transition-colors",
                                                                            i <
                                                                                passwordStrength.score
                                                                                ? passwordStrength.barClass
                                                                                : "bg-border",
                                                                        )}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {
                                                                    passwordStrength.label
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                    {passwordErrors.newPassword && (
                                                        <p className="text-xs text-destructive mt-1">
                                                            {
                                                                passwordErrors
                                                                    .newPassword
                                                                    .message as string
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor="confirmPassword"
                                                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                                    >
                                                        Confirm New Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="confirmPassword"
                                                            type={
                                                                showNewPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            placeholder="Confirm new password"
                                                            {...registerPassword(
                                                                "confirmPassword",
                                                                {
                                                                    required:
                                                                        "Please confirm new password",
                                                                },
                                                            )}
                                                            className="pl-10 bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10 w-full"
                                                        />
                                                    </div>
                                                    {passwordErrors.confirmPassword && (
                                                        <p className="text-xs text-destructive mt-1">
                                                            {
                                                                passwordErrors
                                                                    .confirmPassword
                                                                    .message as string
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="border-t border-border/80 p-6 flex justify-end gap-3 bg-accent/5 rounded-b-lg">
                                            <Button
                                                type="submit"
                                                disabled={passwordLoading}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-10 px-5 cursor-pointer shadow-md shadow-indigo-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                            >
                                                {passwordLoading ? (
                                                    <Loading
                                                        variant="mini"
                                                        text="Updating credentials..."
                                                    />
                                                ) : (
                                                    "Update Password"
                                                )}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "sessions" && (
                            <motion.div
                                key="sessions"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-border bg-card shadow-sm text-card-foreground">
                                    <CardHeader className="border-b border-border/60 pb-4">
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <Laptop className="h-4.5 w-4.5 text-indigo-500" />
                                            Device Sessions
                                        </CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            Up to 3 devices can stay signed in
                                            at once. Revoke any device you don't
                                            recognize.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {sessions.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <Laptop className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                                                <p className="text-sm text-muted-foreground">
                                                    No active sessions found.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {sessions.map((sess) => {
                                                    const isCurrent =
                                                        sess.sessionToken ===
                                                        session?.user
                                                            ?.sessionToken;
                                                    const isMobile =
                                                        sess.userAgent
                                                            ?.toLowerCase()
                                                            .includes(
                                                                "mobile",
                                                            ) ||
                                                        sess.userAgent
                                                            ?.toLowerCase()
                                                            .includes(
                                                                "android",
                                                            ) ||
                                                        sess.userAgent
                                                            ?.toLowerCase()
                                                            .includes("iphone");

                                                    return (
                                                        <div
                                                            key={sess._id}
                                                            className={cn(
                                                                "flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border transition-colors gap-4",
                                                                isCurrent
                                                                    ? "border-emerald-500/25 bg-emerald-500/5"
                                                                    : "border-border bg-accent/5 hover:bg-accent/10",
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <div
                                                                    className={cn(
                                                                        "p-2.5 rounded-lg shrink-0",
                                                                        isCurrent
                                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                                                                    )}
                                                                >
                                                                    {isMobile ? (
                                                                        <Smartphone className="h-5 w-5" />
                                                                    ) : (
                                                                        <Laptop className="h-5 w-5" />
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span
                                                                            className="text-sm font-bold text-foreground max-w-sm truncate"
                                                                            title={
                                                                                sess.userAgent
                                                                            }
                                                                        >
                                                                            {sess.userAgent ||
                                                                                "Unknown Device"}
                                                                        </span>
                                                                        {isCurrent && (
                                                                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0 font-bold shrink-0">
                                                                                This
                                                                                Device
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                                        <span className="flex items-center gap-1">
                                                                            <Globe className="h-3.5 w-3.5" />
                                                                            {sess.ipAddress ||
                                                                                "127.0.0.1"}
                                                                        </span>
                                                                        <span>
                                                                            •
                                                                        </span>
                                                                        <span
                                                                            title={new Date(
                                                                                sess.lastActive,
                                                                            ).toLocaleString()}
                                                                        >
                                                                            Active{" "}
                                                                            {formatRelativeTime(
                                                                                sess.lastActive,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {!isCurrent && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={
                                                                        deleteSessionMutation.isPending
                                                                    }
                                                                    onClick={() =>
                                                                        deleteSessionMutation.mutate(
                                                                            sess._id,
                                                                        )
                                                                    }
                                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 px-3 self-end sm:self-center gap-1.5 cursor-pointer border border-border/40 rounded-lg hover:border-destructive/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                    <span>
                                                                        Revoke
                                                                        Device
                                                                    </span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "statement" && (
                            <motion.div
                                key="statement"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-border bg-card shadow-sm text-card-foreground">
                                    <CardHeader className="border-b border-border/60 pb-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                                    <Wallet className="h-4.5 w-4.5 text-indigo-500" />
                                                    Salary & Balance Statement
                                                </CardTitle>
                                                <CardDescription className="text-muted-foreground mt-1">
                                                    Your payment history,
                                                    salary, and loan statements.
                                                </CardDescription>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                                    Current Balance
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-xl font-black tabular-nums",
                                                        balanceValue >= 0
                                                            ? "text-emerald-600"
                                                            : "text-rose-600",
                                                    )}
                                                >
                                                    ${balanceValue.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* Page totals strip */}
                                    {!!statementData?.transactions?.length && (
                                        <div className="flex items-center gap-6 px-6 py-3 border-b border-border/60 bg-muted/10 text-xs">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    ${pageIncome.toFixed(2)}
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
                                                <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                                    ${pageExpense.toFixed(2)}
                                                </span>
                                            </span>
                                        </div>
                                    )}

                                    <CardContent className="p-0">
                                        {isLoadingStatement ? (
                                            <div className="p-12 flex justify-center">
                                                <Loading
                                                    variant="spinner"
                                                    text="Loading statement..."
                                                />
                                            </div>
                                        ) : !statementData?.transactions ||
                                          statementData.transactions.length ===
                                              0 ? (
                                            <div className="p-12 text-center">
                                                <Wallet className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                                                <p className="text-sm text-muted-foreground">
                                                    No transactions found for
                                                    your account.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Desktop table */}
                                                <div className="hidden md:block overflow-x-auto">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                                            <tr>
                                                                <th className="px-6 py-4 font-semibold">
                                                                    Date
                                                                </th>
                                                                <th className="px-6 py-4 font-semibold">
                                                                    Description
                                                                </th>
                                                                <th className="px-6 py-4 font-semibold">
                                                                    Category
                                                                </th>
                                                                <th className="px-6 py-4 font-semibold text-right">
                                                                    Amount
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/50">
                                                            {statementData.transactions.map(
                                                                (t: any) => {
                                                                    const isIncome =
                                                                        t.type ===
                                                                            "income" ||
                                                                        t.type ===
                                                                            "+";
                                                                    return (
                                                                        <tr
                                                                            key={
                                                                                t._id
                                                                            }
                                                                            className="hover:bg-muted/20 transition-colors"
                                                                        >
                                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                    {new Date(
                                                                                        t.date,
                                                                                    ).toLocaleDateString(
                                                                                        undefined,
                                                                                        {
                                                                                            month: "short",
                                                                                            day: "numeric",
                                                                                            year: "numeric",
                                                                                        },
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <p className="font-medium text-foreground">
                                                                                    {
                                                                                        t.description
                                                                                    }
                                                                                </p>
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="capitalize text-xs font-medium bg-background"
                                                                                >
                                                                                    {t.category.replace(
                                                                                        "_",
                                                                                        " ",
                                                                                    )}
                                                                                </Badge>
                                                                            </td>
                                                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                                                <div
                                                                                    className={cn(
                                                                                        "inline-flex items-center gap-1 font-bold tabular-nums",
                                                                                        isIncome
                                                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                                                            : "text-rose-600 dark:text-rose-400",
                                                                                    )}
                                                                                >
                                                                                    {isIncome ? (
                                                                                        <ArrowDownRight className="h-4 w-4" />
                                                                                    ) : (
                                                                                        <ArrowUpRight className="h-4 w-4" />
                                                                                    )}

                                                                                    $
                                                                                    {Number(
                                                                                        t.amount,
                                                                                    ).toFixed(
                                                                                        2,
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                },
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Mobile card list */}
                                                <div className="md:hidden divide-y divide-border/50">
                                                    {statementData.transactions.map(
                                                        (t: any) => {
                                                            const isIncome =
                                                                t.type ===
                                                                    "income" ||
                                                                t.type === "+";
                                                            return (
                                                                <div
                                                                    key={t._id}
                                                                    className="p-4 space-y-2"
                                                                >
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <p className="font-medium text-foreground text-sm">
                                                                            {
                                                                                t.description
                                                                            }
                                                                        </p>
                                                                        <div
                                                                            className={cn(
                                                                                "inline-flex items-center gap-1 font-bold tabular-nums text-sm shrink-0",
                                                                                isIncome
                                                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                                                    : "text-rose-600 dark:text-rose-400",
                                                                            )}
                                                                        >
                                                                            {isIncome ? (
                                                                                <ArrowDownRight className="h-4 w-4" />
                                                                            ) : (
                                                                                <ArrowUpRight className="h-4 w-4" />
                                                                            )}
                                                                            $
                                                                            {Number(
                                                                                t.amount,
                                                                            ).toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                            <Calendar className="h-3.5 w-3.5" />
                                                                            {new Date(
                                                                                t.date,
                                                                            ).toLocaleDateString(
                                                                                undefined,
                                                                                {
                                                                                    month: "short",
                                                                                    day: "numeric",
                                                                                    year: "numeric",
                                                                                },
                                                                            )}
                                                                        </span>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="capitalize text-xs font-medium bg-background"
                                                                        >
                                                                            {t.category.replace(
                                                                                "_",
                                                                                " ",
                                                                            )}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                    {statementData?.totalPages > 1 && (
                                        <CardFooter className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">
                                                Showing page{" "}
                                                <span className="font-semibold text-foreground">
                                                    {statementData?.currentPage}
                                                </span>{" "}
                                                of{" "}
                                                <span className="font-semibold text-foreground">
                                                    {statementData?.totalPages}
                                                </span>
                                            </p>
                                            <div className="flex gap-1">
                                                {Array.from({
                                                    length: statementData?.totalPages,
                                                }).map((_, i) => (
                                                    <Button
                                                        key={i}
                                                        variant={
                                                            statementPage ===
                                                            i + 1
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 w-8 p-0 text-xs font-medium cursor-pointer",
                                                            statementPage ===
                                                                i + 1
                                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                                : "",
                                                        )}
                                                        onClick={() =>
                                                            setStatementPage(
                                                                i + 1,
                                                            )
                                                        }
                                                    >
                                                        {i + 1}
                                                    </Button>
                                                ))}
                                            </div>
                                        </CardFooter>
                                    )}
                                </Card>
                            </motion.div>
                        )}

                        {activeTab === "accounts" && (
                            <motion.div
                                key="accounts"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">
                                            Linked Accounts
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Manage your bank and mobile banking
                                            accounts.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            resetAccountForm();
                                            setAccountToEdit(null);
                                            setProviderSelection("");
                                            setIsAccountModalOpen(true);
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex gap-2 items-center"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Account
                                    </Button>
                                </div>
                                {!reduxUser.accounts ||
                                reduxUser.accounts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                            <Landmark className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">
                                                No accounts linked
                                            </h4>
                                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                                Add your bank or mobile banking
                                                accounts to easily receive
                                                payments and salaries.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                resetAccountForm();
                                                setAccountToEdit(null);
                                                setProviderSelection("");
                                                setIsAccountModalOpen(true);
                                            }}
                                            variant="outline"
                                            className="mt-2"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add First Account
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile View (Cards) */}
                                        <div className="grid grid-cols-1 gap-4 md:hidden">
                                            {reduxUser.accounts.map(
                                                (acc: any) => (
                                                    <Card
                                                        key={acc._id}
                                                        className="relative overflow-hidden group border border-border shadow-sm hover:shadow-md transition-all"
                                                    >
                                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-70" />
                                                        <CardHeader className="p-4 pb-2">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                                        {acc.type ===
                                                                        "bank" ? (
                                                                            <Landmark className="h-5 w-5" />
                                                                        ) : (
                                                                            <Smartphone className="h-5 w-5" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <CardTitle className="text-base font-bold">
                                                                            {
                                                                                acc.providerName
                                                                            }
                                                                        </CardTitle>
                                                                        <CardDescription className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                                                                            {acc.type ===
                                                                            "bank"
                                                                                ? "Bank Account"
                                                                                : "Mobile Banking"}
                                                                        </CardDescription>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-4 pt-2 space-y-2 text-sm">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs text-muted-foreground font-medium">
                                                                    Account Name
                                                                </span>
                                                                <span className="font-semibold text-foreground">
                                                                    {
                                                                        acc.accountName
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs text-muted-foreground font-medium">
                                                                    Account
                                                                    Number
                                                                </span>
                                                                <span className="font-mono bg-muted/50 px-2 py-1 rounded text-foreground w-fit">
                                                                    {
                                                                        acc.accountNumber
                                                                    }
                                                                </span>
                                                            </div>
                                                            {acc.type ===
                                                                "bank" &&
                                                                acc.routingNumber && (
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-xs text-muted-foreground font-medium">
                                                                            Routing
                                                                            Number
                                                                        </span>
                                                                        <span className="font-mono text-foreground">
                                                                            {
                                                                                acc.routingNumber
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            {acc.type ===
                                                                "bank" &&
                                                                acc.branch && (
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-xs text-muted-foreground font-medium">
                                                                            Branch
                                                                        </span>
                                                                        <span className="text-foreground">
                                                                            {
                                                                                acc.branch
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                        </CardContent>
                                                        <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 backdrop-blur-md rounded-md shadow-sm border border-border/50 overflow-hidden">
                                                            <button
                                                                onClick={() => {
                                                                    setAccountToEdit(
                                                                        acc,
                                                                    );
                                                                    Object.keys(
                                                                        acc,
                                                                    ).forEach(
                                                                        (k) =>
                                                                            setAccountValue(
                                                                                k as any,
                                                                                acc[
                                                                                    k
                                                                                ],
                                                                            ),
                                                                    );

                                                                    const isKnownBank =
                                                                        acc.type ===
                                                                            "bank" &&
                                                                        BANGLADESH_BANKS.includes(
                                                                            acc.providerName,
                                                                        );
                                                                    const isKnownMobile =
                                                                        acc.type ===
                                                                            "mobile_banking" &&
                                                                        MOBILE_BANKING_PROVIDERS.includes(
                                                                            acc.providerName,
                                                                        );

                                                                    if (
                                                                        isKnownBank ||
                                                                        isKnownMobile
                                                                    ) {
                                                                        setProviderSelection(
                                                                            acc.providerName,
                                                                        );
                                                                    } else {
                                                                        setProviderSelection(
                                                                            "Other",
                                                                        );
                                                                    }

                                                                    setIsAccountModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="p-2 hover:bg-muted text-foreground transition-colors"
                                                                title="Edit"
                                                            >
                                                                <CreditCard className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setAccountToDelete(
                                                                        acc._id,
                                                                    );
                                                                    setIsDeleteModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="p-2 hover:bg-rose-500 hover:text-white text-rose-500 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </Card>
                                                ),
                                            )}
                                        </div>

                                        {/* Desktop View (Table) */}
                                        <div className="hidden md:block border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                                                    <tr>
                                                        <th className="px-4 py-3 border-b border-border">
                                                            Provider
                                                        </th>
                                                        <th className="px-4 py-3 border-b border-border">
                                                            Account Name
                                                        </th>
                                                        <th className="px-4 py-3 border-b border-border">
                                                            Account No.
                                                        </th>
                                                        <th className="px-4 py-3 border-b border-border">
                                                            Branch/Routing
                                                        </th>
                                                        <th className="px-4 py-3 border-b border-border text-right">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {reduxUser.accounts.map(
                                                        (acc: any) => (
                                                            <tr
                                                                key={`table-${acc._id}`}
                                                                className="hover:bg-muted/30 transition-colors"
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md text-indigo-600 dark:text-indigo-400">
                                                                            {acc.type ===
                                                                            "bank" ? (
                                                                                <Landmark className="h-4 w-4" />
                                                                            ) : (
                                                                                <Smartphone className="h-4 w-4" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-foreground">
                                                                                {
                                                                                    acc.providerName
                                                                                }
                                                                            </p>
                                                                            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                                                                                {acc.type ===
                                                                                "bank"
                                                                                    ? "Bank"
                                                                                    : "Mobile"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-foreground">
                                                                    {
                                                                        acc.accountName
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="font-mono bg-muted/50 px-2 py-1 rounded text-foreground">
                                                                        {
                                                                            acc.accountNumber
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                                                    {acc.type ===
                                                                    "bank" ? (
                                                                        <div className="flex flex-col gap-0.5">
                                                                            {acc.branch ? (
                                                                                <span>
                                                                                    <span className="font-medium">
                                                                                        Br:
                                                                                    </span>{" "}
                                                                                    {
                                                                                        acc.branch
                                                                                    }
                                                                                </span>
                                                                            ) : (
                                                                                <span>
                                                                                    -
                                                                                </span>
                                                                            )}
                                                                            {acc.routingNumber && (
                                                                                <span>
                                                                                    <span className="font-medium">
                                                                                        Rt:
                                                                                    </span>{" "}
                                                                                    <span className="font-mono">
                                                                                        {
                                                                                            acc.routingNumber
                                                                                        }
                                                                                    </span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted-foreground/50">
                                                                            -
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setAccountToEdit(
                                                                                    acc,
                                                                                );
                                                                                Object.keys(
                                                                                    acc,
                                                                                ).forEach(
                                                                                    (
                                                                                        k,
                                                                                    ) =>
                                                                                        setAccountValue(
                                                                                            k as any,
                                                                                            acc[
                                                                                                k
                                                                                            ],
                                                                                        ),
                                                                                );

                                                                                const isKnownBank =
                                                                                    acc.type ===
                                                                                        "bank" &&
                                                                                    BANGLADESH_BANKS.includes(
                                                                                        acc.providerName,
                                                                                    );
                                                                                const isKnownMobile =
                                                                                    acc.type ===
                                                                                        "mobile_banking" &&
                                                                                    MOBILE_BANKING_PROVIDERS.includes(
                                                                                        acc.providerName,
                                                                                    );

                                                                                if (
                                                                                    isKnownBank ||
                                                                                    isKnownMobile
                                                                                ) {
                                                                                    setProviderSelection(
                                                                                        acc.providerName,
                                                                                    );
                                                                                } else {
                                                                                    setProviderSelection(
                                                                                        "Other",
                                                                                    );
                                                                                }

                                                                                setIsAccountModalOpen(
                                                                                    true,
                                                                                );
                                                                            }}
                                                                            className="p-1.5 hover:bg-muted rounded text-foreground transition-colors cursor-pointer"
                                                                            title="Edit"
                                                                        >
                                                                            <CreditCard className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setAccountToDelete(
                                                                                    acc._id,
                                                                                );
                                                                                setIsDeleteModalOpen(
                                                                                    true,
                                                                                );
                                                                            }}
                                                                            className="p-1.5 hover:bg-rose-500/10 rounded hover:text-rose-600 text-rose-500 transition-colors cursor-pointer"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Account Modal */}
            <AnimatePresence>
                {isAccountModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAccountModalOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg border border-border bg-card shadow-2xl rounded-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <h3 className="text-xl font-bold">
                                    {accountToEdit
                                        ? "Edit Account"
                                        : "Add New Account"}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsAccountModalOpen(false)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="p-6">
                                <form
                                    onSubmit={handleAccountSubmit((data) =>
                                        saveAccountMutation.mutate(data),
                                    )}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label>Account Type</Label>
                                        <Controller
                                            name="type"
                                            control={accountControl}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(
                                                        val: any,
                                                    ) => {
                                                        field.onChange(val);
                                                        setProviderSelection(
                                                            "",
                                                        );
                                                        setAccountValue(
                                                            "providerName",
                                                            "",
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background border-input text-foreground focus-visible:ring-indigo-500 h-10!">
                                                        <SelectValue placeholder="Select Account Type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[110]">
                                                        <SelectItem
                                                            value="bank"
                                                            className={`h-10!`}
                                                        >
                                                            Bank Account
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="mobile_banking"
                                                            className={`h-10!`}
                                                        >
                                                            Mobile Banking (e.g.
                                                            bKash, CashApp)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>
                                            {accountType === "bank"
                                                ? "Select Bank"
                                                : "Select Provider"}
                                        </Label>
                                        <input
                                            type="hidden"
                                            {...registerAccount("providerName")}
                                        />
                                        <Select
                                            value={
                                                providerSelection || undefined
                                            }
                                            onValueChange={(val) => {
                                                setProviderSelection(val);
                                                if (val !== "Other") {
                                                    setAccountValue(
                                                        "providerName",
                                                        val,
                                                    );
                                                } else {
                                                    setAccountValue(
                                                        "providerName",
                                                        "",
                                                    );
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-background border-input text-foreground focus-visible:ring-indigo-500 h-10!">
                                                <SelectValue placeholder="-- Select --" />
                                            </SelectTrigger>
                                            <SelectContent className="z-[110]">
                                                {accountType === "bank"
                                                    ? BANGLADESH_BANKS.map(
                                                          (b) => (
                                                              <SelectItem
                                                                  key={b}
                                                                  value={b}
                                                                  className={`h-10!`}
                                                              >
                                                                  {b}
                                                              </SelectItem>
                                                          ),
                                                      )
                                                    : MOBILE_BANKING_PROVIDERS.map(
                                                          (p) => (
                                                              <SelectItem
                                                                  key={p}
                                                                  value={p}
                                                                  className={`h-10!`}
                                                              >
                                                                  {p}
                                                              </SelectItem>
                                                          ),
                                                      )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {providerSelection === "Other" && (
                                        <div className="space-y-2">
                                            <Label>
                                                {accountType === "bank"
                                                    ? "Bank Name (Other)"
                                                    : "Provider Name (Other)"}
                                            </Label>
                                            <Input
                                                {...registerAccount(
                                                    "providerName",
                                                )}
                                                placeholder={
                                                    accountType === "bank"
                                                        ? "e.g. Foreign Bank"
                                                        : "e.g. Other Provider"
                                                }
                                            />
                                            {accountErrors.providerName && (
                                                <p className="text-xs text-rose-500">
                                                    {accountErrors.providerName.message?.toString()}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Account Name</Label>
                                        <Input
                                            {...registerAccount("accountName")}
                                            placeholder="Name on the account"
                                        />
                                        {accountErrors.accountName && (
                                            <p className="text-xs text-rose-500">
                                                {accountErrors.accountName.message?.toString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <Input
                                            {...registerAccount(
                                                "accountNumber",
                                            )}
                                            placeholder="Account or Mobile number"
                                        />
                                        {accountErrors.accountNumber && (
                                            <p className="text-xs text-rose-500">
                                                {accountErrors.accountNumber.message?.toString()}
                                            </p>
                                        )}
                                    </div>

                                    {accountType === "bank" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>
                                                    Routing Number (Optional)
                                                </Label>
                                                <Input
                                                    {...registerAccount(
                                                        "routingNumber",
                                                    )}
                                                    placeholder="Routing Number"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Branch (Optional)</Label>
                                                <Input
                                                    {...registerAccount(
                                                        "branch",
                                                    )}
                                                    placeholder="Branch Name or Code"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="pt-4 flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                                setIsAccountModalOpen(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                saveAccountMutation.isPending
                                            }
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {saveAccountMutation.isPending
                                                ? "Saving..."
                                                : "Save Account"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-sm border border-border bg-card shadow-2xl rounded-2xl overflow-hidden p-6 text-center"
                        >
                            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                                <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                                Remove Account
                            </h3>
                            <p className="text-muted-foreground text-sm mb-6">
                                Are you sure you want to remove this account?
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-center gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setAccountToDelete(null);
                                    }}
                                    className="flex-1 cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (accountToDelete) {
                                            deleteAccountMutation.mutate(
                                                accountToDelete,
                                            );
                                            setIsDeleteModalOpen(false);
                                            setAccountToDelete(null);
                                        }
                                    }}
                                    disabled={deleteAccountMutation.isPending}
                                    className="flex-1 cursor-pointer"
                                >
                                    {deleteAccountMutation.isPending
                                        ? "Removing..."
                                        : "Remove"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
