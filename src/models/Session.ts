import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;
    sessionToken: string;
    userAgent?: string;
    ipAddress?: string;
    createdAt: Date;
    lastActive: Date;
}

const SessionSchema = new Schema<ISession>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionToken: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
});

const Session: Model<ISession> =
    mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
