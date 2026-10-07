import React, { Suspense } from 'react';
import ProjectsDashboardView from '@/components/projects/ProjectsDashboardView';
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
    title: "Projects | Admin Dashboard | Opygen",
    description: "Manage client projects, milestones, budgets, and tasks.",
};

export default function AdminProjectsPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-28 w-full rounded-2xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            }
        >
            <ProjectsDashboardView />
        </Suspense>
    );
}

