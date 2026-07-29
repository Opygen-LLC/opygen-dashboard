import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
    name: string;
    companyName?: string;
    number?: string;
    socialMediaLink?: string;
    country: string;
    minAmount: number;
    maxAmount: number;
    notes?: string;
    source: string;
    otherSource?: string;
    adName?: string;
    followupDate?: Date;
    meetingDate?: Date;
    status: string;
    priority?: "low" | "medium" | "high";
    assignedTo?: Schema.Types.ObjectId | string | any;
    lastUpdatedBy?: Schema.Types.ObjectId | string | any;
    createdAt: Date;
    updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        companyName: {
            type: String,
            trim: true,
        },
        number: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
        },
        socialMediaLink: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
        },
        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
        },
        minAmount: {
            type: Number,
            min: 0,
        },
        maxAmount: {
            type: Number,
            min: 0,
        },
        notes: {
            type: String,
        },
        source: {
            type: String,
            required: [true, "Source is required"],
        },
        otherSource: {
            type: String,
            trim: true,
        },
        adName: {
            type: String,
            trim: true,
        },
        followupDate: {
            type: Date,
        },
        meetingDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Follow-up", "Meeting Scheduled", "Blocked", "Declined"],
            default: "Pending",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low",
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        lastUpdatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
    },
    {
        timestamps: true,
    },
);

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Client;
}

export default mongoose.models.Client ||
    mongoose.model<IClient>("Client", ClientSchema);
