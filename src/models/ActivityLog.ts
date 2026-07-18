import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
    project: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    type:
        | "comment"
        | "status_change"
        | "assignment_change"
        | "priority_change"
        | "details_change";
    message: string;
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
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
        ],
        required: true,
    },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const ActivityLog: Model<IActivityLog> =
    mongoose.models.ActivityLog ||
    mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
