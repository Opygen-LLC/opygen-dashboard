import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Settings from "@/models/Settings";
import Transaction from "@/models/Transaction";
import { TransactionCategory, TransactionType } from "@/types";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ─── Validation schema ─── */
const optionalUrl = z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), {
        message: "Must be a valid URL or empty",
    })
    .optional()
    .default("");

const settingsPatchSchema = z.object({
    logo:              z.string().trim().optional().or(z.literal("")),
    companyName:       z.string().trim().optional(),
    tagline:           z.string().trim().optional(),
    description:       z.string().trim().optional(),
    email:             z.string().trim().email("Invalid email").or(z.literal("")).optional(),
    phone:             z.string().trim().optional(),
    website:           optionalUrl,
    address:           z.string().trim().optional(),
    socials: z
        .object({
            facebook:  optionalUrl,
            instagram: optionalUrl,
            linkedin:  optionalUrl,
            youtube:   optionalUrl,
            x:         optionalUrl,
        })
        .optional(),
    monthlyBudgetGoal: z.coerce.number().min(0).optional(),
    monthlyRevenueGoals: z.record(z.string(), z.coerce.number().min(0)).optional(),
});

/* ─── GET — return current settings + all monthly revenue history ─── */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const settings = await Settings.findOne({ key: "global" }).lean();

        // Return defaults if no document yet
        const defaults = {
            companyName: "",
            tagline: "",
            description: "",
            email: "",
            phone: "",
            website: "",
            address: "",
            socials: { facebook: "", instagram: "", linkedin: "", youtube: "", x: "" },
            monthlyBudgetGoal: 200000,
            monthlyRevenueGoals: {},
        };

        // Query all historical monthly income revenue from Finance Transaction
        const monthlyStats = await Transaction.aggregate([
            {
                $match: {
                    type: TransactionType.INCOME,
                    category: { $nin: ["transfer", TransactionCategory.TRANSFER] },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                    },
                    revenueBdt: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
        ]);

        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1; // 1-12

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        // Collect all distinct months (at least current month + all months with income transactions)
        const monthMap = new Map<string, {
            year: number;
            month: number;
            revenueBdt: number;
            count: number;
        }>();

        // Always seed current month
        const curKey = `${curYear}-${String(curMonth).padStart(2, "0")}`;
        monthMap.set(curKey, {
            year: curYear,
            month: curMonth,
            revenueBdt: 0,
            count: 0,
        });

        for (const item of monthlyStats) {
            const y = item._id.year;
            const m = item._id.month;
            const key = `${y}-${String(m).padStart(2, "0")}`;
            monthMap.set(key, {
                year: y,
                month: m,
                revenueBdt: Number(Number(item.revenueBdt || 0).toFixed(2)),
                count: item.count || 0,
            });
        }

        // Sort keys descending (newest first)
        const sortedKeys = Array.from(monthMap.keys()).sort().reverse();

        const defaultGoal = (settings?.monthlyBudgetGoal && Number(settings.monthlyBudgetGoal) > 0)
            ? Number(settings.monthlyBudgetGoal)
            : 200000;
        const customGoals = settings?.monthlyRevenueGoals
            ? settings.monthlyRevenueGoals instanceof Map
                ? Object.fromEntries(settings.monthlyRevenueGoals)
                : (settings.monthlyRevenueGoals as Record<string, number>)
            : {};

        const monthlyRevenueHistory = sortedKeys.map((key) => {
            const data = monthMap.get(key)!;
            const goal = customGoals[key] ?? defaultGoal;
            const pct = goal > 0 ? Math.min(Math.round((data.revenueBdt / goal) * 100), 999) : 0;
            const isCurrent = key === curKey;

            let status: "achieved" | "in_progress" | "missed" = "in_progress";
            if (goal > 0 && data.revenueBdt >= goal) {
                status = "achieved";
            } else if (!isCurrent) {
                status = "missed";
            }

            return {
                monthKey: key,
                monthName: `${monthNames[data.month - 1]} ${data.year}`,
                year: data.year,
                month: data.month,
                revenueBdt: data.revenueBdt,
                transactionCount: data.count,
                goal,
                percentage: pct,
                isCurrent,
                status,
            };
        });

        const resolvedSettings = settings ? (typeof settings.toObject === 'function' ? settings.toObject() : settings) : defaults;

        const responseData = {
            ...defaults,
            ...resolvedSettings,
            monthlyBudgetGoal: resolvedSettings.monthlyBudgetGoal && Number(resolvedSettings.monthlyBudgetGoal) > 0
                ? Number(resolvedSettings.monthlyBudgetGoal)
                : 200000,
            monthlyRevenueHistory,
        };

        return NextResponse.json(responseData, {
            headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Server Error" },
            { status: 500 },
        );
    }
}

/* ─── PATCH — upsert settings ─── */
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await req.json();

        const parseResult = settingsPatchSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.flatten() },
                { status: 400 },
            );
        }

        const updates = parseResult.data;

        // Flatten socials into dot-notation so nested fields are upserted correctly
        const flatUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
            if (k === "socials" && v && typeof v === "object") {
                for (const [sk, sv] of Object.entries(v)) {
                    flatUpdates[`socials.${sk}`] = sv;
                }
            } else {
                flatUpdates[k] = v;
            }
        }

        const oldSettings = await Settings.findOne({ key: "global" }).lean();
        
        if (oldSettings && oldSettings.logo && updates.logo && updates.logo !== oldSettings.logo) {
            deleteFromCloudinary(oldSettings.logo).catch(err => 
                console.error("Failed to delete old logo from Cloudinary", err)
            );
        }

        const settings = await Settings.findOneAndUpdate(
            { key: "global" },
            { $set: flatUpdates },
            { new: true, upsert: true, runValidators: true },
        );

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Server Error" },
            { status: 500 },
        );
    }
}
