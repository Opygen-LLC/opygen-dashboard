import React, { Suspense } from "react";
import UsersDashboardView from "@/components/users/UsersDashboardView";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersManagementPage() {
    return (
        <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>}>
            <UsersDashboardView />
        </Suspense>
    );
}

