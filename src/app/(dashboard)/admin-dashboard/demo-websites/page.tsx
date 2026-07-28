import React from "react";
import { Metadata } from "next";
import DemoWebsitesView from "@/components/demo-websites/DemoWebsitesView";

export const metadata: Metadata = {
    title: "Demo Websites | Opygen Admin",
    description: "Manage showcase demo websites and web applications",
};

export default function DemoWebsitesPage() {
    return <DemoWebsitesView />;
}
