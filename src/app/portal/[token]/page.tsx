import React from "react";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { ClientPortalView } from "@/components/portal/ClientPortalView";
import { PortalNotFound } from "@/components/portal/PortalNotFound";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientPortalPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const rawId = (await params)?.token || "";
    const id = decodeURIComponent(rawId).trim();

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return <PortalNotFound />;
    }

    await dbConnect();

    let projectDoc = await Project.findById(id).populate(
        "assignees",
        "name avatarUrl role email",
    );

    if (!projectDoc) {
        return <PortalNotFound />;
    }

    const project = JSON.parse(JSON.stringify(projectDoc));

    return <ClientPortalView project={project} />;
}
