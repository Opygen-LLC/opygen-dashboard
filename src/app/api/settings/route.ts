import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Settings from "@/models/Settings";
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
});

/* ─── GET — return current settings ─── */
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
            monthlyBudgetGoal: 0,
        };

        return NextResponse.json(settings ?? defaults, {
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
