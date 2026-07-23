import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
    project?: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
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
    readBy: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: false,
        index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        enum: [
            "comment",
            "status_change",
            "assignment_change",
            "priority_change",
            "details_change",
            "client_added",
            "payment_submitted",
            "quote_accepted",
            "milestone_completed",
            "system_alert",
        ],
        required: true,
    },
    message: { type: String, required: true },
    targetUrl: { type: String, trim: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    createdAt: { type: Date, default: Date.now },
});

// Clear model cache in dev to reflect schema changes
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.ActivityLog;
}

const ActivityLog: Model<IActivityLog> =
    mongoose.models.ActivityLog ||
    mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
