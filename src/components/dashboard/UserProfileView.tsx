"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    User as UserIcon,
    Mail,
    Shield,
    Activity,
    Upload,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    Phone,
    Laptop,
    Globe,
    Trash2,
    KeyRound,
    ShieldAlert,
    Smartphone,
    ChevronRight,
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

export default function UserProfileView() {
    const { data: session, update: updateSession } = useSession();
    const [activeTab, setActiveTab] = useState<
        "profile" | "security" | "sessions"
    >("profile");
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form for Profile Details (Name, Mobile Number, Avatar)
    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        setValue: setProfileValue,
        watch: watchProfile,
        control: profileControl,
        formState: { errors: profileErrors },
    } = useForm<ProfileInput>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: session?.user?.name || "",
            avatarUrl: session?.user?.avatarUrl || "",
            mobileNumber: session?.user?.mobileNumber || "",
        },
    });

    // Dedicated Form for Password Change
    const [passwordLoading, setPasswordLoading] = useState(false);
    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPasswordForm,
        formState: { errors: passwordErrors },
    } = useForm({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
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
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64 }),
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(errData.error || "Failed to upload image");
                }

                const uploadData = await uploadRes.json();
                setProfileValue("avatarUrl", uploadData.url, {
                    shouldValidate: true,
                });
                setPreviewUrl(null);
                toast.success("Avatar uploaded successfully!");
            } catch (err: any) {
                setPreviewUrl(null);
                toast.error(err.message || "Image upload failed.");
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

            await updateSession({
                name: updatedData.user.name,
                avatarUrl: updatedData.user.avatarUrl,
                mobileNumber: updatedData.user.mobileNumber,
            });

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

    const nameValue = watchProfile("name") || session?.user?.name || "";
    const currentAvatar =
        previewUrl || avatarUrlValue || session?.user?.avatarUrl || "";

    const tabs = [
        { id: "profile", name: "Profile Details", icon: UserIcon },
        { id: "security", name: "Security Settings", icon: KeyRound },
        { id: "sessions", name: "Active Sessions", icon: Laptop },
    ] as const;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto space-y-8"
        >
            {/* Premium Profile Banner Card */}
            <div className="relative rounded-2xl border border-border bg-card shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
                {/* Banner Graphics */}
                <div className="relative h-36 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/20 via-transparent to-transparent" />
                    <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                    {/* Ambient Glow Orbs */}
                    <div className="absolute top-2 right-12 w-28 h-28 rounded-full bg-indigo-300/30 blur-2xl animate-pulse" />
                    <div className="absolute bottom-2 left-24 w-24 h-24 rounded-full bg-purple-400/30 blur-2xl animate-pulse" />
                </div>

                {/* Profile Card Body */}
                <div className="px-6 pb-6 pt-0 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-14 relative z-10 text-center md:text-left">
                        {/* Avatar Selector Wrapper */}
                        <div
                            className="relative group cursor-pointer"
                            onClick={handleAvatarClick}
                            title="Click to upload avatar"
                        >
                            <Avatar className="h-28 w-28 border-4 border-card ring-2 ring-indigo-500/20 shadow-xl transition-all duration-300 group-hover:scale-95">
                                <AvatarImage
                                    src={currentAvatar}
                                    alt={nameValue}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-3xl font-extrabold text-white">
                                    {nameValue.substring(0, 2).toUpperCase() ||
                                        "OP"}
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

                        <div className="space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                                    {nameValue}
                                </h2>
                                <div className="flex gap-1.5 justify-center md:justify-start">
                                    <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 font-bold text-xs capitalize">
                                        {session?.user?.role || "Member"}
                                    </Badge>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 px-2.5 py-0.5 font-bold text-xs flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3 shrink-0" />
                                        {session?.user?.status || "Active"}
                                    </Badge>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
                                <Mail className="h-4 w-4 text-muted-foreground/80" />
                                {session?.user?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Segmented Sliding Tabs Switcher */}
                <div className="border-t border-border/80 px-6 py-3 bg-accent/5 flex overflow-x-auto gap-1">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors duration-200 cursor-pointer shrink-0 ${
                                    isActive
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeProfileTab"
                                        className="absolute inset-0 border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-lg -z-10"
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 30,
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Panels Contents with AnimatePresence */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    {activeTab === "profile" && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
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
                                        mobile number configuration.
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
                                                    {...registerProfile("name")}
                                                    className="bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10 w-full"
                                                />
                                                {profileErrors.name && (
                                                    <p className="text-xs text-destructive mt-1">
                                                        {
                                                            profileErrors.name
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
                                                            value={field.value}
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
                                                        session?.user?.email ||
                                                        ""
                                                    }
                                                    disabled
                                                    className="pl-10 bg-accent/40 border-border text-muted-foreground cursor-not-allowed h-10 w-full"
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground italic mt-1">
                                                Email addresses are unique and
                                                locked to this account.
                                            </p>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="border-t border-border/80 p-6 flex justify-end gap-3 bg-accent/5 rounded-b-lg">
                                        <Button
                                            type="submit"
                                            disabled={isSaving || isUploading}
                                            className="bg-indigo-600 text-white font-medium h-10 px-5 cursor-pointer shadow-md shadow-indigo-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            {isSaving ? (
                                                <Loading variant="mini" text="Saving changes..." />
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
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-border bg-card shadow-sm text-card-foreground">
                                <CardHeader className="border-b border-border/60 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Lock className="h-4.5 w-4.5 text-indigo-500" />
                                        Security Settings
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Voluntarily update your account
                                        credentials. Must provide your current
                                        password for security verification.
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
                                                    Your new password must be at
                                                    least 8 characters long and
                                                    contain a mix of uppercase
                                                    letters, numbers, and
                                                    symbols. Avoid reusing
                                                    previous passwords.
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
                                            className="bg-indigo-600 text-white font-medium h-10 px-5 cursor-pointer shadow-md shadow-indigo-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            {passwordLoading ? (
                                                <Loading variant="mini" text="Updating credentials..." />
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
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-border bg-card shadow-sm text-card-foreground">
                                <CardHeader className="border-b border-border/60 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Laptop className="h-4.5 w-4.5 text-indigo-500" />
                                        Device Sessions
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Track all current authorized login
                                        sessions. Max 3 concurrent devices
                                        allowed. Revoke other devices instantly
                                        if needed.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {sessions.map((sess) => {
                                            const isCurrent =
                                                sess.sessionToken ===
                                                session?.user?.sessionToken;
                                            const isMobile =
                                                sess.userAgent
                                                    ?.toLowerCase()
                                                    .includes("mobile") ||
                                                sess.userAgent
                                                    ?.toLowerCase()
                                                    .includes("android") ||
                                                sess.userAgent
                                                    ?.toLowerCase()
                                                    .includes("iphone");

                                            return (
                                                <div
                                                    key={sess._id}
                                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-border bg-accent/5 hover:bg-accent/10 transition-colors gap-4"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
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
                                                                        Current
                                                                        Session
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Globe className="h-3.5 w-3.5" />
                                                                    {sess.ipAddress ||
                                                                        "127.0.0.1"}
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    Last Active:{" "}
                                                                    {new Date(
                                                                        sess.lastActive,
                                                                    ).toLocaleString()}
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
                                                                Revoke Device
                                                            </span>
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
