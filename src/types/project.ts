import { ProjectPriorityType, ProjectStatusType } from "@/types";

export type ProjectUser = {
    _id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
};

export type DashboardProject = {
    _id: string;
    title: string;
    description?: string;
    status: ProjectStatusType;
    priority: ProjectPriorityType;
    budget?: number | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    startDate?: string | Date | null;
    dueDate?: string | Date | null;
    assignees: ProjectUser[];
    createdBy?: ProjectUser;
};
