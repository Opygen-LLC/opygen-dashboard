import { Metadata } from "next";
import SubscriptionsDashboardView from "@/components/subscriptions/SubscriptionsDashboardView";

export const metadata: Metadata = {
    title: "Subscriptions | Admin Dashboard | Opygen",
    description: "Manage global and project-specific SaaS licenses, renewals, and recurring infrastructure costs.",
};

export default function SubscriptionsPage() {
    return <SubscriptionsDashboardView />;
}
