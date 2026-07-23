import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const userId = new mongoose.Types.ObjectId(session.user.id);
        const body = await req.json().catch(() => ({}));

        const { notificationId, markAll } = body;

        if (markAll) {
            // Add user ID to readBy for all notifications where user is not in readBy
            await ActivityLog.updateMany(
                { readBy: { $ne: userId } },
                { $addToSet: { readBy: userId } }
            );
        } else if (notificationId) {
            await ActivityLog.findByIdAndUpdate(notificationId, {
                $addToSet: { readBy: userId },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Mark notification read error:", error);
        return NextResponse.json(
            { error: "Server Error", details: error.message },
            { status: 500 }
        );
    }
}
