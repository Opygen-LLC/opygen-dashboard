import dbConnect from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";
import mongoose from "mongoose";

interface LogParams {
    user: string | mongoose.Types.ObjectId;
    project?: string | mongoose.Types.ObjectId;
    type:
        | "comment"
        | "status_change"
        | "assignment_change"
        | "priority_change"
        | "details_change"
        | "client_added"
        | "payment_submitted"
        | "quote_accepted"
        | "milestone_completed"
        | "system_alert";
    message: string;
    targetUrl?: string;
}

export async function createActivityLog(params: LogParams) {
    try {
        await dbConnect();
        const log = new ActivityLog({
            user: params.user,
            project: params.project || undefined,
            type: params.type,
            message: params.message,
            targetUrl: params.targetUrl || undefined,
            readBy: [params.user], // Creator marks it read for themselves by default
        });
        await log.save();
        return log;
    } catch (error) {
        console.error("Failed to create activity log:", error);
        return null;
    }
}
