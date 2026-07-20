import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { subDays, format } from "date-fns";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();

        const projects = await Project.find({});
        const users = await User.find({}, "name avatarUrl");

        const totalProjects = projects.length;
        const inProgress = projects.filter(
            (p) => p.status === "in_progress",
        ).length;
        const completed = projects.filter(
            (p) => p.status === "completed",
        ).length;
        const now = new Date();
        const overdue = projects.filter(
            (p) =>
                p.status !== "completed" &&
                p.dueDate &&
                new Date(p.dueDate) < now,
        ).length;

        let totalBudget = 0;
        let totalRevenueReceived = 0;
        let totalRevenuePending = 0;

        projects.forEach((p) => {
            const activeStatuses = [
                "todo",
                "in_progress",
                "in_review",
                "completed",
                "on_hold",
            ];
            if (activeStatuses.includes(p.status)) {
                totalBudget += Number(p.budget || 0);
            }

            if (p.payments) {
                p.payments.forEach((pay: any) => {
                    if (pay.status === "paid") {
                        totalRevenueReceived += Number(pay.amount || 0);
                    } else if (pay.status === "pending") {
                        totalRevenuePending += Number(pay.amount || 0);
                    }
                });
            }
        });

        // Status breakdown (Pie Chart data)
        const statusLabels: Record<string, string> = {
            potential: "Potential",
            future: "Future",
            todo: "To Do",
            in_progress: "In Progress",
            in_review: "In Review",
            completed: "Completed",
            on_hold: "On Hold",
        };

        const statusCounts: Record<string, number> = {
            potential: 0,
            future: 0,
            todo: 0,
            in_progress: 0,
            in_review: 0,
            completed: 0,
            on_hold: 0,
        };

        projects.forEach((p) => {
            if (statusCounts[p.status] !== undefined) {
                statusCounts[p.status]++;
            }
        });

        const statusBreakdown = Object.keys(statusCounts).map((key) => ({
            name: statusLabels[key],
            value: statusCounts[key],
            key,
        }));

        // Workload per co-founder (Bar Chart data)
        const workload = users.map((user) => {
            const count = projects.filter((p) =>
                p.assignees.some((id) => id.toString() === user._id.toString()),
            ).length;
            return {
                name: user.name,
                projects: count,
                avatarUrl: user.avatarUrl,
            };
        });

        // Completion Trend over last 30 days (Line Chart data)
        const completionTrend: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const dateStr = format(subDays(now, i), "MMM dd");
            completionTrend[dateStr] = 0;
        }

        projects.forEach((p) => {
            if (p.status === "completed") {
                const completedDate = new Date(p.updatedAt);
                const diffInDays = Math.floor(
                    (now.getTime() - completedDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                );
                if (diffInDays >= 0 && diffInDays < 30) {
                    const dateStr = format(completedDate, "MMM dd");
                    if (completionTrend[dateStr] !== undefined) {
                        completionTrend[dateStr]++;
                    }
                }
            }
        });

        // Convert trend to ordered array
        const trendData = Object.keys(completionTrend).map((date) => ({
            date,
            completed: completionTrend[date],
        }));

        return NextResponse.json(
            {
                summary: {
                    totalProjects,
                    inProgress,
                    completed,
                    overdue,
                    totalBudget,
                    totalRevenueReceived,
                    totalRevenuePending,
                },
                statusBreakdown,
                workload,
                completionTrend: trendData,
            },
            {
                headers: {
                    "Cache-Control": "no-store, max-age=0, must-revalidate",
                },
            },
        );
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Server Error" },
            { status: 500 },
        );
    }
}
