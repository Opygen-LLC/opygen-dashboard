import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { DemoWebsite } from "@/models/DemoWebsite";
import { demoWebsiteSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const searchParams = new URL(req.url).searchParams;
        const search = searchParams.get("search");
        const category = searchParams.get("category");

        const query: any = {};

        if (category && category !== "All") {
            query.category = category;
        }

        if (search) {
            const regex = new RegExp(search, "i");
            query.$or = [
                { title: regex },
                { link: regex },
                { category: regex },
                { description: regex },
            ];
        }

        const websites = await DemoWebsite.find(query).sort({ createdAt: -1 });

        return NextResponse.json(websites);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch demo websites" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const parsed = demoWebsiteSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation error", details: parsed.error.format() },
                { status: 400 }
            );
        }

        await dbConnect();

        const newWebsite = await DemoWebsite.create(parsed.data);

        return NextResponse.json(newWebsite, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to create demo website" },
            { status: 500 }
        );
    }
}
