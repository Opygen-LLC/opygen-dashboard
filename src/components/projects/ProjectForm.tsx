"use client";

import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
    Briefcase,
    Calendar,
    DollarSign,
    Search,
    UserCheck,
    Users,
    X,
} from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { z } from "zod";
import { projectSchema, ProjectInput } from "@/lib/validations";
import { ProjectPriority, ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ProjectFormValues = z.input<typeof projectSchema>;

type UserOption = {
    _id: string;
    name: string;
    avatarUrl?: string;
};

type InitialAssignee = string | UserOption;

interface ProjectFormProps {
    initialData?: Omit<
        Partial<ProjectInput>,
        "assignees" | "priority" | "status"
    > & {
        _id?: string;
        assignees?: InitialAssignee[];
        priority?: ProjectPriority;
        status?: ProjectStatus;
    };
    onSubmit: (data: ProjectInput) => void;
    isLoading: boolean;
    onCancel: () => void;
    isDrawer?: boolean;
}

const fieldClass =
    "bg-background text-foreground shadow-xs focus-visible:border-indigo-600 focus-visible:ring-indigo-600/20 dark:bg-input/30 focus-visible:outline-none";
const sectionClass =
    "rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs transition-shadow duration-200 hover:shadow-sm sm:p-5";
const sectionTitleClass =
    "flex items-center gap-2 border-b border-border pb-3 text-xs font-bold uppercase tracking-wide text-indigo-600";

function toDateInputValue(value: unknown) {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value as string);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function getMessage(error: unknown) {
    return typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
        ? error.message
        : null;
}

export default function ProjectForm({
    initialData,
    onSubmit,
    isLoading,
    onCancel,
    isDrawer = false,
}: ProjectFormProps) {
    const { data: users = [], isLoading: isLoadingUsers } = useQuery<
        UserOption[]
    >({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
    });

    const { data: allProjects = [] } = useQuery<any[]>({
        queryKey: ["allProjects"],
        queryFn: async () => {
            const res = await fetch("/api/projects");
            if (!res.ok) throw new Error("Failed to fetch all projects");
            return res.json();
        },
    });

    const assigneeStats = React.useMemo(() => {
        const statsMap: Record<string, { todo: number; inProgress: number }> =
            {};

        users.forEach((u) => {
            statsMap[u._id] = { todo: 0, inProgress: 0 };
        });

        allProjects.forEach((proj: any) => {
            const status = proj.status;
            if (
                status === ProjectStatus.TODO ||
                status === ProjectStatus.IN_PROGRESS
            ) {
                const assigneesList = proj.assignees || [];
                assigneesList.forEach((ass: any) => {
                    const userId =
                        typeof ass === "object" && ass !== null ? ass._id : ass;
                    if (userId && statsMap[userId]) {
                        if (status === ProjectStatus.TODO) {
                            statsMap[userId].todo += 1;
                        } else if (status === ProjectStatus.IN_PROGRESS) {
                            statsMap[userId].inProgress += 1;
                        }
                    }
                });
            }
        });

        return statsMap;
    }, [users, allProjects]);

    const getInitialAssigneeIds = (): string[] => {
        if (!initialData?.assignees) return [];
        return initialData.assignees.map((assignee) =>
            typeof assignee === "object" && assignee !== null
                ? assignee._id
                : assignee,
        );
    };

    const defaultValues: ProjectFormValues = {
        title: initialData?.title ?? "",
        description: initialData?.description ?? "",
        status: initialData?.status ?? ProjectStatus.TODO,
        priority: initialData?.priority ?? ProjectPriority.MEDIUM,
        budget: initialData?.budget ?? 0,
        budgetMin: initialData?.budgetMin ?? null,
        budgetMax: initialData?.budgetMax ?? null,
        startDate: toDateInputValue(initialData?.startDate),
        dueDate: toDateInputValue(initialData?.dueDate),
        clientName: initialData?.clientName ?? "",
        clientMobile: initialData?.clientMobile ?? "",
        clientSocialLink: initialData?.clientSocialLink ?? "",
        assignees: getInitialAssigneeIds(),
    };

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<ProjectFormValues, unknown, ProjectInput>({
        resolver: zodResolver(projectSchema),
        defaultValues,
    });

    const selectedAssignees = useWatch({ control, name: "assignees" }) ?? [];
    const selectedStatus =
        useWatch({ control, name: "status" }) ?? ProjectStatus.TODO;
    const isPipelineProject = [
        ProjectStatus.POTENTIAL,
        ProjectStatus.FUTURE,
    ].includes(selectedStatus as ProjectStatus);

    const [assigneeQuery, setAssigneeQuery] = React.useState("");
    const filteredUsers = React.useMemo(() => {
        const q = assigneeQuery.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => u.name.toLowerCase().includes(q));
    }, [users, assigneeQuery]);

    const handleAssigneeToggle = (userId: string) => {
        const nextAssignees = selectedAssignees.includes(userId)
            ? selectedAssignees.filter((id) => id !== userId)
            : [...selectedAssignees, userId];

        setValue("assignees", nextAssignees, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const onFormSubmit = (data: ProjectInput) => {
        const { payments, ...rest } = data;
        onSubmit({
            ...rest,
            budget: isPipelineProject ? 0 : Number(data.budget ?? 0),
            budgetMin: isPipelineProject ? (data.budgetMin ?? null) : null,
            budgetMax: isPipelineProject ? (data.budgetMax ?? null) : null,
        } as ProjectInput);
    };

    return (
        <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-col sm:h-auto sm:max-h-[85vh] lg:max-h-[80vh]"
        >
            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 sm:px-6 sm:pt-6">
                <div
                    className={cn(
                        "grid grid-cols-1 gap-5",
                        !isDrawer && "md:grid-cols-2 lg:gap-6 xl:gap-8",
                    )}
                >
                    {/* Left Column */}
                    <div className="space-y-5">
                        <section className={cn(sectionClass, "space-y-4")}>
                            <h3 className={sectionTitleClass}>
                                <Briefcase className="size-4" />
                                Project Details
                            </h3>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="title"
                                    className="font-semibold"
                                >
                                    Project Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Implement OpyDash Auth"
                                    aria-invalid={!!errors.title}
                                    {...register("title")}
                                    className={cn(fieldClass, "h-10 sm:h-11")}
                                />
                                {getMessage(errors.title) && (
                                    <p className="text-xs text-destructive">
                                        {getMessage(errors.title)}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="description"
                                    className="font-semibold"
                                >
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the goals and scope of this project..."
                                    rows={4}
                                    aria-invalid={!!errors.description}
                                    {...register("description")}
                                    className={cn(
                                        fieldClass,
                                        "resize-none leading-relaxed",
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="space-y-2">
                                            <Label className="font-semibold">
                                                Status <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger
                                                    aria-invalid={
                                                        !!errors.status
                                                    }
                                                    className={cn(
                                                        fieldClass,
                                                        "h-10 w-full sm:h-11",
                                                    )}
                                                >
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value={
                                                            ProjectStatus.POTENTIAL
                                                        }
                                                    >
                                                        Potential
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectStatus.FUTURE
                                                        }
                                                    >
                                                        Future
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectStatus.TODO
                                                        }
                                                    >
                                                        To Do
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectStatus.IN_PROGRESS
                                                        }
                                                    >
                                                        In Progress
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectStatus.IN_REVIEW
                                                        }
                                                    >
                                                        In Review
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectStatus.COMPLETED
                                                        }
                                                    >
                                                        Completed
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectStatus.ON_HOLD
                                                        }
                                                    >
                                                        On Hold
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                />

                                <Controller
                                    name="priority"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="space-y-2">
                                            <Label className="font-semibold">
                                                Priority <span className="text-destructive">*</span>
                                            </Label>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger
                                                    aria-invalid={
                                                        !!errors.priority
                                                    }
                                                    className={cn(
                                                        fieldClass,
                                                        "h-10 w-full sm:h-11",
                                                    )}
                                                >
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value={
                                                            ProjectPriority.LOW
                                                        }
                                                    >
                                                        Low
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectPriority.MEDIUM
                                                        }
                                                    >
                                                        Medium
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectPriority.HIGH
                                                        }
                                                    >
                                                        High
                                                    </SelectItem>
                                                    <SelectItem
                                                        value={
                                                            ProjectPriority.URGENT
                                                        }
                                                    >
                                                        Urgent
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                />
                            </div>
                        </section>

                        <section className={cn(sectionClass, "space-y-4")}>
                            <h3 className={sectionTitleClass}>
                                <Calendar className="size-4" />
                                Schedule &amp; Budget
                            </h3>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="startDate"
                                        className="font-semibold"
                                    >
                                        Start Date
                                    </Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        aria-invalid={!!errors.startDate}
                                        {...register("startDate")}
                                        className={cn(
                                            fieldClass,
                                            "h-10 sm:h-11",
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="dueDate"
                                        className="font-semibold"
                                    >
                                        Due Date
                                    </Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        aria-invalid={!!errors.dueDate}
                                        {...register("dueDate")}
                                        className={cn(
                                            fieldClass,
                                            "h-10 sm:h-11",
                                        )}
                                    />
                                </div>
                            </div>

                            {isPipelineProject ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="budgetMin"
                                            className="font-semibold"
                                        >
                                            Min Budget
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="budgetMin"
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="1,000"
                                                aria-invalid={
                                                    !!errors.budgetMin
                                                }
                                                {...register("budgetMin")}
                                                className={cn(
                                                    fieldClass,
                                                    "h-10 pl-9 sm:h-11",
                                                )}
                                            />
                                        </div>
                                        {getMessage(errors.budgetMin) && (
                                            <p className="text-xs text-destructive mt-1">
                                                {getMessage(errors.budgetMin)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="budgetMax"
                                            className="font-semibold"
                                        >
                                            Max Budget
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="budgetMax"
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="5,000"
                                                aria-invalid={
                                                    !!errors.budgetMax
                                                }
                                                {...register("budgetMax")}
                                                className={cn(
                                                    fieldClass,
                                                    "h-10 pl-9 sm:h-11",
                                                )}
                                            />
                                        </div>
                                        {getMessage(errors.budgetMax) && (
                                            <p className="text-xs text-destructive mt-1">
                                                {getMessage(errors.budgetMax)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="budget"
                                        className="font-semibold"
                                    >
                                        Budget
                                    </Label>
                                    <div className="relative">
                                        <DollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="budget"
                                            type="number"
                                            min="0"
                                            step="any"
                                            placeholder="0"
                                            aria-invalid={!!errors.budget}
                                            {...register("budget")}
                                            className={cn(
                                                fieldClass,
                                                "h-10 pl-9 sm:h-11",
                                            )}
                                        />
                                    </div>
                                    {getMessage(errors.budget) && (
                                        <p className="text-xs text-destructive">
                                            {getMessage(errors.budget)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                        <section className={cn(sectionClass, "space-y-4")}>
                            <h3 className={sectionTitleClass}>
                                <UserCheck className="size-4" />
                                Client Details
                            </h3>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="clientName"
                                    className="font-semibold"
                                >
                                    Client Name
                                </Label>
                                <Input
                                    id="clientName"
                                    placeholder="e.g. Acme Corp"
                                    {...register("clientName")}
                                    className={cn(fieldClass, "h-10 sm:h-11")}
                                />
                                {getMessage(errors.clientName) && (
                                    <p className="text-xs text-destructive">
                                        {getMessage(errors.clientName)}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="clientMobile"
                                        className="font-semibold"
                                    >
                                        Mobile
                                    </Label>
                                    <Controller
                                        name="clientMobile"
                                        control={control}
                                        render={({ field }) => (
                                            <PhoneInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                id="clientMobile"
                                            />
                                        )}
                                    />
                                    {getMessage(errors.clientMobile) && (
                                        <p className="text-xs text-destructive">
                                            {getMessage(errors.clientMobile)}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="clientSocialLink"
                                        className="font-semibold"
                                    >
                                        Social Link
                                    </Label>
                                    <Input
                                        id="clientSocialLink"
                                        placeholder="e.g. linkedin.com/company/acme"
                                        {...register("clientSocialLink")}
                                        className={cn(
                                            fieldClass,
                                            "h-10 sm:h-11",
                                        )}
                                    />
                                    {getMessage(errors.clientSocialLink) && (
                                        <p className="text-xs text-destructive">
                                            {getMessage(
                                                errors.clientSocialLink,
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className={cn(sectionClass, "space-y-3")}>
                            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-600">
                                    <Users className="size-4" />
                                    Assignees
                                </h3>
                                {selectedAssignees.length > 0 && (
                                    <span className="shrink-0 rounded-full bg-indigo-600/10 px-2 py-0.5 text-[10px] font-extrabold text-indigo-600">
                                        {selectedAssignees.length} selected
                                    </span>
                                )}
                            </div>

                            {users.length > 6 && (
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={assigneeQuery}
                                        onChange={(e) =>
                                            setAssigneeQuery(e.target.value)
                                        }
                                        placeholder="Search team members..."
                                        className={cn(
                                            fieldClass,
                                            "h-9 pl-8 pr-8 text-sm",
                                        )}
                                    />
                                    {assigneeQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setAssigneeQuery("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            aria-label="Clear search"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {isLoadingUsers ? (
                                <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                                    <Loading size="sm" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                                    No users are available to assign.
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                                    No team members match &ldquo;
                                    {assigneeQuery}&rdquo;.
                                </div>
                            ) : (
                                <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:max-h-72">
                                    {filteredUsers.map((user) => {
                                        const isSelected =
                                            selectedAssignees.includes(
                                                user._id,
                                            );

                                        return (
                                            <button
                                                key={user._id}
                                                type="button"
                                                onClick={() =>
                                                    handleAssigneeToggle(
                                                        user._id,
                                                    )
                                                }
                                                className={cn(
                                                    "flex h-11 items-center gap-2 rounded-lg border px-2 text-left transition-colors",
                                                    "hover:border-indigo-600/40 hover:bg-accent/70 focus-visible:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-600/20 focus-visible:outline-none",
                                                    isSelected
                                                        ? "border-indigo-600/50 bg-indigo-600/10 text-foreground"
                                                        : "border-border bg-background text-muted-foreground dark:bg-input/20",
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    tabIndex={-1}
                                                    className="size-4 shrink-0 rounded border-border text-indigo-600 accent-indigo-600"
                                                />
                                                <Avatar className="size-7 shrink-0">
                                                    <AvatarImage
                                                        src={user.avatarUrl}
                                                        alt={user.name}
                                                    />
                                                    <AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground">
                                                        {user.name
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                                    {user.name}
                                                </span>
                                                {(() => {
                                                    const stats = assigneeStats[
                                                        user._id
                                                    ] || {
                                                        todo: 0,
                                                        inProgress: 0,
                                                    };
                                                    return (
                                                        <div className="ml-auto flex shrink-0 select-none items-center gap-1">
                                                            {stats.todo > 0 && (
                                                                <span
                                                                    title="To Do"
                                                                    className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full border border-slate-200/50 bg-slate-100 px-1 text-[9px] font-extrabold text-slate-600 transition-transform hover:scale-105 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-400"
                                                                >
                                                                    {stats.todo}
                                                                </span>
                                                            )}
                                                            {stats.inProgress >
                                                                0 && (
                                                                <span
                                                                    title="In Progress"
                                                                    className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full border border-indigo-200/50 bg-indigo-50 px-1 text-[9px] font-extrabold text-indigo-600 transition-transform hover:scale-105 dark:border-indigo-800/30 dark:bg-indigo-950/40 dark:text-indigo-400"
                                                                >
                                                                    {
                                                                        stats.inProgress
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {/* Sticky footer */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="h-10 sm:h-11"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 bg-indigo-600 px-5 text-white shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98] sm:h-11"
                >
                    {isLoading ? (
                        <Loading variant="mini" text="Saving..." />
                    ) : (
                        "Save Project"
                    )}
                </Button>
            </div>
        </form>
    );
}
