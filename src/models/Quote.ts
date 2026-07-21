import mongoose, { Document, Schema } from "mongoose";

export interface IQuotePhase {
    phaseName: string;
    description: string;
    minBudget: number;
    maxBudget: number;
}

export interface IQuotePaymentAccount {
    providerName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    branch?: string;
}

export interface IQuote extends Document {
    projectName: string;
    projectDetails?: string;
    clientName: string;
    clientPhone?: string;
    clientSocialLink?: string;
    phases: IQuotePhase[];
    currency: "USD" | "BDT" | "EUR";
    advanceType: "percentage" | "fixed";
    advanceValue?: number;
    projectDuration: string;
    paymentAccount?: IQuotePaymentAccount;
    createdAt: Date;
    updatedAt: Date;
}

const QuotePhaseSchema = new Schema<IQuotePhase>(
    {
        phaseName: { type: String, required: true },
        description: { type: String, default: "" },
        minBudget: { type: Number, required: true },
        maxBudget: { type: Number, required: true },
    },
    { _id: true },
);

const QuotePaymentAccountSchema = new Schema<IQuotePaymentAccount>(
    {
        providerName: { type: String, required: true },
        accountName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        routingNumber: { type: String },
        branch: { type: String },
    },
    { _id: false },
);

const QuoteSchema = new Schema<IQuote>(
    {
        projectName: { type: String, required: true, trim: true },
        projectDetails: { type: String, trim: true },
        clientName: { type: String, required: true, trim: true },
        clientPhone: { type: String, trim: true },
        clientSocialLink: { type: String, trim: true },
        phases: { type: [QuotePhaseSchema], default: [] },
        currency: { type: String, enum: ["USD", "BDT", "EUR"], default: "USD" },
        advanceType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
        advanceValue: { type: Number, min: 0 },
        projectDuration: { type: String, required: true, trim: true },
        paymentAccount: { type: QuotePaymentAccountSchema },
    },
    { timestamps: true },
);

if (mongoose.models.Quote) {
    delete mongoose.models.Quote;
}

export default mongoose.models.Quote || mongoose.model<IQuote>("Quote", QuoteSchema);
