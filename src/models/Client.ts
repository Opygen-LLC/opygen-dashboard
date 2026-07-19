import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
    name: string;
    number?: string;
    socialMediaLink?: string;
    country: string;
    minAmount: number;
    maxAmount: number;
    notes?: string;
    source: string;
    otherSource?: string;
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
        number: {
            type: String,
            trim: true,
        },
        socialMediaLink: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
        },
        minAmount: {
            type: Number,
            required: [true, "Minimum amount is required"],
            min: 0,
        },
        maxAmount: {
            type: Number,
            required: [true, "Maximum amount is required"],
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
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Client ||
    mongoose.model<IClient>("Client", ClientSchema);
