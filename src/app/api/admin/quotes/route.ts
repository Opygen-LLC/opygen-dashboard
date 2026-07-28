import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Quote from "@/models/Quote";
import { quoteSchema } from "@/lib/validations";
import { createActivityLog } from "@/lib/activityLogger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        
        // Return latest quotes first
        const quotes = await Quote.find().sort({ createdAt: -1 }).lean();

        return NextResponse.json(quotes);
    } catch (error: any) {
        console.error("GET Quotes error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await req.json();

        const parseResult = quoteSchema.safeParse(body);

        if (!parseResult.success) {
            const errorMessages = parseResult.error.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join("; ");
            console.error("POST Quote validation error:", errorMessages);
            return NextResponse.json(
                {
                    error: `Validation Error (${errorMessages})`,
                    details: parseResult.error.flatten(),
                },
                { status: 400 },
            );
        }

        const quoteData = { ...parseResult.data };
        if (!quoteData.quoteNumber || !quoteData.quoteNumber.trim()) {
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            quoteData.quoteNumber = `PRJ-${new Date().getFullYear()}-${randomCode}`;
        }

        const newQuote = await Quote.create(quoteData);

        await createActivityLog({
            user: session.user.id,
            type: "quote_accepted",
            message: `New proposal created for ${newQuote.clientName}: ${newQuote.projectName}`,
            targetUrl: "/admin-dashboard/quotes"
        });

        return NextResponse.json(newQuote, { status: 201 });
    } catch (error: any) {
        console.error("POST Quote error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}
