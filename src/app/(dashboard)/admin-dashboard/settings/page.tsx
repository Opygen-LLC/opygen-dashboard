import React, { Suspense } from "react";
import CompanySettingsView from "@/components/settings/CompanySettingsView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
    title: "Company Settings",
    description: "Manage your company profile, social links, monthly revenue goals, and products.",
};

export default function SettingsPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <Skeleton className="h-32 w-full rounded-3xl" />
                    <Skeleton className="h-12 w-96 rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            }
        >
            <CompanySettingsView />
        </Suspense>
    );
}

