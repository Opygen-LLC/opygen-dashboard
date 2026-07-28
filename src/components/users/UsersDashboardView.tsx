"use client";

import React, { useState, useEffect } from "react";
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
    Briefcase,
    Edit,
    Search,
    Filter,
    RotateCcw,
    X,
    Building2,
    CreditCard,
    Calendar,
    BadgeCheck,
    Globe,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loading } from "@/components/ui/Loading";
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

export default function UsersManagementPage() {
    const queryClient = useQueryClient();
    const { data: currentSession } = useSession();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [deleteUserTarget, setDeleteUserTarget] = useState<any | null>(null);
    const [viewUserTarget, setViewUserTarget] = useState<any | null>(null);
    const [editUserTarget, setEditUserTarget] = useState<any | null>(null);
    const [editTitleValue, setEditTitleValue] = useState("");

    // Search and Filter states
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [titleFilter, setTitleFilter] = useState("all");

    useEffect(() => {
        if (editUserTarget) {
            setEditTitleValue(editUserTarget.title || "");
        }
    }, [editUserTarget]);

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
            title: "",
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

    const availableTitles = React.useMemo(() => {
        const set = new Set<string>();
        users.forEach((u: any) => {
            if (u.title && u.title.trim()) {
                set.add(u.title.trim());
            }
        });
        return Array.from(set).sort();
    }, [users]);

    const filteredUsers = React.useMemo(() => {
        return users.filter((u: any) => {
            const matchesSearch =
                !searchQuery.trim() ||
                u.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase().trim());

            const matchesRole =
                roleFilter === "all" ||
                u.role?.toLowerCase() === roleFilter.toLowerCase();

            const matchesStatus =
                statusFilter === "all" ||
                u.status?.toLowerCase() === statusFilter.toLowerCase();

            const matchesTitle =
                titleFilter === "all" || u.title === titleFilter;

            return matchesSearch && matchesRole && matchesStatus && matchesTitle;
        });
    }, [users, searchQuery, roleFilter, statusFilter, titleFilter]);

    const isFilterActive =
        searchInput.trim() !== "" ||
        searchQuery.trim() !== "" ||
        roleFilter !== "all" ||
        statusFilter !== "all" ||
        titleFilter !== "all";

    const resetFilters = () => {
        setSearchInput("");
        setSearchQuery("");
        setRoleFilter("all");
        setStatusFilter("all");
        setTitleFilter("all");
    };

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
            title,
        }: {
            id: string;
            role?: string;
            status?: string;
            title?: string;
        }) => {
            const res = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, status, title }),
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
                    <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent flex items-center gap-2">
                        {/* <Users className="h-7 w-7 text-indigo-505 shrink-0" /> */}
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
                <CardHeader className="border-b border-border/60 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-bold">
                            Registered Members ({filteredUsers.length})
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Manage team members, roles, statuses, and profiles.
                        </CardDescription>
                    </div>
                </CardHeader>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-accent/20 border-b border-border/60">
                    {/* Search Input Form (Matching Accounts / Quotes / Clients pattern) */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setSearchQuery(searchInput);
                        }}
                        className="relative flex-1 min-w-60 flex items-center"
                    >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by user name or email... (Press Enter)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    setSearchQuery(searchInput);
                                }
                            }}
                            className="pl-9 pr-20 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 text-foreground h-10 transition-all w-full text-xs"
                        />
                        <button
                            type="submit"
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Search"
                        >
                            Search
                        </button>
                    </form>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Role Filter */}
                        <Select value={roleFilter} onValueChange={(val: any) => setRoleFilter(val as string)}>
                            <SelectTrigger className="bg-background border-border text-xs h-10! w-31.25">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-xs">
                                <SelectItem value="all" className={`h-10!`}>All Roles</SelectItem>
                                <SelectItem value="admin" className={`h-10!`}>Admin</SelectItem>
                                <SelectItem value="member" className={`h-10!`}>Member</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val as string)}>
                            <SelectTrigger className="bg-background border-border text-xs h-10! w-31.25">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-xs">
                                <SelectItem value="all" className={`h-10!`}>All Statuses</SelectItem>
                                <SelectItem value="active" className={`h-10!`}>Active</SelectItem>
                                <SelectItem value="blocked" className={`h-10!`}>Blocked</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Title Filter */}
                        <Select value={titleFilter} onValueChange={(val: any) => setTitleFilter(val as string)}>
                            <SelectTrigger className="bg-background border-border text-xs h-10! w-60">
                                <SelectValue placeholder="Title" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-xs max-h-56">
                                <SelectItem value="all" className={`h-10!`}>All Titles</SelectItem>
                                {availableTitles.map((title) => (
                                    <SelectItem key={title} value={title} className={`h-10!`}>
                                        {title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isFilterActive && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-9 px-2 text-xs text-muted-foreground hover:text-destructive gap-1 cursor-pointer"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Reset</span>
                            </Button>
                        )}
                    </div>
                </div>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 px-4 space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-accent/40 flex items-center justify-center text-muted-foreground">
                                <Users className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {users.length === 0
                                    ? "No registered user profiles found."
                                    : "No users match your search or filter criteria."}
                            </p>
                            {isFilterActive && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="text-xs h-8 gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Clear Filters
                                </Button>
                            )}
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
                                    {filteredUsers.map((user) => {
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
                                                        <div className="flex items-center">
                                                            <span className="text-foreground font-semibold">
                                                                {user.name}
                                                            </span>
                                                            {isSelf && (
                                                                <Badge className="ml-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[9px] px-1 py-0">
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {user.title && (
                                                            <div className="text-[11px] font-normal text-muted-foreground">
                                                                {user.title}
                                                            </div>
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
                                                        <SelectTrigger className="bg-background border-border text-foreground h-10! w-32 cursor-pointer">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border-border text-foreground">
                                                            <SelectItem
                                                                value={
                                                                    UserRole.MEMBER
                                                                }
                                                                className="h-10!"
                                                            >
                                                                Member
                                                            </SelectItem>
                                                            <SelectItem
                                                                value={
                                                                    UserRole.ADMIN
                                                                }
                                                                className="h-10!"
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
                                                        <SelectTrigger className="bg-background border-border text-foreground h-10! w-32 cursor-pointer">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border-border text-foreground">
                                                            <SelectItem
                                                                value={
                                                                    UserStatus.ACTIVE
                                                                }
                                                                className="h-10!"
                                                            >
                                                                Active
                                                            </SelectItem>
                                                            <SelectItem
                                                                value={
                                                                    UserStatus.BLOCKED
                                                                }
                                                                className="h-10!"
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
                                                        onClick={() => {
                                                            setEditUserTarget(user);
                                                            setEditTitleValue(user.title || "");
                                                        }}
                                                        className="h-10 w-10 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-md cursor-pointer hover:scale-[1.05] active:scale-[0.95] transition-all"
                                                        title="Edit user title"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
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
                            <Label htmlFor="name">Full Name *</Label>
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
                            <Label htmlFor="title">Title / Role Designation *</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="title"
                                    placeholder="e.g. Full Stack Developer, Project Manager"
                                    {...register("title")}
                                    className="pl-10 bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10"
                                />
                            </div>
                            {errors.title && (
                                <p className="text-xs text-destructive">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email Address *</Label>
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
                                        <SelectTrigger className="pl-10 bg-background border-border text-foreground h-10! cursor-pointer">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground">
                                            <SelectItem value={UserRole.ADMIN} className="h-10!">
                                                Admin
                                            </SelectItem>
                                            <SelectItem value={UserRole.MEMBER} className="h-10!">
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
                                        <SelectTrigger className="pl-10 bg-background/50 border-border text-foreground/75 h-10! cursor-not-allowed opacity-80">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span>Pending</span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border text-foreground">
                                            <SelectItem
                                                value={UserStatus.ACTIVE}
                                                className="h-10!"
                                            >
                                                Active
                                            </SelectItem>
                                            <SelectItem
                                                value={UserStatus.BLOCKED}
                                                className="h-10!"
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
                                    Temporary Password *
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
                onOpenChange={(open) => {
                    if (!open) setViewUserTarget(null);
                }}
            >
                <DialogContent className="sm:max-w-xl bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden text-card-foreground">
                    {viewUserTarget && (
                        <div>
                            {/* Profile Header Banner */}
                            <div className="relative bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 px-6 pt-8 pb-6 text-white overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <UserIcon className="h-48 w-48 text-indigo-400" />
                                </div>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 relative z-10">
                                    <Avatar className="h-20 w-20 border-4 border-white/20 shadow-xl ring-4 ring-indigo-500/20 shrink-0">
                                        <AvatarImage
                                            src={viewUserTarget.avatarUrl}
                                            alt={viewUserTarget.name}
                                        />
                                        <AvatarFallback className="bg-indigo-700 text-2xl font-bold text-white">
                                            {viewUserTarget.name
                                                .substring(0, 2)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 text-center sm:text-left space-y-1">
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                            <h2 className="text-xl font-bold tracking-tight text-white">
                                                {viewUserTarget.name}
                                            </h2>
                                            <Badge
                                                className={`capitalize text-[10px] font-bold px-2 py-0.5 border ${
                                                    viewUserTarget.role === UserRole.ADMIN
                                                        ? "bg-indigo-500/20 text-indigo-200 border-indigo-400/30"
                                                        : "bg-slate-500/20 text-slate-200 border-slate-400/30"
                                                }`}
                                            >
                                                {viewUserTarget.role || "Member"}
                                            </Badge>
                                            <Badge
                                                className={`capitalize text-[10px] font-bold px-2 py-0.5 border ${
                                                    viewUserTarget.status === UserStatus.BLOCKED
                                                        ? "bg-rose-500/20 text-rose-300 border-rose-400/30"
                                                        : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                                                }`}
                                            >
                                                {viewUserTarget.status || "Active"}
                                            </Badge>
                                        </div>

                                        {viewUserTarget.title && (
                                            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-indigo-200 font-medium">
                                                <Briefcase className="h-3.5 w-3.5" />
                                                <span>{viewUserTarget.title}</span>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300 pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5 text-indigo-300" />
                                                <span>{viewUserTarget.email}</span>
                                            </div>
                                            {viewUserTarget.mobileNumber && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-indigo-300" />
                                                    <span>{viewUserTarget.mobileNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Details Sections */}
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                {/* Section 1: Overview Metadata */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3.5 rounded-xl border border-border bg-accent/20 space-y-1">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                            Member Since
                                        </span>
                                        <p className="text-xs font-semibold text-foreground">
                                            {viewUserTarget.createdAt
                                                ? new Date(viewUserTarget.createdAt).toLocaleDateString("en-US", {
                                                      year: "numeric",
                                                      month: "long",
                                                      day: "numeric",
                                                  })
                                                : "N/A"}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-border bg-accent/20 space-y-1">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <BadgeCheck className="h-3.5 w-3.5 text-indigo-500" />
                                            Account Status
                                        </span>
                                        <p className="text-xs font-semibold text-foreground capitalize">
                                            {viewUserTarget.status || "Active"}
                                        </p>
                                    </div>
                                </div>

                                {/* Section 2: Personal Information */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <UserIcon className="h-4 w-4 text-indigo-500" />
                                        Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-border/80 bg-card text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Father's Name:</span>{" "}
                                            <span className="font-semibold text-foreground">
                                                {viewUserTarget.fathersName || "Not specified"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Mother's Name:</span>{" "}
                                            <span className="font-semibold text-foreground">
                                                {viewUserTarget.mothersName || "Not specified"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Gender:</span>{" "}
                                            <span className="font-semibold text-foreground capitalize">
                                                {viewUserTarget.gender || "Not specified"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Blood Group:</span>{" "}
                                            <span className="font-semibold text-foreground">
                                                {viewUserTarget.bloodGroup || "Not specified"}
                                            </span>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-muted-foreground">Date of Birth:</span>{" "}
                                            <span className="font-semibold text-foreground">
                                                {viewUserTarget.dateOfBirth
                                                    ? new Date(viewUserTarget.dateOfBirth).toLocaleDateString()
                                                    : "Not specified"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Payment Accounts */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <CreditCard className="h-4 w-4 text-indigo-500" />
                                        Payment & Bank Accounts ({viewUserTarget.accounts?.length || 0})
                                    </h3>
                                    {viewUserTarget.accounts && viewUserTarget.accounts.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {viewUserTarget.accounts.map((acc: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="p-3.5 rounded-xl border border-border bg-accent/15 space-y-1 text-xs"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-foreground flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-indigo-500" />
                                                            {acc.accountName || "Account"}
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] font-semibold">
                                                            {acc.providerName || "Bank"}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-muted-foreground font-mono pt-1">
                                                        Acc #: {acc.accountNumber || "N/A"}
                                                    </div>
                                                    {acc.branchOrRouting && (
                                                        <div className="text-[11px] text-muted-foreground italic">
                                                            Branch/Routing: {acc.branchOrRouting}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground italic">
                                            No payment accounts configured for this user.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-accent/20 border-t border-border flex justify-end">
                                <Button
                                    onClick={() => setViewUserTarget(null)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-9 px-6 text-xs cursor-pointer"
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
                                    className="bg-destructive hover:bg-destructive/90 text-white font-medium shadow-md shadow-destructive/10 h-10 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
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

            {/* Edit User Title Modal */}
            <Dialog open={!!editUserTarget} onOpenChange={(open) => { if (!open) setEditUserTarget(null); }}>
                <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Edit className="h-5 w-5 text-indigo-600" />
                            Edit Job Title / Designation
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Update official job title for <span className="font-semibold text-foreground">{editUserTarget?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-user-title">Job Title / Designation *</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="edit-user-title"
                                    value={editTitleValue}
                                    onChange={(e) => setEditTitleValue(e.target.value)}
                                    placeholder="e.g. Full Stack Developer, Project Manager"
                                    className="pl-10 bg-background border-border text-foreground focus-visible:ring-indigo-500 h-10"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setEditUserTarget(null)}
                                className="text-xs cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (!editTitleValue.trim()) {
                                        toast.error("Title cannot be empty");
                                        return;
                                    }
                                    updateUserMutation.mutate({
                                        id: editUserTarget._id,
                                        title: editTitleValue.trim(),
                                    });
                                    setEditUserTarget(null);
                                }}
                                disabled={updateUserMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                            >
                                {updateUserMutation.isPending ? <Loading variant="mini" /> : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
