import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { subDays, format, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Client from "@/models/Client";
import Quote from "@/models/Quote";
import { DemoWebsite } from "@/models/DemoWebsite";
import { TransactionCategory, TransactionType } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "all";
        
        const now = new Date();
        let startDate: Date | null = null;
        
        if (range === "7d") {
            startDate = subDays(now, 7);
        } else if (range === "30d") {
            startDate = subDays(now, 30);
        } else if (range === "ytd") {
            startDate = startOfYear(now);
        }

        const projectFilter = startDate ? { createdAt: { $gte: startDate } } : {};
        const projects = await Project.find(projectFilter);
        const users = await User.find({}, "name avatarUrl accounts role");

        const totalProjects = projects.length;
        const inProgress = projects.filter(
            (p) => p.status === "in_progress",
        ).length;
        const completed = projects.filter(
            (p) => p.status === "completed",
        ).length;
        const overdue = projects.filter(
            (p) =>
                p.status !== "completed" &&
                p.dueDate &&
                new Date(p.dueDate) < now,
        ).length;

        let totalBudget = 0;
        let totalRevenueReceived = 0;
        let totalRevenuePending = 0;

        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

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
                    if (pay.status === "pending") {
                        totalRevenuePending += Number(pay.amount || 0);
                    } else if (pay.status === "paid") {
                        const pd = pay.paymentDate ? new Date(pay.paymentDate) : null;
                        const isWithinRange = !startDate || (pd && pd >= startDate);
                        if (isWithinRange) {
                            totalRevenueReceived += Number(pay.amount || 0);
                        }
                    }
                });
            }
        });

        // 1. Finance & Treasury Aggregations
        const accountsList: any[] = [];
        let totalLiquidityBdt = 0;
        users.forEach((u) => {
            if (u.accounts && Array.isArray(u.accounts)) {
                u.accounts.forEach((acc: any) => {
                    const balBdt = Number(acc.balanceInBdt ?? acc.balance ?? 0);
                    totalLiquidityBdt += balBdt;
                    accountsList.push({
                        _id: String(acc._id || Math.random()),
                        providerName: acc.providerName || "Bank",
                        accountName: acc.accountName || "",
                        accountNumber: acc.accountNumber || "",
                        type: acc.type || "bank",
                        balanceInBdt: balBdt,
                        userName: u.name,
                    });
                });
            }
        });

        // Current month transactions (income and expense)
        const currentMonthTxs = await Transaction.find({
            date: { $gte: monthStart, $lte: monthEnd },
        }).lean();

        let monthlyIncomeBdt = 0;
        let monthlyExpenseBdt = 0;
        for (const tx of currentMonthTxs) {
            // Transfers between accounts are internal reallocations, NOT revenue/income or operational expenses
            if (tx.category === TransactionCategory.TRANSFER) {
                continue;
            }
            const amt = Number(tx.amount || 0);
            if (tx.type === TransactionType.INCOME) {
                monthlyIncomeBdt += amt;
            } else if (tx.type === TransactionType.EXPENSE) {
                monthlyExpenseBdt += amt;
            }
        }
        const monthlyNetBdt = monthlyIncomeBdt - monthlyExpenseBdt;

        // Keep monthlyCollected and monthlyCollectedBdt for MonthlyBudgetBar
        const monthlyCollected = monthlyIncomeBdt;
        const monthlyCollectedBdt = monthlyIncomeBdt;

        // Recent 5 transactions
        const recentTransactions = await Transaction.find()
            .sort({ date: -1, createdAt: -1 })
            .limit(5)
            .lean();

        // 2. Client CRM Pipeline
        const clients = await Client.find().lean();
        const totalClients = clients.length;
        const confirmedClients = clients.filter((c: any) => c.status === "Confirmed").length;
        const activePipelineClients = clients.filter((c: any) => !["Lost", "Cancelled", "Confirmed"].includes(c.status));
        const pipelineDealValueMin = activePipelineClients.reduce((sum: number, c: any) => sum + Number(c.minAmount || 0), 0);
        const pipelineDealValueMax = activePipelineClients.reduce((sum: number, c: any) => sum + Number(c.maxAmount || c.minAmount || 0), 0);

        const clientStatusCounts: Record<string, number> = {};
        clients.forEach((c: any) => {
            if (c.status) {
                clientStatusCounts[c.status] = (clientStatusCounts[c.status] || 0) + 1;
            }
        });

        // 3. Quotes / Proposals
        const totalQuotes = await Quote.countDocuments();
        const recentQuotes = await Quote.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .select("quoteNumber projectName clientName projectPrice currency createdAt")
            .lean();

        // 4. Demo Websites
        const totalDemoWebsites = await DemoWebsite.countDocuments();

        // 5. Active In-flight Projects
        const activeProjects = await Project.find({
            status: { $in: ["in_progress", "in_review", "todo"] },
        })
            .sort({ updatedAt: -1 })
            .limit(4)
            .populate("assignees", "name avatarUrl")
            .lean();

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
                    monthlyCollected,
                    monthlyCollectedBdt,
                    totalLiquidityBdt,
                    monthlyIncomeBdt,
                    monthlyExpenseBdt,
                    monthlyNetBdt,
                    totalClients,
                    confirmedClients,
                    pipelineDealValueMin,
                    pipelineDealValueMax,
                    totalQuotes,
                    totalDemoWebsites,
                },
                statusBreakdown,
                workload,
                completionTrend: trendData,
                accountsSummary: accountsList.sort((a, b) => b.balanceInBdt - a.balanceInBdt).slice(0, 6),
                recentTransactions: recentTransactions.map((tx: any) => ({
                    _id: String(tx._id),
                    type: tx.type,
                    category: tx.category,
                    amount: Number(tx.amount || 0),
                    description: tx.description || tx.title || "",
                    date: tx.date,
                    accountName: tx.accountName || "",
                })),
                activeProjects: activeProjects.map((p: any) => {
                    const totalPayments = (p.payments || []).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0);
                    const paidPayments = (p.payments || []).filter((pay: any) => pay.status === "paid").reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0);
                    return {
                        _id: String(p._id),
                        title: p.title,
                        clientName: p.clientName || "",
                        status: p.status,
                        priority: p.priority,
                        budget: p.budget || totalPayments,
                        paidPayments,
                        dueDate: p.dueDate,
                        assignees: p.assignees || [],
                        paymentsCount: (p.payments || []).length,
                        progressPercent: totalPayments > 0 ? Math.min(100, Math.round((paidPayments / totalPayments) * 100)) : 0,
                    };
                }),
                recentQuotes: recentQuotes.map((q: any) => ({
                    _id: String(q._id),
                    quoteNumber: q.quoteNumber,
                    projectName: q.projectName,
                    clientName: q.clientName,
                    projectPrice: q.projectPrice,
                    currency: q.currency || "BDT",
                    createdAt: q.createdAt,
                })),
                clientStatusCounts,
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
