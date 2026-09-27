import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Subscription from "@/models/Subscription";
import SubscriptionProjectTag from "@/models/SubscriptionProjectTag";
import { subscriptionSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        const subscription = await Subscription.findById(id)
            .populate("createdBy", "name email avatarUrl");

        if (!subscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        return NextResponse.json(subscription);
    } catch (error: any) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch subscription" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const { id } = await params;
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

        const updateData: any = {
            ...data,
            projectName: finalProjectName,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : null,
        };

        const updatedSubscription = await Subscription.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate("createdBy", "name email avatarUrl");

        if (!updatedSubscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        return NextResponse.json(updatedSubscription);
    } catch (error: any) {
        console.error("Error updating subscription:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update subscription" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        const deletedSubscription = await Subscription.findByIdAndDelete(id);

        if (!deletedSubscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Subscription deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting subscription:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete subscription" },
            { status: 500 }
        );
    }
}
