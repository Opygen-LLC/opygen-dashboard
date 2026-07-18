"use client";

import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Calendar, Loader2, UserCheck, Users } from "lucide-react";
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
    "rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xs";
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
        const statsMap: Record<string, { todo: number; inProgress: number }> = {};
        
        users.forEach((u) => {
            statsMap[u._id] = { todo: 0, inProgress: 0 };
        });

        allProjects.forEach((proj: any) => {
            const status = proj.status;
            if (status === ProjectStatus.TODO || status === ProjectStatus.IN_PROGRESS) {
                const assigneesList = proj.assignees || [];
                assigneesList.forEach((ass: any) => {
                    const userId = typeof ass === "object" && ass !== null ? ass._id : ass;
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
    const isPipelineProject = [ProjectStatus.POTENTIAL, ProjectStatus.FUTURE]
        .includes(selectedStatus as ProjectStatus);

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
        onSubmit({
            ...data,
            budget: isPipelineProject ? 0 : Number(data.budget ?? 0),
            budgetMin: isPipelineProject ? data.budgetMin ?? null : null,
            budgetMax: isPipelineProject ? data.budgetMax ?? null : null,
        });
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <div
                className={
                    isDrawer
                        ? "space-y-5"
                        : "grid grid-cols-1 gap-5"
                }
            >
                <section className={cn(sectionClass, "space-y-4")}>
                    <h3 className={sectionTitleClass}>
                        <Briefcase className="size-4" />
                        Project Details
                    </h3>

                    <div className="space-y-2">
                        <Label htmlFor="title" className="font-semibold">
                            Project Title
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g. Implement OpyDash Auth"
                            aria-invalid={!!errors.title}
                            {...register("title")}
                            className={fieldClass}
                        />
                        {getMessage(errors.title) && (
                            <p className="text-xs text-destructive">
                                {getMessage(errors.title)}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-semibold">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the goals and scope of this project..."
                            rows={4}
                            aria-invalid={!!errors.description}
                            {...register("description")}
                            className={cn(fieldClass, "resize-none leading-relaxed")}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <Label className="font-semibold">Status</Label>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            aria-invalid={!!errors.status}
                                            className={cn(fieldClass, "h-10 w-full")}
                                        >
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ProjectStatus.POTENTIAL}>
                                                Potential
                                            </SelectItem>
                                            <SelectItem value={ProjectStatus.FUTURE}>
                                                Future
                                            </SelectItem>
                                            <SelectItem value={ProjectStatus.TODO}>
                                                To Do
                                            </SelectItem>
                                            <SelectItem value={ProjectStatus.IN_PROGRESS}>
                                                In Progress
                                            </SelectItem>
                                            <SelectItem value={ProjectStatus.IN_REVIEW}>
                                                In Review
                                            </SelectItem>
                                            <SelectItem value={ProjectStatus.COMPLETED}>
                                                Completed
                                            </SelectItem>
                                            <SelectItem value={ProjectStatus.ON_HOLD}>
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
                                    <Label className="font-semibold">Priority</Label>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger
                                            aria-invalid={!!errors.priority}
                                            className={cn(fieldClass, "h-10 w-full")}
                                        >
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ProjectPriority.LOW}>
                                                Low
                                            </SelectItem>
                                            <SelectItem value={ProjectPriority.MEDIUM}>
                                                Medium
                                            </SelectItem>
                                            <SelectItem value={ProjectPriority.HIGH}>
                                                High
                                            </SelectItem>
                                            <SelectItem value={ProjectPriority.URGENT}>
                                                Urgent
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                    </div>
                </section>

                <div className="space-y-5">
                    <section className={cn(sectionClass, "space-y-4")}>
                        <h3 className={sectionTitleClass}>
                            <Calendar className="size-4" />
                            Schedule & Budget
                        </h3>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="startDate" className="font-semibold">
                                    Start Date
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    aria-invalid={!!errors.startDate}
                                    {...register("startDate")}
                                    className={fieldClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dueDate" className="font-semibold">
                                    Due Date
                                </Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    aria-invalid={!!errors.dueDate}
                                    {...register("dueDate")}
                                    className={fieldClass}
                                />
                            </div>
                        </div>

                        {isPipelineProject ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="budgetMin" className="font-semibold">
                                        Min Budget ($)
                                    </Label>
                                    <Input
                                        id="budgetMin"
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="1000"
                                        aria-invalid={!!errors.budgetMin}
                                        {...register("budgetMin")}
                                        className={fieldClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="budgetMax" className="font-semibold">
                                        Max Budget ($)
                                    </Label>
                                    <Input
                                        id="budgetMax"
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="5000"
                                        aria-invalid={!!errors.budgetMax}
                                        {...register("budgetMax")}
                                        className={fieldClass}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="budget" className="font-semibold">
                                    Budget ($)
                                </Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    aria-invalid={!!errors.budget}
                                    {...register("budget")}
                                    className={fieldClass}
                                />
                                {getMessage(errors.budget) && (
                                    <p className="text-xs text-destructive">
                                        {getMessage(errors.budget)}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    <section className={cn(sectionClass, "space-y-4")}>
                        <h3 className={sectionTitleClass}>
                            <UserCheck className="size-4" />
                            Client Details
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="clientName" className="font-semibold">
                                Client Name
                            </Label>
                            <Input
                                id="clientName"
                                placeholder="e.g. Acme Corp"
                                {...register("clientName")}
                                className={fieldClass}
                            />
                            {getMessage(errors.clientName) && (
                                <p className="text-xs text-destructive">
                                    {getMessage(errors.clientName)}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="clientMobile" className="font-semibold">
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
                                    className={fieldClass}
                                />
                                {getMessage(errors.clientSocialLink) && (
                                    <p className="text-xs text-destructive">
                                        {getMessage(errors.clientSocialLink)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <section className={cn(sectionClass, "space-y-3")}>
                <h3 className={sectionTitleClass}>
                    <Users className="size-4" />
                    Assignees
                </h3>

                {isLoadingUsers ? (
                    <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                        <Loader2 className="size-4 animate-spin text-indigo-600" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                        No users are available to assign.
                    </div>
                ) : (
                    <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto pr-1">
                        {users.map((user) => {
                            const isSelected = selectedAssignees.includes(user._id);
 
                            return (
                                <button
                                    key={user._id}
                                    type="button"
                                    onClick={() => handleAssigneeToggle(user._id)}
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
                                        className="size-4 rounded border-border text-indigo-600 accent-indigo-600"
                                    />
                                    <Avatar className="size-7">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback className="bg-muted text-[10px] font-bold text-muted-foreground">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {user.name}
                                    </span>
                                    {(() => {
                                        const stats = assigneeStats[user._id] || { todo: 0, inProgress: 0 };
                                        return (
                                            <div className="flex items-center gap-1 shrink-0 ml-auto select-none">
                                                {stats.todo > 0 && (
                                                    <span 
                                                        title="To Do"
                                                        className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-extrabold text-slate-600 dark:text-slate-400 px-1 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
                                                    >
                                                        {stats.todo}
                                                    </span>
                                                )}
                                                {stats.inProgress > 0 && (
                                                    <span 
                                                        title="In Progress"
                                                        className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 px-1 border border-indigo-200/50 dark:border-indigo-800/30 hover:scale-105 transition-transform"
                                                    >
                                                        {stats.inProgress}
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

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="h-10"
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin text-white" />
                            Saving...
                        </>
                    ) : (
                        "Save Project"
                    )}
                </Button>
            </div>
        </form>
    );
}
