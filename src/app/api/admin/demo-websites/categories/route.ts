import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { DemoWebsite } from "@/models/DemoWebsite";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const categories = await DemoWebsite.distinct("category");
        const filteredCategories = categories
            .filter((c) => c && typeof c === "string" && c.trim().length > 0)
            .sort((a, b) => a.localeCompare(b));

        return NextResponse.json(filteredCategories);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        if (!session || (userRole !== "admin" && userRole !== "superadmin")) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const categoryToDelete = searchParams.get("name");

        if (!categoryToDelete) {
            return NextResponse.json(
                { error: "Category name query parameter is required" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Remove matching demo websites or clear category field
        const result = await DemoWebsite.deleteMany({ category: categoryToDelete });

        return NextResponse.json({
            message: `Category "${categoryToDelete}" deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to delete category" },
            { status: 500 }
        );
    }
}
