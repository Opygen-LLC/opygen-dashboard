import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStatement extends Document {
    user: mongoose.Types.ObjectId;
    transaction?: mongoose.Types.ObjectId;
    amount: number;
    type: "+" | "-";
    category: string;
    description: string;
    date: Date;
    createdAt: Date;
}

const StatementSchema = new Schema<IStatement>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    transaction: {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ["+", "-"],
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

function signedAmount(amount: number, type: "+" | "-") {
    return type === "+" ? Number(amount) : -Number(amount);
}

// Removed pre and post save hooks. Balance updates are now handled explicitly in the API endpoints to ensure reliability.

// Bust dev cache so schema changes always apply
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Statement;
}

const Statement: Model<IStatement> =
    mongoose.models.Statement ||
    mongoose.model<IStatement>("Statement", StatementSchema);

export default Statement;
