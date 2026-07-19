import mongoose, { Schema, Document, Model } from "mongoose";
import User from "./User";

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

// ─── PRE SAVE: Capture whether doc is new + snapshot old values ───────────────
StatementSchema.pre("save", async function () {
    // Mark as new so post-hook knows
    this.$locals.wasNew = this.isNew;

    if (!this.isNew && (this.isModified("amount") || this.isModified("type") || this.isModified("user"))) {
        const previous = await (this.constructor as Model<IStatement>)
            .findById(this._id)
            .lean();
        this.$locals.previous = previous;
    }
});

// ─── POST SAVE: Update user balance ──────────────────────────────────────────
StatementSchema.post("save", async function (doc) {
    if (doc.$locals.wasNew) {
        // New statement → add to user balance
        await User.findByIdAndUpdate(doc.user, {
            $inc: { balance: signedAmount(doc.amount, doc.type) },
        });
        return;
    }

    const previous = doc.$locals.previous as IStatement | undefined;
    if (!previous) return;

    const oldValue = signedAmount(previous.amount, previous.type);
    const newValue = signedAmount(doc.amount, doc.type);

    if (String(previous.user) !== String(doc.user)) {
        // User changed → revert from old user, apply to new user
        await User.findByIdAndUpdate(previous.user, {
            $inc: { balance: -oldValue },
        });
        await User.findByIdAndUpdate(doc.user, {
            $inc: { balance: newValue },
        });
        return;
    }

    // Same user — apply only the diff
    const diff = newValue - oldValue;
    if (diff !== 0) {
        await User.findByIdAndUpdate(doc.user, {
            $inc: { balance: diff },
        });
    }
});

// ─── POST findOneAndDelete: Revert balance ────────────────────────────────────
StatementSchema.post(
    "findOneAndDelete",
    async function (doc: IStatement | null) {
        if (!doc) return;
        await User.findByIdAndUpdate(doc.user, {
            $inc: { balance: -signedAmount(doc.amount, doc.type) },
        });
    },
);

// ─── POST deleteOne (document): Revert balance ───────────────────────────────
StatementSchema.post(
    "deleteOne",
    { document: true, query: false },
    async function () {
        await User.findByIdAndUpdate(this.user, {
            $inc: { balance: -signedAmount(this.amount, this.type) },
        });
    },
);

// Bust dev cache so schema changes always apply
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Statement;
}

const Statement: Model<IStatement> =
    mongoose.models.Statement ||
    mongoose.model<IStatement>("Statement", StatementSchema);

export default Statement;
