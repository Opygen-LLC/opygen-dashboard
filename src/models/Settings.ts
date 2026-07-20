import mongoose, { Schema, Document } from "mongoose";

export interface ISocialLinks {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    x?: string;
}

export interface ISettings extends Document {
    key: string;
    companyName?: string;
    tagline?: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    socials: ISocialLinks;
    monthlyBudgetGoal: number;
    createdAt: Date;
    updatedAt: Date;
}

const SocialsSchema = new Schema<ISocialLinks>(
    {
        facebook:  { type: String, trim: true, default: "" },
        instagram: { type: String, trim: true, default: "" },
        linkedin:  { type: String, trim: true, default: "" },
        youtube:   { type: String, trim: true, default: "" },
        x:         { type: String, trim: true, default: "" },
    },
    { _id: false },
);

const SettingsSchema = new Schema<ISettings>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: "global",
        },
        companyName:       { type: String, trim: true, default: "" },
        tagline:           { type: String, trim: true, default: "" },
        description:       { type: String, trim: true, default: "" },
        email:             { type: String, trim: true, default: "" },
        phone:             { type: String, trim: true, default: "" },
        website:           { type: String, trim: true, default: "" },
        address:           { type: String, trim: true, default: "" },
        socials:           { type: SocialsSchema, default: () => ({}) },
        monthlyBudgetGoal: { type: Number, min: 0, default: 0 },
    },
    { timestamps: true },
);

export default mongoose.models.Settings ||
    mongoose.model<ISettings>("Settings", SettingsSchema);
