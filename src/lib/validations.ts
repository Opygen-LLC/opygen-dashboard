import { z } from "zod";
import { ProjectStatus, ProjectPriority, UserRole, UserStatus } from "@/types";

export const baseProjectSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(100, "Title cannot exceed 100 characters"),
    description: z.string().optional().default(""),
    status: z.nativeEnum(ProjectStatus).default(ProjectStatus.TODO),
    priority: z.nativeEnum(ProjectPriority).default(ProjectPriority.MEDIUM),
    budget: z.coerce
        .number()
        .min(0, "Budget must be a non-negative number")
        .optional()
        .default(0),
    budgetMin: z.coerce
        .number()
        .min(0, "Min budget must be a non-negative number")
        .optional()
        .nullable(),
    budgetMax: z.coerce
        .number()
        .min(0, "Max budget must be a non-negative number")
        .optional()
        .nullable(),
    assignees: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"))
        .default([]),
    dueDate: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val ? new Date(val) : undefined)),
    startDate: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val ? new Date(val) : undefined)),
    clientName: z
        .string()
        .min(1, "Client name is required")
        .max(100, "Client name cannot exceed 100 characters"),
    clientMobile: z.string().optional().default(""),
    clientSocialLink: z.string().optional().default(""),
    payments: z
        .array(
            z.object({
                _id: z.string().optional(),
                type: z.enum([
                    "advance",
                    "frontend",
                    "backend",
                    "ui",
                    "other",
                    "custom",
                ]),
                customLabel: z.string().optional().default(""),
                amount: z.coerce
                    .number()
                    .min(0, "Amount must be a non-negative number"),
                status: z.enum(["pending", "paid"]).default("pending"),
                paymentDate: z
                    .string()
                    .optional()
                    .nullable()
                    .transform((val) => (val ? new Date(val) : undefined)),
                receiptUrl: z.string().optional().nullable(),
            }),
        )
        .optional()
        .default([]),
});

export const projectSchema = baseProjectSchema
    .refine(
        (data) => {
            if (
                data.clientMobile === undefined &&
                data.clientSocialLink === undefined
            ) {
                return true;
            }
            const hasMobile = !!data.clientMobile?.trim();
            const hasSocial = !!data.clientSocialLink?.trim();
            return hasMobile || hasSocial;
        },
        {
            message:
                "Either client mobile number or client social link must be provided",
            path: ["clientMobile"],
        },
    )
    .refine(
        (data) => {
            const activeStatuses = [
                ProjectStatus.TODO,
                ProjectStatus.IN_PROGRESS,
                ProjectStatus.IN_REVIEW,
                ProjectStatus.COMPLETED,
                ProjectStatus.ON_HOLD,
            ];
            if (activeStatuses.includes(data.status as ProjectStatus)) {
                return data.budget !== undefined && Number(data.budget) > 0;
            }
            return true;
        },
        {
            message: "Budget must be greater than 0 for active projects",
            path: ["budget"],
        },
    )
    .refine(
        (data) => {
            const pipelineStatuses = [
                ProjectStatus.POTENTIAL,
                ProjectStatus.FUTURE,
            ];
            if (pipelineStatuses.includes(data.status as ProjectStatus)) {
                return (
                    data.budgetMin !== null &&
                    data.budgetMin !== undefined &&
                    Number(data.budgetMin) > 0
                );
            }
            return true;
        },
        {
            message: "Minimum budget must be greater than 0",
            path: ["budgetMin"],
        },
    )
    .refine(
        (data) => {
            const pipelineStatuses = [
                ProjectStatus.POTENTIAL,
                ProjectStatus.FUTURE,
            ];
            if (pipelineStatuses.includes(data.status as ProjectStatus)) {
                return (
                    data.budgetMax !== null &&
                    data.budgetMax !== undefined &&
                    Number(data.budgetMax) > 0
                );
            }
            return true;
        },
        {
            message: "Maximum budget must be greater than 0",
            path: ["budgetMax"],
        },
    )
    .refine(
        (data) => {
            const pipelineStatuses = [
                ProjectStatus.POTENTIAL,
                ProjectStatus.FUTURE,
            ];
            if (pipelineStatuses.includes(data.status as ProjectStatus)) {
                if (
                    data.budgetMin !== null &&
                    data.budgetMin !== undefined &&
                    data.budgetMax !== null &&
                    data.budgetMax !== undefined
                ) {
                    return Number(data.budgetMax) >= Number(data.budgetMin);
                }
            }
            return true;
        },
        {
            message: "Maximum budget cannot be less than minimum budget",
            path: ["budgetMax"],
        },
    );

export type ProjectInput = z.infer<typeof projectSchema>;

export const commentSchema = z.object({
    message: z.string().min(1, "Comment message cannot be empty"),
});

export type CommentInput = z.infer<typeof commentSchema>;

export const userAccountSchema = z.object({
    _id: z.string().optional(),
    type: z.enum(["bank", "mobile_banking"], {
        required_error: "Account type is required",
    }),
    providerName: z.string().min(1, "Provider Name is required"),
    accountName: z.string().min(1, "Account Name is required"),
    accountNumber: z.string().min(1, "Account Number is required"),
    routingNumber: z.string().optional(),
    branch: z.string().optional(),
});

export type UserAccountInput = z.infer<typeof userAccountSchema>;

