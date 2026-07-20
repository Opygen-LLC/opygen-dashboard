import React from "react";
import CompanySettingsView from "@/components/settings/CompanySettingsView";

export const metadata = {
    title: "Company Settings | OpyDash",
    description: "Manage your company profile, social links, and monthly revenue goals.",
};

export default function SettingsPage() {
    return <CompanySettingsView />;
}
