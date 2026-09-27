import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscriptionProjectTag extends Document {
    name: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionProjectTagSchema = new Schema<ISubscriptionProjectTag>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.SubscriptionProjectTag;
}

const SubscriptionProjectTag: Model<ISubscriptionProjectTag> =
    mongoose.models.SubscriptionProjectTag ||
    mongoose.model<ISubscriptionProjectTag>(
        "SubscriptionProjectTag",
        SubscriptionProjectTagSchema
    );

export default SubscriptionProjectTag;
