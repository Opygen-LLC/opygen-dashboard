import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Subscription from "@/models/Subscription";
import Project from "@/models/Project";
import SubscriptionProjectTag from "@/models/SubscriptionProjectTag";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        await dbConnect();

        // 1. Distinct titles from the connected Project model
        const projectModelTitles: string[] = await Project.distinct("title");

        // 2. Distinct projectName from Subscription model
        const subscriptionProjectNames: string[] = await Subscription.distinct("projectName", {
            projectName: { $exists: true, $ne: "" },
        });

        // 3. Persistent SubscriptionProjectTag records
        const projectTags = await SubscriptionProjectTag.find({});

        const deletedSet = new Set<string>();
        const activeTagSet = new Set<string>();

        projectTags.forEach((tag) => {
            const name = tag.name?.trim();
            if (!name) return;
            if (tag.isDeleted) {
                deletedSet.add(name.toLowerCase());
            } else {
                activeTagSet.add(name);
            }
        });

        // Combine all distinct names, respecting deleted tags
        const projectSet = new Set<string>();

        // Add from Project model if not explicitly deleted
        projectModelTitles.forEach((t) => {
            if (t && typeof t === "string" && t.trim() !== "") {
                const trimmed = t.trim();
                if (!deletedSet.has(trimmed.toLowerCase())) {
                    projectSet.add(trimmed);
                }
            }
        });

        // Add from Subscriptions if not explicitly deleted
        subscriptionProjectNames.forEach((t) => {
            if (t && typeof t === "string" && t.trim() !== "") {
                const trimmed = t.trim();
                if (!deletedSet.has(trimmed.toLowerCase())) {
                    projectSet.add(trimmed);
                }
            }
        });

        // Add explicitly active tags
        activeTagSet.forEach((t) => {
            if (!deletedSet.has(t.toLowerCase())) {
                projectSet.add(t);
            }
        });

        const sortedProjects = Array.from(projectSet).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
        );

        return NextResponse.json(sortedProjects, {
            headers: {
                "Cache-Control": "no-store, max-age=0, must-revalidate",
            },
        });
    } catch (error: any) {
        console.error("Error fetching subscription projects:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch projects" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const body = await req.json();
        const name = body?.name;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return NextResponse.json(
                { error: "Valid project name is required" },
                { status: 400 }
            );
        }

        await dbConnect();
        const trimmed = name.trim();

        await SubscriptionProjectTag.findOneAndUpdate(
            { name: trimmed },
            { name: trimmed, isDeleted: false },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            message: `Project "${trimmed}" added successfully`,
            name: trimmed,
        });
    } catch (error: any) {
        console.error("Error adding subscription project:", error);
        return NextResponse.json(
            { error: error.message || "Failed to add project" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectName = searchParams.get("name");

        if (!projectName || projectName.trim() === "") {
            return NextResponse.json(
                { error: "Project name query parameter is required" },
                { status: 400 }
            );
        }

        await dbConnect();

        const target = projectName.trim();

        // 1. Mark tag as deleted so it never re-appears from Project model or historical cache
        await SubscriptionProjectTag.findOneAndUpdate(
            { name: target },
            { name: target, isDeleted: true },
            { upsert: true, new: true }
        );

        // 2. Clear projectName and project from matching subscriptions
        const result = await Subscription.updateMany(
            {
                $or: [
                    { projectName: target },
                    { projectName: { $regex: new RegExp(`^${target}$`, "i") } },
                ],
            },
            { $set: { projectName: "" } }
        );

        return NextResponse.json({
            message: `Project "${target}" removed successfully`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error: any) {
        console.error("Error deleting subscription project:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete project" },
            { status: 500 }
        );
    }
}
