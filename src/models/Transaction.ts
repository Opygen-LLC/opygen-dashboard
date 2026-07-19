import mongoose, { Schema, Document, Model } from "mongoose";
import { TransactionType, TransactionCategory, TransactionTypeUnion, TransactionCategoryUnion } from "@/types";

export interface ITransaction extends Document {
    amount: number;
    type: TransactionTypeUnion;
    category: TransactionCategoryUnion;
    description: string;
    date: Date;
    user?: mongoose.Types.ObjectId;
    externalEntity?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
    amount: { type: Number, required: true, min: 0 },
    type: {
        type: String,
        enum: Object.values(TransactionType),
        required: true,
    },
    category: {
        type: String,
        enum: Object.values(TransactionCategory),
        required: true,
    },
    description: { type: String, required: true, maxlength: 500 },
    date: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    externalEntity: { type: String },
}, {
    timestamps: true
});

// Delete the cached model in development to ensure schema updates (like new enums) are applied
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Transaction;
}

const Transaction: Model<ITransaction> =
    mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
