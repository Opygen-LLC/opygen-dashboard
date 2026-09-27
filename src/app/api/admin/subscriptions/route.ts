import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Subscription from "@/models/Subscription";
import Project from "@/models/Project";
import SubscriptionProjectTag from "@/models/SubscriptionProjectTag";
import { subscriptionSchema } from "@/lib/validations";
import { createActivityLog } from "@/lib/activityLogger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get("search");
        const type = searchParams.get("type");
        const projectParam = searchParams.get("project");
        const status = searchParams.get("status");
        const billingCycle = searchParams.get("billingCycle");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        // Query all for stats calculation
        const allItems = await Subscription.find({});

        const now = new Date();
        const next14Days = new Date();
        next14Days.setDate(now.getDate() + 14);

        let activeCount = 0;
        let expiringSoonCount = 0;
        let expiredCount = 0;
        let globalCount = 0;
        let projectCount = 0;
        let totalMonthlySpend = 0;
        let totalAnnualSpend = 0;

        allItems.forEach((sub) => {
            const isCurrentlyActive = sub.status === "active";
            if (isCurrentlyActive) {
                activeCount++;
                // Check if expiring soon
                if (sub.endDate) {
                    const end = new Date(sub.endDate);
                    if (end < now) {
                        expiredCount++;
                    } else if (end <= next14Days) {
                        expiringSoonCount++;
                    }
                }

                // Normalized monthly spend calculation
                let monthlyEquivalent = 0;
                switch (sub.billingCycle) {
                    case "monthly":
                        monthlyEquivalent = sub.price;
                        break;
                    case "yearly":
                        monthlyEquivalent = sub.price / 12;
                        break;
                    case "quarterly":
                        monthlyEquivalent = sub.price / 3;
                        break;
                    case "weekly":
                        monthlyEquivalent = sub.price * 4.33;
                        break;
                    case "one-time":
                        monthlyEquivalent = 0;
                        break;
                    default:
                        monthlyEquivalent = sub.price;
                }
                totalMonthlySpend += monthlyEquivalent;
                totalAnnualSpend += monthlyEquivalent * 12;
            }

            if (sub.type === "global") {
                globalCount++;
            } else if (sub.type === "project") {
                projectCount++;
            }
        });

        // Filter for specific view query
        const query: any = {};

        if (type && type !== "all" && type !== "All") {
            query.type = type.toLowerCase();
        }

        if (projectParam && projectParam !== "all" && projectParam !== "All") {
            const cleanProject = projectParam.trim();
            const projectCondition = [
                { projectName: cleanProject },
                { projectName: { $regex: new RegExp(`^${cleanProject}$`, "i") } },
            ];

            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: projectCondition }];
                delete query.$or;
            } else {
                query.$or = projectCondition;
            }
        }

        if (status && status !== "all" && status !== "All") {
            if (status === "expiring_soon") {
                const expiringSoonCondition = [
                    { status: "expiring_soon" },
                    {
                        status: "active",
                        endDate: { $gte: now, $lte: next14Days },
                    },
                ];

                if (query.$or) {
                    query.$and = [{ $or: query.$or }, { $or: expiringSoonCondition }];
                    delete query.$or;
                } else {
                    query.$or = expiringSoonCondition;
                }
            } else {
                query.status = status.toLowerCase();
            }
        }

        if (billingCycle && billingCycle !== "all" && billingCycle !== "All") {
            query.billingCycle = billingCycle.toLowerCase();
        }

        if (search) {
            const cleanSearch = search.trim();
            const regex = new RegExp(cleanSearch, "i");
            const searchOr: any[] = [
                { name: regex },
                { provider: regex },
                { projectName: regex },
                { notes: regex },
            ];

            if (query.$and) {
                query.$and.push({ $or: searchOr });
            } else if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchOr }];
                delete query.$or;
            } else {
                query.$or = searchOr;
            }
        }

        // Sort configuration
        const sortOptions: any = {};
        if (sortBy === "price") {
            sortOptions.price = sortOrder === "asc" ? 1 : -1;
        } else if (sortBy === "endDate") {
            sortOptions.endDate = sortOrder === "asc" ? 1 : -1;
        } else if (sortBy === "startDate") {
            sortOptions.startDate = sortOrder === "asc" ? 1 : -1;
        } else if (sortBy === "name") {
            sortOptions.name = sortOrder === "asc" ? 1 : -1;
        } else {
            sortOptions.createdAt = sortOrder === "asc" ? 1 : -1;
        }

        const subscriptions = await Subscription.find(query)
            .populate("createdBy", "name email avatarUrl")
            .sort(sortOptions);

        return NextResponse.json(
            {
                subscriptions,
                stats: {
                    total: allItems.length,
                    activeCount,
                    expiringSoonCount,
                    expiredCount,
                    globalCount,
                    projectCount,
                    totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
                    totalAnnualSpend: Math.round(totalAnnualSpend * 100) / 100,
                },
            },
            {
                headers: {
                    "Cache-Control": "no-store, max-age=0, must-revalidate",
                },
            }
        );
    } catch (error: any) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch subscriptions" },
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
        const parsed = subscriptionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation error", details: parsed.error.format() },
                { status: 400 }
            );
        }

        await dbConnect();

        const data = parsed.data;

        let finalProjectName = data.projectName?.trim() || "";

        if (data.type === "project") {
            if (finalProjectName) {
                // Ensure persistent project tag is active so it shows forever until deleted
                await SubscriptionProjectTag.findOneAndUpdate(
                    { name: finalProjectName },
                    { name: finalProjectName, isDeleted: false },
                    { upsert: true }
                );
            }
        } else {
            finalProjectName = "";
        }

        // Default start date to now if not provided
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = data.endDate ? new Date(data.endDate) : null;

        const newSubscription = await Subscription.create({
            ...data,
            projectName: finalProjectName,
            startDate,
            endDate,
            createdBy: session.user.id,
        });

        const populated = await Subscription.findById(newSubscription._id)
            .populate("createdBy", "name email avatarUrl");

        return NextResponse.json(populated, { status: 201 });
    } catch (error: any) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create subscription" },
            { status: 500 }
        );
    }
}
