import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const userId = session.user.id;

        // Fetch top 30 recent notification activity logs
        const notifications = await ActivityLog.find({})
            .populate("user", "name avatarUrl email")
            .populate("project", "title")
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        // Calculate unread count for current user
        const unreadCount = notifications.filter(
            (n: any) =>
                !n.readBy ||
                !n.readBy.some(
                    (id: any) => id.toString() === userId.toString()
                )
        ).length;

        // Format for frontend consumption
        const formatted = notifications.map((n: any) => ({
            id: n._id.toString(),
            type: n.type,
            message: n.message,
            targetUrl: n.targetUrl || (n.project ? `/admin-dashboard/projects` : undefined),
            createdAt: n.createdAt,
            isRead:
                n.readBy &&
                n.readBy.some((id: any) => id.toString() === userId.toString()),
            user: n.user
                ? {
                      id: n.user._id?.toString(),
                      name: n.user.name,
                      avatarUrl: n.user.avatarUrl,
                  }
                : null,
            projectTitle: n.project ? n.project.title : null,
        }));

        return NextResponse.json(
            {
                notifications: formatted,
                unreadCount,
            },
            {
                headers: {
                    "Cache-Control": "no-store, max-age=0, must-revalidate",
                },
            }
        );
    } catch (error: any) {
        console.error("Fetch notifications error:", error);
        return NextResponse.json(
            { error: "Server Error", details: error.message },
            { status: 500 }
        );
    }
}
