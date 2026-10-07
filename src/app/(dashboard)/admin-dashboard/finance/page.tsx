import React, { Suspense } from "react";
import FinanceDashboardView from "@/components/finance/FinanceDashboardView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
    title: "Finance | Admin Dashboard | Opygen",
    description: "Financial overview, revenue, expenses, and transaction logs.",
};

export default function FinanceDashboard() {
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
            <FinanceDashboardView />
        </Suspense>
    );
}

