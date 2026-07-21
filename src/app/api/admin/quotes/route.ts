import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Quote from "@/models/Quote";
import { quoteSchema } from "@/lib/validations";

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
            return NextResponse.json(
                {
                    error: "Validation Error",
                    details: parseResult.error.flatten(),
                },
                { status: 400 },
            );
        }

        const newQuote = await Quote.create(parseResult.data);

        return NextResponse.json(newQuote, { status: 201 });
    } catch (error: any) {
        console.error("POST Quote error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 },
        );
    }
}
