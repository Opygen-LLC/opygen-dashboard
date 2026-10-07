import React, { Suspense } from "react";
import ClientDashboardView from "@/components/clients/ClientDashboardView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
    title: "Clients | Admin Dashboard | Opygen",
    description: "Manage client leads, pipeline, and follow-ups.",
};

export default function ClientsPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            }
        >
            <ClientDashboardView />
        </Suspense>
    );
}

