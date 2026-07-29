import mongoose, { Document, Schema } from "mongoose";

export interface IQuoteFeature {
    featureName: string;
    description: string;
}

export interface IQuoteFeatureSection {
    title: string;
    description?: string;
    features: IQuoteFeature[];
}

export interface IQuotePhase {
    phaseName: string;
    description: string;
    phaseTag?: string;
    minBudget: number;
    maxBudget: number;
}

export interface IQuotePaymentScheduleItem {
    pmtNo: number;
    milestone: string;
    calculation?: string;
    amount: number;
}

export interface IQuoteTermItem {
    title: string;
    text: string;
}

export interface IQuoteBilledBy {
    name?: string;
    title?: string;
    country?: string;
    email?: string;
    phone?: string;
}

export interface IQuoteBilledTo {
    name?: string;
    company?: string;
    country?: string;
    email?: string;
    phone?: string;
    socialLink?: string;
}

export interface IQuotePaymentAccount {
    providerName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    branch?: string;
    type?: string;
    userName?: string;
    userId?: string;
}

export interface IQuote extends Document {
    quoteNumber: string;
    projectName: string;
    proposalType?: string;
    proposalSubtitle?: string;
    projectDetails?: string;
    clientName: string;
    clientPhone?: string;
    clientSocialLink?: string;
    billedBy?: IQuoteBilledBy;
    billedTo?: IQuoteBilledTo;
    projectOverview?: string;
    featureSections?: IQuoteFeatureSection[];
    phases: IQuotePhase[];
    paymentSchedule?: IQuotePaymentScheduleItem[];
    termsAndConditions?: IQuoteTermItem[];
    currency: "USD" | "BDT" | "EUR";
    advanceType: "percentage" | "fixed";
    advanceValue?: number;
    projectDuration: string;
    paymentAccount?: IQuotePaymentAccount;
    billedBySignatory?: {
        name?: string;
        title?: string;
        country?: string;
    };
    billedToSignatory?: {
        name?: string;
        company?: string;
        country?: string;
    };
    quoteDate?: string;
    projectPrice?: string;
    showBilledInfo?: boolean;
    showFeatureSections?: boolean;
    showScopePricing?: boolean;
    showPaymentAccount?: boolean;
    showTerms?: boolean;
    showAgreement?: boolean;
    footerNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

const QuoteFeatureSchema = new Schema<IQuoteFeature>(
    {
        featureName: { type: String, default: "" },
        description: { type: String, default: "" },
    },
    { _id: false },
);

const QuoteFeatureSectionSchema = new Schema<IQuoteFeatureSection>(
    {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        features: { type: [QuoteFeatureSchema], default: [] },
    },
    { _id: false },
);

const QuotePhaseSchema = new Schema<IQuotePhase>(
    {
        phaseName: { type: String, default: "" },
        description: { type: String, default: "" },
        phaseTag: { type: String, default: "" },
        minBudget: { type: Number, default: 0 },
        maxBudget: { type: Number, default: 0 },
    },
    { _id: true },
);

const QuotePaymentScheduleSchema = new Schema<IQuotePaymentScheduleItem>(
    {
        pmtNo: { type: Number, default: 1 },
        milestone: { type: String, default: "" },
        calculation: { type: String, default: "" },
        amount: { type: Number, default: 0 },
    },
    { _id: false },
);

const QuoteTermItemSchema = new Schema<IQuoteTermItem>(
    {
        title: { type: String, default: "" },
        text: { type: String, default: "" },
    },
    { _id: false },
);

const QuotePaymentAccountSchema = new Schema<IQuotePaymentAccount>(
    {
        providerName: { type: String, default: "" },
        accountName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        routingNumber: { type: String },
        branch: { type: String },
        type: { type: String },
        userName: { type: String },
        userId: { type: String },
    },
    { _id: false },
);

const QuoteSchema = new Schema<IQuote>(
    {
        quoteNumber: { type: String, trim: true, index: true },
        projectName: { type: String, default: "Software Development Proposal", trim: true },
        proposalType: { type: String, default: "SOFTWARE DEVELOPMENT PROPOSAL" },
        proposalSubtitle: { type: String, default: "" },
        projectDetails: { type: String, trim: true },
        clientName: { type: String, default: "Valued Client", trim: true },
        clientPhone: { type: String, trim: true },
        clientSocialLink: { type: String, trim: true },
        billedBy: {
            name: { type: String },
            title: { type: String },
            country: { type: String },
            email: { type: String },
            phone: { type: String },
        },
        billedTo: {
            name: { type: String },
            company: { type: String },
            country: { type: String },
            email: { type: String },
            phone: { type: String },
            socialLink: { type: String },
        },
        projectOverview: { type: String },
        featureSections: { type: [QuoteFeatureSectionSchema], default: [] },
        phases: { type: [QuotePhaseSchema], default: [] },
        paymentSchedule: { type: [QuotePaymentScheduleSchema], default: [] },
        termsAndConditions: { type: [QuoteTermItemSchema], default: [] },
        currency: { type: String, enum: ["USD", "BDT", "EUR"], default: "USD" },
        advanceType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
        advanceValue: { type: Number, min: 0 },
        projectDuration: { type: String, default: "6-8 Weeks", trim: true },
        paymentAccount: { type: QuotePaymentAccountSchema },
        billedBySignatory: {
            name: { type: String },
            title: { type: String },
            country: { type: String },
        },
        billedToSignatory: {
            name: { type: String },
            company: { type: String },
            country: { type: String },
        },
        quoteDate: { type: String },
        projectPrice: { type: String, default: "" },
        showBilledInfo: { type: Boolean, default: true },
        showFeatureSections: { type: Boolean, default: true },
        showScopePricing: { type: Boolean, default: true },
        showPaymentAccount: { type: Boolean, default: true },
        showTerms: { type: Boolean, default: true },
        showAgreement: { type: Boolean, default: true },
        footerNote: { type: String },
    },
    { timestamps: true },
);

if (mongoose.models.Quote) {
    delete mongoose.models.Quote;
}

export default mongoose.models.Quote || mongoose.model<IQuote>("Quote", QuoteSchema);
