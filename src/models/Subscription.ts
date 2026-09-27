import mongoose, { Schema, Document, Model } from "mongoose";
import {
    SubscriptionType,
    SubscriptionStatus,
    SubscriptionBillingCycle,
} from "@/types";

export interface ISubscription extends Document {
    name: string;
    type: SubscriptionType;
    projectName?: string;
    startDate: Date;
    endDate?: Date | null;
    price: number;
    currency?: string;
    billingCycle: SubscriptionBillingCycle;
    status: SubscriptionStatus;
    autoRenew: boolean;
    provider?: string;
    paymentMethod?: string;
    notes?: string;
    createdBy?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
    {
        name: {
            type: String,
            required: [true, "Subscription name is required"],
            trim: true,
        },
        type: {
            type: String,
            enum: ["global", "project"],
            required: [true, "Subscription type is required"],
            default: "global",
            index: true,
        },
        projectName: {
            type: String,
            trim: true,
            default: "",
            index: true,
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
            default: Date.now,
        },
        endDate: {
            type: Date,
            default: null,
            index: true,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price must be non-negative"],
            default: 0,
        },
        currency: {
            type: String,
            default: "$",
            trim: true,
        },
        billingCycle: {
            type: String,
            enum: ["monthly", "yearly", "quarterly", "weekly", "one-time", "custom"],
            default: "monthly",
        },
        status: {
            type: String,
            enum: ["active", "expiring_soon", "expired", "cancelled", "paused"],
            default: "active",
            index: true,
        },
        autoRenew: {
            type: Boolean,
            default: false,
        },
        provider: {
            type: String,
            trim: true,
            default: "",
        },
        paymentMethod: {
            type: String,
            trim: true,
            default: "",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Clear model cache in dev to reflect schema changes
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Subscription;
}

const Subscription: Model<ISubscription> =
    mongoose.models.Subscription ||
    mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
