"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    X,
    Check,
    Clock,
    AlertTriangle,
    Play,
    CheckCircle2,
    Paperclip,
    Plus,
    Send,
    MoreHorizontal,
    Briefcase,
    DollarSign,
    FileImage,
    CreditCard,
    ExternalLink,
    Calendar,
    MessageSquare,
    Trash2,
    Edit2,
    ArrowRight,
    Smartphone,
    Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ProjectForm from "./ProjectForm";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useAppDispatch } from "@/store";
import { fetchProjectsThunk } from "@/store/projectsSlice";
import { Loading } from "../ui/Loading";

interface ProjectDetailsProps {
    projectId: string;
    onClose: () => void;
}

export default function ProjectDetails({
    projectId,
    onClose,
}: ProjectDetailsProps) {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState<
        "overview" | "payments" | "activity"
    >("overview");
    const [isEditing, setIsEditing] = useState(false);
    const [commentText, setCommentText] = useState("");

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Payments states
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [payType, setPayType] = useState<
        "advance" | "frontend" | "backend" | "ui" | "custom"
    >("advance");
    const [payLabel, setPayLabel] = useState("");
    const [payAmount, setPayAmount] = useState("");
    const [payDate, setPayDate] = useState("");
    const [editPaymentIndex, setEditPaymentIndex] = useState<number | null>(null);
    const [payStatus, setPayStatus] = useState<"pending" | "paid">("pending");
    const [deletePaymentIndex, setDeletePaymentIndex] = useState<number | null>(
        null,
    );
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Receipt upload states
    const [receiptFile, setReceiptFile] = useState<string | null>(null);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(
        null,
    );

    const {
        data: project,
        isLoading,
        error,
    } = useQuery<any>({
        queryKey: ["project", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${projectId}`);
            if (!res.ok) throw new Error("Failed to fetch project");
            return res.json();
        },
    });

    const { data: activities, isLoading: isLoadingActivities } = useQuery<
        any[]
    >({
        queryKey: ["activities", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/activity`);
            if (!res.ok) throw new Error("Failed to fetch activity logs");
            return res.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to update project");
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["project", projectId], data);
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            queryClient.invalidateQueries({
                queryKey: ["activities", projectId],
            });
            toast.success("Project updated successfully");
            setIsEditing(false);
            dispatch(fetchProjectsThunk());
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update project");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete project");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            toast.success("Project deleted successfully");
            onClose();
            dispatch(fetchProjectsThunk());
        },
        onError: () => {
            toast.error("Failed to delete project");
        },
    });

    const commentMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await fetch(`/api/projects/${projectId}/activity`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            if (!res.ok) throw new Error("Failed to add comment");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["activities", projectId],
            });
            setCommentText("");
            toast.success("Comment added");
        },
        onError: () => {
            toast.error("Failed to add comment");
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-card border-l border-border text-foreground overflow-hidden shadow-2xl p-6 space-y-8">
                <div className="flex items-center justify-between border-b border-border bg-accent/20 pb-6">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <Skeleton className="h-10 w-10 rounded-md" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-accent/10 border border-border">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <div className="space-y-4 border-b border-border/60 pb-6">
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-24 rounded-full" />
                            <Skeleton className="h-8 w-24 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="text-center p-8 bg-card border-l border-border h-full flex flex-col items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">
                    Error Loading Project
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                    The project could not be found or loaded.
                </p>
                <Button onClick={onClose} className="mt-4 h-10 cursor-pointer">
                    Close
                </Button>
            </div>
        );
    }

    const handleStatusChange = (status: string | null) => {
        if (status) {
            updateMutation.mutate({ status });
        }
    };

    const handlePriorityChange = (priority: string | null) => {
        if (priority) {
            updateMutation.mutate({ priority });
        }
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        commentMutation.mutate(commentText);
    };

    const handleDelete = () => {
        if (
            confirm(
                "Are you sure you want to delete this project? This action is permanent.",
            )
        ) {
            deleteMutation.mutate();
        }
    };

    const priorityColors: Record<string, string> = {
        low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20",
        medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-450 dark:border-amber-500/20",
        high: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-450 dark:border-orange-500/20",
        urgent: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20 animate-pulse",
    };

    const statusLabels: Record<string, string> = {
        potential: "Potential",
        future: "Future",
        todo: "To Do",
        in_progress: "In Progress",
        in_review: "In Review",
        completed: "Completed",
        on_hold: "On Hold",
    };

    const logTypeIcons = {
        comment: MessageSquare,
        status_change: ArrowRight,
        assignment_change: ArrowRight,
        priority_change: ArrowRight,
        details_change: Edit2,
    };

    return (
        <div className="flex flex-col h-full bg-card border-l border-border text-foreground overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-accent/20">
                <div className="flex items-center gap-3">
                    <Badge
                        className={`capitalize border ${priorityColors[project.priority] || ""}`}
                    >
                        {project.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        Updated{" "}
                        {project.updatedAt ? format(new Date(project.updatedAt), "MMM dd, HH:mm") : "N/A"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsEditing(true)}
                                className="text-muted-foreground hover:text-foreground h-10 w-10 cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
                                title="Edit Project"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowDeleteModal(true)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
                                disabled={deleteMutation.isPending}
                                title="Delete Project"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground h-10 w-10 cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isEditing ? (
                    <div className="bg-accent/5 p-4 rounded-lg border border-border/80">
                        <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
                            Edit Project Details
                        </h3>
                        <ProjectForm
                            initialData={project}
                            onSubmit={(data) => updateMutation.mutate(data)}
                            isLoading={updateMutation.isPending}
                            onCancel={() => setIsEditing(false)}
                            isDrawer={true}
                        />
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                                {project.title}
                            </h2>
                            <p className="text-muted-foreground mt-3 text-sm whitespace-pre-wrap leading-relaxed">
                                {project.description || (
                                    <span className="italic text-muted-foreground/60">
                                        No description provided.
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Quick Status / Priority Inline Updates */}
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-accent/10 border border-border">
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Status
                                </span>
                                <Select
                                    value={project.status}
                                    onValueChange={handleStatusChange}
                                    disabled={updateMutation.isPending}
                                >
                                    <SelectTrigger className="bg-background border-border text-foreground h-10 cursor-pointer">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        {Object.keys(statusLabels).map(
                                            (key) => (
                                                <SelectItem
                                                    key={key}
                                                    value={key}
                                                >
                                                    {statusLabels[key]}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Priority
                                </span>
                                <Select
                                    value={project.priority}
                                    onValueChange={handlePriorityChange}
                                    disabled={updateMutation.isPending}
                                >
                                    <SelectTrigger className="bg-background border-border text-foreground h-10 cursor-pointer">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">
                                            Medium
                                        </SelectItem>
                                        <SelectItem value="high">
                                            High
                                        </SelectItem>
                                        <SelectItem value="urgent">
                                            Urgent
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Date, Budget, and Assignees info */}
                        <div className="space-y-4 border-b border-border/60 pb-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-455 shrink-0" />
                                    <span>Start Date:</span>
                                    <span className="font-semibold text-foreground">
                                        {project.startDate
                                            ? format(
                                                  new Date(project.startDate),
                                                  "PPP",
                                              )
                                            : "Not set"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-455 shrink-0" />
                                    <span>Due Date:</span>
                                    <span className="font-bold text-foreground">
                                        {project.dueDate
                                            ? format(
                                                  new Date(project.dueDate),
                                                  "PPP",
                                              )
                                            : "No due date set"}
                                    </span>
                                    {project.dueDate &&
                                        new Date(project.dueDate) <
                                            new Date() &&
                                        project.status !== "completed" && (
                                            <Badge
                                                variant="destructive"
                                                className="ml-2 text-[10px] py-0 px-1.5 font-bold uppercase animate-pulse"
                                            >
                                                Overdue
                                            </Badge>
                                        )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <DollarSign className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-450 shrink-0" />
                                    <span>Budget:</span>
                                    <span className="font-bold text-emerald-650 dark:text-emerald-450">
                                        {["potential", "future"].includes(
                                            project.status,
                                        )
                                            ? project.budgetMin !== undefined &&
                                              project.budgetMax !== undefined
                                                ? `$${Number(project.budgetMin).toLocaleString()} - $${Number(project.budgetMax).toLocaleString()}`
                                                : project.budgetMin !==
                                                    undefined
                                                  ? `Min: $${Number(project.budgetMin).toLocaleString()}`
                                                  : project.budgetMax !==
                                                      undefined
                                                    ? `Max: $${Number(project.budgetMax).toLocaleString()}`
                                                    : "$0 (Range not set)"
                                            : project.budget !== undefined &&
                                                project.budget !== null
                                              ? `$${Number(project.budget).toLocaleString()}`
                                              : "$0"}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                    Assignees ({project.assignees?.length || 0})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(project.assignees || []).map((user: any) => (
                                        <div
                                            key={user._id}
                                            className="flex items-center gap-2 bg-background border border-border rounded-full py-1 px-3 pr-4"
                                        >
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage
                                                    src={user.avatarUrl}
                                                />
                                                <AvatarFallback className="bg-accent text-muted-foreground text-xs">
                                                    {user.name
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium text-foreground/80">
                                                {user.name}
                                            </span>
                                        </div>
                                    ))}
                                    {(project.assignees || []).length === 0 && (
                                        <p className="text-xs italic text-muted-foreground/60">
                                            Unassigned
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Client Details Card */}
                        <div className="p-4 rounded-lg bg-accent/25 dark:bg-card border border-border space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Client Details
                            </h4>
                            {project.clientName ? (
                                <div className="space-y-2">
                                    <div className="text-sm font-bold text-foreground">
                                        {project.clientName}
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-xs mt-1">
                                        {project.clientMobile && (
                                            <a
                                                href={`tel:${project.clientMobile}`}
                                                className="flex items-center gap-1.5 text-muted-foreground hover:text-indigo-500 hover:underline transition-colors"
                                            >
                                                <Smartphone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                <span>
                                                    {project.clientMobile}
                                                </span>
                                            </a>
                                        )}

                                        {project.clientSocialLink && (
                                            <a
                                                href={
                                                    typeof project.clientSocialLink === 'string' && project.clientSocialLink.startsWith(
                                                        "http",
                                                    )
                                                        ? project.clientSocialLink
                                                        : `https://${project.clientSocialLink}`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-muted-foreground hover:text-indigo-500 hover:underline transition-colors"
                                            >
                                                <Globe className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                <span className="truncate max-w-[200px]">
                                                    {project.clientSocialLink}
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground italic">
                                    No customer details specified for this
                                    project.
                                </div>
                            )}
                        </div>

                        {/* Payment Milestones Tracker */}
                        <div className="p-4 rounded-lg bg-accent/15 dark:bg-card border border-border space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard className="h-4 w-4 text-indigo-500" />
                                    Payment Milestones
                                </h4>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (showAddPayment) {
                                            setShowAddPayment(false);
                                            setEditPaymentIndex(null);
                                            setPayAmount("");
                                            setPayLabel("");
                                            setPayDate("");
                                            setPayType("advance");
                                            setPayStatus("pending");
                                            setReceiptFile(null);
                                        } else {
                                            setShowAddPayment(true);
                                        }
                                    }}
                                    className="h-7 text-xs border-border px-2 flex items-center gap-1 cursor-pointer"
                                >
                                    {showAddPayment ? (
                                        <X className="h-3 w-3" />
                                    ) : (
                                        <Plus className="h-3 w-3" />
                                    )}
                                    {showAddPayment
                                        ? "Cancel"
                                        : "Add Milestone"}
                                </Button>
                            </div>

                            {/* Interactive Stats Grid */}
                            {(() => {
                                const list = project.payments || [];
                                const totalPaid = list.reduce(
                                    (sum: number, p: any) =>
                                        p.status === "paid"
                                            ? sum + Number(p.amount)
                                            : sum,
                                    0,
                                );
                                const totalContract = list.reduce(
                                    (sum: number, p: any) =>
                                        sum + Number(p.amount),
                                    0,
                                );
                                const percent =
                                    totalContract > 0
                                        ? Math.min(
                                              100,
                                              Math.round(
                                                  (totalPaid / totalContract) *
                                                      100,
                                              ),
                                          )
                                        : 0;
                                const pendingAmount = totalContract - totalPaid;
                                const unallocatedBudget = Math.max(
                                    0,
                                    (project.budget || 0) - totalContract,
                                );

                                return (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {/* Received Card */}
                                            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex flex-col justify-between transition-all hover:scale-[1.02]">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                    <span>Received</span>
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="mt-2 text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                                                    $
                                                    {totalPaid.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                                                    {percent}% of milestones
                                                </div>
                                            </div>

                                            {/* Pending Card */}
                                            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col justify-between transition-all hover:scale-[1.02]">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 dark:text-amber-450 uppercase tracking-wider">
                                                    <span>Pending</span>
                                                    <Clock className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="mt-2 text-base font-extrabold text-amber-700 dark:text-amber-450">
                                                    $
                                                    {pendingAmount.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-amber-600/80 dark:text-amber-450/80 mt-0.5">
                                                    {
                                                        list.filter(
                                                            (p: any) =>
                                                                p.status ===
                                                                "pending",
                                                        ).length
                                                    }{" "}
                                                    milestone(s)
                                                </div>
                                            </div>

                                            {/* Milestone Total Card */}
                                            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 flex flex-col justify-between transition-all hover:scale-[1.02]">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-405 uppercase tracking-wider">
                                                    <span>
                                                        Milestones Total
                                                    </span>
                                                    <CreditCard className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="mt-2 text-base font-extrabold text-indigo-700 dark:text-indigo-405">
                                                    $
                                                    {totalContract.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
                                                    {list.length} total
                                                    milestone(s)
                                                </div>
                                            </div>

                                            {/* Unallocated Budget Card */}
                                            <div className="p-3 rounded-lg border border-border bg-accent/5 dark:bg-accent/10 flex flex-col justify-between transition-all hover:scale-[1.02]">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    <span>Unallocated</span>
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="mt-2 text-base font-extrabold text-foreground">
                                                    $
                                                    {unallocatedBudget.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-muted-foreground/80 mt-0.5">
                                                    Budget: $
                                                    {(
                                                        project.budget || 0
                                                    ).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="w-full bg-accent dark:bg-accent/40 rounded-full h-1.5 overflow-hidden border border-border/40">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="text-right text-[9px] text-muted-foreground/80 font-bold uppercase tracking-wider">
                                                {percent}% Paid
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Add Payment Form */}
                            {showAddPayment && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (
                                            !payAmount ||
                                            Number(payAmount) <= 0
                                        ) {
                                            toast.error(
                                                "Please enter a valid amount",
                                            );
                                            return;
                                        }
                                        const totalPayments =
                                            (project.payments || []).reduce(
                                                (sum: number, p: any) =>
                                                    sum + Number(p.amount),
                                                0,
                                            ) + Number(payAmount);
                                        if (
                                            totalPayments >
                                            (project.budget || 0)
                                        ) {
                                            toast.error(
                                                `Total payment milestones ($${totalPayments.toLocaleString()}) cannot exceed the project budget ($${(project.budget || 0).toLocaleString()})`,
                                            );
                                            return;
                                        }
                                        const newPay = {
                                            type: payType,
                                            customLabel:
                                                payType === "custom"
                                                    ? payLabel
                                                    : "",
                                            amount: Number(payAmount),
                                            status: payStatus,
                                            paymentDate: new Date(payDate).toISOString(),
                                            receiptUrl:
                                                receiptFile || undefined,
                                        };
                                        const updated = [...(project.payments || [])];
                                        if (editPaymentIndex !== null) {
                                            updated[editPaymentIndex] = newPay;
                                        } else {
                                            updated.push(newPay);
                                        }
                                        updateMutation.mutate({
                                            payments: updated,
                                        });
                                        setPayLabel("");
                                        setPayAmount("");
                                        setPayDate("");
                                        setPayType("advance");
                                        setPayStatus("pending");
                                        setReceiptFile(null);
                                        setEditPaymentIndex(null);
                                        setShowAddPayment(false);
                                    }}
                                    className="bg-accent/10 border border-border/80 rounded-xl p-4 space-y-3.5 shadow-xs"
                                >
                                    <div className="flex items-center gap-1.5 border-b border-border/60 pb-2 mb-1">
                                        <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                                        <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                                            {editPaymentIndex !== null ? "Edit Milestone Specifications" : "New Milestone Specifications"}
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Milestone Type <span className="text-destructive">*</span>
                                            </label>
                                            <select
                                                value={payType}
                                                onChange={(e) =>
                                                    setPayType(
                                                        e.target.value as any,
                                                    )
                                                }
                                                className="w-full h-9 px-3 rounded-lg border border-border bg-background hover:bg-background/80 focus:bg-background focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-foreground transition-all focus:outline-none cursor-pointer"
                                            >
                                                <option value="advance">
                                                    Advance
                                                </option>
                                                <option value="frontend">
                                                    Frontend
                                                </option>
                                                <option value="backend">
                                                    Backend
                                                </option>
                                                <option value="ui">
                                                    UI/UX Design
                                                </option>
                                                <option value="custom">
                                                    Custom
                                                </option>
                                                <option value="other">
                                                    Other
                                                </option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Amount ($) <span className="text-destructive">*</span>
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/75" />
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="0.00"
                                                    value={payAmount}
                                                    onChange={(e) =>
                                                        setPayAmount(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background hover:bg-background/80 focus:bg-background focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-foreground transition-all focus:outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {payType === "custom" && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                Custom Label <span className="text-destructive">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Design Phase"
                                                value={payLabel}
                                                onChange={(e) =>
                                                    setPayLabel(e.target.value)
                                                }
                                                className="w-full h-9 px-3 rounded-lg border border-border bg-background hover:bg-background/80 focus:bg-background focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-foreground transition-all focus:outline-none"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Payment Date <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={payDate}
                                            onChange={(e) => setPayDate(e.target.value)}
                                            className="w-full h-9 px-3 rounded-lg border border-border bg-background hover:bg-background/80 focus:bg-background focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-foreground transition-all focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider">
                                            Receipt Image (Optional)
                                            {uploadingReceipt && (
                                                <Loading variant="mini" />
                                            )}
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file =
                                                    e.target.files?.[0];
                                                if (!file) return;

                                                setUploadingReceipt(true);
                                                const reader = new FileReader();
                                                reader.onload = async () => {
                                                    const base64 =
                                                        reader.result as string;
                                                    try {
                                                        const res = await fetch(
                                                            "/api/upload",
                                                            {
                                                                method: "POST",
                                                                headers: {
                                                                    "Content-Type":
                                                                        "application/json",
                                                                },
                                                                body: JSON.stringify(
                                                                    {
                                                                        image: base64,
                                                                    },
                                                                ),
                                                            },
                                                        );
                                                        if (!res.ok)
                                                            throw new Error(
                                                                "Upload failed",
                                                            );
                                                        const uploadData =
                                                            await res.json();
                                                        setReceiptFile(
                                                            uploadData.url,
                                                        );
                                                        toast.success(
                                                            "Receipt uploaded to Cloudinary",
                                                        );
                                                    } catch (err) {
                                                        toast.error(
                                                            "Failed to upload receipt image",
                                                        );
                                                    } finally {
                                                        setUploadingReceipt(
                                                            false,
                                                        );
                                                    }
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                            className="w-full text-xs text-muted-foreground file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-indigo-550/10 file:hover:bg-indigo-550/20 file:text-indigo-600 dark:file:text-indigo-400 file:cursor-pointer bg-background dark:bg-card border border-border rounded-lg h-9.5 flex items-center px-1.5 transition-all hover:border-indigo-500/30"
                                        />
                                        {receiptFile && (
                                            <div className="flex items-center gap-2 mt-1.5 p-1 rounded bg-accent/40 border border-border/50 w-fit">
                                                <Image
                                                    src={receiptFile}
                                                    className="object-cover rounded border border-border/80"
                                                    alt="Receipt preview"
                                                    width={28}
                                                    height={28}
                                                />
                                                <span className="text-[9px] text-muted-foreground">
                                                    Receipt ready
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setReceiptFile(null)
                                                    }
                                                    className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-border/60 mt-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="payStatusCheck"
                                                checked={payStatus === "paid"}
                                                onChange={(e) =>
                                                    setPayStatus(
                                                        e.target.checked
                                                            ? "paid"
                                                            : "pending",
                                                    )
                                                }
                                                className="rounded border-border text-indigo-600 focus:ring-indigo-550/30 focus:ring-1 h-4 w-4 bg-background cursor-pointer"
                                            />
                                            <label
                                                htmlFor="payStatusCheck"
                                                className="text-xs text-muted-foreground select-none cursor-pointer font-medium hover:text-foreground transition-colors"
                                            >
                                                Mark as Paid immediately
                                            </label>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={uploadingReceipt}
                                            size="sm"
                                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 cursor-pointer shadow-sm shadow-indigo-600/10 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-md font-medium"
                                        >
                                            Save Milestone
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {/* Payments List */}
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {(project.payments || []).map(
                                    (pay: any, index: number) => {
                                        const typeLabels: Record<
                                            string,
                                            string
                                        > = {
                                            advance: "Advance",
                                            frontend: "Frontend Delivery",
                                            backend: "Backend Delivery",
                                            ui: "UI/UX Design",
                                        };
                                        const label =
                                            pay.type === "custom"
                                                ? pay.customLabel ||
                                                  "Custom Milestone"
                                                : typeLabels[pay.type];

                                        return (
                                            <div
                                                key={pay._id || index}
                                                className="flex items-center justify-between border border-border bg-background dark:bg-accent/5 rounded-md p-2.5 hover:bg-accent/20 transition-colors"
                                            >
                                                <div className="space-y-0.5 min-w-0 pr-2">
                                                    <div className="text-xs font-bold text-foreground truncate">
                                                        {label}
                                                    </div>
                                                    {pay.paymentDate && (
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {format(
                                                                new Date(
                                                                    pay.paymentDate,
                                                                ),
                                                                "MMM dd, yyyy",
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    {pay.receiptUrl && (
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewReceiptUrl(
                                                                    pay.receiptUrl,
                                                                );
                                                            }}
                                                            className="h-8 w-8 rounded border border-border bg-background overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors shadow-xs group shrink-0 relative"
                                                            title="Click to view receipt"
                                                        >
                                                            <Image
                                                                src={
                                                                    pay.receiptUrl
                                                                }
                                                                className="object-cover group-hover:scale-110 transition-transform"
                                                                alt="Receipt thumbnail"
                                                                width={32}
                                                                height={32}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="text-xs font-bold text-foreground">
                                                        $
                                                        {Number(
                                                            pay.amount,
                                                        ).toLocaleString()}
                                                    </div>
                                                    <Badge
                                                        onClick={() => {
                                                            const updated = (
                                                                project.payments ||
                                                                []
                                                            ).map(
                                                                (
                                                                    p: any,
                                                                    idx: number,
                                                                ) =>
                                                                    idx ===
                                                                    index
                                                                        ? {
                                                                              ...p,
                                                                              status:
                                                                                  p.status ===
                                                                                  "paid"
                                                                                      ? "pending"
                                                                                      : "paid",
                                                                          }
                                                                        : p,
                                                            );
                                                            updateMutation.mutate(
                                                                {
                                                                    payments:
                                                                        updated,
                                                                },
                                                            );
                                                        }}
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors border select-none ${
                                                            pay.status ===
                                                            "paid"
                                                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                                : "bg-amber-500/15 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-450"
                                                        }`}
                                                    >
                                                        {pay.status === "paid"
                                                            ? "Paid"
                                                            : "Pending"}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setPayAmount(String(pay.amount));
                                                            setPayType(pay.type);
                                                            setPayLabel(pay.customLabel || "");
                                                            setPayDate(pay.paymentDate ? new Date(pay.paymentDate).toISOString().split("T")[0] : "");
                                                            setPayStatus(pay.status);
                                                            setReceiptFile(pay.receiptUrl || null);
                                                            setEditPaymentIndex(index);
                                                            setShowAddPayment(true);
                                                        }}
                                                        className="h-7 w-7 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 cursor-pointer"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setDeletePaymentIndex(
                                                                index,
                                                            )
                                                        }
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}

                                {(project.payments || []).length === 0 && (
                                    <div className="text-center text-xs text-muted-foreground/60 py-4 italic">
                                        No payment milestones set.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Logs & Comments */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                <MessageSquare className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                                Activity & Comments
                            </h3>

                            {/* Comment submission form */}
                            <form
                                onSubmit={handleCommentSubmit}
                                className="flex items-start gap-2 bg-background p-2 rounded-lg border border-border"
                            >
                                <Textarea
                                    value={commentText}
                                    onChange={(e) =>
                                        setCommentText(e.target.value)
                                    }
                                    placeholder="Post a comment..."
                                    rows={2}
                                    className="bg-transparent border-none text-foreground text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 resize-none flex-1 p-2 focus:outline-none"
                                />
                                <Button
                                    type="submit"
                                    disabled={
                                        commentMutation.isPending ||
                                        !commentText.trim()
                                    }
                                    size="icon"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 self-end mb-1 mr-1 h-10 w-10 cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>

                            {/* Log List */}
                            {isLoadingActivities ? (
                                <div className="flex justify-center p-4">
                                    <Loading size="sm" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence initial={false}>
                                        {activities?.map((log) => {
                                            const LogIcon =
                                                logTypeIcons[
                                                    log.type as keyof typeof logTypeIcons
                                                ] || MessageSquare;
                                            const isComment =
                                                log.type === "comment";

                                            return (
                                                <motion.div
                                                    key={log._id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.2,
                                                    }}
                                                    className={`flex items-start gap-3 text-sm p-3 rounded-lg border ${
                                                        isComment
                                                            ? "bg-accent/15 border-border"
                                                            : "bg-accent/5 border-transparent text-muted-foreground"
                                                    }`}
                                                >
                                                    <Avatar className="h-8 w-8 border border-indigo-500/10">
                                                        <AvatarImage
                                                            src={
                                                                log.user
                                                                    ?.avatarUrl
                                                            }
                                                        />
                                                        <AvatarFallback className="bg-accent text-muted-foreground text-xs font-bold">
                                                            {log.user?.name
                                                                ?.substring(
                                                                    0,
                                                                    2,
                                                                )
                                                                .toUpperCase() ||
                                                                "OP"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 space-y-1 overflow-hidden">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="font-bold text-foreground">
                                                                {log.user?.name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {log.createdAt
                                                                    ? format(
                                                                          new Date(log.createdAt),
                                                                          "MMM dd, HH:mm",
                                                                      )
                                                                    : "N/A"}
                                                            </span>
                                                        </div>
                                                        {isComment ? (
                                                            <p className="text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap mt-1">
                                                                {log.message}
                                                            </p>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                                <LogIcon className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                                                <span>
                                                                    {
                                                                        log.message
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {activities?.length === 0 && (
                                        <p className="text-center text-xs text-muted-foreground/60 py-4 italic">
                                            No activity logged yet.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Receipt Image Preview Dialog */}
            <Dialog
                open={!!previewReceiptUrl}
                onOpenChange={(open) => !open && setPreviewReceiptUrl(null)}
            >
                <DialogContent className="bg-card border-border text-foreground max-w-2xl p-4 flex flex-col items-center justify-center">
                    <div className="flex justify-between items-center w-full border-b border-border pb-2 mb-3">
                        <h3 className="text-sm font-bold flex items-center gap-1.5">
                            <FileImage className="h-4 w-4 text-indigo-500" />
                            Payment Receipt Preview
                        </h3>
                    </div>
                    {previewReceiptUrl && (
                        <Image
                            src={previewReceiptUrl}
                            className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg border border-border shadow-md"
                            alt="Receipt Full View"
                            width={800}
                            height={600}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Payment Milestone Confirmation Dialog */}
            <Dialog
                open={deletePaymentIndex !== null}
                onOpenChange={(open) => !open && setDeletePaymentIndex(null)}
            >
                <DialogContent className="bg-card border-border text-foreground max-w-sm p-5 flex flex-col gap-4">
                    <DialogHeader className="border-none p-0 flex flex-col gap-1">
                        <DialogTitle className="text-lg font-bold flex items-center gap-1.5 text-foreground">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete Milestone
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
                            Are you sure you want to delete this payment
                            milestone? This action is permanent and cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeletePaymentIndex(null)}
                            className="h-9 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (deletePaymentIndex !== null) {
                                    const updated = (
                                        project.payments || []
                                    ).filter(
                                        (_: any, idx: number) =>
                                            idx !== deletePaymentIndex,
                                    );
                                    updateMutation.mutate({
                                        payments: updated,
                                    });
                                    setDeletePaymentIndex(null);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white h-9 cursor-pointer"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {showDeleteModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowDeleteModal(false)}
                                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.15,
                                        ease: "easeOut",
                                    }}
                                    className="relative w-full max-w-sm border border-border bg-card shadow-2xl rounded-2xl overflow-hidden p-6 text-center space-y-6"
                                >
                                    <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
                                        <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-foreground">
                                            Delete Project
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Are you sure you want to delete this
                                            project? This action is permanent
                                            and cannot be undone.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setShowDeleteModal(false)
                                            }
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                                            onClick={() => {
                                                deleteMutation.mutate();
                                                setShowDeleteModal(false);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
}
