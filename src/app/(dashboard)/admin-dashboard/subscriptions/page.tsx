import { Metadata } from "next";
import { Suspense } from "react";
import SubscriptionsDashboardView from "@/components/subscriptions/SubscriptionsDashboardView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: "Subscriptions | Admin Dashboard | Opygen",
    description: "Manage global and project-specific SaaS licenses, renewals, and recurring infrastructure costs.",
};

export default function SubscriptionsPage() {
    return (
        <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>}>
            <SubscriptionsDashboardView />
        </Suspense>
    );
}

