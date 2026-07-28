import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDemoWebsite extends Document {
    title: string;
    link: string;
    category: string;
    description?: string;
    thumbnailUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DemoWebsiteSchema: Schema<IDemoWebsite> = new Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        link: {
            type: String,
            required: [true, "Link is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        thumbnailUrl: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export const DemoWebsite: Model<IDemoWebsite> =
    mongoose.models.DemoWebsite ||
    mongoose.model<IDemoWebsite>("DemoWebsite", DemoWebsiteSchema);
