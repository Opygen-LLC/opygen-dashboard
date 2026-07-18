import mongoose, { Schema, Document, Model } from "mongoose";
import {
    ProjectStatus,
    ProjectStatusType,
    ProjectPriority,
    ProjectPriorityType,
} from "@/types";

export interface IPayment {
    _id?: string;
    type: "advance" | "frontend" | "backend" | "ui" | "other" | "custom";
    customLabel?: string;
    amount: number;
    status: "pending" | "paid";
    paymentDate?: Date | null;
    receiptUrl?: string | null;
}

export interface IProject extends Document {
    title: string;
    description?: string;
    status: ProjectStatusType;
    priority: ProjectPriorityType;
    budget?: number;
    budgetMin?: number | null;
    budgetMax?: number | null;
    startDate?: Date | null;
    clientName: string;
    clientMobile?: string | null;
    clientSocialLink?: string | null;
    assignees: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    dueDate?: Date | null;
    payments: IPayment[];
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        type: {
            type: String,
            enum: ["advance", "frontend", "backend", "ui", "other", "custom"],
            required: true,
        },
        customLabel: { type: String, trim: true },
        amount: { type: Number, required: true, default: 0 },
        status: {
            type: String,
            enum: ["pending", "paid"],
            default: "pending",
        },
        paymentDate: { type: Date },
        receiptUrl: { type: String, trim: true },
    },
    {
        timestamps: true,
    },
);

const ProjectSchema = new Schema<IProject>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        status: {
            type: String,
            enum: Object.values(ProjectStatus),
            default: ProjectStatus.TODO,
        },
        priority: {
            type: String,
            enum: Object.values(ProjectPriority),
            default: ProjectPriority.MEDIUM,
        },
        budget: { type: Number, default: 0 },
        budgetMin: { type: Number },
        budgetMax: { type: Number },
        startDate: { type: Date },
        clientName: { type: String, trim: true, default: "" },
        clientMobile: { type: String, trim: true, default: "" },
        clientSocialLink: { type: String, trim: true, default: "" },
        assignees: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        dueDate: { type: Date },
        payments: { type: [PaymentSchema], default: [] },
    },
    {
        timestamps: true,
    },
);

const Project: Model<IProject> =
    mongoose.models.Project ||
    mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
