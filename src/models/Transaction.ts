import mongoose, { Schema, Document, Model } from "mongoose";
import {
    TransactionType,
    TransactionCategory,
    TransactionTypeUnion,
    TransactionCategoryUnion,
    ProductName,
    ProductNameUnion,
} from "@/types";

export interface ITransactionAccountDetails {
    providerName?: string;
    accountName?: string;
    accountNumber?: string;
    type?: string;
    branch?: string;
    routingNumber?: string;
}

export interface ITransaction extends Document {
    amount: number;
    type: TransactionTypeUnion;
    category: TransactionCategoryUnion;
    productName?: ProductNameUnion | string;
    productId?: mongoose.Types.ObjectId;
    description: string;
    date: Date;
    user?: mongoose.Types.ObjectId;
    externalEntity?: string;
    accountId?: string;
    accountUser?: mongoose.Types.ObjectId;
    accountDetails?: ITransactionAccountDetails;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
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
        productName: {
            type: String,
            trim: true,
            default: "",
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            index: true,
        },
        description: { type: String, required: true, maxlength: 500 },
        date: { type: Date, default: Date.now },
        user: { type: Schema.Types.ObjectId, ref: "User" },
        externalEntity: { type: String },
        accountId: { type: String, index: true },
        accountUser: { type: Schema.Types.ObjectId, ref: "User", index: true },
        accountDetails: {
            providerName: { type: String },
            accountName: { type: String },
            accountNumber: { type: String },
            type: { type: String },
            branch: { type: String },
            routingNumber: { type: String },
        },
    },
    {
        timestamps: true,
    },
);

// Delete the cached model in development to ensure schema updates (like new enums) are applied
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Transaction;
}

const Transaction: Model<ITransaction> =
    mongoose.models.Transaction ||
    mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
