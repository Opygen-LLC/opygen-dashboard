import ClientDashboardView from "@/components/clients/ClientDashboardView";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Clients | OpyDash",
    description: "Manage and track client details in OpyDash",
};

export default function ClientsPage() {
    return <ClientDashboardView />;
}