export const profileSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(50, "Name cannot exceed 50 characters"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .optional()
        .or(z.literal("")),
    avatarUrl: z.string().optional().or(z.literal("")),
    mobileNumber: z
        .string()
        .regex(
            /^\+\d{4,15}$/,
            "Must start with + and include country code (e.g. +1234567890)",
        )
        .optional()
        .or(z.literal("")),
    balance: z.number().optional(),
    fathersName: z.string().optional().or(z.literal("")),
    mothersName: z.string().optional().or(z.literal("")),
    gender: z.string().optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")),
    bloodGroup: z.string().optional().or(z.literal("")),
    accounts: z.array(userAccountSchema).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const addUserSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(50, "Name cannot exceed 50 characters"),
    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email address"),
    role: z.nativeEnum(UserRole),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: z
        .string()
        .regex(
            /^\+\d{4,15}$/,
            "Must start with + and include country code (e.g. +1234567890)",
        )
        .optional()
        .or(z.literal("")),
    status: z.nativeEnum(UserStatus).optional(),
});

export type AddUserInput = z.infer<typeof addUserSchema>;

export const transactionSchema = z.object({
    amount: z.coerce.number().min(0, "Amount must be a non-negative number"),
    type: z.enum(["income", "expense"]),
    category: z.enum([
        "salary",
        "loan_given",
        "loan_repayment",
        "loan_taken",
        "equipment",
        "software",
        "office",
        "project_revenue",
        "other",
    ]),
    description: z
        .string()
        .min(1, "Description is required")
        .max(500, "Description cannot exceed 500 characters"),
    date: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val ? new Date(val) : new Date())),
    user: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID")
        .or(z.literal("other"))
        .optional()
        .nullable(),
    externalEntity: z.string().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const clientSchema = z
    .object({
        name: z.string().min(2, "Name is required"),
        companyName: z.string().optional(),
        number: z.string().optional(),
        socialMediaLink: z
            .string()
            .url("Please enter a valid URL")
            .optional()
            .or(z.literal("")),
        country: z.string().min(2, "Country is required"),
        minAmount: z.coerce.number().min(0, "Min amount must be at least 0").optional().default(0),
        maxAmount: z.coerce.number().min(0, "Max amount must be at least 0").optional().default(0),
        notes: z.string().optional(),
        source: z.string().min(1, "Source is required"),
        otherSource: z.string().optional(),
        followupDate: z.string().optional().nullable().transform(val => val ? new Date(val) : undefined),
        status: z.enum(["Pending", "Confirmed", "Follow-up", "Blocked", "Declined"]).default("Pending"),
    })
    .refine(
        (data) => {
            if (
                data.source === "Other" &&
                (!data.otherSource || data.otherSource.trim() === "")
            ) {
                return false;
            }
            return true;
        },
        {
            message: "Please specify the other source",
            path: ["otherSource"],
        },
    )
    .refine(
        (data) => {
            return data.maxAmount >= data.minAmount;
        },
        {
            message: "Max amount cannot be less than min amount",
            path: ["maxAmount"],
        },
    )
    .refine(
        (data) => {
            const hasNumber = !!data.number?.trim();
            const hasSocial = !!data.socialMediaLink?.trim();
            return hasNumber || hasSocial;
        },
        {
            message:
                "Either phone number or social media link must be provided",
            path: ["number"], // attach error to number field
        },
    );

export type ClientInput = z.infer<typeof clientSchema>;

export const quotePhaseSchema = z.object({
    _id: z.string().optional(),
    phaseName: z.string().min(1, "Phase name is required"),
    description: z.string().optional().default(""),
    minBudget: z.coerce.number().min(0, "Min budget must be a positive number"),
    maxBudget: z.coerce.number().min(0, "Max budget must be a positive number"),
}).refine(
    (data) => data.maxBudget >= data.minBudget,
    {
        message: "Max budget cannot be less than min budget",
        path: ["maxBudget"],
    }
);

export type QuotePhaseInput = z.infer<typeof quotePhaseSchema>;

export const quoteSchema = z
    .object({
        projectName: z.string().min(1, "Project name is required"),
        projectDetails: z.string().optional(),
        clientName: z.string().min(1, "Client name is required"),
        clientPhone: z.string().optional().or(z.literal("")),
        clientSocialLink: z
            .string()
            .url("Please enter a valid URL")
            .optional()
            .or(z.literal("")),
        phases: z.array(quotePhaseSchema).optional().default([]),
        currency: z.enum(["USD", "BDT", "EUR"]).default("USD"),
        advanceType: z.enum(["percentage", "fixed"]).default("percentage"),
        advanceValue: z.coerce
            .number()
            .min(0)
            .optional()
            .nullable(),
        projectDuration: z.string().min(1, "Project duration is required"),
        paymentAccount: z.object({
            providerName: z.string().min(1),
            accountName: z.string().min(1),
            accountNumber: z.string().min(1),
            routingNumber: z.string().optional(),
            branch: z.string().optional(),
        }, { required_error: "Payment account is required" }),
    })
    .refine(
        (data) => {
            const hasPhone = !!data.clientPhone?.trim();
            const hasSocial = !!data.clientSocialLink?.trim();
            return hasPhone || hasSocial;
        },
        {
            message: "Either client phone or social link must be provided",
            path: ["clientPhone"],
        },
    )
    .refine(
        (data) => {
            if (
                data.advanceType === "percentage" &&
                data.advanceValue !== null &&
                data.advanceValue !== undefined
            ) {
                return data.advanceValue <= 100;
            }
            return true;
        },
        {
            message: "Advance percentage cannot exceed 100",
            path: ["advanceValue"],
        },
    );

export type QuoteInput = z.infer<typeof quoteSchema>;
