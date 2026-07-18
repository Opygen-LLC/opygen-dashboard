"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Search,
    Plus,
    LayoutGrid,
    List as ListIcon,
    ArrowUpDown,
    Loader2,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import KanbanBoard from "@/components/projects/KanbanBoard";
import ProjectList from "@/components/projects/ProjectList";
import ProjectForm from "@/components/projects/ProjectForm";
import ProjectDetails from "@/components/projects/ProjectDetails";
import { ProjectInput } from "@/lib/validations";
import { ProjectStatus, ProjectStatusType } from "@/types";
import { DashboardProject, ProjectUser } from "@/types/project";

export default function ProjectsDashboardView() {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [defaultCreateStatus, setDefaultCreateStatus] =
        useState<ProjectStatus>(ProjectStatus.TODO);

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        null,
    );
    const [deleteProjectTarget, setDeleteProjectTarget] = useState<{ id: string; name: string } | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [priority, setPriority] = useState("all");
    const [assignee, setAssignee] = useState("all");
    const [sortBy, setSortBy] = useState("updatedAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        setCurrentPage(1);
    }, [search, status, priority, assignee, sortBy, sortOrder]);

    const { data: users } = useQuery<ProjectUser[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
    });

    const getFilterParams = () => {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search);
        if (status !== "all") params.append("status", status);
        if (priority !== "all") params.append("priority", priority);
        if (assignee !== "all") params.append("assignee", assignee);
        params.append("sortBy", sortBy);
        params.append("sortOrder", sortOrder);
        return params.toString();
    };

    const { data: projects = [], isLoading } = useQuery<DashboardProject[]>({
        queryKey: [
            "projects",
            search,
            status,
            priority,
            assignee,
            sortBy,
            sortOrder,
        ],
        queryFn: async () => {
            const params = getFilterParams();
            const res = await fetch(`/api/projects?${params}`);
            if (!res.ok) throw new Error("Failed to fetch projects");
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newProject: ProjectInput) => {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProject),
            });
            if (!res.ok) throw new Error("Failed to create project");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            setIsCreateOpen(false);
            toast.success("Project created successfully");
        },
        onError: () => {
            toast.error("Failed to create project");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/projects/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete project");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            setDeleteProjectTarget(null);
            setDeleteConfirmText("");
            toast.success("Project deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete project");
        },
    });

    const handleAddProject = (statusValue: ProjectStatusType) => {
        setDefaultCreateStatus(statusValue as ProjectStatus);
        setIsCreateOpen(true);
    };

    const handleEditClick = (
        project: DashboardProject,
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        setSelectedProjectId(project._id);
    };

    return (
        <div className="space-y-6 h-full flex flex-col overflow-hidden relative">
            {/* Title + Action Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Projects
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create, update, and manage Opygen team projects.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => handleAddProject("todo")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 h-10 shrink-0 gap-1.5 cursor-pointer"
                    >
                        <Plus className="h-4.5 w-4.5" />
                        <span>Create Project</span>
                    </Button>
                </div>
            </div>

            {/* Redesigned Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border shadow-xs">
                <div className="relative sm:col-span-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title or description..."
                        className="pl-9 bg-background/50 border-border focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-foreground h-10 transition-all"
                    />
                </div>

                <div>
                    <Select
                        value={status}
                        onValueChange={(val) => setStatus(val || "all")}
                    >
                        <SelectTrigger className="bg-background/50 border-border text-foreground h-10 cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="potential">Potential</SelectItem>
                            <SelectItem value="future">Future</SelectItem>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">
                                In Progress
                            </SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Select
                        value={priority}
                        onValueChange={(val) => setPriority(val || "all")}
                    >
                        <SelectTrigger className="bg-background/50 border-border text-foreground h-10 cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Select
                        value={assignee}
                        onValueChange={(val) => setAssignee(val || "all")}
                    >
                        <SelectTrigger className="bg-background/50 border-border text-foreground h-10 cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="all">All Assignees</SelectItem>
                            {users?.map((user) => (
                                <SelectItem key={user._id} value={user._id}>
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Select
                        value={sortBy}
                        onValueChange={(val) => setSortBy(val || "updatedAt")}
                    >
                        <SelectTrigger className="bg-background/50 border-border text-foreground h-10 flex-1 cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="updatedAt">Recently Updated</SelectItem>
                            <SelectItem value="dueDate">Due Date</SelectItem>
                            <SelectItem value="createdAt">Date Created</SelectItem>
                            <SelectItem value="title">Alphabetical</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            setSortOrder((prev) =>
                                prev === "asc" ? "desc" : "asc",
                            )
                        }
                        className="h-10 w-10 border border-border bg-background/50 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer hover:scale-[1.05] active:scale-[0.95] transition-all shrink-0"
                    >
                        <ArrowUpDown className="h-4.5 w-4.5" />
                    </Button>
                </div>
            </div>

            {/* Projects Display Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-accent/5">
                        <FolderOpen className="h-12 w-12 text-muted-foreground/60 mb-4" />
                        <h3 className="text-base font-bold text-muted-foreground">
                            No projects found
                        </h3>
                        <p className="text-sm text-muted-foreground/80 mt-1">
                            Try relaxing your filters or create a new project.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearch("");
                                setStatus("all");
                                setPriority("all");
                                setAssignee("all");
                            }}
                            className="mt-4 border-border text-muted-foreground hover:text-foreground hover:bg-accent h-10 cursor-pointer"
                        >
                            Reset Filters
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ProjectList
                            projects={projects.slice(
                                (currentPage - 1) * 10,
                                currentPage * 10
                            )}
                            onProjectClick={setSelectedProjectId}
                            onEditClick={handleEditClick}
                            onDeleteClick={(id, name) => setDeleteProjectTarget({ id, name })}
                        />

                        {projects.length > 10 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-4 mt-2">
                                <p className="text-xs text-muted-foreground text-center sm:text-left">
                                    Showing <span className="font-semibold text-foreground">{(currentPage - 1) * 10 + 1}</span> to{" "}
                                    <span className="font-semibold text-foreground">{Math.min(currentPage * 10, projects.length)}</span> of{" "}
                                    <span className="font-semibold text-foreground">{projects.length}</span> projects
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                        className="h-8 w-8 cursor-pointer disabled:opacity-50"
                                        title="Previous Page"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.ceil(projects.length / 10) }).map((_, i) => {
                                            const pageNum = i + 1;
                                            const totalPages = Math.ceil(projects.length / 10);
                                            if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(currentPage - pageNum) > 1) {
                                                if (pageNum === 2 && currentPage > 3) {
                                                    return <span key="ellipsis-start" className="text-xs text-muted-foreground px-1">...</span>;
                                                }
                                                if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                                                    return <span key="ellipsis-end" className="text-xs text-muted-foreground px-1">...</span>;
                                                }
                                                return null;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={cn(
                                                        "h-8 w-8 text-xs cursor-pointer p-0 transition-all font-semibold",
                                                        currentPage === pageNum ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs" : "hover:bg-accent"
                                                    )}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={currentPage === Math.ceil(projects.length / 10)}
                                        onClick={() => setCurrentPage((p) => Math.min(p + 1, Math.ceil(projects.length / 10)))}
                                        className="h-8 w-8 cursor-pointer disabled:opacity-50"
                                        title="Next Page"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Project Creation Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-card border-border text-foreground max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Scaffold a new project card for Opygen. Fill in the
                            fields below.
                        </DialogDescription>
                    </DialogHeader>
                    <ProjectForm
                        initialData={{ status: defaultCreateStatus }}
                        onSubmit={(data) => createMutation.mutate(data)}
                        isLoading={createMutation.isPending}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Slide-out Project Details Panel */}
            <AnimatePresence>
                {selectedProjectId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProjectId(null)}
                            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 200,
                            }}
                            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg"
                        >
                            <ProjectDetails
                                projectId={selectedProjectId}
                                onClose={() => setSelectedProjectId(null)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Dialog overlay */}
            <AnimatePresence>
                {deleteProjectTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setDeleteProjectTarget(null); setDeleteConfirmText(""); }}
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
                            <h3 className="text-lg font-bold text-foreground">
                                Delete Project
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-normal">
                                Are you sure you want to permanently delete the project <strong className="text-foreground">"{deleteProjectTarget.name}"</strong>? This action is irreversible.
                            </p>
                            
                            <div className="mt-4 space-y-2">
                                <Label htmlFor="confirmDeleteInput" className="text-xs font-semibold text-muted-foreground">
                                    Type <span className="font-bold text-foreground select-all">DELETE</span> to confirm:
                                </Label>
                                <Input
                                    id="confirmDeleteInput"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="bg-background border-border text-foreground focus-visible:ring-1 focus-visible:ring-red-500 focus-visible:border-red-500 h-9 text-sm"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="ghost"
                                    onClick={() => { setDeleteProjectTarget(null); setDeleteConfirmText(""); }}
                                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground h-10 cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => deleteMutation.mutate(deleteProjectTarget.id)}
                                    disabled={deleteMutation.isPending || deleteConfirmText !== "DELETE"}
                                    className="bg-red-700 hover:bg-red-800 text-white dark:text-destructive-foreground font-medium shadow-md shadow-destructive/10 h-10 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteMutation.isPending && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                                    Delete
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
