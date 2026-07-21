import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Quote from "@/models/Quote";

export const dynamic = "force-dynamic";

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();

        const params = await context.params;
        const quoteId = params.id;
        const deletedQuote = await Quote.findByIdAndDelete(quoteId);

        if (!deletedQuote) {
            return NextResponse.json({ error: "Quote not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Quote deleted successfully" });
    } catch (error: any) {
        console.error("DELETE Quote error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();

        const params = await context.params;
        const quoteId = params.id;
        const body = await req.json();

        const updatedQuote = await Quote.findByIdAndUpdate(
            quoteId,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedQuote) {
            return NextResponse.json({ error: "Quote not found" }, { status: 404 });
        }

        return NextResponse.json(updatedQuote);
    } catch (error: any) {
        console.error("PUT Quote error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
