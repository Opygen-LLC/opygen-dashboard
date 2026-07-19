"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Users,
    UserPlus,
    Trash2,
    Mail,
    User as UserIcon,
    Lock,
    Shield,
    Eye,
    EyeOff,
    Sparkles,
    AlertTriangle,
    Activity,
    Phone,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, Controller } from "react-hook-form";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { addUserSchema, AddUserInput } from "@/lib/validations";
import { UserRole, UserStatus } from "@/types";
import AdminDashboardView from "@/components/dashboard/AdminDashboardView";

export default function UsersManagementPage() {
    const queryClient = useQueryClient();
    const { data: currentSession } = useSession();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [deleteUserTarget, setDeleteUserTarget] = useState<any | null>(null);
    const [viewUserTarget, setViewUserTarget] = useState<any | null>(null);

    // Form setup for creating user
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        reset,
        formState: { errors },
    } = useForm<AddUserInput>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            name: "",
            email: "",
            role: UserRole.MEMBER,
            password: "",
            mobileNumber: "",
            status: UserStatus.PENDING,
        },
    });

    const selectedRole = watch("role");

    const { data: users = [], isLoading } = useQuery<any[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: AddUserInput) => {
            const res = await fetch("/api/users/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create user");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsCreateOpen(false);
            reset();
            toast.success("Co-founder created successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create user");
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({
            id,
            role,
            status,
        }: {
            id: string;
            role?: string;
            status?: string;
        }) => {
            const res = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, status }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error || "Failed to update user details",
                );
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update user");
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/users/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to delete user");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setDeleteUserTarget(null);
            toast.success("User deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete user");
        },
    });

    const generateSecurePassword = () => {
        const chars =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let pass = "";
        pass += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
        pass += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
        pass += "0123456789"[Math.floor(Math.random() * 10)];
        pass += "!@#$%^&*()"[Math.floor(Math.random() * 10)];
        for (let i = 4; i < 12; i++) {
            pass += chars[Math.floor(Math.random() * chars.length)];
        }
        setValue(
            "password",
            pass
                .split("")
                .sort(() => 0.5 - Math.random())
                .join(""),
            { shouldValidate: true },
        );
        toast.success("Secure password generated!");
    };

    const handleRoleToggle = (userId: string, currentRole: string) => {
        if (currentSession?.user?.id === userId) {
            toast.error(
                "You cannot demote or update your own administrator role.",
            );
            return;
        }
        const newRole =
            currentRole === UserRole.ADMIN ? UserRole.MEMBER : UserRole.ADMIN;
        updateUserMutation.mutate({ id: userId, role: newRole });
    };

    const handleStatusToggle = (userId: string, currentStatus: string) => {
        if (currentSession?.user?.id === userId) {
            toast.error(
                "You cannot demote or block your own administrator account.",
            );
            return;
        }
        const newStatus =
            currentStatus === UserStatus.BLOCKED
                ? UserStatus.ACTIVE
                : UserStatus.BLOCKED;
        updateUserMutation.mutate({ id: userId, status: newStatus });
    };

    const handleDeleteConfirm = () => {
        if (!deleteUserTarget) return;
        deleteUserMutation.mutate(deleteUserTarget._id);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent flex items-center gap-2">
                        <Users className="h-7 w-7 text-indigo-505 shrink-0" />
                        Users
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Showcase users, view detailed profiles, toggle roles, or
                        delete inactive profiles.
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 h-10 gap-1.5 cursor-pointer"
                >
                    <UserPlus className="h-4.5 w-4.5" />
                    <span>Add User</span>
                </Button>
            </div>

            {/* Users List Table */}
            <Card className="border-border bg-card shadow-sm text-card-foreground">
                <CardHeader className="border-b border-border/60 pb-4">
                    <CardTitle className="text-base font-bold">
                        Registered Members
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground italic">
                            No registered user profiles found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-accent/30 border-b border-border">
                                    <TableRow className="hover:bg-transparent border-b border-border">
                                        <TableHead className="text-muted-foreground font-bold">
                                            Users
                                        </TableHead>
                                        <TableHead className="text-muted-foreground font-bold">
                                            Email
                                        </TableHead>
                                        <TableHead className="text-muted-foreground font-bold w-40">
                                            Role
                                        </TableHead>
                                        <TableHead className="text-muted-foreground font-bold w-40">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-muted-foreground font-bold w-32 text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => {
                                        const isSelf =
                                            currentSession?.user?.id ===
                                            user._id;

                                        return (
                                            <TableRow
                                                key={user._id}
                                                className="border-b border-border/60 hover:bg-accent/15 transition-colors"
                                            >
                                                <TableCell className="font-bold flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-border">
                                                        <AvatarImage
                                                            src={user.avatarUrl}
                                                        />
                                                        <AvatarFallback className="bg-accent text-xs font-bold text-muted-foreground">
                                                            {user.name
                                                                .substring(0, 2)
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <span className="text-foreground">
                                                            {user.name}
                                                        </span>
                                                        {isSelf && (
                                                            <Badge className="ml-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[9px] px-1 py-0">
                                                                You
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm font-medium">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={user.role}
                                                        onValueChange={() =>
                                                            handleRoleToggle(
                                                                user._id,
                                                                user.role,
                                                            )
                                                        }
                                                        disabled={
                                                            isSelf ||
                                                            updateUserMutation.isPending
                                                        }
                                                    >
                                                        <SelectTrigger className="bg-background border-border text-foreground h-10 w-32 cursor-pointer">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border-border text-foreground">
                                                            <SelectItem
                                                                value={
                                                                    UserRole.MEMBER
                                                                }
                                                            >
                                                                Member
                                                            </SelectItem>
                                                            <SelectItem
                                                                value={
                                                                    UserRole.ADMIN
                                                                }
                                                            >
                                                                Admin
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={
                                                            user.status ||
                                                            UserStatus.ACTIVE
                                                        }
                                                        onValueChange={() =>
                                                            handleStatusToggle(
                                                                user._id,
                                                                user.status ||
                                                                    UserStatus.ACTIVE,
                                                            )
                                                        }
                                                        disabled={
                                                            isSelf ||
                                                            updateUserMutation.isPending
                                                        }
                                                    >
                                                        <SelectTrigger className="bg-background border-border text-foreground h-10 w-32 cursor-pointer">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border-border text-foreground">
                                                            <SelectItem
                                                                value={
                                                                    UserStatus.ACTIVE
                                                                }
                                                            >
                                                                Active
                                                            </SelectItem>
                                                            <SelectItem
                                                                value={
                                                                    UserStatus.BLOCKED
                                                                }
                                                            >
                                                                Blocked
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setViewUserTarget(
                                                                user,
                                                            )
                                                        }
                                                        className="h-10 w-10 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-md cursor-pointer hover:scale-[1.05] active:scale-[0.95] transition-all"
                                                        title="View detailed information"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={
                                                            isSelf ||
                                                            deleteUserMutation.isPending
                                                        }
                                                        onClick={() =>
                                                            setDeleteUserTarget(
                                                                user,
                                                            )
                                                        }
                                                        className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer hover:scale-[1.05] active:scale-[0.95] transition-all"
                                                        title={
                                                            isSelf
                                                                ? "Cannot delete yourself"
                                                                : "Delete user"
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* User Creation Dialog Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-card border-border text-foreground max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-indigo-505" />
                            Add User
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Create a new user credentials. A force password
                            change flag will be set.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit((data) =>
                            createUserMutation.mutate(data),
                        )}
                        className="space-y-4 pt-2"
                    >
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    placeholder="e.g. Alice Smith"
                                    {...register("name")}
                                    className="pl-10 bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10"
                                />
                            </div>
                            {errors.name && (
                                <p className="text-xs text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@opygen.com"
                                    {...register("email")}
                                    className="pl-10 bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="mobileNumber">
                                Mobile Number{" "}
                                <span className="text-xs text-muted-foreground font-normal">
                                    (Optional)
                                </span>
                            </Label>
                            <Controller
                                name="mobileNumber"
                                control={control}
                                render={({ field }) => (
                                    <PhoneInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        id="mobileNumber"
                                    />
                                )}
                            />
                            {errors.mobileNumber && (
                                <p className="text-xs text-destructive">
                                    {errors.mobileNumber.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-row gap-4 w-full justify-between">
                            <div className="space-y-1.5 w-[48%]">
                                <Label htmlFor="role">Account Role</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                    <Select
                                        value={selectedRole}
                                        onValueChange={(value) =>
                                            setValue(
                                                "role",
                                                value as UserRole,
                                                {
                                                    shouldValidate: true,
                                                },
                                            )
                                        }
                                    >
                                        <SelectTrigger className="pl-10 bg-background border-border text-foreground h-10 cursor-pointer">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground">
                                            <SelectItem value={UserRole.ADMIN}>
                                                Admin
                                            </SelectItem>
                                            <SelectItem value={UserRole.MEMBER}>
                                                Member
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {errors.role && (
                                    <p className="text-xs text-destructive">
                                        {errors.role.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5 w-[48%]">
                                <Label htmlFor="status">User Status</Label>
                                <div className="relative">
                                    <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                    <Select value={UserStatus.PENDING} disabled>
                                        <SelectTrigger className="pl-10 bg-background/50 border-border text-foreground/75 h-10 cursor-not-allowed opacity-80">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span>Pending</span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground">
                                            <SelectItem
                                                value={UserStatus.ACTIVE}
                                            >
                                                Active
                                            </SelectItem>
                                            <SelectItem
                                                value={UserStatus.BLOCKED}
                                            >
                                                Blocked
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">
                                    Temporary Password
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={generateSecurePassword}
                                    className="h-7 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-1 px-2 cursor-pointer"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    Generate
                                </Button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    {...register("password")}
                                    className="pl-10 pr-12 bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
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
                            {errors.password && (
                                <p className="text-xs text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                className="border-border text-muted-foreground hover:bg-accent h-10 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createUserMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 cursor-pointer"
                            >
                                {createUserMutation.isPending ? (
                                    <Loading variant="mini" text="Saving..." />
                                ) : (
                                    "Create User"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View User Information Modal */}
            <Dialog
                open={!!viewUserTarget}
                onOpenChange={(open) => !open && setViewUserTarget(null)}
            >
                <DialogContent className="bg-card border-border text-foreground max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-indigo-500" />
                            User Profile Details
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Detailed account details for this co-founder
                            profile.
                        </DialogDescription>
                    </DialogHeader>

                    {viewUserTarget && (
                        <div className="space-y-4 pt-4 border-t border-border/60">
                            <div className="flex flex-col items-center text-center pb-4">
                                <Avatar className="h-20 w-20 border-2 border-indigo-500/20 ring-4 ring-indigo-500/10">
                                    <AvatarImage
                                        src={viewUserTarget.avatarUrl}
                                        alt={viewUserTarget.name}
                                    />
                                    <AvatarFallback className="bg-accent text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {viewUserTarget.name
                                            .substring(0, 2)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="text-lg font-bold text-foreground mt-3">
                                    {viewUserTarget.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {viewUserTarget.email}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                    <span className="text-muted-foreground font-semibold">
                                        Account Status
                                    </span>
                                    <Badge
                                        className={`capitalize font-bold border ${
                                            viewUserTarget.status === "blocked"
                                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        }`}
                                    >
                                        {viewUserTarget.status || "Active"}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                    <span className="text-muted-foreground font-semibold">
                                        Account Role
                                    </span>
                                    <Badge className="capitalize bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                                        {viewUserTarget.role || "Member"}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                    <span className="text-muted-foreground font-semibold">
                                        Mobile Number
                                    </span>
                                    <span className="text-foreground font-medium">
                                        {viewUserTarget.mobileNumber || (
                                            <span className="text-muted-foreground italic text-xs">
                                                Not specified
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm pb-1">
                                    <span className="text-muted-foreground font-semibold">
                                        Created At
                                    </span>
                                    <span className="text-foreground font-medium text-xs">
                                        {viewUserTarget.createdAt
                                            ? new Date(
                                                  viewUserTarget.createdAt,
                                              ).toLocaleString()
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border mt-6">
                                <Button
                                    onClick={() => setViewUserTarget(null)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 cursor-pointer w-full"
                                >
                                    Close Details
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete User Confirmation Modal */}
            <AnimatePresence>
                {deleteUserTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteUserTarget(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xs"
                        />
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 220,
                            }}
                            className="relative z-10 w-full max-w-sm border border-border bg-card p-6 shadow-xl rounded-xl text-card-foreground"
                        >
                            <div className="flex items-center gap-2 text-destructive mb-3">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <h3 className="text-lg font-bold">
                                    Delete Account
                                </h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Are you sure you want to permanently delete the
                                profile for{" "}
                                <strong className="text-foreground">
                                    {deleteUserTarget.name}
                                </strong>
                                ? All their assigned projects will lose this
                                reference.
                            </p>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => setDeleteUserTarget(null)}
                                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground h-10 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteUserMutation.isPending}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium shadow-md shadow-destructive/10 h-10 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                                >
                                    {deleteUserMutation.isPending ? (
                                        <Loading variant="mini" />
                                    ) : (
                                        "Delete User"
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
